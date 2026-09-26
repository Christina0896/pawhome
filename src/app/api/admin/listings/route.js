import { requireAdmin } from '../../../../lib/requireAdmin';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUS_FILTERS = ['pending', 'approved', 'rejected'];

const ADMIN_LISTING_SELECT = `
  id,
  title,
  animal_type,
  listing_type,
  breed,
  age,
  sex,
  county,
  city,
  seller_name,
  seller_type,
  price,
  price_negotiable,
  microchipped,
  vaccinated,
  wormed,
  vet_checked,
  spayed_neutered,
  health_tested,
  kennel_club_registered,
  litter_size,
  available_litter_count,
  male_count,
  female_count,
  date_of_birth,
  ready_to_leave,
  mother_can_be_seen,
  registration_number,
  organisation_name,
  contact_phone,
  description,
  status,
  created_at
`;

function attachPhotoData(listings, photos) {
  const photosByListingId = new Map();

  for (const photo of photos || []) {
    const currentPhotos = photosByListingId.get(photo.listing_id) || [];
    currentPhotos.push(photo);
    photosByListingId.set(photo.listing_id, currentPhotos);
  }

  return (listings || []).map((listing) => {
    const sortedPhotos = [...(photosByListingId.get(listing.id) || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return {
      ...listing,
      mainImage: sortedPhotos[0]?.image_url || null,
      photoCount: sortedPhotos.length,
    };
  });
}

export async function GET(request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  if (!ALLOWED_STATUS_FILTERS.includes(status)) {
    return Response.json({ error: 'Invalid listing status.' }, { status: 400 });
  }

  const { data: listings, error } = await supabaseAdmin
    .from('listings')
    .select(ADMIN_LISTING_SELECT)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin listings API fetch error:', {
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
    .select('listing_id, image_url, sort_order')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  if (photosError) {
    console.error('Admin listing photos API fetch error:', {
      message: photosError.message,
      code: photosError.code,
      details: photosError.details,
    });
  }

  return Response.json({ listings: attachPhotoData(listingRows, photos || []) }, { status: 200 });
}
