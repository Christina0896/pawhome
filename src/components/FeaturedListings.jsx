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
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Featured listings error:', error);
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
          console.error('Featured favorites error:', favoritesError);
        } else {
          setFavoriteIds(favoritesData.map((fav) => fav.listing_id));
        }
      }

      setLoading(false);
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
  return (
    <section className="w-full bg-[#FAF6EC] py-12">
      <div className="mx-auto max-w-[1500px] px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#123524]">Featured Listings</h2>

          <a href="/listings" className="text-sm font-semibold text-[#0E4F2A]">
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
                  className="overflow-hidden rounded-2xl border border-[#E8DFD1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative  h-48 bg-[#DDEDD8]">
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
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-[#123524]">{listing.title}</h3>

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
