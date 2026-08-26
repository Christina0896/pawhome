import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { isTrueFlag, normalizePhoneVerified } from '../../../../lib/booleanFlags';
import { checkPhoneVerificationCode, formatPhoneForVerification } from '../../../../lib/phoneVerification';
import {
  findVerifiedPhoneOwner,
  isDuplicateVerifiedPhoneError,
  updateProfilePhoneVerified,
} from '../../../../lib/phoneUniqueness';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_CODE_ATTEMPTS = 3;

async function markChallenge(supabaseAdmin, challengeId, values) {
  return supabaseAdmin
    .from('phone_verification_challenges')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', challengeId);
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

    if (isTrueFlag(profile.phone_verified)) {
      return Response.json({ success: true, profile: normalizePhoneVerified(profile) }, { status: 200 });
    }

    const phoneToVerify = formatPhoneForVerification(profile.phone_code, profile.phone_number);

    if (!phoneToVerify) {
      return Response.json({ error: 'Please enter a valid phone number in your profile first.' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const { error: expiryError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .update({ status: 'expired', provider_status: 'expired', finalized_at: nowIso, updated_at: nowIso })
      .eq('user_id', user.id)
      .in('status', ['creating', 'pending', 'provider_verified'])
      .lte('expires_at', nowIso);

    if (expiryError) {
      console.error('Phone verification expiry cleanup failed:', {
        message: expiryError.message,
        code: expiryError.code,
      });

      return Response.json(
        { error: 'Phone verification storage is not configured. Run the latest Supabase migration first.' },
        { status: 500 },
      );
    }

    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('phone_verification_challenges')
      .select('id, provider_request_id, status, provider_status, attempt_count, expires_at')
      .eq('user_id', user.id)
      .eq('phone_e164', phoneToVerify)
      .eq('provider', 'vonage')
      .eq('channel', 'voice')
      .in('status', ['pending', 'provider_verified'])
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (challengeError) {
      console.error('Phone verification challenge lookup failed:', {
        message: challengeError.message,
        code: challengeError.code,
      });

      return Response.json({ error: 'Could not load the verification request.' }, { status: 500 });
    }

    if (!challenge) {
      const { data: latestChallenge } = await supabaseAdmin
        .from('phone_verification_challenges')
        .select('status')
        .eq('user_id', user.id)
        .eq('phone_e164', phoneToVerify)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (['failed', 'expired', 'rejected', 'user_rejected'].includes(latestChallenge?.status)) {
        return Response.json({ error: 'The last call failed or expired. Request a new verification call.' }, { status: 400 });
      }

      return Response.json({ error: 'Start a new verification call first.' }, { status: 400 });
    }

    if ((challenge.attempt_count || 0) >= MAX_CODE_ATTEMPTS) {
      await markChallenge(supabaseAdmin, challenge.id, {
        status: 'failed',
        provider_status: 'too_many_code_attempts',
        finalized_at: nowIso,
      });

      return Response.json({ error: 'Too many incorrect attempts. Start a new verification call.' }, { status: 429 });
    }

    if (challenge.status === 'pending') {
      let verificationCheck;

      try {
        verificationCheck = await checkPhoneVerificationCode(challenge.provider_request_id, cleanCode);
      } catch (error) {
        const isCodeError = error?.status && error.status >= 400 && error.status < 500;

        if (isCodeError) {
          const nextAttemptCount = (challenge.attempt_count || 0) + 1;
          const terminal = nextAttemptCount >= MAX_CODE_ATTEMPTS;

          await markChallenge(supabaseAdmin, challenge.id, {
            attempt_count: nextAttemptCount,
            status: terminal ? 'failed' : 'pending',
            provider_status: error?.code || (terminal ? 'too_many_code_attempts' : 'invalid_code'),
            ...(terminal ? { finalized_at: new Date().toISOString() } : {}),
          });
        }

        throw error;
      }

      if (verificationCheck.status !== 'completed') {
        const nextAttemptCount = (challenge.attempt_count || 0) + 1;
        const terminal = nextAttemptCount >= MAX_CODE_ATTEMPTS;

        await markChallenge(supabaseAdmin, challenge.id, {
          attempt_count: nextAttemptCount,
          status: terminal ? 'failed' : 'pending',
          provider_status: terminal ? 'too_many_code_attempts' : 'invalid_code',
          ...(terminal ? { finalized_at: new Date().toISOString() } : {}),
        });

        return Response.json({ error: 'The code is incorrect or expired.' }, { status: 400 });
      }

      const { error: providerVerifiedError } = await markChallenge(supabaseAdmin, challenge.id, {
        status: 'provider_verified',
        provider_status: 'code_completed',
        provider_details: verificationCheck,
      });

      if (providerVerifiedError) {
        console.error('Phone verification provider result save failed:', {
          message: providerVerifiedError.message,
          code: providerVerifiedError.code,
        });

        return Response.json(
          { error: 'The code was accepted, but PawHome could not save the result. Please try again.' },
          { status: 500 },
        );
      }
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
      await markChallenge(supabaseAdmin, challenge.id, {
        status: 'failed',
        provider_status: 'duplicate_phone',
        finalized_at: new Date().toISOString(),
      });

      return Response.json(
        { error: 'This phone number is already linked to another PawHome account.' },
        { status: 409 },
      );
    }

    const { profile: updatedProfile, error: updateError } = await updateProfilePhoneVerified(
      supabaseAdmin,
      user.id,
      phoneToVerify,
    );

    if (updateError) {
      console.error('Phone verification profile update failed:', {
        message: updateError.message,
        code: updateError.code,
      });

      if (isDuplicateVerifiedPhoneError(updateError)) {
        await markChallenge(supabaseAdmin, challenge.id, {
          status: 'failed',
          provider_status: 'duplicate_phone',
          finalized_at: new Date().toISOString(),
        });

        return Response.json(
          { error: 'This phone number is already linked to another PawHome account.' },
          { status: 409 },
        );
      }

      return Response.json(
        { error: 'Phone was verified, but your profile could not be updated. Please try again.' },
        { status: 500 },
      );
    }

    const { error: completionError } = await markChallenge(supabaseAdmin, challenge.id, {
      status: 'completed',
      provider_status: 'completed',
      finalized_at: new Date().toISOString(),
    });

    if (completionError) {
      console.error('Phone verification challenge completion save failed:', {
        message: completionError.message,
        code: completionError.code,
      });
    }

    return Response.json({ success: true, profile: normalizePhoneVerified(updatedProfile) }, { status: 200 });
  } catch (error) {
    console.error('Verify phone code failed:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    const isClientError = error?.status && error.status >= 400 && error.status < 500;

    return Response.json(
      {
        error: isClientError
          ? error.message || 'The code is incorrect or expired.'
          : 'Could not verify code. Please try again.',
      },
      { status: isClientError ? 400 : 500 },
    );
  }
}
