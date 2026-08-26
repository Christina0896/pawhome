import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { formatPhoneForVerification } from '../../../../lib/phoneVerification';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const USER_MESSAGES = {
  failed: 'The automated call failed. Check the number and try again.',
  expired: 'The verification request expired. Request a new call.',
  rejected: 'The verification provider rejected the call. Please try again later.',
  user_rejected: 'The call was declined. Request a new call when you are ready to answer.',
};

export async function GET(request) {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });

  const auth = await getAuthenticatedUser(supabaseAdmin, request);
  if (auth.error) return auth.error;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('phone_code, phone_number, phone_verified')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return Response.json({ error: 'Could not load your profile.' }, { status: 500 });
  }

  const phone = formatPhoneForVerification(profile.phone_code, profile.phone_number);
  if (!phone) return Response.json({ status: 'none' }, { status: 200 });

  const { data: challenge, error } = await supabaseAdmin
    .from('phone_verification_challenges')
    .select('status, provider_status, expires_at, created_at, finalized_at')
    .eq('user_id', auth.user.id)
    .eq('phone_e164', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Phone verification status lookup failed:', {
      message: error.message,
      code: error.code,
    });

    return Response.json({ error: 'Could not check the verification call.' }, { status: 500 });
  }

  if (!challenge) return Response.json({ status: 'none' }, { status: 200 });

  const status = challenge.status || 'pending';

  return Response.json(
    {
      status,
      providerStatus: challenge.provider_status || '',
      expiresAt: challenge.expires_at,
      finalizedAt: challenge.finalized_at,
      terminal: Boolean(USER_MESSAGES[status] || status === 'completed'),
      message: USER_MESSAGES[status] || '',
    },
    { status: 200 },
  );
}
