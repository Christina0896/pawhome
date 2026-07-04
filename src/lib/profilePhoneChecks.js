import { formatPhoneForVerification } from './phoneVerification';

function normalizedPhone(profile) {
  return formatPhoneForVerification(profile?.phone_code, profile?.phone_number);
}

export async function findProfileWithPhone(supabaseAdmin, phoneCode, phoneNumber, currentUserId = null) {
  const phoneE164 = formatPhoneForVerification(phoneCode, phoneNumber);

  if (!phoneE164) {
    return { phoneE164: null, owner: null, error: null };
  }

  let query = supabaseAdmin
    .from('profiles')
    .select('user_id, phone_code, phone_number, verified_phone_e164');

  if (currentUserId) {
    query = query.neq('user_id', currentUserId);
  }

  const { data, error } = await query.limit(1000);

  if (error) {
    const message = String(error?.message || '').toLowerCase();
    const details = String(error?.details || '').toLowerCase();
    const missingE164 = error?.code === '42703' || message.includes('verified_phone_e164') || details.includes('verified_phone_e164');

    if (!missingE164) {
      return { phoneE164, owner: null, error };
    }

    let fallback = supabaseAdmin
      .from('profiles')
      .select('user_id, phone_code, phone_number');

    if (currentUserId) {
      fallback = fallback.neq('user_id', currentUserId);
    }

    const fallbackResult = await fallback.limit(1000);

    if (fallbackResult.error) {
      return { phoneE164, owner: null, error: fallbackResult.error };
    }

    const owner = (fallbackResult.data || []).find((profile) => normalizedPhone(profile) === phoneE164);
    return { phoneE164, owner: owner || null, error: null };
  }

  const owner = (data || []).find((profile) => {
    const value = profile.verified_phone_e164 || normalizedPhone(profile);
    return value === phoneE164;
  });

  return { phoneE164, owner: owner || null, error: null };
}
