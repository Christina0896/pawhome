import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser(request, supabaseAdmin) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return { error: Response.json({ error: 'Not authenticated.' }, { status: 401 }) };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: Response.json({ error: 'Invalid session.' }, { status: 401 }) };
  }

  return { user };
}

export async function POST(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Favourite service is not configured.' }, { status: 500 });
  }

  const { listingId } = await params;

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const auth = await getAuthenticatedUser(request, supabaseAdmin);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, status')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError) {
    console.error('Favourite listing lookup error:', {
      message: listingError.message,
      code: listingError.code,
    });

    return Response.json({ error: 'Could not check listing.' }, { status: 500 });
  }

  if (!listing || listing.status !== 'approved') {
    return Response.json({ error: 'Listing is not available.' }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from('favorites').upsert(
    {
      user_id: user.id,
      listing_id: listingId,
    },
    {
      onConflict: 'user_id,listing_id',
      ignoreDuplicates: true,
    },
  );

  if (error) {
    console.error('Favourite insert error:', {
      message: error.message,
      code: error.code,
    });

    return Response.json({ error: 'Could not save favourite.' }, { status: 500 });
  }

  return Response.json({ success: true, isFavorite: true }, { status: 200 });
}

export async function DELETE(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Favourite service is not configured.' }, { status: 500 });
  }

  const { listingId } = await params;

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const auth = await getAuthenticatedUser(request, supabaseAdmin);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  const { error } = await supabaseAdmin.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);

  if (error) {
    console.error('Favourite delete error:', {
      message: error.message,
      code: error.code,
    });

    return Response.json({ error: 'Could not remove favourite.' }, { status: 500 });
  }

  return Response.json({ success: true, isFavorite: false }, { status: 200 });
}
