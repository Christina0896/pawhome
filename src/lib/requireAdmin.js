import { getSupabaseAdminClient } from './supabaseAdmin';

export async function requireAdmin(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return {
      error: Response.json({ error: 'Admin service is not configured.' }, { status: 500 }),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return {
      error: Response.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      error: Response.json({ error: 'Invalid session.' }, { status: 401 }),
    };
  }

  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('Admin check failed:', {
      message: adminError.message,
      code: adminError.code,
    });

    return {
      error: Response.json({ error: 'Could not verify admin access.' }, { status: 500 }),
    };
  }

  if (!adminUser) {
    return {
      error: Response.json({ error: 'Admin access required.' }, { status: 403 }),
    };
  }

  return {
    supabaseAdmin,
    user,
  };
}
