import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getRequestIp } from '../../../../../lib/apiHelpers';
import { getIpHash, isCounterRateLimited } from '../../../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX_CLICKS = 3;

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
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, contact_phone')
      .eq('id', listingId)
      .eq('status', 'approved')
      .maybeSingle();

    if (listingError) {
      console.error('Phone reveal listing lookup failed:', {
        message: listingError.message,
        code: listingError.code,
      });

      return Response.json({ error: 'Could not reveal phone number.' }, { status: 500 });
    }

    if (!listing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }
    const limited = await isCounterRateLimited({
      supabaseAdmin,
      counterType: 'phone_click',
      listingId,
      ipHash,
      maxHits: RATE_LIMIT_MAX_CLICKS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (limited) {
      return Response.json(
        {
          success: true,
          skipped: true,
          phoneNumber: listing.contact_phone || '',
        },
        { status: 200 },
      );
    }

    const { data: phoneClicks, error: rpcError } = await supabaseAdmin.rpc('increment_listing_phone_clicks', {
      listing_id_input: listingId,
    });

    if (rpcError) {
      console.error('Phone click counter error:', {
        message: rpcError.message,
        code: rpcError.code,
      });

      return Response.json(
        {
          success: true,
          phoneClicks: null,
          phoneNumber: listing.contact_phone || '',
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        success: true,
        phoneClicks,
        phoneNumber: listing.contact_phone || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Phone click API error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Could not track phone click.' }, { status: 500 });
  }
}
