'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];

const sortListingPhotos = (photos) => {
  return [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
};

const getStatusClass = (status) => {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';

  return 'bg-orange-100 text-orange-700';
};

export default function ProfilePage() {
  // Auth/profile state
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [profile, setProfile] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    account_type: 'Buyer',
    phone_code: '+353',
    phone_number: '',
    county: '',
    password: '',
  });

  // Load user profile and listings
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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const safeProfile = profileData || {
        first_name: '',
        last_name: '',
        account_type: 'Buyer',
        phone_code: '+353',
        phone_number: '',
        county: '',
        avatar_url: null,
        phone_verified: false,
      };

      setProfile(safeProfile);

      setProfileForm({
        first_name: safeProfile.first_name || '',
        last_name: safeProfile.last_name || '',
        account_type: safeProfile.account_type || 'Buyer',
        phone_code: safeProfile.phone_code || '+353',
        phone_number: safeProfile.phone_number || '',
        county: safeProfile.county || '',
        password: '',
      });

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

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

  const phone = `${profile?.phone_code || ''} ${profile?.phone_number || ''}`.trim();

  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const phoneVerified = Boolean(profile?.phone_verified);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IE', {
        month: 'long',
        year: 'numeric',
      })
    : '-';

  // Upload profile picture to Supabase storage
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    if (!allowedAvatarTypes.includes(file.type)) {
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
      alert('Could not upload profile picture. Please try again.');
      setAvatarUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Avatar update error:', updateError);
      alert('Profile picture uploaded, but could not update your profile.');
      setAvatarUploading(false);
      return;
    }

    setProfile(updatedProfile);
    setAvatarUploading(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      alert('Could not remove profile picture.');
      return;
    }

    setProfile(updatedProfile);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileMessage('');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    if (!user) return;

    setProfileSaving(true);
    setProfileMessage('');

    const updatedProfilePayload = {
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim(),
      account_type: profileForm.account_type,
      phone_code: profileForm.phone_code.trim(),
      phone_number: profileForm.phone_number.trim(),
      county: profileForm.county.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(updatedProfilePayload)
      .eq('user_id', user.id)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      setProfileSaving(false);
      setProfileMessage('Could not save settings. Please try again.');
      return;
    }

    if (profileForm.password.trim()) {
      const password = profileForm.password.trim();

      const strongPassword =
        password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

      if (!strongPassword) {
        setProfileSaving(false);
        setProfileMessage('Password must be at least 10 characters and include uppercase, lowercase, and a number.');
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });

      if (passwordError) {
        console.error('Password update error:', passwordError);
        setProfileSaving(false);
        setProfileMessage('Could not update password. Please try again.');
        return;
      }
    }

    setProfile(updatedProfile);
    setProfileSaving(false);

    setProfileForm((current) => ({
      ...current,
      password: '',
    }));

    setProfileMessage('Settings saved.');
  };

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

    const secondConfirm = window.confirm(
      'This will permanently delete your account, listings, saved favourites, and uploaded photos. Continue?',
    );

    if (!secondConfirm) return;

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.dispatchEvent(new Event('open-login-modal'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/delete-profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile could not be deleted.');
      }

      await supabase.auth.signOut();

      window.location.href = '/';
    } catch (error) {
      console.error('Delete profile error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-(--primary-green)">My Account</p>

          <h1 className="mt-2 text-4xl font-extrabold text-(--secondary-green)">Profile</h1>

          <p className="mt-3 text-sm text-(--muted-green-text)">Manage your PawHome account details and listings.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
          {/* Left profile panel */}
          <aside className="h-fit rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)] lg:sticky lg:top-24">
            <ProfileAvatar
              user={user}
              profile={profile}
              fullName={fullName}
              avatarUploading={avatarUploading}
              handleAvatarUpload={handleAvatarUpload}
              handleRemoveAvatar={handleRemoveAvatar}
            />

            <div className="mt-4 flex items-center justify-center gap-2">
              <p className="text-sm text-(--muted-green-text)">Member since:</p>
              <p className="font-bold text-(--secondary-green)">{memberSince}</p>
            </div>

            <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
              <ProfileEditField
                label="First Name"
                name="first_name"
                value={profileForm.first_name}
                onChange={handleProfileFormChange}
                required
              />

              <ProfileEditField
                label="Last Name"
                name="last_name"
                value={profileForm.last_name}
                onChange={handleProfileFormChange}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Account Type</label>

                <select
                  name="account_type"
                  value={profileForm.account_type}
                  onChange={handleProfileFormChange}
                  className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Private Owner">Private Owner</option>
                  <option value="Breeder">Breeder</option>
                  <option value="Shelter / Rescue">Shelter / Rescue</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-(--secondary-green)">Email</label>

                  {emailVerified ? (
                    <VerifiedBadge />
                  ) : (
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                      Not verified
                    </span>
                  )}
                </div>

                <input
                  value={user?.email || ''}
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-xl border border-(--border-beige) bg-(--background) px-4 text-sm font-semibold text-(--muted-green-text) outline-none"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-(--secondary-green)">Phone</label>

                  {phoneVerified ? (
                    <VerifiedBadge />
                  ) : (
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                      Not verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-[105px_1fr] gap-3">
                  <select
                    name="phone_code"
                    value={profileForm.phone_code}
                    onChange={handleProfileFormChange}
                    className="h-12 rounded-xl border border-(--border-beige) bg-white px-3 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
                  >
                    <option value="+353">+353</option>
                    <option value="+44">+44</option>
                    <option value="+49">+49</option>
                    <option value="+351">+351</option>
                    <option value="+33">+33</option>
                    <option value="+34">+34</option>
                  </select>

                  <input
                    name="phone_number"
                    value={profileForm.phone_number}
                    onChange={handleProfileFormChange}
                    placeholder="871234567"
                    className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
                  />
                </div>
              </div>

              <ProfileEditField
                label="County"
                name="county"
                value={profileForm.county}
                onChange={handleProfileFormChange}
                placeholder="Westmeath"
              />

              <ProfileEditField
                label="New Password"
                name="password"
                type="password"
                value={profileForm.password}
                onChange={handleProfileFormChange}
                placeholder="Leave empty to keep current password"
              />

              {profileMessage && (
                <p
                  className={`text-sm font-bold ${
                    profileMessage === 'Settings saved.' ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {profileMessage}
                </p>
              )}

              <div className="grid gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex h-12 items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {profileSaving ? 'Saving...' : 'Save Settings'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  className="flex h-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  Delete Profile
                </button>
              </div>
            </form>
          </aside>

          {/* Right listings panel */}
          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)]">
            <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2>

                <p className="mt-1 text-sm text-(--muted-green-text)">View, edit, or delete your submitted ads.</p>
              </div>

              <Link
                href="/post-ad"
                className="inline-flex items-center justify-center rounded-xl bg-(--primary-orange) px-5 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-orange)"
              >
                Post new ad
              </Link>
            </div>

            {myListings.length === 0 ? (
              <EmptyListings />
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {myListings.map((listing) => (
                  <ProfileListingCard key={listing.id} listing={listing} handleDeleteListing={handleDeleteListing} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const ProfileAvatar = ({ user, profile, fullName, avatarUploading, handleAvatarUpload, handleRemoveAvatar }) => {
  const initial = (profile?.first_name || user?.email || 'U').charAt(0).toUpperCase();
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile picture" className="h-full w-full object-cover" />
          ) : (
            initial
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

      {profile?.avatar_url && (
        <button
          type="button"
          onClick={handleRemoveAvatar}
          className="mt-3 text-xs font-semibold text-red-500 hover:underline"
        >
          Remove profile picture
        </button>
      )}
    </div>
  );
};

const ProfileEditField = ({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
        {label}
        {required && <span className="text-(--primary-orange)"> *</span>}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
      />
    </div>
  );
};

const ProfileInfoItem = ({ label, value, verified, showNotVerified }) => {
  return (
    <div className="rounded-2xl bg-(--background) p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-(--muted-green-text)">{label}</p>

        {verified && <VerifiedBadge />}

        {!verified && showNotVerified && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">
            Not verified
          </span>
        )}
      </div>

      <p className="mt-1 break-words font-bold text-(--secondary-green)">{value}</p>
    </div>
  );
};

const VerifiedBadge = () => {
  return (
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
  );
};

const EmptyListings = () => {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-10 text-center">
      <div className="text-4xl">🐾</div>

      <h3 className="mt-4 text-xl font-extrabold text-(--secondary-green)">No listings yet</h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-(--muted-green-text)">
        Once you submit an ad, it will appear here. You can manage it from your profile.
      </p>

      <Link
        href="/post-ad"
        className="mt-6 inline-flex rounded-xl bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:scale-105"
      >
        Post your first ad
      </Link>
    </div>
  );
};

const ProfileListingCard = ({ listing, handleDeleteListing }) => {
  const sortedPhotos = sortListingPhotos(listing.listing_photos);
  const mainImage = sortedPhotos[0]?.image_url;

  const tags = [
    listing.county,
    listing.listing_type,
    listing.age,
    listing.sex,
    listing.microchipped === 'Yes' ? 'Microchipped' : null,
    listing.vaccinated === 'Yes' ? 'Vaccinated' : null,
    listing.litter_size ? `Litter: ${listing.litter_size}` : null,
  ].filter(Boolean);

  return (
    <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-white shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
      <div className="relative h-44 shrink-0 bg-(--light-green)">
        {mainImage ? (
          <img
            src={mainImage}
            alt={listing.breed || listing.animal_type || 'Pet listing'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🐾</div>
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
            listing.status,
          )}`}
        >
          {listing.status || 'pending'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-extrabold text-(--secondary-green)">
              {listing.breed || listing.animal_type || 'Listing'}
            </h3>

            <p className="mt-1 text-sm text-(--muted-green-text)">{listing.animal_type || '-'}</p>
          </div>

          {listing.price && (
            <p className="shrink-0 text-base font-extrabold text-(--primary-orange)">€{listing.price}</p>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-(--background) px-3 py-1 font-semibold text-(--secondary-green)"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
          <Link
            href={`/listings/${listing.id}`}
            className="rounded-xl border border-(--border-beige) px-3 py-2 text-center text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
          >
            View
          </Link>

          <Link
            href={`/profile/listings/${listing.id}/edit`}
            className="flex h-10 items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105"
          >
            Edit
          </Link>

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
};
