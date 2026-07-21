import { createHash } from 'crypto';

export function getIpHash(ip, secretName) {
  const secret = process.env[secretName];

  if (!secret) return null;

  return createHash('sha256').update(`${secret}:${ip}`).digest('hex');
}

async function consumeRateLimit({ supabaseAdmin, bucket, scopeKey, maxHits, windowMs, cleanupMs }) {
  const { data, error } = await supabaseAdmin.rpc('consume_api_rate_limit', {
    p_bucket: bucket,
    p_scope_key: scopeKey,
    p_max_hits: maxHits,
    p_window_seconds: Math.max(Math.ceil(windowMs / 1000), 1),
    p_cleanup_seconds: Math.max(Math.ceil((cleanupMs || windowMs) / 1000), 1),
  });

  if (error) throw error;

  return Boolean(data);
}

export async function isCounterRateLimited({ supabaseAdmin, counterType, listingId, ipHash, maxHits, windowMs }) {
  return consumeRateLimit({
    supabaseAdmin,
    bucket: `counter:${counterType}`,
    scopeKey: `${listingId}:${ipHash}`,
    maxHits,
    windowMs,
    cleanupMs: Math.max(windowMs * 24, 24 * 60 * 60 * 1000),
  });
}

export async function isIpRateLimited({ supabaseAdmin, tableName, ipHash, maxHits, windowMs, cleanupMs }) {
  return consumeRateLimit({
    supabaseAdmin,
    bucket: `ip:${tableName}`,
    scopeKey: ipHash,
    maxHits,
    windowMs,
    cleanupMs,
  });
}

export async function isScopedRateLimited({ supabaseAdmin, bucket, scopeKey, maxHits, windowMs, cleanupMs }) {
  return consumeRateLimit({
    supabaseAdmin,
    bucket,
    scopeKey,
    maxHits,
    windowMs,
    cleanupMs,
  });
}
