import { getSupabaseAdminClient } from '../../../../../../lib/supabaseAdmin';
import { getAuthenticatedUser } from '../../../../../../lib/apiHelpers';
import { PUBLIC_LISTING_SELECT } from '../../../../../../lib/publicListingSelect';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Preview service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);

  if (authError) {
    return authError;
  }

  try {
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select(`user_id, ${PUBLIC_LISTING_SELECT}`)
      .eq('id', listingId)
      .maybeSingle();

    if (error) {
      console.error('Owner listing preview lookup failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not load listing preview.' }, { status: 500 });
    }

    if (!listing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return Response.json({ error: 'Not allowed.' }, { status: 403 });
    }

    const { user_id: _userId, ...publicListing } = listing;

    const { data: similarListings, error: similarError } = await supabaseAdmin
      .from('listings')
      .select(PUBLIC_LISTING_SELECT)
      .neq('id', listingId)
      .eq('animal_type', listing.animal_type)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);

    if (similarError) {
      console.warn('Owner preview similar listings failed:', {
        message: similarError.message,
        code: similarError.code,
      });
    }

    return Response.json(
      {
        listing: publicListing,
        similarListings: similarListings || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Owner listing preview route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Could not load listing preview.' }, { status: 500 });
  }
}
