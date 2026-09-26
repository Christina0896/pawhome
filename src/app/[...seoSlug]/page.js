import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { PUBLIC_LISTING_SELECT } from '../../lib/publicListingSelect';
import { getSupabaseServerClient } from '../../lib/supabaseServer';
import {
  SEO_FALLBACK_LIMIT,
  SEO_PAGE_LIMIT,
  buildListingsHref,
  getRelatedSeoLinks,
  getSeoRouteConfig,
  matchesSeoConfig,
} from '../../lib/seoLandingConfig';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

async function getSeoListings(config) {
  const supabase = getSupabaseServerClient();

  if (!supabase) return [];

  let strictQuery = supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(SEO_PAGE_LIMIT);

  if (config.animalType) strictQuery = strictQuery.ilike('animal_type', config.animalType);
  if (config.listingType) strictQuery = strictQuery.ilike('listing_type', config.listingType);
  if (config.county) strictQuery = strictQuery.ilike('county', config.county);
  if (config.breed) strictQuery = strictQuery.ilike('breed', `%${config.breed}%`);

  const { data: strictData, error: strictError } = await strictQuery;

  if (!strictError && strictData?.length) return strictData;

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(SEO_FALLBACK_LIMIT);

  if (fallbackError) {
    console.warn('SEO landing listing fetch failed:', {
      message: fallbackError.message,
      code: fallbackError.code,
    });
    return [];
  }

  return (fallbackData || []).filter((listing) => matchesSeoConfig(listing, config)).slice(0, SEO_PAGE_LIMIT);
}

function getMainImage(listing) {
  const sortedPhotos = [...(listing?.listing_photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return sortedPhotos[0]?.image_url || '';
}

function buildStructuredData(config, listings) {
  const pageUrl = `${siteUrl}/${config.canonical}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: config.h1,
        description: config.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'PawHome',
          url: siteUrl,
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: listings.length,
          itemListElement: listings.map((listing, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${siteUrl}/listings/${listing.id}`,
            name: listing.title || `${listing.breed || listing.animal_type || 'Pet'} listing`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Pet listings', item: `${siteUrl}/listings` },
          { '@type': 'ListItem', position: 3, name: config.h1, item: pageUrl },
        ],
      },
    ],
  };
}

function SeoListingCard({ listing }) {
  const mainImage = getMainImage(listing);
  const tags = [listing.county, listing.age, listing.sex, listing.listing_type].filter(Boolean);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-(--border-beige) bg-white shadow-[0_8px_24px_rgba(18,53,36,0.05)] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(18,53,36,0.10)]"
    >
      <div className="h-48 bg-(--light-green)">
        {mainImage ? (
          <img src={mainImage} alt={listing.title || listing.breed || 'Pet listing'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🐾</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-extrabold text-(--secondary-green)">
              {listing.title || listing.breed || listing.animal_type || 'Pet listing'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-(--muted-green-text)">{listing.breed || listing.animal_type}</p>
          </div>

          {listing.price ? <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">€{listing.price}</p> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-(--background) px-3 py-1 font-bold text-(--secondary-green)">
              {tag}
            </span>
          ))}
        </div>

        <span className="mt-auto pt-5 text-sm font-extrabold text-(--primary-green) group-hover:underline">View listing</span>
      </div>
    </Link>
  );
}

function FaqSection({ config }) {
  const location = config.county || 'Ireland';
  const animalText = config.breed || config.keyword || config.animalType || 'pets';

  const faqs = [
    [`How do I find ${String(animalText).toLowerCase()} in ${location}?`, 'Use PawHome to browse approved listings, compare photos and details, then contact the seller directly from the listing page.'],
    ['What should I check before contacting a seller?', 'Check the pet description, age, location, photos, microchip information, vaccination details, seller type and any registration or health testing information provided.'],
    ['Are pending listings shown here?', 'No. SEO landing pages only show approved listings that are visible to the public.'],
  ];

  return (
    <section className="mt-12 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-(--secondary-green)">Frequently asked questions</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {faqs.map(([question, answer]) => (
          <div key={question} className="rounded-2xl bg-(--background) p-5">
            <h3 className="text-sm font-extrabold text-(--secondary-green)">{question}</h3>
            <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const config = getSeoRouteConfig(resolvedParams?.seoSlug || []);

  if (!config) return { title: 'Page not found', robots: { index: false, follow: false } };

  const description = config.description.length > 155 ? `${config.description.slice(0, 152).trim()}...` : config.description;

  return {
    title: config.title,
    description,
    alternates: { canonical: `/${config.canonical}` },
    openGraph: {
      title: config.title,
      description,
      url: `/${config.canonical}`,
      siteName: 'PawHome',
      type: 'website',
      locale: 'en_IE',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description,
    },
  };
}

export default async function SeoLandingPage({ params }) {
  const resolvedParams = await params;
  const config = getSeoRouteConfig(resolvedParams?.seoSlug || []);

  if (!config) notFound();

  const listings = await getSeoListings(config);
  const relatedLinks = getRelatedSeoLinks(config);
  const structuredData = buildStructuredData(config, listings);
  const listingsHref = buildListingsHref(config);

  return (
    <div className="min-h-screen bg-(--background)">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <Header />

      <main className="mx-auto max-w-(--page-max-width) px-6 py-10">
        <nav className="text-sm font-semibold text-(--muted-green-text)" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-(--primary-green)">Home</Link>
          <span className="px-2">/</span>
          <Link href="/listings" className="hover:text-(--primary-green)">Listings</Link>
          <span className="px-2">/</span>
          <span className="text-(--secondary-green)">{config.h1}</span>
        </nav>

        <section className="mt-8 rounded-[2rem] border border-(--border-beige) bg-white p-8 shadow-[0_12px_32px_rgba(18,53,36,0.06)] md:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-(--primary-green)">PawHome Ireland</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-(--secondary-green) md:text-5xl">{config.h1}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-(--muted-green-text)">{config.description}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={listingsHref} className="rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-extrabold text-white transition hover:bg-(--secondary-orange)">
              Browse all matching listings
            </Link>
            <Link href="/post-ad" className="rounded-full border border-(--border-beige) bg-white px-6 py-3 text-sm font-extrabold text-(--secondary-green) transition hover:border-(--primary-green)">
              Post an ad
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-(--secondary-green)">Latest listings</h2>
              <p className="mt-1 text-sm text-(--muted-green-text)">
                {listings.length > 0 ? `${listings.length} matching approved listings shown.` : 'No approved matching listings are live yet.'}
              </p>
            </div>
            <Link href={listingsHref} className="text-sm font-extrabold text-(--primary-green) hover:underline">View more filters</Link>
          </div>

          {listings.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => <SeoListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-(--border-beige) bg-white p-8 text-center">
              <h2 className="text-xl font-extrabold text-(--secondary-green)">No listings found yet</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-(--muted-green-text)">
                This SEO page is connected to the approved listings database. It only shows public approved ads that match this page.
              </p>
              <Link href="/post-ad" className="mt-5 inline-flex rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-extrabold text-white">Post the first ad</Link>
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-(--secondary-green)">Related searches</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-(--border-beige) bg-(--background) px-4 py-2 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green) hover:text-(--primary-green)">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <FaqSection config={config} />
      </main>

      <Footer />
    </div>
  );
}
