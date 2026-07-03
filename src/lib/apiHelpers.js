const SERVER_AUTH_TIMEOUT_MS = 4000;

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), SERVER_AUTH_TIMEOUT_MS);
    }),
  ]);
}

export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  return authHeader.replace('Bearer ', '').trim();
}

export async function getAuthenticatedUser(supabaseAdmin, request, unauthorizedMessage = 'Not authenticated.') {
  const token = getBearerToken(request);

  if (!token) {
    return { error: Response.json({ error: unauthorizedMessage }, { status: 401 }) };
  }

  let authResult;

  try {
    authResult = await withTimeout(supabaseAdmin.auth.getUser(token), 'Server auth validation');
  } catch (error) {
    console.error('Server auth validation failed:', error);
    return { error: Response.json({ error: 'Session validation timed out. Please reload and log in again.' }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userError,
  } = authResult;

  if (userError || !user) {
    return { error: Response.json({ error: 'Invalid session.' }, { status: 401 }) };
  }

  return { user, token };
}

function getFirstHeaderValue(value) {
  return String(value || '')
    .split(',')[0]
    .trim();
}

export function getRequestIp(request) {
  return (
    getFirstHeaderValue(request.headers.get('x-vercel-forwarded-for')) ||
    getFirstHeaderValue(request.headers.get('cf-connecting-ip')) ||
    getFirstHeaderValue(request.headers.get('x-real-ip')) ||
    getFirstHeaderValue(request.headers.get('x-forwarded-for')) ||
    'unknown'
  );
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
