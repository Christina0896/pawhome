import { formatPhoneForVerification } from './phoneVerification';

export function isMissingVerifiedPhoneColumn(error) {
  const message = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();

  return error?.code === '42703' || message.includes('verified_phone_e164') || details.includes('verified_phone_e164');
}

async function findLegacyVerifiedPhoneOwner(supabaseAdmin, verifiedPhoneE164, currentUserId, onlyMissingE164 = false) {
  let query = supabaseAdmin
    .from('profiles')
    .select('user_id, phone_code, phone_number, verified_phone_e164')
    .eq('phone_verified', true);

  if (currentUserId) {
    query = query.neq('user_id', currentUserId);
  }

  if (onlyMissingE164) {
    query = query.is('verified_phone_e164', null);
  }

  const { data: profiles, error } = await query.limit(500);

  if (error) {
    if (isMissingVerifiedPhoneColumn(error)) {
      const fallback = await supabaseAdmin
        .from('profiles')
        .select('user_id, phone_code, phone_number')
        .eq('phone_verified', true)
        .limit(500);

      if (fallback.error) {
        return { owner: null, error: fallback.error };
      }

      const owner = (fallback.data || []).find((profile) => {
        const normalizedPhone = formatPhoneForVerification(profile.phone_code, profile.phone_number);
        return normalizedPhone === verifiedPhoneE164;
      });

      return { owner: owner || null, error: null };
    }

    return { owner: null, error };
  }

  const owner = (profiles || []).find((profile) => {
    const normalizedPhone = profile.verified_phone_e164 || formatPhoneForVerification(profile.phone_code, profile.phone_number);
    return normalizedPhone === verifiedPhoneE164;
  });

  return { owner: owner || null, error: null };
}

export async function findVerifiedPhoneOwner(supabaseAdmin, verifiedPhoneE164, currentUserId) {
  if (!supabaseAdmin || !verifiedPhoneE164) {
    return { owner: null, missingColumn: false, error: null };
  }

  let query = supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('verified_phone_e164', verifiedPhoneE164)
    .maybeSingle();

  if (currentUserId) {
    query = query.neq('user_id', currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingVerifiedPhoneColumn(error)) {
      console.warn('verified_phone_e164 column is missing. Falling back to legacy phone duplicate check.');
      const legacyResult = await findLegacyVerifiedPhoneOwner(supabaseAdmin, verifiedPhoneE164, currentUserId);
      return { owner: legacyResult.owner, missingColumn: true, error: legacyResult.error };
    }

    return { owner: null, missingColumn: false, error };
  }

  if (data) {
    return { owner: data, missingColumn: false, error: null };
  }

  const legacyResult = await findLegacyVerifiedPhoneOwner(supabaseAdmin, verifiedPhoneE164, currentUserId, true);

  return { owner: legacyResult.owner, missingColumn: false, error: legacyResult.error };
}

export async function updateProfilePhoneVerified(supabaseAdmin, userId, verifiedPhoneE164) {
  const updatePayload = {
    phone_verified: true,
    verified_phone_e164: verifiedPhoneE164,
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('user_id', userId)
    .select()
    .single();

  if (!error) {
    return { profile: data, error: null };
  }

  if (!isMissingVerifiedPhoneColumn(error)) {
    return { profile: null, error };
  }

  console.warn('verified_phone_e164 column is missing. Falling back to phone_verified only.');

  const fallback = await supabaseAdmin
    .from('profiles')
    .update({ phone_verified: true })
    .eq('user_id', userId)
    .select()
    .single();

  return { profile: fallback.data || null, error: fallback.error || null };
}
