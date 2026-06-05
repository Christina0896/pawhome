'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const FeaturedListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      setLoading(true);

      const { data: listingsData, error: listingsError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(4);

      if (listingsError) {
        console.error('Featured listings error:', listingsError);
        setListings([]);
        setLoading(false);
        return;
      }

      setListings(listingsData || []);
      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);

      if (!user) return;

      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Featured favorites error:', favoritesError);
        return;
      }

      setFavoriteIds((favoritesData || []).map((fav) => fav.listing_id));
    };

    fetchFeaturedListings();
  }, []);

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
  const getSexIcon = (sex) => {
    const value = sex?.toLowerCase();

    if (value === 'female') {
      return (
        <svg
          className="h-3.5 w-3.5 text-black"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M12 12v8" />
          <path d="M8.5 17h7" />
        </svg>
      );
    }

    if (value === 'male') {
      return (
        <span className="text-black" aria-hidden="true">
          ♂
        </span>
      );
    }

    if (value === 'mixed' || value === 'mixed litter' || value === 'mixed gender' || value === 'mixed genders') {
      return (
        <span className="text-black" aria-hidden="true">
          ⚥
        </span>
      );
    }

    return null;
  };
  return (
    <section className="w-full bg-(--background) py-12">
      <div className="mx-auto max-w-(--page-max-width) px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-(--primary-green)">Featured Listings</h2>

          <a href="/listings" className="text-md font-bold text-(--primary-orange) ">
            View all listings →
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-[#5F6F64]">Loading featured listings...</p>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {listings.map((listing) => {
              const sortedPhotos = [...(listing.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);

              const mainImage = sortedPhotos[0]?.image_url;

              return (
                <a
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-2xl border border-(--border-beige) bg-(--secundary-background) shadow-[0_6px_18px_rgba(18,53,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,53,36,0.11)]"
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
                      <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                    )}

                    {/* Favourite */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, listing.id)}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm transition hover:scale-110"
                      aria-label="Save listing"
                    >
                      {favoriteIds.includes(listing.id) ? (
                        <span className="text-red-500">♥</span>
                      ) : (
                        <span className="text-(--muted-green-text)">♡</span>
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-(--primary-green)">
                        {listing.title}
                      </h3>

                      {listing.price && (
                        <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">€{listing.price}</p>
                      )}
                    </div>

                    {/* Animal + breed */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-(--muted-green-text)">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4 text-(--primary-green)"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <ellipse cx="7" cy="8" rx="1.3" ry="1.8" />
                          <ellipse cx="11" cy="6.5" rx="1.3" ry="1.8" />
                          <ellipse cx="15" cy="6.5" rx="1.3" ry="1.8" />
                          <ellipse cx="18" cy="8" rx="1.3" ry="1.8" />
                          <path d="M12 12.5C9.4 12.5 7.1 14.4 6.5 17c-.2 1 .6 2 1.7 2h7.6c1.1 0 1.9-1 1.7-2-.6-2.6-2.9-4.5-5.5-4.5Z" />
                        </svg>
                        {listing.animal_type}
                      </span>

                      {(listing.breed || listing.animal_type) && (
                        <>
                          <span>·</span>
                          <span className="truncate">{listing.breed || listing.animal_type}</span>
                        </>
                      )}
                    </div>

                    {/* Pills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {listing.age && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="4" y="5" width="16" height="15" rx="2" />
                            <path d="M8 3v4" />
                            <path d="M16 3v4" />
                            <path d="M4 10h16" />
                          </svg>
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
                          <svg
                            className="h-3.5 w-3.5 text-(--primary-green)"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {listing.county}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-(--muted-green-text)">
                        {listing.description}
                      </p>
                    )}

                    {/* Posted date */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      {/* Posted date */}
                      <div className="flex items-center gap-2 text-xs text-(--muted-green-text)">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="4" y="5" width="16" height="15" rx="2" />
                          <path d="M8 3v4" />
                          <path d="M16 3v4" />
                          <path d="M4 10h16" />
                        </svg>

                        <span>
                          Posted{' '}
                          {listing.created_at
                            ? new Date(listing.created_at).toLocaleDateString('en-IE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'recently'}
                        </span>
                      </div>

                      {/* IKC badge */}
                      {listing.kc_registered && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--primary-green) text-[11px] font-extrabold text-white">
                          IKC
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8DFD1] bg-[#FFFCF5] px-8 py-14 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#DDEDD8] text-4xl">
              🐾
            </div>

            <h3 className="text-2xl font-bold text-[#123524]">Be one of the first to list a pet on PawHome</h3>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#5F6F64]">
              PawHome is launching soon. Responsible owners, breeders, and rescues can start by posting the first
              trusted pet listings in Ireland.
            </p>

            <div className="mt-7 flex justify-center gap-4">
              <a href="/post-ad" className="rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white">
                Post an Ad
              </a>

              <a
                href="/safety"
                className="rounded-xl border border-[#0E4F2A] px-6 py-3 text-sm font-semibold text-[#0E4F2A]"
              >
                Learn Safety Rules
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedListings;
