'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import ListingCard from '../../components/ListingCard';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { FAVORITE_LISTING_SELECT } from '../../lib/publicListingSelect';
import { getVerifiedAccessToken } from '../../lib/authTokens';
import { useAuth } from '../../context/AuthContext';

export default function FavoritesPage() {
  const { user, authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (authLoading) return;

      if (!user) {
        window.dispatchEvent(new Event('open-login-modal'));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(FAVORITE_LISTING_SELECT)
        .eq('user_id', user.id)
        .eq('listings.status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Favorites fetch error:', error);
        setLoading(false);
        return;
      }

      setFavorites(data || []);
      setLoading(false);
    };

    loadFavorites();
  }, [user, authLoading]);

  const handleRemoveFavorite = async (_event, listingId) => {
    const previousFavorites = favorites;

    setFavorites((current) => current.filter((favorite) => String(favorite.listing_id) !== String(listingId)));

    try {
      const accessToken = await getVerifiedAccessToken();

      if (!accessToken) {
        setFavorites(previousFavorites);
        return;
      }

      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setFavorites(previousFavorites);
      }
    } catch (error) {
      console.warn('Remove favourite request failed:', error);
      setFavorites(previousFavorites);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0E4F2A]">Profile</p>

          <h1 className="mt-2 text-3xl font-bold text-[#123524]">My Favorites</h1>

          <p className="mt-3 text-sm text-[#5F6F64]">Listings you saved for later.</p>
        </div>

        {loading || authLoading ? (
          <p className="text-sm text-[#5F6F64]">Loading favorites...</p>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-[#E8DFD1] bg-white px-8 py-14 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#123524]">No favorites yet</h2>

            <p className="mt-3 text-sm text-[#5F6F64]">Save listings by clicking the heart icon.</p>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((favorite) => (
              <ListingCard
                key={favorite.id}
                listing={favorite.listings}
                isFavorite
                onFavoriteClick={handleRemoveFavorite}
                showDescription={false}
                compact
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
