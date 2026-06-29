import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

function getSupabaseSitemapClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function sitemap() {
  const staticRoutes = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/listings`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/shelters`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/BreedGuide`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/AboutUs`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/buying-safely`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/safety`, changeFrequency: 'monthly', priority: 0.6 },
  ].map((route) => ({
    ...route,
    lastModified: new Date(),
  }));

  const supabase = getSupabaseSitemapClient();

  if (!supabase) return staticRoutes;

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(500);

  const listingRoutes = (listings || []).map((listing) => ({
    url: `${siteUrl}/listings/${listing.id}`,
    lastModified: new Date(listing.updated_at || listing.created_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...listingRoutes];
}
