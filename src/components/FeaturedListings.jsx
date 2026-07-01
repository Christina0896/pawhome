'use client';

import { PUBLIC_LISTING_SELECT } from '../lib/publicListingSelect';
import { getVerifiedAccessToken } from '../lib/authTokens';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PawIcon, ArrowIcon } from './Icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrowseCards from './BrowseCards';
import ListingCard from './ListingCard';
import Link from 'next/link';

const FeaturedListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const pathname = usePathname();
  const requestIdRef = useRef(0);

  const fetchFeaturedListings = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    const loadingTimeout = setTimeout(() => {
      if (requestIdRef.current === requestId) setLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(PUBLIC_LISTING_SELECT)
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
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, []);

  const fetchFavouriteIds = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    try {
      const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);

      if (error) {
        console.warn('Featured favourites error:', error);
        setFavoriteIds([]);
        return;
      }

      setFavoriteIds((data || []).map((fav) => String(fav.listing_id)));
    } catch (err) {
      console.warn('Featured favourites crashed:', err);
      setFavoriteIds([]);
    }
  }, [user]);

  const refreshFeaturedSection = useCallback(() => {
    fetchFeaturedListings();
    fetchFavouriteIds();
  }, [fetchFeaturedListings, fetchFavouriteIds]);

  useEffect(() => {
    refreshFeaturedSection();
  }, [refreshFeaturedSection, pathname]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshFeaturedSection();
    };

    window.addEventListener('pageshow', refreshFeaturedSection);
    window.addEventListener('focus', refreshFeaturedSection);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.removeEventListener('pageshow', refreshFeaturedSection);
      window.removeEventListener('focus', refreshFeaturedSection);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshFeaturedSection]);

  const toggleFavorite = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();

    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const listingKey = String(listingId);
    const isFavorite = favoriteIds.includes(listingKey);

    setFavoriteIds((prev) =>
      isFavorite ? prev.filter((id) => id !== listingKey) : prev.includes(listingKey) ? prev : [...prev, listingKey],
    );

    try {
      const response = await fetch(`/api/favorites/${listingId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
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
    } catch {
      setFavoriteIds((prev) =>
        isFavorite
          ? prev.includes(listingKey)
            ? prev
            : [...prev, listingKey]
          : prev.filter((id) => id !== listingKey),
      );
    }
  };

  return (
    <section className="w-full bg-(--background) py-10 ">
      <div className="mx-auto max-w-(--page-max-width) px-6 mb-20">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <span>
              <PawIcon className="h-8 w-8 text-(--primary-orange)" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-green)">Featured Listings</h2>
          </div>
          <Link
            href="/listings"
            className="flex items-center gap-2 text-sm font-bold text-(--primary-orange) hover:text-(--secondary-orange)"
          >
            View all listings <ArrowIcon />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-(--muted-green-text)">Loading featured listings...</p>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favoriteIds.includes(String(listing.id))}
                onFavoriteClick={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-(--border-beige) bg-(--secondary-background) px-8 py-14 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-(--light-green) text-4xl">🐾</div>
            <h3 className="text-2xl font-bold text-(--secondary-green)">Be one of the first to list a pet on PawHome</h3>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-(--muted-green-text)">
              PawHome is launching soon. Responsible owners, breeders, and rescues can start by posting the first trusted pet listings in Ireland.
            </p>
            <div className="mt-7 flex justify-center gap-4">
              <Link href="/post-ad" className="rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-semibold text-white">
                Post an Ad
              </Link>
              <Link href="/buying-safely" className="rounded-xl border border-(--primary-green) px-6 py-3 text-sm font-semibold text-(--primary-green)">
                Learn Safety Rules
              </Link>
            </div>
          </div>
        )}
      </div>
      <div>
        <BrowseCards />
      </div>
    </section>
  );
};

export default FeaturedListings;
