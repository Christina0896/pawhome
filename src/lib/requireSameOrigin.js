const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function addOrigin(allowedOrigins, value) {
  if (!value) return;

  try {
    allowedOrigins.add(new URL(value).origin);
  } catch {
    // Ignore invalid values. The request will still be checked against other valid origins.
  }
}

function addRequestHostOrigins(allowedOrigins, request) {
  const host = request.headers.get('host');

  if (!host) return;

  addOrigin(allowedOrigins, `https://${host}`);
  addOrigin(allowedOrigins, `http://${host}`);
}

function getAllowedOrigins(request) {
  const allowedOrigins = new Set();

  addOrigin(allowedOrigins, process.env.NEXT_PUBLIC_SITE_URL);
  addOrigin(allowedOrigins, request.url);
  addRequestHostOrigins(allowedOrigins, request);

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    addOrigin(allowedOrigins, `https://${vercelUrl}`);
  }

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

  if (allowedOrigins.size === 0) {
    return Response.json({ error: 'Allowed site origin is not configured.' }, { status: 500 });
  }

  if (!allowedOrigins.has(originValue)) {
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  return null;
}
