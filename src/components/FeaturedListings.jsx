'use client';

import { supabase } from '../lib/supabaseClient';
import { FemaleIcon, MaleIcon, MixedGenderIcon, LocationIcon, CalendarIcon } from './Icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const formatDate = (date) => {
  if (!date) return 'recently';

  return new Date(date).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getMainImage = (photos) => {
  const sortedPhotos = [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return sortedPhotos[0]?.image_url;
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

const FeaturedListings = () => {
  // Listing state
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth/favorites state
  const [currentUser, setCurrentUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const pathname = usePathname();
  const requestIdRef = useRef(0);

  const fetchFeaturedListings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);

    // Safety: never allow endless loading
    const loadingTimeout = setTimeout(() => {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }, 5000);

    try {
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
        .order('created_at', { ascending: false })
        .limit(4);

      if (requestIdRef.current !== requestId) return;

      if (error) {
        console.warn('Featured listings error:', error);
        setListings([]);
        return;
      }

      setListings(data || []);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;

      console.warn('Featured listings crashed:', err);
      setListings([]);
    } finally {
      clearTimeout(loadingTimeout);

      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  const fetchFavouriteIds = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user || null;

      setCurrentUser(user);

      if (!user) {
        setFavoriteIds([]);
        return;
      }

      const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);

      if (error) {
        console.warn('Featured favourites error:', error);
        setFavoriteIds([]);
        return;
      }

      setFavoriteIds((data || []).map((fav) => fav.listing_id));
    } catch (err) {
      console.warn('Featured favourites crashed:', err);
      setCurrentUser(null);
      setFavoriteIds([]);
    }
  }, []);

  const refreshFeaturedSection = useCallback(() => {
    fetchFeaturedListings();
    fetchFavouriteIds();
  }, [fetchFeaturedListings, fetchFavouriteIds]);

  useEffect(() => {
    refreshFeaturedSection();
  }, [refreshFeaturedSection, pathname]);

  useEffect(() => {
    const handlePageShow = () => {
      refreshFeaturedSection();
    };

    const handlePopState = () => {
      refreshFeaturedSection();
    };

    const handleFocus = () => {
      refreshFeaturedSection();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFeaturedSection();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshFeaturedSection]);

  // Add/remove listing from favorites
  const toggleFavorite = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      window.dispatchEvent(new Event('open-login-modal'));
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
      return;
    }

    const { error } = await supabase.from('favorites').insert({
      user_id: currentUser.id,
      listing_id: listingId,
    });

    if (error) {
      console.error('Add favorite error:', error);
      return;
    }

    setFavoriteIds((prev) => [...prev, listingId]);
  };

  return (
    <section className="w-full bg-(--background) py-12">
      <div className="mx-auto max-w-(--page-max-width) px-6">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-(--primary-green)">Featured Listings</h2>

          <Link href="/listings" className="text-sm font-bold text-(--primary-orange) hover:text-(--secondary-orange)">
            View all listings →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-(--muted-green-text)">Loading featured listings...</p>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {listings.map((listing) => {
              const mainImage = getMainImage(listing.listing_photos);

              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-(--secundary-background) shadow-[0_6px_18px_rgba(18,53,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(18,53,36,0.11)]"
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
                  <div className="flex flex-1 flex-col p-3 bg-(--secondary-background)">
                    <div className="flex items-start justify-between ">
                      <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-(--primary-green)">
                        {listing.title}
                      </h3>

                      {listing.price && (
                        <p className="shrink-0 text-lg font-extrabold text-(--primary-orange)">€{listing.price}</p>
                      )}
                    </div>

                    {/* Animal + breed */}
                    <div className="text-sm text-(--muted-green-text)">
                      <p className="mt-1 line-clamp-1 text-sm  font-bold text-black">
                        {[listing.breed].filter(Boolean).join(' • ')}
                      </p>
                    </div>

                    {/* Listing details */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {listing.age && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-(--background) px-3 py-1 text-xs font-semibold text-(--primary-green)">
                          <CalendarIcon className="h-3.5 w-3.5 text-(--primary-green)" /> {listing.age}
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
                      <div className="mt-auto flex items-center gap-2 pt-5 text-sm text-(--muted-green-text)">
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
        ) : (
          <div className="rounded-2xl border border-(--border-beige) bg-(--secondary-background) px-8 py-14 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-(--light-green) text-4xl">
              🐾
            </div>

            <h3 className="text-2xl font-bold text-(--secondary-green)">
              Be one of the first to list a pet on PawHome
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-(--muted-green-text)">
              PawHome is launching soon. Responsible owners, breeders, and rescues can start by posting the first
              trusted pet listings in Ireland.
            </p>

            <div className="mt-7 flex justify-center gap-4">
              <Link href="/post-ad" className="rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-semibold text-white">
                Post an Ad
              </Link>

              <Link
                href="/safety"
                className="rounded-xl border border-(--primary-green) px-6 py-3 text-sm font-semibold text-(--primary-green)"
              >
                Learn Safety Rules
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedListings;
