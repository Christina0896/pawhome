const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function getAllowedOrigins(request) {
  const allowedOrigins = new Set();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    try {
      allowedOrigins.add(new URL(siteUrl).origin);
      return allowedOrigins;
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return allowedOrigins;
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return allowedOrigins;
  }

  const host = request.headers.get('host');

  if (!host) {
    return allowedOrigins;
  }

  allowedOrigins.add(`http://${host}`);
  allowedOrigins.add(`https://${host}`);

  return allowedOrigins;
}

export function requireSameOrigin(request) {
  const method = request.method?.toUpperCase();

  if (!MUTATING_METHODS.includes(method)) {
    return null;
  }

  const origin = request.headers.get('origin');

  if (!origin) {
    return Response.json({ error: 'Origin header is required.' }, { status: 403 });
  }

  let originValue;

  try {
    originValue = new URL(origin).origin;
  } catch {
    return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  }

  const allowedOrigins = getAllowedOrigins(request);

  if (!allowedOrigins.has(originValue)) {
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  return null;
}
