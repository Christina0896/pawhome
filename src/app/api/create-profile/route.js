import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value, fallback = '') {
  return String(value || fallback)
    .trim()
    .slice(0, 120);
}

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  try {
    const { userId, email, firstName, lastName, phoneCode, phoneNumber, accountType, county, marketing } =
      await request.json();

    if (!userId || !email) {
      return Response.json({ error: 'Missing user details.' }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user || user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return Response.json({ error: 'Invalid user.' }, { status: 401 });
    }

    const allowedAccountTypes = ['Buyer', 'Private Seller', 'Private Owner', 'Breeder', 'Shelter / Rescue'];

    const safeAccountType = allowedAccountTypes.includes(accountType) ? accountType : 'Buyer';

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: userId,
      first_name: cleanText(firstName),
      last_name: cleanText(lastName),
      phone_code: cleanText(phoneCode, '+353'),
      phone_number: cleanText(phoneNumber),
      account_type: safeAccountType,
      county: cleanText(county),
      marketing: Boolean(marketing),
    });

    if (profileError && profileError.code !== '23505') {
      console.error('Create profile error:', profileError);

      return Response.json({ error: 'Could not create profile.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Create profile route error:', error);

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
