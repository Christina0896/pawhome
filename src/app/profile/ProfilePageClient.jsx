'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { PawIcon, ShieldCheckIcon } from '../../components/Icons';
import { supabase } from '../../lib/supabaseClient';
import { getVerifiedAccessToken } from '../../lib/authTokens';

const PROFILE_TIMEOUT_MS = 7000;

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

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = PROFILE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

function getStatusClass(status) {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-orange-100 text-orange-700';
}

function VerifiedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700"><ShieldCheckIcon className="h-3.5 w-3.5" /> Verified</span>;
}

function NotVerifiedBadge() {
  return <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">Not verified</span>;
}

function ProfileField({ label, name, value, onChange, required = false, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">{label}{required && ' *'}</label>
      <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none" />
    </div>
  );
}

export default function ProfilePageClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);
  const [profileError, setProfileError] = useState('');
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
    let cancelled = false;

    const loadListings = async (accessToken) => {
      setLoadingListings(true);
      try {
        const { response, data } = await fetchJsonWithTimeout('/api/profile/listings', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }, 5000);

        if (!cancelled) {
          setMyListings(response.ok ? data.listings || [] : []);
        }
      } catch (error) {
        console.error('Profile listings load failed:', error);
        if (!cancelled) setMyListings([]);
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    };

    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileError('');

      try {
        const accessToken = await getVerifiedAccessToken();

        if (!accessToken) {
          if (!cancelled) {
            setProfileError('Your session could not be loaded. Please log in again.');
            setLoadingProfile(false);
          }
          return;
        }

        const { response, data } = await fetchJsonWithTimeout('/api/profile/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error(data.error || 'Could not load profile.');
        }

        if (!cancelled) {
          applyProfileData(data.profile, data.user);
          setLoadingProfile(false);
          loadListings(accessToken);
        }
      } catch (error) {
        console.error('Profile load failed:', error);
        if (!cancelled) {
          setProfileError(error?.name === 'AbortError' ? 'Profile request timed out. Please reload.' : error.message || 'Could not load profile.');
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'PawHome User';
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const phoneVerified = Boolean(profile?.phone_verified);
  const phoneChanged = Boolean(profile && (profile.phone_code !== profileForm.phone_code || profile.phone_number !== profileForm.phone_number));

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

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    setPhoneVerificationMessage('');

    const password = profileForm.password.trim();

    if (password && !(password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password))) {
      setProfileSaving(false);
      setProfileMessage('Password must be at least 10 characters and include uppercase, lowercase, and a number.');
      return;
    }

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const { response, data } = await fetchJsonWithTimeout('/api/profile', {
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

      if (!response.ok) {
        setProfileMessage(data.error || 'Could not save settings.');
        return;
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) {
          setProfileMessage(passwordError.message || 'Could not update password.');
          return;
        }
      }

      applyProfileData(data.profile, user);
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
      setProfileMessage('Settings saved.');
    } catch (error) {
      console.error('Profile save failed:', error);
      setProfileMessage(error?.name === 'AbortError' ? 'Save request timed out.' : 'Could not save settings.');
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

      const { response, data } = await fetchJsonWithTimeout('/api/phone/send-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        setPhoneVerificationMessage(data.error || 'Could not send verification code.');
        return;
      }

      if (data.alreadyVerified) {
        setPhoneVerificationMessage('This phone number is already verified.');
        return;
      }

      setPhoneCodeSent(true);
      setPhoneVerificationCode('');
      setPhoneVerificationMessage(`Verification code sent to ${data.phone || 'your phone'}.`);
    } catch (error) {
      console.error('Phone code send failed:', error);
      setPhoneVerificationMessage(error?.name === 'AbortError' ? 'Send code request timed out.' : 'Could not send verification code.');
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

      const { response, data } = await fetchJsonWithTimeout('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: phoneVerificationCode.trim() }),
      });

      if (!response.ok) {
        setPhoneVerificationMessage(data.error || 'Could not verify code.');
        return;
      }

      applyProfileData(data.profile, user);
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
      setPhoneVerificationMessage('Phone number verified. You can now post ads.');
    } catch (error) {
      console.error('Phone code verify failed:', error);
      setPhoneVerificationMessage(error?.name === 'AbortError' ? 'Verify request timed out.' : 'Could not verify code.');
    } finally {
      setPhoneVerificationChecking(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const { response, data } = await fetchJsonWithTimeout(`/api/profile/listings/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      alert(data.error || 'Could not delete listing.');
      return;
    }

    setMyListings((current) => current.filter((listing) => listing.id !== listingId));
  };

  if (loadingProfile) {
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

        {profileError ? (
          <section className="rounded-3xl border border-red-100 bg-red-50 p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-red-700">Profile could not load</h2>
            <p className="mt-2 text-sm font-semibold text-red-700">{profileError}</p>
            <button type="button" onClick={() => router.push('/')} className="mt-5 rounded-xl bg-(--primary-green) px-5 py-3 text-sm font-bold text-white">Go home</button>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
            <aside className="h-fit rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">{fullName.charAt(0).toUpperCase()}</div>
                <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">{fullName}</h2>
                <p className="mt-1 break-all text-sm text-(--muted-green-text)">{user?.email}</p>
              </div>

              {!phoneVerified && (
                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-(--secondary-green)">
                  <p className="font-extrabold">Phone verification required to post ads.</p>
                  <p className="mt-1 text-xs font-semibold text-(--muted-green-text)">Verify your phone before submitting an ad.</p>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
                <ProfileField label="First Name" name="first_name" value={profileForm.first_name} onChange={handleProfileFormChange} required />
                <ProfileField label="Last Name" name="last_name" value={profileForm.last_name} onChange={handleProfileFormChange} required />

                <div>
                  <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Account Type</label>
                  <select name="account_type" value={profileForm.account_type} onChange={handleProfileFormChange} className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none">
                    <option value="Buyer">Buyer</option>
                    <option value="Private Seller">Private Seller</option>
                    <option value="Breeder">Breeder</option>
                    <option value="Shelter / Rescue">Shelter / Rescue</option>
                  </select>
                </div>

                <div className="rounded-2xl bg-(--background) p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-xs text-(--muted-green-text)">Email</p>{emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}</div>
                  <p className="mt-2 break-all text-sm font-bold text-(--secondary-green)">{user?.email || '-'}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3"><label className="block text-sm font-bold text-(--secondary-green)">Phone</label>{phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}</div>
                  <div className="grid grid-cols-[105px_1fr] gap-3">
                    <select name="phone_code" value={profileForm.phone_code} onChange={handleProfileFormChange} className="h-12 rounded-xl border border-(--border-beige) bg-white px-3 text-sm font-semibold text-(--secondary-green) outline-none">
                      <option value="+353">+353</option>
                      <option value="+44">+44</option>
                      <option value="+49">+49</option>
                      <option value="+351">+351</option>
                      <option value="+33">+33</option>
                      <option value="+34">+34</option>
                    </select>
                    <input name="phone_number" value={profileForm.phone_number} onChange={handleProfileFormChange} placeholder="871234567" className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none" />
                  </div>

                  {!phoneVerified ? (
                    <div className="mt-3 space-y-3 rounded-2xl bg-(--background) p-4">
                      <p className="text-xs font-semibold text-(--muted-green-text)">Verify this number by SMS before posting ads.</p>
                      {phoneChanged && <p className="text-xs font-bold text-orange-700">Save settings before verifying this phone number.</p>}
                      {phoneVerificationMessage && <p className="text-xs font-bold text-(--secondary-green)">{phoneVerificationMessage}</p>}
                      <button type="button" onClick={handleSendPhoneCode} disabled={phoneVerificationSending || profileSaving || phoneChanged || !profileForm.phone_number.trim()} className="flex h-10 w-full items-center justify-center rounded-xl bg-(--primary-orange) text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
                        {phoneVerificationSending ? 'Sending code...' : phoneCodeSent ? 'Send code again' : 'Send verification code'}
                      </button>
                      {phoneCodeSent && (
                        <div className="grid gap-2">
                          <input type="text" inputMode="numeric" value={phoneVerificationCode} onChange={(event) => setPhoneVerificationCode(event.target.value)} placeholder="Enter SMS code" className="h-11 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none" />
                          <button type="button" onClick={handleVerifyPhoneCode} disabled={phoneVerificationChecking || !phoneVerificationCode.trim()} className="flex h-10 w-full items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
                            {phoneVerificationChecking ? 'Checking code...' : 'Verify phone'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-bold text-green-700">This phone number is verified. Changing it will require verification again.</p>
                  )}
                </div>

                <ProfileField label="County" name="county" value={profileForm.county} onChange={handleProfileFormChange} placeholder="Westmeath" />
                <ProfileField label="New Password" name="password" type="password" value={profileForm.password} onChange={handleProfileFormChange} placeholder="Leave empty to keep current password" />
                {profileMessage && <p className={`text-sm font-bold ${profileMessage === 'Settings saved.' ? 'text-green-700' : 'text-red-600'}`}>{profileMessage}</p>}
                <button type="submit" disabled={profileSaving} className="flex h-12 w-full items-center justify-center rounded-xl bg-(--primary-green) text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">{profileSaving ? 'Saving...' : 'Save Settings'}</button>
              </form>
            </aside>

            <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2>
                  <p className="mt-1 text-sm text-(--muted-green-text)">{loadingListings ? 'Loading listings...' : 'View, edit, or delete your submitted ads.'}</p>
                </div>
                <Link href="/post-ad" className="inline-flex items-center justify-center rounded-xl bg-(--primary-orange) px-5 py-3 text-sm font-bold text-white">Post new ad</Link>
              </div>

              {myListings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-8 text-center"><PawIcon className="mx-auto h-10 w-10 text-(--muted-green-text)" /><h3 className="mt-3 text-lg font-extrabold text-(--secondary-green)">No listings yet</h3><p className="mt-1 text-sm text-(--muted-green-text)">Your submitted ads will appear here.</p></div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {myListings.map((listing) => (
                    <article key={listing.id} className="rounded-2xl border border-(--border-beige) bg-(--background) p-4">
                      <div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-base font-extrabold text-(--secondary-green)">{listing.title}</h3><span className={`rounded-full px-2 py-1 text-xs font-extrabold ${getStatusClass(listing.status)}`}>{listing.status || 'pending'}</span></div>
                      <p className="mt-3 text-sm font-bold text-(--primary-green)">€{listing.price || 'Contact'}</p>
                      <p className="mt-1 text-xs font-semibold text-(--muted-green-text)">{listing.breed} · {listing.county}</p>
                      <button type="button" onClick={() => handleDeleteListing(listing.id)} className="mt-4 w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">Delete listing</button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
