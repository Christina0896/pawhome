import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getRequestIp } from '../../../../../lib/apiHelpers';
import { getIpHash, isCounterRateLimited } from '../../../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_VIEWS = 1;

export async function POST(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Counter service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const ipHash = getIpHash(getRequestIp(request), 'COUNTER_RATE_LIMIT_SECRET');

  if (!ipHash) {
    return Response.json({ error: 'Counter rate limit is not configured.' }, { status: 500 });
  }

  try {
    const limited = await isCounterRateLimited({
      supabaseAdmin,
      counterType: 'view',
      listingId,
      ipHash,
      maxHits: RATE_LIMIT_MAX_VIEWS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (limited) {
      return Response.json({ success: true, skipped: true }, { status: 200 });
    }

    const { data: views, error: rpcError } = await supabaseAdmin.rpc('increment_listing_views', {
      listing_id_input: listingId,
    });

    if (rpcError) {
      console.error('View counter error:', {
        message: rpcError.message,
        code: rpcError.code,
      });

      return Response.json({ error: 'Could not update view counter.' }, { status: 500 });
    }

    return Response.json({ success: true, views }, { status: 200 });
  } catch (error) {
    console.error('View API error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Could not track view.' }, { status: 500 });
  }
}
