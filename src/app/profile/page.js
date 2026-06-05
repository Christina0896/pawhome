'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';

import { supabase } from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setAvatarUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
      upsert: true,
    });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      alert(uploadError.message || 'Could not upload profile picture.');
      setAvatarUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        avatar_url: avatarUrl,
      },
    });

    if (updateError) {
      console.error('Avatar update error:', updateError);
      alert('Profile picture uploaded, but could not update your profile.');
      setAvatarUploading(false);
      return;
    }

    setUser(data.user);
    setAvatarUploading(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = '/';
        return;
      }

      setUser(user);

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

      if (listingsError) {
        console.error('Listings fetch error:', listingsError);
      } else {
        setMyListings(listingsData || []);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleDeleteListing = async (listingId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing? This action cannot be undone.');

    if (!confirmDelete) return;

    const { error } = await supabase.from('listings').delete().eq('id', listingId).eq('user_id', user.id);

    if (error) {
      console.error('Delete listing error:', error);
      alert('Could not delete listing. Please try again.');
      return;
    }

    setMyListings((current) => current.filter((listing) => listing.id !== listingId));
  };

  const handleDeleteProfile = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your profile? This action cannot be undone.');

    if (!confirmDelete) return;

    alert(
      'Profile deletion should be handled securely with a server action or Supabase Edge Function. For now, this button is only a placeholder.',
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />

        <main className="mx-auto max-w-[1440px] px-6 py-10">
          <p className="text-sm text-(--secondary-green)">Loading profile...</p>
        </main>
      </div>
    );
  }

  const metadata = user?.user_metadata || {};
  const fullName = `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();

  const phone = `${metadata.phone_code || ''} ${metadata.phone || ''}`.trim();

  const emailVerified = Boolean(metadata.email_verified || user?.email_confirmed_at);
  const phoneVerified = Boolean(metadata.phone_verified);
  const canPostAd = emailVerified && phoneVerified;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IE', {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-(--primary-green)">My Account</p>

          <h1 className="mt-2 text-4xl font-extrabold text-(--secondary-green)">Profile</h1>

          <p className="mt-3 text-sm text-(--muted-green-text)">Manage your PawHome account details and listings.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
          {/* Left Account Panel */}
          <aside className="h-fit rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">
                  {metadata.avatar_url ? (
                    <img src={metadata.avatar_url} alt="Profile picture" className="h-full w-full object-cover" />
                  ) : (
                    (metadata.first_name || user?.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--primary-green) text-white shadow-md transition hover:scale-105">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  {avatarUploading ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  )}
                </label>
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">{fullName || 'PawHome User'}</h2>

              <p className="mt-1 break-all text-sm text-(--muted-green-text)">{user?.email}</p>
              {metadata.avatar_url && (
                <button
                  type="button"
                  onClick={async () => {
                    const { data, error } = await supabase.auth.updateUser({
                      data: {
                        ...metadata,
                        avatar_url: null,
                      },
                    });

                    if (error) {
                      alert('Could not remove profile picture.');
                      return;
                    }

                    setUser(data.user);
                  }}
                  className="mt-3 text-xs font-semibold text-red-500 hover:underline"
                >
                  Remove profile picture
                </button>
              )}
              <div className="flex items-center gap-2 mt-1">
                <p className=" text-sm text-(--muted-green-text)">Member Since : </p>
                <p className="font-bold text-(--secondary-green)">{memberSince}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-(--background) p-4">
                <p className="text-xs font-semibold text-(--muted-green-text)">Account Type</p>
                <p className="mt-1 font-bold text-(--secondary-green)">{metadata.account_type || 'Buyer'}</p>
              </div>

              <div className="rounded-2xl bg-(--background) p-4">
                <p className="text-xs font-semibold text-(--muted-green-text)">First Name</p>
                <p className="mt-1 font-bold text-(--secondary-green)">{metadata.first_name || '-'}</p>
              </div>

              <div className="rounded-2xl bg-(--background) p-4">
                <p className="text-xs font-semibold text-(--muted-green-text)">Last Name</p>
                <p className="mt-1 font-bold text-(--secondary-green)">{metadata.last_name || '-'}</p>
              </div>

              <div className="rounded-2xl bg-(--background) p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-(--muted-green-text)">Email</p>

                  {emailVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-1 break-all font-bold text-(--secondary-green)">{user?.email || '-'}</p>
              </div>

              <div className="rounded-2xl bg-(--background) p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-(--muted-green-text)">Phone</p>

                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                      Not verified
                    </span>
                  )}
                </div>

                <p className="mt-1 font-bold text-(--secondary-green)">{phone || '-'}</p>
              </div>

              <div className="rounded-2xl bg-(--background) p-4">
                <p className="text-xs font-semibold text-(--muted-green-text)">County</p>
                <p className="mt-1 font-bold text-(--secondary-green)">{metadata.county || '-'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href="/post-ad"
                className="flex h-12 items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105"
              >
                Post an Ad
              </a>

              <button
                type="button"
                className="flex h-12 items-center justify-center rounded-xl border border-(--border-beige) bg-white text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
              >
                Edit Profile
              </button>

              <button
                type="button"
                onClick={handleDeleteProfile}
                className="flex h-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                Delete Profile
              </button>
            </div>
          </aside>

          {/* Right Listings Panel */}
          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)]">
            <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2>

                <p className="mt-1 text-sm text-(--muted-green-text)">View, edit, or delete your submitted ads.</p>
              </div>

              <a
                href="/post-ad"
                className="inline-flex items-center justify-center rounded-xl bg-(--primary-orange) px-5 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-orange)"
              >
                Post new ad
              </a>
            </div>

            {myListings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-10 text-center">
                <div className="text-4xl">🐾</div>

                <h3 className="mt-4 text-xl font-extrabold text-(--secondary-green)">No listings yet</h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-(--muted-green-text)">
                  Once you submit an ad, it will appear here. You can manage it from your profile.
                </p>

                <a
                  href="/post-ad"
                  className="mt-6 inline-flex rounded-xl bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:scale-105"
                >
                  Post your first ad
                </a>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {myListings.map((listing) => {
                  const sortedPhotos = [...(listing.listing_photos || [])].sort(
                    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
                  );

                  const mainImage = sortedPhotos[0]?.image_url;

                  return (
                    <div
                      key={listing.id}
                      className="overflow-hidden rounded-2xl border border-(--border-beige) bg-white shadow-[0_6px_18px_rgba(18,53,36,0.06)]"
                    >
                      <div className="relative h-44 bg-(--light-green)">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={listing.breed || listing.animal_type}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">🐾</div>
                        )}

                        <span
                          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                            listing.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : listing.status === 'pending'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {listing.status || 'pending'}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="line-clamp-1 text-base font-extrabold text-(--secondary-green)">
                              {listing.breed || listing.animal_type || 'Listing'}
                            </h3>

                            <p className="mt-1 text-sm text-(--muted-green-text)">{listing.animal_type || '-'}</p>
                          </div>

                          {listing.price && (
                            <p className="shrink-0 text-base font-extrabold text-(--primary-orange)">
                              €{listing.price}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                          {listing.county && (
                            <span className="rounded-full bg-(--background) px-3 py-1 font-semibold text-(--secondary-green)">
                              {listing.county}
                            </span>
                          )}

                          {listing.listing_type && (
                            <span className="rounded-full bg-(--background) px-3 py-1 font-semibold text-(--secondary-green)">
                              {listing.listing_type}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2">
                          <a
                            href={`/listings/${listing.id}`}
                            className="rounded-xl border border-(--border-beige) px-3 py-2 text-center text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
                          >
                            View
                          </a>

                          <a
                            href={`/profile/listings/${listing.id}/edit`}
                            className="rounded-xl bg-(--primary-green) px-3 py-2 text-center text-sm font-bold text-white transition hover:scale-105"
                          >
                            Edit
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteListing(listing.id)}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
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
