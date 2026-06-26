import { createHash } from 'crypto';
import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX_CLICKS = 3;

function getIpHash(ip) {
  const secret = process.env.COUNTER_RATE_LIMIT_SECRET;
  if (!secret) return null;

  return createHash('sha256').update(`${secret}:${ip}`).digest('hex');
}

async function isRateLimited({ supabaseAdmin, counterType, listingId, ipHash, maxHits }) {
  const windowCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from('counter_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('counter_type', counterType)
    .eq('listing_id', listingId)
    .eq('ip_hash', ipHash)
    .gte('created_at', windowCutoff);

  if (countError) throw countError;

  if ((count || 0) >= maxHits) {
    return true;
  }

  const { error: insertError } = await supabaseAdmin.from('counter_rate_limits').insert({
    counter_type: counterType,
    listing_id: listingId,
    ip_hash: ipHash,
  });

  if (insertError) throw insertError;

  return false;
}

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

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

  const ipHash = getIpHash(ip);

  if (!ipHash) {
    return Response.json({ error: 'Counter rate limit is not configured.' }, { status: 500 });
  }

  try {
    const limited = await isRateLimited({
      supabaseAdmin,
      counterType: 'phone_click',
      listingId,
      ipHash,
      maxHits: RATE_LIMIT_MAX_CLICKS,
    });

    if (limited) {
      return Response.json({ success: true, skipped: true }, { status: 200 });
    }

    const { data: phoneClicks, error: rpcError } = await supabaseAdmin.rpc('increment_listing_phone_clicks', {
      listing_id_input: listingId,
    });

    if (rpcError) {
      console.error('Phone click counter error:', {
        message: rpcError.message,
        code: rpcError.code,
      });

      return Response.json({ error: 'Could not update phone counter.' }, { status: 500 });
    }

    return Response.json({ success: true, phoneClicks }, { status: 200 });
  } catch (error) {
    console.error('Phone click API error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Could not track phone click.' }, { status: 500 });
  }
}
