import { getAuthenticatedUser, getRequestIp } from '../../../../lib/apiHelpers';
import { isTrueFlag } from '../../../../lib/booleanFlags';
import {
  PHONE_VERIFICATION_CHALLENGE_TTL_MS,
  cancelPhoneVerificationRequest,
  formatPhoneForVerification,
  maskPhoneForDisplay,
  startPhoneVerificationCall,
} from '../../../../lib/phoneVerification';
import { findVerifiedPhoneOwner } from '../../../../lib/phoneUniqueness';
import { getIpHash, isScopedRateLimited } from '../../../../lib/rateLimiter';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PHONE_CALL_COOLDOWN_SECONDS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

async function consumeVerificationLimits({ supabaseAdmin, userId, phone, ipHash }) {
  const checks = [
    {
      bucket: 'phone-verify:user-day',
      scopeKey: userId,
      maxHits: 5,
      windowMs: DAY_MS,
    },
    {
      bucket: 'phone-verify:phone-day',
      scopeKey: phone,
      maxHits: 5,
      windowMs: DAY_MS,
    },
    {
      bucket: 'phone-verify:ip-hour',
      scopeKey: ipHash,
      maxHits: 10,
      windowMs: HOUR_MS,
    },
    {
      bucket: 'phone-verify:ip-day',
      scopeKey: ipHash,
      maxHits: 20,
      windowMs: DAY_MS,
    },
  ];

  for (const check of checks) {
    const limited = await isScopedRateLimited({
      supabaseAdmin,
      ...check,
      cleanupMs: 7 * DAY_MS,
    });

    if (limited) return check.bucket;
  }

  return '';
}

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);
  if (auth.error) return auth.error;

  const { user } = auth;
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

  if (!emailVerified) {
    return Response.json({ error: 'Please verify your email address before verifying your phone number.' }, { status: 403 });
  }

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

      return Response.json({ error: 'Could not check this phone number.' }, { status: 500 });
    }

    if (phoneOwnerResult.owner) {
      return Response.json(
        { error: 'This phone number is already linked to another PawHome account.' },
        { status: 409 },
      );
    }

    const requestIp = getRequestIp(request);
    const ipHash =
      getIpHash(requestIp, 'PHONE_VERIFICATION_RATE_LIMIT_SECRET') ||
      getIpHash(requestIp, 'COUNTER_RATE_LIMIT_SECRET');

    if (!ipHash) {
      return Response.json({ error: 'Phone verification rate limiting is not configured.' }, { status: 500 });
    }

    const limitedBucket = await consumeVerificationLimits({
      supabaseAdmin,
      userId: user.id,
      phone: phoneToVerify,
      ipHash,
    });

    if (limitedBucket) {
      const message = limitedBucket.includes('hour')
        ? 'Too many verification calls were requested from this connection. Please try again later.'
        : 'Too many verification calls were requested. Please try again tomorrow.';

      return Response.json({ error: message }, { status: 429 });
    }

    const now = Date.now();
    const expiresAt = new Date(now + PHONE_VERIFICATION_CHALLENGE_TTL_MS).toISOString();

    const { data: challengeId, error: reserveError } = await supabaseAdmin.rpc(
      'reserve_phone_verification_challenge',
      {
        p_user_id: user.id,
        p_phone_e164: phoneToVerify,
        p_ip_hash: ipHash,
        p_expires_at: expiresAt,
        p_cooldown_seconds: PHONE_CALL_COOLDOWN_SECONDS,
      },
    );

    if (reserveError) {
      const reserveMessage = String(reserveError.message || '');

      if (reserveMessage.includes('PHONE_VERIFICATION_COOLDOWN')) {
        return Response.json(
          { error: `Please wait ${PHONE_CALL_COOLDOWN_SECONDS} seconds before requesting another call.` },
          { status: 429 },
        );
      }

      console.error('Phone verification reservation failed:', {
        message: reserveError.message,
        code: reserveError.code,
      });

      return Response.json(
        { error: 'Phone verification storage is not configured. Run the latest Supabase migration first.' },
        { status: 500 },
      );
    }

    let verificationRequest;

    try {
      verificationRequest = await startPhoneVerificationCall(phoneToVerify, String(challengeId));
    } catch (providerError) {
      await supabaseAdmin
        .from('phone_verification_challenges')
        .update({
          status: 'failed',
          provider_status: 'request_failed',
          provider_details: {
            message: providerError?.message || 'Provider request failed.',
            code: providerError?.code || null,
          },
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      throw providerError;
    }

    if (!verificationRequest?.request_id) {
      await supabaseAdmin
        .from('phone_verification_challenges')
        .update({
          status: 'failed',
          provider_status: 'missing_request_id',
          provider_details: verificationRequest || {},
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      return Response.json({ error: 'Verification provider did not return a request ID.' }, { status: 500 });
    }

    const { error: challengeUpdateError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .update({
        provider_request_id: verificationRequest.request_id,
        status: 'pending',
        provider_status: 'accepted',
        provider_details: verificationRequest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)
      .eq('status', 'creating');

    if (challengeUpdateError) {
      console.error('Phone verification challenge finalization failed:', {
        message: challengeUpdateError.message,
        code: challengeUpdateError.code,
      });

      await cancelPhoneVerificationRequest(verificationRequest.request_id).catch(() => {});

      await supabaseAdmin
        .from('phone_verification_challenges')
        .update({
          status: 'failed',
          provider_status: 'storage_failed',
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      return Response.json(
        { error: 'The call was cancelled because PawHome could not save the verification request. Please try again.' },
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
