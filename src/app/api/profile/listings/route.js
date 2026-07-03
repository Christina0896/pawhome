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
  created_at,
  listing_photos (
    id,
    image_url,
    sort_order
  )
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

    return Response.json({ error: 'Could not load your listings.' }, { status: 500 });
  }

  return Response.json({ listings: listings || [] }, { status: 200 });
}
