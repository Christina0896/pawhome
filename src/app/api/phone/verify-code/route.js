import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { checkPhoneVerificationCode, formatPhoneForVerification } from '../../../../lib/phoneVerification';
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
    const { code } = await request.json();
    const cleanCode = String(code || '').replace(/\s+/g, '').trim();

    if (!/^\d{4,10}$/.test(cleanCode)) {
      return Response.json({ error: 'Please enter the verification code.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, phone_code, phone_number, phone_verified')
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

    const phoneToVerify = formatPhoneForVerification(profile.phone_code, profile.phone_number);

    if (!phoneToVerify) {
      return Response.json({ error: 'Please enter a valid phone number in your profile first.' }, { status: 400 });
    }

    const verificationCheck = await checkPhoneVerificationCode(phoneToVerify, cleanCode);

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
      { error: isClientError ? error.message || 'The code is incorrect or expired.' : 'Could not verify code. Please try again.' },
      { status: isClientError ? 400 : 500 },
    );
  }
}
