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
      console.error('verified_phone_e164 is required for safe phone ownership checks.');
      return { owner: null, missingColumn: true, error };
    }

    return { owner: null, missingColumn: false, error };
  }

  return { owner: data || null, missingColumn: false, error: null };
}

export async function updateProfilePhoneVerified(supabaseAdmin, userId, verifiedPhoneE164) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      phone_verified: true,
      verified_phone_e164: verifiedPhoneE164,
    })
    .eq('user_id', userId)
    .select()
    .single();

  return { profile: data || null, error: error || null };
}
