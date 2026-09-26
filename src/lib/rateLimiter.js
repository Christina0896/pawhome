import { createHash } from 'crypto';

export function getIpHash(ip, secretName) {
  const secret = process.env[secretName];

  if (!secret) return null;

  return createHash('sha256').update(`${secret}:${ip}`).digest('hex');
}

export async function isCounterRateLimited({ supabaseAdmin, counterType, listingId, ipHash, maxHits, windowMs }) {
  const windowCutoff = new Date(Date.now() - windowMs).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from('counter_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('counter_type', counterType)
    .eq('listing_id', listingId)
    .eq('ip_hash', ipHash)
    .gte('created_at', windowCutoff);

  if (countError) throw countError;

  if ((count || 0) >= maxHits) {
    return true;
  }

  const { error: insertError } = await supabaseAdmin.from('counter_rate_limits').insert({
    counter_type: counterType,
    listing_id: listingId,
    ip_hash: ipHash,
  });

  if (insertError) throw insertError;

  return false;
}

export async function isIpRateLimited({ supabaseAdmin, tableName, ipHash, maxHits, windowMs, cleanupMs }) {
  if (cleanupMs) {
    const cleanupCutoff = new Date(Date.now() - cleanupMs).toISOString();
    await supabaseAdmin.from(tableName).delete().lt('created_at', cleanupCutoff);
  }

  const { error: insertError } = await supabaseAdmin.from(tableName).insert({
    ip_hash: ipHash,
  });

  if (insertError) throw insertError;

  const windowCutoff = new Date(Date.now() - windowMs).toISOString();

  const { count, error: countError } = await supabaseAdmin
    .from(tableName)
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', windowCutoff);

  if (countError) throw countError;

  return (count || 0) > maxHits;
}
