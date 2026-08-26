import { requireAdmin } from '../../../../../../lib/requireAdmin';
import { PUBLIC_LISTING_SELECT } from '../../../../../../lib/publicListingSelect';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { id } = await params;
  const listingId = Number(id);

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  try {
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select(PUBLIC_LISTING_SELECT)
      .eq('id', listingId)
      .maybeSingle();

    if (error) {
      console.error('Admin listing preview lookup failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not load listing preview.' }, { status: 500 });
    }

    if (!listing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const { data: similarListings, error: similarError } = await supabaseAdmin
      .from('listings')
      .select(PUBLIC_LISTING_SELECT)
      .neq('id', listingId)
      .eq('animal_type', listing.animal_type)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);

    if (similarError) {
      console.warn('Admin preview similar listings failed:', {
        message: similarError.message,
        code: similarError.code,
      });
    }

    return Response.json(
      {
        listing,
        similarListings: similarListings || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Admin listing preview route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Could not load listing preview.' }, { status: 500 });
  }
}
