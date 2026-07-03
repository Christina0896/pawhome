export function isMissingVerifiedPhoneColumn(error) {
  const message = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();

  return error?.code === '42703' || message.includes('verified_phone_e164') || details.includes('verified_phone_e164');
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
      console.warn('verified_phone_e164 column is missing. Run the phone uniqueness SQL migration.');
      return { owner: null, missingColumn: true, error: null };
    }

    return { owner: null, missingColumn: false, error };
  }

  return { owner: data || null, missingColumn: false, error: null };
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
