import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

function getSupabaseMetadataClient() {
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

function trimDescription(value) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= 155) return text;

  return `${text.slice(0, 152).trim()}...`;
}

function getMainImage(photos) {
  const sortedPhotos = [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return sortedPhotos[0]?.image_url || '/img/logo.png';
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const listingId = resolvedParams?.id;

  if (!listingId) {
    return {
      title: 'Pet Listing',
      description: 'View this PawHome pet listing in Ireland.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const supabase = getSupabaseMetadataClient();

  if (!supabase) {
    return {
      title: 'Pet Listing',
      description: 'View this PawHome pet listing in Ireland.',
    };
  }

  const { data: listing } = await supabase
    .from('listings')
    .select(
      `
        id,
        title,
        breed,
        animal_type,
        listing_type,
        county,
        city,
        description,
        price,
        listing_photos (
          image_url,
          sort_order
        )
      `,
    )
    .eq('id', listingId)
    .eq('status', 'approved')
    .maybeSingle();

  if (!listing) {
    return {
      title: 'Listing Not Available',
      description: 'This PawHome listing may have been removed, expired, or is currently unavailable.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const listingTitle = listing.title || `${listing.breed || listing.animal_type || 'Pet'} available`;
  const location = [listing.city, listing.county].filter(Boolean).join(', ');
  const title = [listingTitle, location].filter(Boolean).join(' | ');
  const description = trimDescription(
    listing.description ||
      `${listing.breed || listing.animal_type || 'Pet'} listing${location ? ` in ${location}` : ' in Ireland'} on PawHome.`,
  );
  const image = getMainImage(listing.listing_photos);
  const canonical = `/listings/${listing.id}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | PawHome`,
      description,
      url: `${siteUrl}${canonical}`,
      type: 'article',
      siteName: 'PawHome',
      locale: 'en_IE',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: listingTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PawHome`,
      description,
      images: [image],
    },
  };
}

export default function ListingDetailLayout({ children }) {
  return children;
}
