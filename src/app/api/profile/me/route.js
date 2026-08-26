import { getAuthenticatedUser } from '../../../../lib/apiHelpers';
import { normalizePhoneVerified } from '../../../../lib/booleanFlags';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PROFILE_SELECT = `
  user_id,
  first_name,
  last_name,
  account_type,
  phone_code,
  phone_number,
  phone_verified,
  county,
  avatar_url,
  created_at
`;

export async function GET(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(supabaseAdmin, request);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile API fetch error:', {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
    });

    return Response.json({ error: 'Could not load profile.' }, { status: 500 });
  }

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        confirmed_at: user.confirmed_at,
      },
      profile: normalizePhoneVerified(profile),
    },
    { status: 200 },
  );
}
