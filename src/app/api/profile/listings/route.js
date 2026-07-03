import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PROFILE_LISTING_SELECT = `
  id,
  title,
  listing_type,
  animal_type,
  breed,
  age,
  sex,
  price,
  price_negotiable,
  county,
  city,
  microchipped,
  vaccinated,
  litter_size,
  status,
  created_at
`;

export async function GET(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile listing service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  const { data: listings, error } = await supabaseAdmin
    .from('listings')
    .select(PROFILE_LISTING_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Profile listings API fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return Response.json({ listings: [] }, { status: 200 });
  }

  const listingRows = listings || [];
  const listingIds = listingRows.map((listing) => listing.id).filter(Boolean);

  if (listingIds.length === 0) {
    return Response.json({ listings: [] }, { status: 200 });
  }

  const { data: photos, error: photosError } = await supabaseAdmin
    .from('listing_photos')
    .select('id, listing_id, image_url, sort_order')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  if (photosError) {
    console.error('Profile listing photos API fetch error:', {
      message: photosError.message,
      code: photosError.code,
      details: photosError.details,
    });
  }

  const photosByListingId = new Map();

  for (const photo of photos || []) {
    const currentPhotos = photosByListingId.get(photo.listing_id) || [];
    currentPhotos.push(photo);
    photosByListingId.set(photo.listing_id, currentPhotos);
  }

  const listingsWithPhotos = listingRows.map((listing) => ({
    ...listing,
    listing_photos: photosByListingId.get(listing.id) || [],
  }));

  return Response.json({ listings: listingsWithPhotos }, { status: 200 });
}
