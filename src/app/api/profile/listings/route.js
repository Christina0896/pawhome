import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 24;

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

function getPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile listing service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);
  if (auth.error) return auth.error;

  const { user } = auth;
  const { searchParams } = new URL(request.url);
  const page = getPositiveInt(searchParams.get('page'), 1);
  const pageSize = getPositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: listings, error, count } = await supabaseAdmin
    .from('listings')
    .select(PROFILE_LISTING_SELECT, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Profile listings API fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return Response.json({ error: 'Could not load your listings.' }, { status: 500 });
  }

  const listingRows = listings || [];
  const listingIds = listingRows.map((listing) => listing.id).filter(Boolean);
  let photos = [];

  if (listingIds.length > 0) {
    const { data, error: photosError } = await supabaseAdmin
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

      return Response.json({ error: 'Could not load listing photos.' }, { status: 500 });
    }

    photos = data || [];
  }

  const firstPhotoByListingId = new Map();

  for (const photo of photos) {
    if (!firstPhotoByListingId.has(photo.listing_id)) {
      firstPhotoByListingId.set(photo.listing_id, photo);
    }
  }

  const listingsWithFirstPhoto = listingRows.map((listing) => ({
    ...listing,
    first_photo: firstPhotoByListingId.get(listing.id) || null,
  }));
  const totalCount = count || 0;

  return Response.json(
    {
      listings: listingsWithFirstPhoto,
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    },
    { status: 200 },
  );
}
