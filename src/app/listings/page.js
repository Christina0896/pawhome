'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/header';
import { supabase } from '../../lib/supabaseClient';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds } from '../../data/petOptions';
import { useSearchParams } from 'next/navigation';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    animalType: searchParams.get('animalType') || '',
    breed: searchParams.get('breed') || '',
    county: searchParams.get('county') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    age: '',
    sex: '',
    vaccinated: false,
    microchipped: false,
    kennelClubRegistered: false,
    neutered: false,
  });

  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchListings = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      const { data, error } = await supabase
        .from('listings')
        .select(
          `
        *,
        listing_photos (
          image_url,
          sort_order
        )
      `,
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Listings fetch error:', error);
        setLoading(false);
        return;
      }

      setListings(data || []);

      if (user) {
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', user.id);

        if (favoritesError) {
          console.error('Favorites fetch error:', favoritesError);
        } else {
          setFavoriteIds(favoritesData.map((fav) => fav.listing_id));
        }
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      animalType: '',
      breed: '',
      county: '',
      minPrice: '',
      maxPrice: '',
      age: '',
      sex: '',
      vaccinated: false,
      microchipped: false,
      kennelClubRegistered: false,
      neutered: false,
    });
  };

  const breedOptions = filters.animalType === 'Dogs' ? dogBreeds : filters.animalType === 'Cats' ? catBreeds : [];

  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (filters.animalType) {
      result = result.filter((listing) => listing.animal_type === filters.animalType);
    }

    if (filters.breed) {
      result = result.filter((listing) => listing.breed?.toLowerCase().includes(filters.breed.toLowerCase()));
    }

    if (filters.county) {
      result = result.filter((listing) => listing.county === filters.county);
    }

    if (filters.minPrice) {
      result = result.filter((listing) => Number(listing.price) >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter((listing) => Number(listing.price) <= Number(filters.maxPrice));
    }

    if (filters.age) {
      result = result.filter((listing) => listing.age?.toLowerCase().includes(filters.age.toLowerCase()));
    }

    if (filters.sex) {
      result = result.filter((listing) => listing.sex === filters.sex);
    }

    if (filters.vaccinated) {
      result = result.filter((listing) => listing.vaccinated === 'Yes');
    }

    if (filters.microchipped) {
      result = result.filter((listing) => listing.microchip);
    }

    if (filters.kennelClubRegistered) {
      result = result.filter((listing) => ['IKC Registered', 'KC Registered'].includes(listing.kennel_club_registered));
    }

    if (filters.neutered) {
      result = result.filter((listing) => listing.spayed_neutered === 'Yes');
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return result;
  }, [listings, filters, sortBy]);
  const toggleFavorite = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const isFavorite = favoriteIds.includes(listingId);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('listing_id', listingId);

      if (error) {
        console.error('Remove favorite error:', error);
        return;
      }

      setFavoriteIds((prev) => prev.filter((id) => id !== listingId));
    } else {
      const { error } = await supabase.from('favorites').insert({
        user_id: currentUser.id,
        listing_id: listingId,
      });

      if (error) {
        console.error('Add favorite error:', error);
        return;
      }

      setFavoriteIds((prev) => [...prev, listingId]);
    }
  };
  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-[#5F6F64]">
          <a href="/" className="hover:text-[#0E4F2A]">
            Home
          </a>
          <span className="mx-2">›</span>
          <span>Listings</span>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#0E4F2A]">PawHome Listings</p>

          <h1 className="mt-2 text-3xl font-bold text-[#123524]">Pets available in Ireland</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F6F64]">
            Browse approved pet listings from owners, breeders, rescues, and shelters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters */}
          <aside className="h-fit rounded-2xl border border-[#E8DFD1] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#123524]">Filters</h2>

              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#0E4F2A]">
                Clear all
              </button>
            </div>

            <div className="space-y-5">
              {/* Animal Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Animal Type</label>

                <select
                  name="animalType"
                  value={filters.animalType}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      animalType: e.target.value,
                      breed: '',
                    }));
                  }}
                  className="h-10 w-full rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option value="">All Animals</option>
                  <option value="Dogs">Dogs</option>
                  <option value="Cats">Cats</option>
                  <option value="Other Pets">Other Pets</option>
                </select>
              </div>

              {/* Breed */}
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

              {/* County */}
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

              {/* Price */}
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

              {/* Age */}
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

              {/* Sex */}
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
                  <option value="Mixed litter">Mixed litter</option>
                </select>
              </div>

              {/* Trust / Health */}
              <div className="space-y-3 border-t border-[#E8DFD1] pt-4 text-sm text-[#123524]">
                <p className="text-sm font-bold text-[#123524]">Health & Trust</p>

                <label className="flex items-center gap-2">
                  <input type="checkbox" name="vaccinated" checked={filters.vaccinated} onChange={handleFilterChange} />
                  Vaccinated
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="microchipped"
                    checked={filters.microchipped}
                    onChange={handleFilterChange}
                  />
                  Microchipped
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="kennelClubRegistered"
                    checked={filters.kennelClubRegistered}
                    onChange={handleFilterChange}
                  />
                  KC / IKC Registered
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" name="neutered" checked={filters.neutered} onChange={handleFilterChange} />
                  Neutered
                </label>
              </div>
            </div>
          </aside>

          {/* Listings */}
          <section>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-[#5F6F64]">
                <span className="font-bold text-[#0E4F2A]">{filteredListings.length}</span> approved listings found
              </p>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-[#123524]">Sort by</label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 rounded-lg border border-[#E8DFD1] bg-white px-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price Low to High</option>
                  <option value="price-high">Price High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[#5F6F64]">Loading listings...</p>
            ) : filteredListings.length === 0 ? (
              <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
                <h2 className="text-2xl font-bold text-[#123524]">No listings found</h2>

                <p className="mt-3 text-sm text-[#5F6F64]">Try changing your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => {
                  const sortedPhotos = [...(listing.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);

                  const mainImage = sortedPhotos[0]?.image_url;

                  return (
                    <a
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="overflow-hidden rounded-2xl border border-[#E8DFD1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="relative h-52 bg-[#DDEDD8]">
                        {mainImage ? (
                          <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(e, listing.id)}
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm transition hover:scale-105"
                          aria-label="Save listing"
                        >
                          {favoriteIds.includes(listing.id) ? (
                            <span className="text-red-500">♥</span>
                          ) : (
                            <span className="text-[#123524]">♡</span>
                          )}
                        </button>

                        {listing.price && (
                          <span className="absolute left-4 top-4 rounded-lg bg-[#0E4F2A] px-3 py-2 text-sm font-bold text-white">
                            €{listing.price}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h2 className="text-lg font-bold text-[#123524]">{listing.title}</h2>

                        <p className="mt-2 text-sm capitalize text-[#5F6F64]">
                          {listing.animal_type} · {listing.breed || 'Unknown breed'}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                          {listing.age && (
                            <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.age}</span>
                          )}

                          {listing.sex && (
                            <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.sex}</span>
                          )}

                          {listing.county && (
                            <span className="rounded-full bg-[#FAF6EC] px-3 py-1 text-[#123524]">{listing.county}</span>
                          )}

                          {['IKC Registered', 'KC Registered'].includes(listing.kennel_club_registered) && (
                            <span className="rounded-full bg-[#DDEDD8] px-3 py-1 text-[#0E4F2A]">
                              {listing.kennel_club_registered}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#5F6F64]">
                          {listing.description || 'No description added.'}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
