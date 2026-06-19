import { getSupabaseAdminClient } from './supabaseAdmin';

export async function requireAdmin(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return {
      error: Response.json({ error: 'Admin service is not configured.' }, { status: 500 }),
    };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      error: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
    };
  }

  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminData) {
    return {
      error: Response.json({ error: 'Forbidden.' }, { status: 403 }),
    };
  }

  return {
    supabaseAdmin,
    user,
  };
}
