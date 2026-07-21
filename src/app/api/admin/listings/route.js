import { requireAdmin } from '../../../../lib/requireAdmin';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUS_FILTERS = ['pending', 'approved', 'rejected'];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const ADMIN_LISTING_SELECT = `
  id,
  user_id,
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
  seller_verified,
  seller_verified_at,
  price,
  price_negotiable,
  microchipped,
  vaccinated,
  wormed,
  vet_checked,
  spayed_neutered,
  health_tested,
  kennel_club_registered,
  proven_stud,
  stud_terms,
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

function getPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function attachPhotoAndProfileData(listings, photos, profiles) {
  const photosByListingId = new Map();
  const profileByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

  for (const photo of photos || []) {
    const currentPhotos = photosByListingId.get(photo.listing_id) || [];
    currentPhotos.push(photo);
    photosByListingId.set(photo.listing_id, currentPhotos);
  }

  return (listings || []).map((listing) => {
    const sortedPhotos = [...(photosByListingId.get(listing.id) || [])].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );

    return {
      ...listing,
      seller_profile: profileByUserId.get(listing.user_id) || null,
      mainImage: sortedPhotos[0]?.image_url || null,
      photoCount: sortedPhotos.length,
    };
  });
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { supabaseAdmin } = admin;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const page = getPositiveInt(searchParams.get('page'), 1);
  const pageSize = getPositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  if (!ALLOWED_STATUS_FILTERS.includes(status)) {
    return Response.json({ error: 'Invalid listing status.' }, { status: 400 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: listings, error, count } = await supabaseAdmin
    .from('listings')
    .select(ADMIN_LISTING_SELECT, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Admin listings API fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return Response.json({ error: 'Could not load admin listings.' }, { status: 500 });
  }

  const listingRows = listings || [];
  const listingIds = listingRows.map((listing) => listing.id).filter(Boolean);
  const userIds = [...new Set(listingRows.map((listing) => listing.user_id).filter(Boolean))];

  let photos = [];
  let profiles = [];

  if (listingIds.length > 0) {
    const { data, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('listing_id, image_url, sort_order')
      .in('listing_id', listingIds)
      .order('sort_order', { ascending: true });

    if (photosError) {
      console.error('Admin listing photos API fetch error:', {
        message: photosError.message,
        code: photosError.code,
      });
      return Response.json({ error: 'Could not load listing photos.' }, { status: 500 });
    }

    photos = data || [];
  }

  if (userIds.length > 0) {
    const { data, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(
        'user_id, account_type, phone_verified, verified_phone_e164, seller_verification_status, seller_verified_type, seller_verified_at',
      )
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Admin seller profiles fetch error:', {
        message: profilesError.message,
        code: profilesError.code,
      });
      return Response.json({ error: 'Could not load seller verification details.' }, { status: 500 });
    }

    profiles = data || [];
  }

  const totalCount = count || 0;

  return Response.json(
    {
      listings: attachPhotoAndProfileData(listingRows, photos, profiles),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    },
    { status: 200 },
  );
}
