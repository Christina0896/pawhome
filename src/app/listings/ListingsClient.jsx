'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ListingCard from '../../components/ListingCard';
import { getVerifiedAccessToken } from '../../lib/authTokens';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds } from '../../data/petOptions';

const PAGE_SIZE = 24;

const emptyFilters = {
  animalType: '',
  breed: '',
  county: '',
  minPrice: '',
  maxPrice: '',
  age: '',
  sex: '',
  listingType: '',
  vaccinated: false,
  microchipped: false,
  kennelClubRegistered: false,
  neutered: false,
};

function buildListingsUrl(filters, sortBy, page) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) params.set(key, 'true');
      return;
    }

    if (value !== '') params.set(key, value);
  });

  if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `/listings?${query}` : '/listings';
}

export default function ListingsClient({
  initialListings = [],
  initialTotalCount = 0,
  initialFilters = emptyFilters,
  initialSortBy = 'newest',
  initialPage = 1,
  initialError = '',
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [filters, setFilters] = useState({ ...emptyFilters, ...initialFilters });
  const [sortBy, setSortBy] = useState(initialSortBy || 'newest');

  const totalPages = Math.max(Math.ceil(initialTotalCount / PAGE_SIZE), 1);
  const currentPage = Math.min(Math.max(Number(initialPage) || 1, 1), totalPages);
  const breedOptions = filters.animalType === 'Dogs' ? dogBreeds : filters.animalType === 'Cats' ? catBreeds : [];

  useEffect(() => {
    setFilters({ ...emptyFilters, ...initialFilters });
    setSortBy(initialSortBy || 'newest');
  }, [initialFilters, initialSortBy]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteIds([]);
        return;
      }

      const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);

      if (error) {
        console.error('Favorites fetch error:', error);
        setFavoriteIds([]);
        return;
      }

      setFavoriteIds((data || []).map((fav) => String(fav.listing_id)));
    };

    fetchFavorites();
  }, [user]);

  const navigateWithFilters = (nextFilters, nextSortBy = sortBy, nextPage = 1) => {
    startTransition(() => {
      router.push(buildListingsUrl(nextFilters, nextSortBy, nextPage));
    });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    };

    setFilters(nextFilters);
    navigateWithFilters(nextFilters, sortBy, 1);
  };

  const handleAnimalTypeChange = (e) => {
    const nextFilters = {
      ...filters,
      animalType: e.target.value,
      breed: '',
    };

    setFilters(nextFilters);
    navigateWithFilters(nextFilters, sortBy, 1);
  };

  const handleSortChange = (e) => {
    const nextSortBy = e.target.value;
    setSortBy(nextSortBy);
    navigateWithFilters(filters, nextSortBy, 1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSortBy('newest');
    startTransition(() => router.push('/listings'));
  };

  const goToPage = (nextPage) => {
    navigateWithFilters(filters, sortBy, nextPage);
  };

  const toggleFavorite = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    const listingKey = String(listingId);
    const isFavorite = favoriteIds.includes(listingKey);

    setFavoriteIds((prev) =>
      isFavorite ? prev.filter((id) => id !== listingKey) : prev.includes(listingKey) ? prev : [...prev, listingKey],
    );

    try {
      const accessToken = await getVerifiedAccessToken();

      if (!accessToken) {
        setFavoriteIds((prev) =>
          isFavorite
            ? prev.includes(listingKey)
              ? prev
              : [...prev, listingKey]
            : prev.filter((id) => id !== listingKey),
        );
        return;
      }

      const response = await fetch(`/api/favorites/${listingId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setFavoriteIds((prev) =>
          isFavorite
            ? prev.includes(listingKey)
              ? prev
              : [...prev, listingKey]
            : prev.filter((id) => id !== listingKey),
        );
      }
    } catch (error) {
      console.warn('Favourite request failed:', error);

      setFavoriteIds((prev) =>
        isFavorite
          ? prev.includes(listingKey)
            ? prev
            : [...prev, listingKey]
          : prev.filter((id) => id !== listingKey),
      );
    }
  };

  const listings = useMemo(() => initialListings || [], [initialListings]);

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10">
      <div className="mb-6 text-sm text-[#5F6F64]">
        <Link href="/" className="hover:text-[#0E4F2A]">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span>Listings</span>
      </div>

      <div className="mb-10">
        <p className="text-sm font-semibold text-[#0E4F2A]">PawHome Listings</p>
        <h1 className="mt-2 text-3xl font-bold text-[#123524]">Pets available in Ireland</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F6F64]">
          Browse approved pet listings from owners, breeders, rescues, and shelters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#E8DFD1] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#123524]">Filters</h2>
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#0E4F2A]">
              Clear all
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Animal Type</label>
              <select
                name="animalType"
                value={filters.animalType}
                onChange={handleAnimalTypeChange}
                className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="">All Animals</option>
                <option value="Dogs">Dogs</option>
                <option value="Cats">Cats</option>
                <option value="Other Pets">Other Pets</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Listing Type</label>
              <select
                name="listingType"
                value={filters.listingType}
                onChange={handleFilterChange}
                className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="">All Listing Types</option>
                <option value="For Sale">For Sale</option>
                <option value="For Adoption">For Adoption</option>
                <option value="For Stud">For Stud</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Breed / Type</label>
              {filters.animalType === 'Other Pets' ? (
                <input
                  name="breed"
                  value={filters.breed}
                  onChange={handleFilterChange}
                  placeholder="Type pet type"
                  className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              ) : (
                <select
                  name="breed"
                  value={filters.breed}
                  onChange={handleFilterChange}
                  className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option value="">All Breeds</option>
                  {breedOptions.map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">County</label>
              <select
                name="county"
                value={filters.county}
                onChange={handleFilterChange}
                className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="">All Counties</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  type="number"
                  placeholder="Min"
                  className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
                <input
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  type="number"
                  placeholder="Max"
                  className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Age</label>
              <select
                name="age"
                value={filters.age}
                onChange={handleFilterChange}
                className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="">Any Age</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
                <option value="year">Years</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123524]">Sex</label>
              <select
                name="sex"
                value={filters.sex}
                onChange={handleFilterChange}
                className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="">Any Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Mixed Litter">Mixed Litter</option>
              </select>
            </div>

            <div className="space-y-3 border-t border-[#E8DFD1] pt-4 text-sm text-[#123524]">
              <p className="text-sm font-bold text-[#123524]">Health & Trust</p>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="vaccinated" checked={filters.vaccinated} onChange={handleFilterChange} />
                Vaccinated
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="microchipped" checked={filters.microchipped} onChange={handleFilterChange} />
                Microchipped
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="kennelClubRegistered"
                  checked={filters.kennelClubRegistered}
                  onChange={handleFilterChange}
                />
                KC
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="neutered" checked={filters.neutered} onChange={handleFilterChange} />
                Neutered
              </label>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#5F6F64]">
              <span className="font-bold text-[#0E4F2A]">{initialTotalCount}</span> approved listings found
              {isPending && <span className="ml-2 text-xs font-semibold text-[#0E4F2A]">Updating...</span>}
            </p>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-[#123524]">Sort by</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="h-10 rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price Low to High</option>
                <option value="price-high">Price High to Low</option>
              </select>
            </div>
          </div>

          {initialError ? (
            <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-[#123524]">Listings could not be loaded</h2>
              <p className="mt-3 text-sm text-[#5F6F64]">{initialError}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-[#123524]">No listings found</h2>
              <p className="mt-3 text-sm text-[#5F6F64]">Try changing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.includes(String(listing.id))}
                  onFavoriteClick={toggleFavorite}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={currentPage <= 1 || isPending}
                onClick={() => goToPage(Math.max(currentPage - 1, 1))}
                className="rounded-xl border border-[#E8DFD1] bg-white px-4 py-2 text-sm font-bold text-[#123524] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm font-bold text-[#5F6F64]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages || isPending}
                onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
                className="rounded-xl border border-[#E8DFD1] bg-white px-4 py-2 text-sm font-bold text-[#123524] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
