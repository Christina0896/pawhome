'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { GalleryIcon, PawIcon, ShieldCheckIcon } from '../../components/Icons';
import { supabase } from '../../lib/supabaseClient';
import { getVerifiedAccessToken } from '../../lib/authTokens';

const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function getDefaultProfile() {
  return {
    first_name: '',
    last_name: '',
    account_type: 'Buyer',
    phone_code: '+353',
    phone_number: '',
    county: '',
    avatar_url: null,
    phone_verified: false,
  };
}

function sortListingPhotos(photos) {
  return [...(photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function getStatusClass(status) {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-orange-100 text-orange-700';
}

export default function ProfilePageClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneVerificationMessage, setPhoneVerificationMessage] = useState('');
  const [phoneVerificationSending, setPhoneVerificationSending] = useState(false);
  const [phoneVerificationChecking, setPhoneVerificationChecking] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    account_type: 'Buyer',
    phone_code: '+353',
    phone_number: '',
    county: '',
    password: '',
  });

  const applyProfileData = (profileData, userData) => {
    const safeProfile = profileData || getDefaultProfile();

    setUser(userData);
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
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      try {
        const accessToken = await getVerifiedAccessToken();

        if (!accessToken) {
          router.push('/');
          return;
        }

        const [profileResponse, listingsResponse] = await Promise.all([
          fetch('/api/profile/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/profile/listings', { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);

        const profileResult = await profileResponse.json();
        const listingsResult = await listingsResponse.json();

        if (!profileResponse.ok) {
          router.push('/');
          return;
        }

        applyProfileData(profileResult.profile, profileResult.user);
        setMyListings(listingsResponse.ok ? listingsResult.listings || [] : []);
      } catch (error) {
        console.error('Profile load error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const phoneVerified = Boolean(profile?.phone_verified);
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' }) : '-';
  const phoneChanged = Boolean(
    profile && (profile.phone_code !== profileForm.phone_code || profile.phone_number !== profileForm.phone_number),
  );

  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileMessage('');

    if (name === 'phone_code' || name === 'phone_number') {
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
      setPhoneVerificationMessage('Save your phone number before verifying it.');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!allowedAvatarTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      alert('Profile picture must be 2 MB or smaller.');
      return;
    }

    setAvatarUploading(true);

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Could not upload profile picture.');
        return;
      }

      setProfile(result.profile);
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Could not upload profile picture. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const response = await fetch('/api/profile/avatar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error || 'Could not remove profile picture.');
      return;
    }

    setProfile(result.profile);
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    setPhoneVerificationMessage('');

    const password = profileForm.password.trim();

    if (password) {
      const strongPassword = password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

      if (!strongPassword) {
        setProfileSaving(false);
        setProfileMessage('Password must be at least 10 characters and include uppercase, lowercase, and a number.');
        return;
      }
    }

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          first_name: profileForm.first_name.trim(),
          last_name: profileForm.last_name.trim(),
          account_type: profileForm.account_type,
          phone_code: profileForm.phone_code.trim(),
          phone_number: profileForm.phone_number.trim(),
          county: profileForm.county.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setProfileMessage(result.error || 'Could not save settings. Please try again.');
        return;
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) {
          setProfileMessage(passwordError.message || 'Could not update password.');
          return;
        }
      }

      setProfile(result.profile);
      setProfileForm((current) => ({ ...current, password: '' }));
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
      setProfileMessage('Settings saved.');
    } catch (error) {
      console.error('Profile save error:', error);
      setProfileMessage('Could not save settings. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setPhoneVerificationMessage('');

    if (phoneChanged) {
      setPhoneVerificationMessage('Save your phone number before verifying it.');
      return;
    }

    if (!profileForm.phone_number.trim()) {
      setPhoneVerificationMessage('Enter your phone number first.');
      return;
    }

    setPhoneVerificationSending(true);

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const response = await fetch('/api/phone/send-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();

      if (!response.ok) {
        setPhoneVerificationMessage(result.error || 'Could not send verification code.');
        return;
      }

      if (result.alreadyVerified) {
        setPhoneVerificationMessage('This phone number is already verified.');
        return;
      }

      setPhoneCodeSent(true);
      setPhoneVerificationCode('');
      setPhoneVerificationMessage(`Verification code sent to ${result.phone || 'your phone'}.`);
    } catch (error) {
      console.error('Send phone code error:', error);
      setPhoneVerificationMessage('Could not send verification code. Please try again.');
    } finally {
      setPhoneVerificationSending(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    setPhoneVerificationMessage('');

    if (!phoneVerificationCode.trim()) {
      setPhoneVerificationMessage('Enter the code from the SMS.');
      return;
    }

    setPhoneVerificationChecking(true);

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const response = await fetch('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: phoneVerificationCode.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        setPhoneVerificationMessage(result.error || 'Could not verify code.');
        return;
      }

      setProfile(result.profile);
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
      setPhoneVerificationMessage('Phone number verified. You can now post ads.');
    } catch (error) {
      console.error('Verify phone code error:', error);
      setPhoneVerificationMessage('Could not verify code. Please try again.');
    } finally {
      setPhoneVerificationChecking(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const response = await fetch(`/api/profile/listings/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error || 'Could not delete listing. Please try again.');
      return;
    }

    setMyListings((current) => current.filter((listing) => listing.id !== listingId));
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
    if (!window.confirm('This will permanently delete your account, listings, saved favourites, and uploaded photos. Continue?')) return;

    setLoading(true);

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const response = await fetch('/api/delete-profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Profile could not be deleted.');

      await supabase.auth.signOut();
      router.push('/');
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
        <main className="mx-auto max-w-[1440px] px-6 py-10"><p className="text-sm text-(--secondary-green)">Loading profile...</p></main>
      </div>
    );
  }

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
          <ProfileSidebar
            user={user}
            profile={profile}
            fullName={fullName}
            memberSince={memberSince}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            phoneChanged={phoneChanged}
            profileForm={profileForm}
            profileSaving={profileSaving}
            profileMessage={profileMessage}
            phoneCodeSent={phoneCodeSent}
            phoneVerificationCode={phoneVerificationCode}
            phoneVerificationMessage={phoneVerificationMessage}
            phoneVerificationSending={phoneVerificationSending}
            phoneVerificationChecking={phoneVerificationChecking}
            avatarUploading={avatarUploading}
            onAvatarUpload={handleAvatarUpload}
            onRemoveAvatar={handleRemoveAvatar}
            onProfileFormChange={handleProfileFormChange}
            onPhoneVerificationCodeChange={(event) => setPhoneVerificationCode(event.target.value)}
            onSendPhoneCode={handleSendPhoneCode}
            onVerifyPhoneCode={handleVerifyPhoneCode}
            onSaveSettings={handleSaveSettings}
            onDeleteProfile={handleDeleteProfile}
          />

          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)]">
            <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2>
                <p className="mt-1 text-sm text-(--muted-green-text)">View, edit, or delete your submitted ads.</p>
              </div>
              <Link href="/post-ad" className="inline-flex items-center justify-center rounded-xl bg-(--primary-orange) px-5 py-3 text-sm font-bold text-white transition hover:scale-105 hover:bg-(--secondary-orange)">Post new ad</Link>
            </div>

            {myListings.length === 0 ? <EmptyListings /> : <ListingGrid listings={myListings} onDelete={handleDeleteListing} />}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProfileSidebar(props) {
  const initial = (props.profile?.first_name || props.user?.email || 'U').charAt(0).toUpperCase();

  return (
    <aside className="h-fit rounded-3xl border border-(--border-beige) bg-white p-6 shadow-[0_8px_24px_rgba(18,53,36,0.05)] lg:sticky lg:top-24">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">
            {props.profile?.avatar_url ? <img src={props.profile.avatar_url} alt="Profile picture" className="h-full w-full object-cover" /> : initial}
          </div>
          <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--primary-green) text-white shadow-md transition hover:scale-105">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={props.onAvatarUpload} className="hidden" />
            {props.avatarUploading ? <span className="text-xs">...</span> : <GalleryIcon className="h-4 w-4" />}
          </label>
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">{props.fullName || 'PawHome User'}</h2>
        <p className="mt-1 break-all text-sm text-(--muted-green-text)">{props.user?.email}</p>
        {props.profile?.avatar_url && <button type="button" onClick={props.onRemoveAvatar} className="mt-3 text-xs font-semibold text-red-500 hover:underline">Remove profile picture</button>}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2"><p className="text-sm text-(--muted-green-text)">Member since:</p><p className="font-bold text-(--secondary-green)">{props.memberSince}</p></div>

      {!props.phoneVerified && (
        <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-(--secondary-green)">
          <p className="font-extrabold">Phone verification required to post ads.</p>
          <p className="mt-1 text-xs font-semibold text-(--muted-green-text)">You can browse and save listings now. Verify your phone before submitting an ad.</p>
        </div>
      )}

      <form onSubmit={props.onSaveSettings} className="mt-6 space-y-4">
        <ProfileEditField label="First Name" name="first_name" value={props.profileForm.first_name} onChange={props.onProfileFormChange} required />
        <ProfileEditField label="Last Name" name="last_name" value={props.profileForm.last_name} onChange={props.onProfileFormChange} required />
        <div>
          <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Account Type</label>
          <select name="account_type" value={props.profileForm.account_type} onChange={props.onProfileFormChange} className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none">
            <option value="Buyer">Buyer</option>
            <option value="Private Seller">Private Seller</option>
            <option value="Breeder">Breeder</option>
            <option value="Shelter / Rescue">Shelter / Rescue</option>
          </select>
        </div>
        <ProfileInfoItem label="Email" value={props.user?.email || '-'} verified={props.emailVerified} showNotVerified />
        <div>
          <div className="mb-2 flex items-center justify-between gap-3"><label className="block text-sm font-bold text-(--secondary-green)">Phone</label>{props.phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}</div>
          <div className="grid grid-cols-[105px_1fr] gap-3">
            <select name="phone_code" value={props.profileForm.phone_code} onChange={props.onProfileFormChange} className="h-12 rounded-xl border border-(--border-beige) bg-white px-3 text-sm font-semibold text-(--secondary-green) outline-none">
              <option value="+353">+353</option>
              <option value="+44">+44</option>
              <option value="+49">+49</option>
              <option value="+351">+351</option>
              <option value="+33">+33</option>
              <option value="+34">+34</option>
            </select>
            <input name="phone_number" value={props.profileForm.phone_number} onChange={props.onProfileFormChange} placeholder="871234567" className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none" />
          </div>
          <PhoneVerificationBox {...props} />
        </div>
        <ProfileEditField label="County" name="county" value={props.profileForm.county} onChange={props.onProfileFormChange} placeholder="Westmeath" />
        <ProfileEditField label="New Password" name="password" type="password" value={props.profileForm.password} onChange={props.onProfileFormChange} placeholder="Leave empty to keep current password" />
        {props.profileMessage && <p className={`text-sm font-bold ${props.profileMessage === 'Settings saved.' ? 'text-green-700' : 'text-red-600'}`}>{props.profileMessage}</p>}
        <div className="grid gap-3 pt-2"><button type="submit" disabled={props.profileSaving} className="flex h-12 items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60">{props.profileSaving ? 'Saving...' : 'Save Settings'}</button><button type="button" onClick={props.onDeleteProfile} className="flex h-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100">Delete Profile</button></div>
      </form>
    </aside>
  );
}

function PhoneVerificationBox(props) {
  if (props.phoneVerified) {
    return <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-bold text-green-700">This phone number is verified. Changing it will require verification again.</p>;
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-(--background) p-4">
      <p className="text-xs font-semibold text-(--muted-green-text)">Verify this number by SMS before posting ads.</p>
      {props.phoneChanged && <p className="text-xs font-bold text-orange-700">Save settings before verifying this phone number.</p>}
      {props.phoneVerificationMessage && <p className="text-xs font-bold text-(--secondary-green)">{props.phoneVerificationMessage}</p>}
      <button
        type="button"
        onClick={props.onSendPhoneCode}
        disabled={props.phoneVerificationSending || props.profileSaving || props.phoneChanged || !props.profileForm.phone_number.trim()}
        className="flex h-10 w-full items-center justify-center rounded-xl bg-(--primary-orange) text-sm font-bold text-white transition hover:bg-(--secondary-orange) disabled:cursor-not-allowed disabled:opacity-60"
      >
        {props.phoneVerificationSending ? 'Sending code...' : props.phoneCodeSent ? 'Send code again' : 'Send verification code'}
      </button>
      {props.phoneCodeSent && (
        <div className="grid gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={props.phoneVerificationCode}
            onChange={props.onPhoneVerificationCodeChange}
            placeholder="Enter SMS code"
            className="h-11 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none"
          />
          <button
            type="button"
            onClick={props.onVerifyPhoneCode}
            disabled={props.phoneVerificationChecking || !props.phoneVerificationCode.trim()}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.phoneVerificationChecking ? 'Checking code...' : 'Verify phone'}
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileEditField({ label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return <div><label className="mb-2 block text-sm font-bold text-(--secondary-green)">{label}{required && <span className="text-(--primary-orange)"> *</span>}</label><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none" /></div>;
}

function ProfileInfoItem({ label, value, verified, showNotVerified }) {
  return <div className="rounded-2xl bg-(--background) p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-(--muted-green-text)">{label}</p>{verified && <VerifiedBadge />}{!verified && showNotVerified && <NotVerifiedBadge />}</div><p className="mt-1 break-words font-bold text-(--secondary-green)">{value}</p></div>;
}

function VerifiedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700"><ShieldCheckIcon className="h-3.5 w-3.5" />Verified</span>;
}

function NotVerifiedBadge() {
  return <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700">Not verified</span>;
}

function EmptyListings() {
  return <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-(--light-green) text-(--primary-green)"><PawIcon className="h-8 w-8" /></div><h3 className="mt-4 text-xl font-extrabold text-(--secondary-green)">No listings yet</h3><p className="mx-auto mt-2 max-w-md text-sm text-(--muted-green-text)">Once you submit an ad, it will appear here. You can manage it from your profile.</p><Link href="/post-ad" className="mt-6 inline-flex rounded-xl bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:scale-105">Post your first ad</Link></div>;
}

function ListingGrid({ listings, onDelete }) {
  return <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ProfileListingCard key={listing.id} listing={listing} onDelete={onDelete} />)}</div>;
}

function ProfileListingCard({ listing, onDelete }) {
  const mainImage = sortListingPhotos(listing.listing_photos)[0]?.image_url;
  const viewHref = listing.status === 'approved' ? `/listings/${listing.id}` : `/listings/${listing.id}?ownerPreview=true`;
  const tags = [listing.county, listing.listing_type, listing.age, listing.sex, listing.microchipped === 'Yes' ? 'Microchipped' : null, listing.vaccinated === 'Yes' ? 'Vaccinated' : null, listing.litter_size ? `Litter: ${listing.litter_size}` : null].filter(Boolean);

  return (
    <div className="flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-(--border-beige) bg-white shadow-[0_6px_18px_rgba(18,53,36,0.06)]">
      <div className="relative h-44 shrink-0 bg-(--light-green)">{mainImage ? <img src={mainImage} alt={listing.breed || listing.animal_type || 'Pet listing'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-(--primary-green)"><PawIcon className="h-12 w-12" /></div>}<span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(listing.status)}`}>{listing.status || 'pending'}</span></div>
      <div className="flex flex-1 flex-col p-4"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-extrabold text-(--secondary-green)">{listing.breed || listing.animal_type || 'Listing'}</h3><p className="mt-1 text-sm text-(--muted-green-text)">{listing.animal_type || '-'}</p></div>{listing.price && <p className="shrink-0 whitespace-nowrap text-base font-extrabold text-(--primary-orange)">€{listing.price}</p>}</div>{tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2 text-xs">{tags.map((tag) => <span key={tag} className="rounded-full bg-(--background) px-3 py-1 font-semibold text-(--secondary-green)">{tag}</span>)}</div>}<div className="mt-auto grid grid-cols-3 gap-2 pt-5"><Link href={viewHref} className="rounded-xl border border-(--border-beige) px-3 py-2 text-center text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)">{listing.status === 'approved' ? 'View' : 'Preview'}</Link><Link href={`/profile/listings/${listing.id}/edit`} className="flex h-10 items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition hover:scale-105">Edit</Link><button type="button" onClick={() => onDelete(listing.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100">Delete</button></div></div>
    </div>
  );
}
