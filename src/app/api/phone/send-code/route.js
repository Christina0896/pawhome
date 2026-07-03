import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { formatPhoneForVerification, maskPhoneForDisplay, sendPhoneVerificationCode } from '../../../../lib/phoneVerification';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function getSendCodeErrorMessage(error) {
  const message = error?.message || '';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('trial') && lowerMessage.includes('unverified')) {
    return 'Twilio trial still sees this phone as unverified for the API credentials PawHome is using. Check that Vercel TWILIO_ACCOUNT_SID matches the Twilio account where this number is verified, then redeploy.';
  }

  return message || 'Could not send verification code. Please try again.';
}

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
      return Response.json({ success: true, alreadyVerified: true }, { status: 200 });
    }

    const phoneToVerify = formatPhoneForVerification(profile.phone_code, profile.phone_number);

    if (!phoneToVerify) {
      return Response.json({ error: 'Please enter a valid phone number in your profile first.' }, { status: 400 });
    }

    await sendPhoneVerificationCode(phoneToVerify);

    return Response.json(
      {
        success: true,
        phone: maskPhoneForDisplay(phoneToVerify),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Send phone verification code failed:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    const status = error?.status && error.status < 500 ? error.status : 500;

    return Response.json(
      { error: getSendCodeErrorMessage(error) },
      { status },
    );
  }
}
