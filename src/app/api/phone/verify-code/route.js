import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { checkPhoneVerificationCode } from '../../../../lib/phoneVerification';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  try {
    const { code, requestId } = await request.json();
    const cleanCode = String(code || '').replace(/\s+/g, '').trim();
    const cleanRequestId = String(requestId || '').trim();

    if (!cleanRequestId) {
      return Response.json({ error: 'Send a new verification code first.' }, { status: 400 });
    }

    if (!/^[A-Za-z0-9-]{10,80}$/.test(cleanRequestId)) {
      return Response.json({ error: 'Send a new verification code first.' }, { status: 400 });
    }

    if (!/^\d{4,10}$/.test(cleanCode)) {
      return Response.json({ error: 'Please enter the verification code.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, phone_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Phone verification profile lookup failed:', {
        message: profileError.message,
        code: profileError.code,
      });

      return Response.json({ error: 'Could not load your profile.' }, { status: 500 });
    }

    if (!profile) {
      return Response.json({ error: 'Please save your profile before verifying your phone number.' }, { status: 400 });
    }

    if (profile.phone_verified) {
      return Response.json({ success: true, profile }, { status: 200 });
    }

    const verificationCheck = await checkPhoneVerificationCode(cleanRequestId, cleanCode);

    if (verificationCheck.status !== 'completed') {
      return Response.json({ error: 'The code is incorrect or expired.' }, { status: 400 });
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ phone_verified: true })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Phone verification profile update failed:', {
        message: updateError.message,
        code: updateError.code,
      });

      return Response.json({ error: 'Phone was verified, but your profile could not be updated.' }, { status: 500 });
    }

    return Response.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error('Verify phone code failed:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    const isClientError = error?.status && error.status >= 400 && error.status < 500;

    return Response.json(
      { error: isClientError ? 'The code is incorrect or expired.' : 'Could not verify code. Please try again.' },
      { status: isClientError ? 400 : 500 },
    );
  }
}
