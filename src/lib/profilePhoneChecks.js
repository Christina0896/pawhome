import { formatPhoneForVerification } from './phoneVerification';
import { findVerifiedPhoneOwner } from './phoneUniqueness';

export async function findProfileWithPhone(supabaseAdmin, phoneCode, phoneNumber, currentUserId = null) {
  const phoneE164 = formatPhoneForVerification(phoneCode, phoneNumber);

  if (!phoneE164) {
    return { phoneE164: null, owner: null, error: null };
  }

  const result = await findVerifiedPhoneOwner(supabaseAdmin, phoneE164, currentUserId);

  return {
    phoneE164,
    owner: result.owner || null,
    error: result.error || null,
  };
}
