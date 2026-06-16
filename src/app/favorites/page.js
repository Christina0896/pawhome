'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(
          `
          id,
          listing_id,
          listings (
            *,
            listing_photos (
              image_url,
              sort_order
            )
          )
        `,
        )
        .eq('user_id', user.id)
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
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0E4F2A]">Profile</p>

          <h1 className="mt-2 text-3xl font-bold text-[#123524]">My Favorites</h1>

          <p className="mt-3 text-sm text-[#5F6F64]">Listings you saved for later.</p>
        </div>

        {loading ? (
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
            {favorites.map((favorite) => {
              const listing = favorite.listings;
              const sortedPhotos = [...(listing?.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order);

              const mainImage = sortedPhotos[0]?.image_url;

              return (
                <Link
                  key={favorite.id}
                  href={`/listings/${listing.id}`}
                  className="overflow-hidden rounded-2xl border border-[#E8DFD1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="h-48 bg-[#DDEDD8]">
                    {mainImage ? (
                      <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-[#123524]">{listing.title}</h2>

                      {listing.price && <p className="text-sm font-bold text-[#0E4F2A]">€{listing.price}</p>}
                    </div>

                    <p className="mt-2 text-sm text-[#5F6F64]">{listing.breed || listing.animal_type}</p>

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
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
