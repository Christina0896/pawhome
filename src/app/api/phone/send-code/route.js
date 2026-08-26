import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { isTrueFlag } from '../../../../lib/booleanFlags';
import {
  PHONE_VERIFICATION_CHALLENGE_TTL_MS,
  formatPhoneForVerification,
  maskPhoneForDisplay,
  startPhoneVerificationCall,
} from '../../../../lib/phoneVerification';
import { findVerifiedPhoneOwner } from '../../../../lib/phoneUniqueness';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PHONE_CALL_COOLDOWN_MS = 60 * 1000;
const PHONE_CALL_DAILY_LIMIT = 5;
const PHONE_CALL_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const PHONE_GLOBAL_DAILY_LIMIT = 10;

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

  if (!emailVerified) {
    return Response.json({ error: 'Please verify your email address before verifying your phone number.' }, { status: 403 });
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, phone_code, phone_number, phone_verified, verified_phone_e164')
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

    if (isTrueFlag(profile.phone_verified)) {
      return Response.json({ success: true, alreadyVerified: true }, { status: 200 });
    }

    const phoneToVerify = formatPhoneForVerification(profile.phone_code, profile.phone_number);

    if (!phoneToVerify) {
      return Response.json({ error: 'Please enter a valid phone number in your profile first.' }, { status: 400 });
    }

    const phoneOwnerResult = await findVerifiedPhoneOwner(supabaseAdmin, phoneToVerify, user.id);

    if (phoneOwnerResult.error) {
      console.error('Verified phone uniqueness check failed:', {
        message: phoneOwnerResult.error.message,
        code: phoneOwnerResult.error.code,
      });

      return Response.json(
        { error: 'Phone ownership checks are not configured correctly. Please contact PawHome support.' },
        { status: 500 },
      );
    }

    if (phoneOwnerResult.owner) {
      return Response.json(
        { error: 'This phone number is already linked to another PawHome account.' },
        { status: 409 },
      );
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const cooldownCutoff = new Date(now - PHONE_CALL_COOLDOWN_MS).toISOString();
    const dailyCutoff = new Date(now - PHONE_CALL_DAILY_WINDOW_MS).toISOString();

    const { data: recentChallenge, error: recentError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .select('created_at')
      .eq('phone_e164', phoneToVerify)
      .gte('created_at', cooldownCutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentError) {
      console.error('Phone verification cooldown lookup failed:', {
        message: recentError.message,
        code: recentError.code,
      });

      return Response.json(
        { error: 'Phone verification storage is not configured. Run the Supabase phone verification SQL first.' },
        { status: 500 },
      );
    }

    if (recentChallenge) {
      const elapsedMs = now - new Date(recentChallenge.created_at).getTime();
      const retryAfterSeconds = Math.max(Math.ceil((PHONE_CALL_COOLDOWN_MS - elapsedMs) / 1000), 1);

      return Response.json(
        { error: `Please wait ${retryAfterSeconds} seconds before requesting another call.`, retryAfterSeconds },
        { status: 429 },
      );
    }

    const { count: dailyCount, error: dailyCountError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('phone_e164', phoneToVerify)
      .gte('created_at', dailyCutoff);

    if (dailyCountError) {
      console.error('Phone verification daily limit lookup failed:', {
        message: dailyCountError.message,
        code: dailyCountError.code,
      });

      return Response.json({ error: 'Could not check the verification call limit.' }, { status: 500 });
    }

    if ((dailyCount || 0) >= PHONE_CALL_DAILY_LIMIT) {
      return Response.json(
        { error: 'Too many verification calls were requested for this account. Please try again tomorrow.' },
        { status: 429 },
      );
    }

    const { count: phoneDailyCount, error: phoneDailyError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('phone_e164', phoneToVerify)
      .gte('created_at', dailyCutoff);

    if (phoneDailyError) {
      console.error('Phone verification number limit lookup failed:', {
        message: phoneDailyError.message,
        code: phoneDailyError.code,
      });

      return Response.json({ error: 'Could not check the verification call limit.' }, { status: 500 });
    }

    if ((phoneDailyCount || 0) >= PHONE_GLOBAL_DAILY_LIMIT) {
      return Response.json(
        { error: 'Too many verification calls were requested for this number. Please try again tomorrow.' },
        { status: 429 },
      );
    }

    // Only cancel stale active requests. The created_at condition prevents one
    // concurrent request from cancelling a reservation created by another.
    const { error: cancelError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .update({ status: 'cancelled', updated_at: nowIso })
      .eq('user_id', user.id)
      .in('status', ['pending', 'provider_verified'])
      .lt('created_at', cooldownCutoff);

    if (cancelError) {
      console.error('Old phone verification challenge cleanup failed:', {
        message: cancelError.message,
        code: cancelError.code,
      });

      return Response.json({ error: 'Could not prepare a new verification call.' }, { status: 500 });
    }

    const expiresAt = new Date(now + PHONE_VERIFICATION_CHALLENGE_TTL_MS).toISOString();
    const reservationToken = `reserved:${crypto.randomUUID()}`;

    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .insert({
        user_id: user.id,
        phone_e164: phoneToVerify,
        provider: 'vonage',
        provider_request_id: reservationToken,
        channel: 'voice',
        status: 'pending',
        attempt_count: 0,
        expires_at: expiresAt,
        updated_at: nowIso,
      })
      .select('id')
      .single();

    if (reservationError || !reservation) {
      if (reservationError?.code === '23505') {
        return Response.json(
          { error: 'A verification call is already being started. Please wait one minute before trying again.' },
          { status: 429 },
        );
      }

      console.error('Phone verification reservation failed:', {
        message: reservationError?.message,
        code: reservationError?.code,
      });

      return Response.json({ error: 'Could not reserve a verification call. Please try again.' }, { status: 500 });
    }

    let verificationRequest;

    try {
      verificationRequest = await startPhoneVerificationCall(phoneToVerify, user.id);
    } catch (providerError) {
      await supabaseAdmin
        .from('phone_verification_challenges')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', reservation.id)
        .eq('provider_request_id', reservationToken);

      throw providerError;
    }

    if (!verificationRequest?.request_id) {
      await supabaseAdmin
        .from('phone_verification_challenges')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', reservation.id);

      return Response.json({ error: 'Verification provider did not return a request ID.' }, { status: 500 });
    }

    const { data: activatedChallenge, error: activationError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .update({
        provider_request_id: verificationRequest.request_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)
      .eq('provider_request_id', reservationToken)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (activationError || !activatedChallenge) {
      console.error('Phone verification challenge activation failed:', {
        message: activationError?.message,
        code: activationError?.code,
      });

      return Response.json(
        { error: 'The call started, but PawHome could not activate the verification request. Please wait one minute and try again.' },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        channel: 'voice',
        phone: maskPhoneForDisplay(phoneToVerify),
        expiresAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Start phone verification call failed:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    const status = error?.status && error.status < 500 ? error.status : 500;

    return Response.json(
      { error: error?.message || 'Could not start the verification call. Please try again.' },
      { status },
    );
  }
}
