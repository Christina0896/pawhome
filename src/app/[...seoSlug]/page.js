import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../../data/petOptions';
import { PUBLIC_LISTING_SELECT } from '../../lib/publicListingSelect';
import { getSupabaseServerClient } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';
const PAGE_LIMIT = 24;

const CORE_CATEGORY_ROUTES = [
  {
    slug: 'pets-for-sale',
    title: 'Pets for Sale in Ireland',
    h1: 'Pets for sale in Ireland',
    animalType: '',
    listingType: 'For Sale',
    intro:
      'Browse pets for sale across Ireland, including dogs, cats, puppies, kittens and other animals from private sellers, breeders and trusted organisations.',
  },
  {
    slug: 'pets-for-adoption',
    title: 'Pets for Adoption in Ireland',
    h1: 'Pets for adoption in Ireland',
    animalType: '',
    listingType: 'For Adoption',
    intro:
      'Find pets for adoption across Ireland from rescues, shelters and owners looking for responsible new homes.',
  },
  {
    slug: 'dogs-for-sale',
    title: 'Dogs for Sale in Ireland',
    h1: 'Dogs for sale in Ireland',
    animalType: 'Dogs',
    listingType: 'For Sale',
    intro: 'Browse dogs and puppies for sale across Ireland from responsible owners and breeders.',
  },
  {
    slug: 'dogs-for-adoption',
    title: 'Dogs for Adoption in Ireland',
    h1: 'Dogs for adoption in Ireland',
    animalType: 'Dogs',
    listingType: 'For Adoption',
    intro: 'Find dogs for adoption in Ireland and connect with owners, rescues and shelters.',
  },
  {
    slug: 'dogs-for-stud',
    title: 'Dogs for Stud in Ireland',
    h1: 'Dogs for stud in Ireland',
    animalType: 'Dogs',
    listingType: 'For Stud',
    intro: 'Browse dog stud listings across Ireland and compare breed, location and health information.',
  },
  {
    slug: 'puppies-for-sale',
    title: 'Puppies for Sale in Ireland',
    h1: 'Puppies for sale in Ireland',
    animalType: 'Dogs',
    listingType: 'For Sale',
    keyword: 'puppies',
    intro: 'Find puppies for sale in Ireland by county, breed and seller type. Check microchip, vaccination and ready-to-leave details before enquiring.',
  },
  {
    slug: 'cats-for-sale',
    title: 'Cats for Sale in Ireland',
    h1: 'Cats for sale in Ireland',
    animalType: 'Cats',
    listingType: 'For Sale',
    intro: 'Browse cats and kittens for sale across Ireland from private sellers and breeders.',
  },
  {
    slug: 'cats-for-adoption',
    title: 'Cats for Adoption in Ireland',
    h1: 'Cats for adoption in Ireland',
    animalType: 'Cats',
    listingType: 'For Adoption',
    intro: 'Find cats for adoption in Ireland from shelters, rescues and owners looking for new homes.',
  },
  {
    slug: 'kittens-for-sale',
    title: 'Kittens for Sale in Ireland',
    h1: 'Kittens for sale in Ireland',
    animalType: 'Cats',
    listingType: 'For Sale',
    keyword: 'kittens',
    intro: 'Browse kittens for sale in Ireland and compare breed, county, age and ready-to-leave information.',
  },
  {
    slug: 'other-pets-for-sale',
    title: 'Other Pets for Sale in Ireland',
    h1: 'Other pets for sale in Ireland',
    animalType: 'Other Pets',
    listingType: 'For Sale',
    intro: 'Browse rabbits, birds, reptiles, fish, horses, poultry, livestock and other pets for sale across Ireland.',
  },
  {
    slug: 'other-pets-for-adoption',
    title: 'Other Pets for Adoption in Ireland',
    h1: 'Other pets for adoption in Ireland',
    animalType: 'Other Pets',
    listingType: 'For Adoption',
    intro: 'Find rabbits, birds, reptiles, fish, horses and other pets for adoption across Ireland.',
  },
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCaseFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pluralPetType(value) {
  const text = String(value || '').trim();
  if (!text) return 'Pets';
  if (text.endsWith('s')) return text;
  return `${text}s`;
}

function getCountyFromSlug(slug) {
  return counties.find((county) => slugify(county) === slug) || '';
}

function getBreedFromSlug(slug, breeds) {
  return breeds.find((breed) => slugify(breed) === slug) || '';
}

function getOtherPetTypeFromSlug(slug) {
  return otherPetTypes.find((type) => slugify(type) === slug) || '';
}

function withCountyText(text, county) {
  if (!county) return text;
  return text.replace('in Ireland', `in ${county}`);
}

function withCountyRoute(base, county) {
  return county ? `${base}/${slugify(county)}` : base;
}

function getRouteConfig(slugParts) {
  const mainSlug = slugParts?.[0] || '';
  const county = slugParts?.[1] ? getCountyFromSlug(slugParts[1]) : '';

  if (!mainSlug || slugParts.length > 2 || (slugParts[1] && !county)) return null;

  const coreRoute = CORE_CATEGORY_ROUTES.find((route) => route.slug === mainSlug);

  if (coreRoute) {
    return {
      ...coreRoute,
      county,
      canonical: withCountyRoute(coreRoute.slug, county),
      title: withCountyText(coreRoute.title, county),
      h1: withCountyText(coreRoute.h1, county),
      description: withCountyText(coreRoute.intro, county),
    };
  }

  const dogBreedPuppySlug = mainSlug.endsWith('-puppies') ? mainSlug.replace(/-puppies$/, '') : '';
  const dogBreedDogSlug = mainSlug.endsWith('-dogs') ? mainSlug.replace(/-dogs$/, '') : '';
  const catBreedCatSlug = mainSlug.endsWith('-cats') ? mainSlug.replace(/-cats$/, '') : '';
  const catBreedKittenSlug = mainSlug.endsWith('-kittens') ? mainSlug.replace(/-kittens$/, '') : '';

  const dogBreed = getBreedFromSlug(dogBreedPuppySlug || dogBreedDogSlug, dogBreeds);
  if (dogBreed) {
    const isPuppyPage = Boolean(dogBreedPuppySlug);
    const phrase = isPuppyPage ? `${dogBreed} puppies for sale` : `${dogBreed} dogs for sale`;
    const baseSlug = `${slugify(dogBreed)}-${isPuppyPage ? 'puppies' : 'dogs'}`;

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} ${county ? `in ${county}` : 'in Ireland'}`,
      h1: `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} ${county ? `in ${county}` : 'in Ireland'}`,
      description: `Browse ${phrase} ${county ? `in ${county}` : 'across Ireland'} and compare age, sex, photos, microchip status and seller information.`,
      animalType: 'Dogs',
      breed: dogBreed,
      listingType: 'For Sale',
      keyword: isPuppyPage ? 'puppies' : 'dogs',
      county,
    };
  }

  const catBreed = getBreedFromSlug(catBreedCatSlug || catBreedKittenSlug, catBreeds);
  if (catBreed) {
    const isKittenPage = Boolean(catBreedKittenSlug);
    const phrase = isKittenPage ? `${catBreed} kittens for sale` : `${catBreed} cats for sale`;
    const baseSlug = `${slugify(catBreed)}-${isKittenPage ? 'kittens' : 'cats'}`;

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} ${county ? `in ${county}` : 'in Ireland'}`,
      h1: `${phrase.charAt(0).toUpperCase() + phrase.slice(1)} ${county ? `in ${county}` : 'in Ireland'}`,
      description: `Browse ${phrase} ${county ? `in ${county}` : 'across Ireland'} and compare age, sex, photos and seller information.`,
      animalType: 'Cats',
      breed: catBreed,
      listingType: 'For Sale',
      keyword: isKittenPage ? 'kittens' : 'cats',
      county,
    };
  }

  const otherTypeSaleSlug = mainSlug.endsWith('-for-sale') ? mainSlug.replace(/-for-sale$/, '') : '';
  const otherTypeAdoptionSlug = mainSlug.endsWith('-for-adoption') ? mainSlug.replace(/-for-adoption$/, '') : '';
  const otherType = getOtherPetTypeFromSlug(otherTypeSaleSlug || otherTypeAdoptionSlug);

  if (otherType) {
    const listingType = otherTypeAdoptionSlug ? 'For Adoption' : 'For Sale';
    const phrase = `${pluralPetType(otherType).toLowerCase()} ${listingType === 'For Adoption' ? 'for adoption' : 'for sale'}`;
    const baseSlug = `${slugify(otherType)}-${listingType === 'For Adoption' ? 'for-adoption' : 'for-sale'}`;

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${titleCaseFromSlug(phrase)} ${county ? `in ${county}` : 'in Ireland'}`,
      h1: `${titleCaseFromSlug(phrase)} ${county ? `in ${county}` : 'in Ireland'}`,
      description: `Browse ${phrase} ${county ? `in ${county}` : 'across Ireland'} on PawHome and compare location, photos and seller details.`,
      animalType: 'Other Pets',
      breed: otherType,
      listingType,
      county,
    };
  }

  return null;
}

function buildListingsHref(config) {
  const params = new URLSearchParams();

  if (config.animalType) params.set('animalType', config.animalType);
  if (config.breed) params.set('breed', config.breed);
  if (config.county) params.set('county', config.county);
  if (config.listingType) params.set('listingType', config.listingType);

  const query = params.toString();
  return query ? `/listings?${query}` : '/listings';
}

async function getSeoListings(config) {
  const supabase = getSupabaseServerClient();

  if (!supabase) return [];

  let query = supabase
    .from('listings')
    .select(PUBLIC_LISTING_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(PAGE_LIMIT);

  if (config.animalType) query = query.eq('animal_type', config.animalType);
  if (config.listingType) query = query.eq('listing_type', config.listingType);
  if (config.county) query = query.eq('county', config.county);
  if (config.breed) query = query.ilike('breed', `%${config.breed}%`);

  const { data, error } = await query;

  if (error) {
    console.warn('SEO landing listing fetch failed:', {
      message: error.message,
      code: error.code,
    });
    return [];
  }

  return data || [];
}

function getMainImage(listing) {
  const sortedPhotos = [...(listing?.listing_photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return sortedPhotos[0]?.image_url || '';
}

function buildStructuredData(config, listings) {
  const pageUrl = `${siteUrl}/${config.canonical}`;
  const itemListElements = listings.map((listing, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${siteUrl}/listings/${listing.id}`,
    name: listing.title || `${listing.breed || listing.animal_type || 'Pet'} listing`,
  }));

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
          itemListElement: itemListElements,
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

function getRelatedLinks(config) {
  const popularCounties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Kildare', 'Meath', 'Waterford', 'Wexford'];
  const links = [];

  if (!config.county) {
    popularCounties.forEach((county) => {
      links.push({ href: `/${withCountyRoute(config.slug, county)}`, label: `${config.h1.replace('in Ireland', `in ${county}`)}` });
    });
  }

  CORE_CATEGORY_ROUTES.filter((route) => route.slug !== config.slug)
    .slice(0, 8)
    .forEach((route) => {
      links.push({ href: `/${withCountyRoute(route.slug, config.county)}`, label: withCountyText(route.h1, config.county) });
    });

  return links.slice(0, 14);
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
    {
      question: `How do I find ${animalText.toLowerCase()} in ${location}?`,
      answer: `Use PawHome to browse approved listings, compare photos and details, then contact the seller directly from the listing page.`,
    },
    {
      question: 'What should I check before contacting a seller?',
      answer:
        'Check the pet description, age, location, photos, microchip information, vaccination details, seller type and any registration or health testing information provided.',
    },
    {
      question: 'Are pending listings shown here?',
      answer: 'No. SEO landing pages only show approved listings that are visible to the public.',
    },
  ];

  return (
    <section className="mt-12 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-(--secondary-green)">Frequently asked questions</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-2xl bg-(--background) p-5">
            <h3 className="text-sm font-extrabold text-(--secondary-green)">{faq.question}</h3>
            <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const config = getRouteConfig(resolvedParams?.seoSlug || []);

  if (!config) {
    return {
      title: 'Page not found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/${config.canonical}`;
  const description = config.description.length > 155 ? `${config.description.slice(0, 152).trim()}...` : config.description;

  return {
    title: config.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description,
      url: canonical,
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
  const config = getRouteConfig(resolvedParams?.seoSlug || []);

  if (!config) notFound();

  const listings = await getSeoListings(config);
  const relatedLinks = getRelatedLinks(config);
  const structuredData = buildStructuredData(config, listings);
  const listingsHref = buildListingsHref(config);

  return (
    <div className="min-h-screen bg-(--background)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
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
            <Link
              href={listingsHref}
              className="rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-extrabold text-white transition hover:bg-(--secondary-orange)"
            >
              Browse all matching listings
            </Link>
            <Link
              href="/post-ad"
              className="rounded-full border border-(--border-beige) bg-white px-6 py-3 text-sm font-extrabold text-(--secondary-green) transition hover:border-(--primary-green)"
            >
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
            <Link href={listingsHref} className="text-sm font-extrabold text-(--primary-green) hover:underline">
              View more filters
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <SeoListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-(--border-beige) bg-white p-8 text-center">
              <h2 className="text-xl font-extrabold text-(--secondary-green)">No listings found yet</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-(--muted-green-text)">
                This page is ready for search engines and will show matching approved listings as soon as they are available.
              </p>
              <Link href="/post-ad" className="mt-5 inline-flex rounded-full bg-(--primary-orange) px-6 py-3 text-sm font-extrabold text-white">
                Post the first ad
              </Link>
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-(--secondary-green)">Related searches</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-(--border-beige) bg-(--background) px-4 py-2 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green) hover:text-(--primary-green)"
              >
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
