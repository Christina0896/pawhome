import { notFound } from 'next/navigation';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import { PUBLIC_LISTING_SELECT } from '../../../lib/publicListingSelect';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import AdminListingPreviewClient from './AdminListingPreviewClient';
import ListingDetailClient from './ListingDetailClient';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';
const LISTING_DETAIL_SELECT = `${PUBLIC_LISTING_SELECT}, user_id`;

function absoluteUrl(value) {
  const url = String(value || '').trim();

  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${siteUrl}${url}`;

  return `${siteUrl}/${url}`;
}

function trimText(value, maxLength = 155) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function getSortedPhotoUrls(listing) {
  return [...(listing?.listing_photos || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((photo) => absoluteUrl(photo.image_url))
    .filter(Boolean);
}

function buildListingStructuredData(listing) {
  const canonical = `${siteUrl}/listings/${listing.id}`;
  const images = getSortedPhotoUrls(listing);
  const name = listing.title || `${listing.breed || listing.animal_type || 'Pet'} available in Ireland`;
  const location = [listing.city, listing.county].filter(Boolean).join(', ');
  const description = trimText(
    listing.description ||
      `${listing.breed || listing.animal_type || 'Pet'} ${listing.listing_type || 'listing'}${
        location ? ` in ${location}` : ' in Ireland'
      } on PawHome.`,
    500,
  );

  const additionalProperty = [
    listing.animal_type ? { '@type': 'PropertyValue', name: 'Animal type', value: listing.animal_type } : null,
    listing.breed ? { '@type': 'PropertyValue', name: 'Breed', value: listing.breed } : null,
    listing.listing_type ? { '@type': 'PropertyValue', name: 'Listing type', value: listing.listing_type } : null,
    listing.age ? { '@type': 'PropertyValue', name: 'Age', value: listing.age } : null,
    listing.sex ? { '@type': 'PropertyValue', name: 'Sex', value: listing.sex } : null,
    listing.county ? { '@type': 'PropertyValue', name: 'County', value: listing.county } : null,
    listing.microchipped ? { '@type': 'PropertyValue', name: 'Microchipped', value: listing.microchipped } : null,
    listing.vaccinated ? { '@type': 'PropertyValue', name: 'Vaccinated', value: listing.vaccinated } : null,
    listing.seller_verified
      ? { '@type': 'PropertyValue', name: 'Seller verification', value: 'Verified by PawHome' }
      : null,
  ].filter(Boolean);

  const productNode = {
    '@type': 'Product',
    '@id': `${canonical}#listing`,
    name,
    description,
    image: images.length > 0 ? images : [`${siteUrl}/img/logo.png`],
    category: `${listing.animal_type || 'Pet'} listing`,
    brand: {
      '@type': 'Brand',
      name: 'PawHome',
    },
    additionalProperty,
  };

  if (listing.price && Number.isFinite(Number(listing.price))) {
    productNode.offers = {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'EUR',
      price: Number(listing.price),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'PawHome',
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Pet listings', item: `${siteUrl}/listings` },
          { '@type': 'ListItem', position: 3, name, item: canonical },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name,
        description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'PawHome',
          url: siteUrl,
        },
        primaryImageOfPage: images[0] || `${siteUrl}/img/logo.png`,
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        mainEntity: { '@id': `${canonical}#listing` },
      },
      productNode,
    ],
  };
}

async function getSellerAvatarUrl(userId) {
  if (!userId) return null;

  const supabaseAdmin = getSupabaseAdminClient();
  const supabase = supabaseAdmin || getSupabaseServerClient();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Seller profile avatar fetch failed:', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return profile?.avatar_url || null;
}

async function getListing(listingId) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !listingId) {
    return { listing: null, similarListings: [] };
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .select(LISTING_DETAIL_SELECT)
    .eq('id', listingId)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) {
    console.error('Server listing detail fetch failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return { listing: null, similarListings: [] };
  }

  if (!listing) return { listing: null, similarListings: [] };

  const sellerAvatarUrl = await getSellerAvatarUrl(listing.user_id);
  const publicListing = {
    ...listing,
    seller_avatar_url: sellerAvatarUrl,
  };

  delete publicListing.user_id;

  const { data: similarListings, error: similarError } = await supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('status', 'approved')
    .neq('id', listingId)
    .eq('animal_type', listing.animal_type)
    .order('created_at', { ascending: false })
    .limit(3);

  if (similarError) {
    console.warn('Server similar listings fetch failed:', {
      message: similarError.message,
      code: similarError.code,
    });
  }

  return {
    listing: publicListing,
    similarListings: similarListings || [],
  };
}

export default async function ListingDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const listingId = resolvedParams?.id;
  const isAdminPreview = resolvedSearchParams?.adminPreview === 'true';
  const isOwnerPreview = resolvedSearchParams?.ownerPreview === 'true';

  if (isAdminPreview || isOwnerPreview) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />
        <AdminListingPreviewClient listingId={listingId} mode={isOwnerPreview ? 'owner' : 'admin'} />
        <Footer />
      </div>
    );
  }

  const { listing, similarListings } = await getListing(listingId);
  if (!listing) notFound();

  const listingStructuredData = buildListingStructuredData(listing);

  return (
    <div className="min-h-screen bg-(--background)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingStructuredData).replace(/</g, '\\u003c') }}
      />
      <Header />
      <ListingDetailClient listing={listing} similarListings={similarListings} />
      <Footer />
    </div>
  );
}
