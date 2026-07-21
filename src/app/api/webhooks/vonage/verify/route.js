import { timingSafeEqual } from 'node:crypto';
import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const TERMINAL_STATUS_MAP = {
  failed: 'failed',
  expired: 'expired',
  rejected: 'rejected',
  user_rejected: 'user_rejected',
};

function isAuthorized(request) {
  const expected = process.env.VONAGE_VERIFY_WEBHOOK_SECRET;
  if (!expected) return false;

  const url = new URL(request.url);
  const supplied = url.searchParams.get('secret') || request.headers.get('x-pawhome-webhook-secret') || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Service unavailable.' }, { status: 500 });

  try {
    const payload = await request.json();
    const requestId = String(payload?.request_id || '').trim();
    const providerStatus = String(payload?.status || '').trim().toLowerCase();

    if (!requestId || !providerStatus) {
      return Response.json({ error: 'Invalid callback.' }, { status: 400 });
    }

    const nextStatus = TERMINAL_STATUS_MAP[providerStatus];
    const updatePayload = {
      provider_status: providerStatus,
      provider_details: payload,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus) {
      updatePayload.status = nextStatus;
      updatePayload.finalized_at = payload?.finalized_at || new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('phone_verification_challenges')
      .update(updatePayload)
      .eq('provider_request_id', requestId);

    if (error) {
      console.error('Vonage Verify callback update failed:', {
        message: error.message,
        code: error.code,
      });

      return Response.json({ error: 'Could not record callback.' }, { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Vonage Verify callback failed:', { message: error?.message });
    return Response.json({ error: 'Invalid callback.' }, { status: 400 });
  }
}
