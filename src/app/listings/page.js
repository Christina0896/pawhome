import Header from '../../components/header';
import Footer from '../../components/footer';
import ListingsClient from './ListingsClient';
import { PUBLIC_LISTING_SELECT } from '../../lib/publicListingSelect';
import { getSupabaseServerClient } from '../../lib/supabaseServer';

const PAGE_SIZE = 24;

export const metadata = {
  title: 'Pets for Sale and Adoption in Ireland | PawHome',
  description:
    'Browse approved dogs, cats, and other pets for sale or adoption across Ireland from private owners, breeders, rescues, and shelters.',
  alternates: {
    canonical: '/listings',
  },
  openGraph: {
    title: 'Pets for Sale and Adoption in Ireland | PawHome',
    description: 'Find approved pet listings across Ireland from private owners, breeders, rescues, and shelters.',
    url: '/listings',
    siteName: 'PawHome',
    type: 'website',
  },
};

function getParam(searchParams, key) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) return value[0] || '';

  return value || '';
}

function getBooleanParam(searchParams, key) {
  return getParam(searchParams, key) === 'true';
}

function getNumberParam(searchParams, key, fallback) {
  const value = Number(getParam(searchParams, key));

  if (!Number.isFinite(value) || value < 1) return fallback;

  return value;
}

function buildFilters(searchParams) {
  return {
    animalType: getParam(searchParams, 'animalType'),
    breed: getParam(searchParams, 'breed'),
    county: getParam(searchParams, 'county'),
    minPrice: getParam(searchParams, 'minPrice'),
    maxPrice: getParam(searchParams, 'maxPrice'),
    age: getParam(searchParams, 'age'),
    sex: getParam(searchParams, 'sex'),
    listingType: getParam(searchParams, 'listingType'),
    vaccinated: getBooleanParam(searchParams, 'vaccinated'),
    microchipped: getBooleanParam(searchParams, 'microchipped'),
    kennelClubRegistered: getBooleanParam(searchParams, 'kennelClubRegistered'),
    neutered: getBooleanParam(searchParams, 'neutered'),
  };
}

async function getListings({ searchParams }) {
  const supabase = getSupabaseServerClient();
  const filters = buildFilters(searchParams);
  const sortBy = getParam(searchParams, 'sortBy') || 'newest';
  const page = getNumberParam(searchParams, 'page', 1);

  if (!supabase) {
    return {
      listings: [],
      totalCount: 0,
      filters,
      sortBy,
      page,
      error: 'Listing service is not configured.',
    };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('listings').select(PUBLIC_LISTING_SELECT, { count: 'exact' }).eq('status', 'approved');

  if (filters.animalType) query = query.eq('animal_type', filters.animalType);
  if (filters.listingType) query = query.eq('listing_type', filters.listingType);
  if (filters.breed) query = query.ilike('breed', `%${filters.breed}%`);
  if (filters.county) query = query.eq('county', filters.county);
  if (filters.minPrice !== '') query = query.gte('price', Number(filters.minPrice));
  if (filters.maxPrice !== '') query = query.lte('price', Number(filters.maxPrice));
  if (filters.age) query = query.ilike('age', `%${filters.age}%`);
  if (filters.sex) query = query.eq('sex', filters.sex);
  if (filters.vaccinated) query = query.eq('vaccinated', 'Yes');
  if (filters.microchipped) query = query.eq('microchipped', 'Yes');
  if (filters.kennelClubRegistered) query = query.in('kennel_club_registered', ['Yes', 'IKC Registered', 'KC Registered']);
  if (filters.neutered) query = query.eq('spayed_neutered', 'Yes');

  if (sortBy === 'price-low') {
    query = query.order('price', { ascending: true, nullsFirst: false });
  } else if (sortBy === 'price-high') {
    query = query.order('price', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Server listings fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return {
      listings: [],
      totalCount: 0,
      filters,
      sortBy,
      page,
      error: 'Could not load listings.',
    };
  }

  return {
    listings: data || [],
    totalCount: count || 0,
    filters,
    sortBy,
    page,
    error: '',
  };
}

export default async function ListingsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { listings, totalCount, filters, sortBy, page, error } = await getListings({ searchParams: resolvedSearchParams });

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <ListingsClient
        initialListings={listings}
        initialTotalCount={totalCount}
        initialFilters={filters}
        initialSortBy={sortBy}
        initialPage={page}
        initialError={error}
      />

      <Footer />
    </div>
  );
}
