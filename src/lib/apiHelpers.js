export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  return authHeader.replace('Bearer ', '').trim();
}

export async function getAuthenticatedUser(supabaseAdmin, request, unauthorizedMessage = 'Not authenticated.') {
  const token = getBearerToken(request);

  if (!token) {
    return { error: Response.json({ error: unauthorizedMessage }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return { error: Response.json({ error: 'Invalid session.' }, { status: 401 }) };
  }

  return { user, token };
}

export function getRequestIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function safeDelete(query, label) {
  const { error } = await query;

  if (error) {
    console.error(`${label} delete error:`, {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    throw error;
  }
}

export async function removeStorageFiles(supabaseAdmin, bucket, paths = [], logLabel = 'Storage cleanup') {
  const safePaths = [...new Set(paths)].filter(Boolean);

  if (safePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(bucket).remove(safePaths);

  if (error) {
    console.error(`${logLabel} failed:`, {
      message: error?.message,
      code: error?.code,
    });
  }
}
