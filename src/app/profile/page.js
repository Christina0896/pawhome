'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
      console.log('Logged in user id:', user.id);

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('My listings data:', listingsData);
      console.log('My listings error:', listingsError);

      if (!listingsError) {
        setMyListings(listingsData || []);
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-[#123524]">Loading profile...</p>
        </main>
      </div>
    );
  }

  const metadata = user?.user_metadata || {};

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#0E4F2A]">My Account</p>
          <h1 className="mt-2 text-3xl font-bold text-[#123524]">Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F6F64]">
            Manage your PawHome account details and listings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#DDEDD8] text-3xl font-bold text-[#0E4F2A]">
              {metadata.first_name?.charAt(0) || 'U'}
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#123524]">
              {metadata.first_name || 'User'} {metadata.last_name || ''}
            </h2>

            <p className="mt-1 text-sm text-[#5F6F64]">{user.email}</p>

            <div className="mt-6 rounded-xl bg-[#FFFCF5] p-4">
              <p className="text-sm font-semibold text-[#123524]">Account Type</p>
              <p className="mt-1 text-sm text-[#5F6F64]">{metadata.account_type || 'Not set'}</p>
            </div>
          </aside>

          {/* Main Profile Info */}
          <section className="rounded-2xl border border-[#E8DFD1] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#123524]">Account Details</h2>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[#123524]">First Name</p>
                <p className="mt-1 text-sm text-[#5F6F64]">{metadata.first_name || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#123524]">Last Name</p>
                <p className="mt-1 text-sm text-[#5F6F64]">{metadata.last_name || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#123524]">Email</p>
                <p className="mt-1 text-sm text-[#5F6F64]">{user.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#123524]">Phone</p>
                <p className="mt-1 text-sm text-[#5F6F64]">
                  {metadata.phone_code || ''} {metadata.phone || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#123524]">County</p>
                <p className="mt-1 text-sm text-[#5F6F64]">{metadata.county || 'Not provided'}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#123524]">Email Verified</p>
                <p className="mt-1 text-sm text-[#5F6F64]">{user.email_confirmed_at ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-[#E8DFD1] pt-8">
              <h2 className="text-2xl font-bold text-[#123524]">My Listings</h2>

              {myListings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-[#E8DFD1] bg-[#FFFCF5] px-8 py-8 text-center">
                  <p className="text-sm text-[#5F6F64]">You have not posted any listings yet.</p>

                  <a
                    href="/post-ad"
                    className="mt-5 inline-flex rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Post your first ad
                  </a>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {myListings.map((listing) => {
                    const sortedPhotos = [...(listing.listing_photos || [])].sort(
                      (a, b) => a.sort_order - b.sort_order,
                    );

                    const mainImage = sortedPhotos[0]?.image_url;

                    return (
                      <a
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="overflow-hidden rounded-2xl border border-[#E8DFD1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="h-40 bg-[#DDEDD8]">
                          {mainImage ? (
                            <img src={mainImage} alt={listing.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-[#123524]">{listing.title}</h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                listing.status === 'approved'
                                  ? 'bg-[#DDEDD8] text-[#0E4F2A]'
                                  : listing.status === 'rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-[#FFF1DF] text-[#C46A00]'
                              }`}
                            >
                              {listing.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-[#5F6F64]">{listing.breed || listing.animal_type}</p>

                          <p className="mt-3 text-sm font-bold text-[#0E4F2A]">
                            {listing.price ? `€${listing.price}` : 'No price'}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
