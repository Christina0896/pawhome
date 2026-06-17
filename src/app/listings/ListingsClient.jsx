'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { supabase } from '../../lib/supabaseClient';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds } from '../../data/petOptions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FemaleIcon,
  MaleIcon,
  MixedGenderIcon,
  LocationIcon,
  CalendarIcon,
  HeartIcon,
  PawIcon,
} from '../../components/Icons';

export default function ListingsClient() {
  const searchParams = useSearchParams();

  const formatDate = (date) => {
    if (!date) return 'recently';

    return new Date(date).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSexIcon = (sex) => {
    const value = sex?.toLowerCase();

    if (value === 'female') {
      return <FemaleIcon />;
    }

    if (value === 'male') {
      return <MaleIcon />;
    }

    if (value === 'mixed' || value === 'mixed litter' || value === 'mixed gender' || value === 'mixed genders') {
      return <MixedGenderIcon />;
    }

    return null;
  };
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const [filters, setFilters] = useState({
    animalType: searchParams.get('animalType') || '',
    breed: searchParams.get('breed') || '',
    county: searchParams.get('county') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    age: '',
    sex: '',
    listingType: searchParams.get('listingType') || '',
    vaccinated: false,
    microchipped: false,
    kennelClubRegistered: false,
    neutered: false,
  });

  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchListings = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user || null;

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
          setFavoriteIds((favoritesData || []).map((fav) => String(fav.listing_id)));
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
      listingType: '',
      vaccinated: false,
      microchipped: false,
      kennelClubRegistered: false,
      neutered: false,
    });
    window.history.replaceState(null, '', '/listings');
  };

  const breedOptions = filters.animalType === 'Dogs' ? dogBreeds : filters.animalType === 'Cats' ? catBreeds : [];

  const filteredListings = useMemo(() => {
    const normalize = (value) =>
      String(value ?? '')
        .trim()
        .toLowerCase();

    const isYes = (value) => {
      const normalized = normalize(value);

      return ['yes', 'true', '1', 'ikc registered', 'kc registered'].includes(normalized);
    };

    let result = [...listings];

    if (filters.animalType) {
      result = result.filter((listing) => normalize(listing.animal_type) === normalize(filters.animalType));
    }

    if (filters.listingType) {
      result = result.filter((listing) => normalize(listing.listing_type) === normalize(filters.listingType));
    }

    if (filters.breed) {
      result = result.filter((listing) => normalize(listing.breed).includes(normalize(filters.breed)));
    }

    if (filters.county) {
      result = result.filter((listing) => normalize(listing.county) === normalize(filters.county));
    }

    if (filters.minPrice !== '') {
      result = result.filter((listing) => Number(listing.price ?? 0) >= Number(filters.minPrice));
    }

    if (filters.maxPrice !== '') {
      result = result.filter((listing) => Number(listing.price ?? 0) <= Number(filters.maxPrice));
    }

    if (filters.age) {
      result = result.filter((listing) => normalize(listing.age).includes(normalize(filters.age)));
    }

    if (filters.sex) {
      result = result.filter((listing) => normalize(listing.sex) === normalize(filters.sex));
    }

    if (filters.vaccinated) {
      result = result.filter((listing) => isYes(listing.vaccinated));
    }

    if (filters.microchipped) {
      result = result.filter((listing) => isYes(listing.microchipped));
    }

    if (filters.kennelClubRegistered) {
      result = result.filter((listing) => isYes(listing.kennel_club_registered));
    }

    if (filters.neutered) {
      result = result.filter((listing) => isYes(listing.spayed_neutered));
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
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    const listingKey = String(listingId);
    const isFavorite = favoriteIds.includes(listingKey);

    if (isFavorite) {
      setFavoriteIds((prev) => prev.filter((id) => id !== listingKey));

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('listing_id', listingId);

      if (error) {
        console.error('Remove favorite error:', error);

        setFavoriteIds((prev) => (prev.includes(listingKey) ? prev : [...prev, listingKey]));

        return;
      }

      return;
    }

    setFavoriteIds((prev) => (prev.includes(listingKey) ? prev : [...prev, listingKey]));

    const { error } = await supabase.from('favorites').insert({
      user_id: currentUser.id,
      listing_id: listingId,
    });

    if (error) {
      console.error('Add favorite error:', error);

      // 23505 = duplicate favorite already exists
      if (error.code === '23505') {
        return;
      }

      setFavoriteIds((prev) => prev.filter((id) => id !== listingKey));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-[#5F6F64]">
          <Link href="/" className="hover:text-[#0E4F2A]">
            Home
          </Link>
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
              {/* listing Type */}
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
                  KC
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
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-(--secondary-background) shadow-[0_6px_18px_rgba(18,53,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,53,36,0.11)]"
                    >
                      {/* Image */}
                      <div className="relative h-[230px] overflow-hidden bg-(--light-green)">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={listing.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-(--primary-green)">
                            <PawIcon className="h-12 w-12" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(e, listing.id)}
                          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110"
                          aria-label="Save listing"
                        >
                          <HeartIcon
                            className={`h-4 w-4 ${
                              favoriteIds.includes(String(listing.id))
                                ? 'fill-red-500 text-red-500'
                                : 'text-(--muted-green-text)'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col bg-(--secondary-background) p-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-(--primary-green)">
                            {listing.title}
                          </h3>

                          {listing.price !== null && listing.price !== undefined && listing.price !== '' && (
                            <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">€{listing.price}</p>
                          )}
                        </div>

                        {/* Breed */}
                        <div className="text-sm text-(--muted-green-text)">
                          <p className="mt-1 line-clamp-1 text-sm font-bold text-black">
                            {[listing.breed].filter(Boolean).join(' • ')}
                          </p>
                        </div>

                        {/* Listing details */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {listing.age && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                              {listing.age}
                            </span>
                          )}

                          {listing.sex && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                              <span className="text-sm leading-none">{getSexIcon(listing.sex)}</span>
                              {listing.sex}
                            </span>
                          )}

                          {listing.county && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                              <LocationIcon className="h-3.5 w-3.5 text-(--primary-green)" />
                              {listing.county}
                            </span>
                          )}
                        </div>

                        {listing.description && (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-(--muted-green-text)">
                            {listing.description}
                          </p>
                        )}

                        {/* Posted date + IKC */}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                          <div className="flex items-center gap-2 text-sm text-(--muted-green-text)">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Posted {formatDate(listing.created_at)}</span>
                          </div>

                          {['Yes', 'IKC Registered', 'KC Registered'].includes(listing.kennel_club_registered) && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--primary-green) text-[12px] font-extrabold text-white">
                              IKC
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
