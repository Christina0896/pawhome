'use client';

import { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { ShieldCheckIcon } from '../../components/Icons';
import { getVerifiedAccessToken } from '../../lib/authTokens';
import MyListingsSimple from './MyListingsSimple';

const DEFAULT_PROFILE = {
  first_name: '',
  last_name: '',
  account_type: 'Buyer',
  phone_code: '+353',
  phone_number: '',
  county: '',
  avatar_url: null,
  phone_verified: false,
};

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

async function fetchJson(url, options = {}, timeoutMs = 7000) {
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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">
      <ShieldCheckIcon className="h-3.5 w-3.5" /> Verified
    </span>
  );
}

function NotVerifiedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">
      Not verified
    </span>
  );
}

export default function ProfilePageClient() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const token = await getVerifiedAccessToken();
        if (!token) throw new Error('Please log in again.');

        const { response, data } = await fetchJson('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(data.error || 'Could not load profile.');
        if (!active) return;

        const safeProfile = { ...DEFAULT_PROFILE, ...(data.profile || {}) };
        setUser(data.user || null);
        setProfile(safeProfile);
        setForm(safeProfile);
      } catch (error) {
        if (active) {
          setMessageType('error');
          setMessage(error.message || 'Could not load profile.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'PawHome User';
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const phoneVerified = Boolean(profile.phone_verified);
  const phoneSaved = Boolean(profile.phone_number);
  const phoneChanged =
    !phoneVerified && (profile.phone_code !== form.phone_code || profile.phone_number !== form.phone_number);

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const updateProfileState = (nextProfile) => {
    const safeProfile = { ...DEFAULT_PROFILE, ...(nextProfile || {}) };
    setProfile(safeProfile);
    setForm(safeProfile);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    if (phoneVerified && (name === 'phone_code' || name === 'phone_number')) return;

    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');

    if (name === 'phone_code' || name === 'phone_number') {
      setCallStarted(false);
      setPhoneCode('');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showMessage('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      showMessage('Profile picture must be 2 MB or smaller.');
      return;
    }

    setAvatarUploading(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const formData = new FormData();
      formData.append('avatar', file);

      const { response, data } = await fetchJson(
        '/api/profile/avatar',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
        12000,
      );

      if (!response.ok) throw new Error(data.error || 'Could not upload profile picture.');

      updateProfileState(data.profile);
      showMessage('Profile picture updated.', 'success');
    } catch (error) {
      showMessage(error.message || 'Could not upload profile picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson(
        '/api/profile/avatar',
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
        12000,
      );

      if (!response.ok) throw new Error(data.error || 'Could not remove profile picture.');

      updateProfileState(data.profile);
      showMessage('Profile picture removed.', 'success');
    } catch (error) {
      showMessage(error.message || 'Could not remove profile picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          account_type: form.account_type,
          phone_code: phoneVerified ? profile.phone_code : form.phone_code.trim(),
          phone_number: phoneVerified ? profile.phone_number : form.phone_number.trim(),
          county: form.county.trim(),
        }),
      });

      if (!response.ok) throw new Error(data.error || 'Could not save settings.');

      updateProfileState(data.profile);
      setCallStarted(false);
      setPhoneCode('');

      if (data.profile?.phone_number && !data.profile?.phone_verified) {
        showMessage('Settings saved. Request an automated call below to verify your phone.', 'success');
      } else {
        showMessage('Settings saved.', 'success');
      }
    } catch (error) {
      showMessage(error.message || 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  };

  const startVerificationCall = async () => {
    if (phoneChanged) {
      showMessage('Save your phone number before requesting the verification call.');
      return;
    }

    if (!phoneSaved) {
      showMessage('Add and save a phone number before requesting the verification call.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson(
        '/api/phone/send-code',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        15000,
      );

      if (!response.ok) throw new Error(data.error || 'Could not start the verification call.');

      if (data.alreadyVerified) {
        updateProfileState({ ...profile, phone_verified: true });
        showMessage('Your phone number is already verified.', 'success');
        return;
      }

      setCallStarted(true);
      showMessage(`An automated call is being placed to ${data.phone || 'your saved phone number'}.`, 'success');
    } catch (error) {
      showMessage(error.message || 'Could not start the verification call.');
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneCode.trim()) {
      showMessage('Enter the code read during the automated call.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson('/api/phone/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: phoneCode.trim() }),
      });

      if (!response.ok) throw new Error(data.error || 'Could not verify the code.');

      updateProfileState(data.profile || { ...profile, phone_verified: true });
      setCallStarted(false);
      setPhoneCode('');
      showMessage('Phone number verified. You can now post ads.', 'success');
    } catch (error) {
      showMessage(error.message || 'Could not verify the code.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />
        <main className="mx-auto max-w-[1440px] px-6 py-10">Loading profile...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <p className="text-sm font-semibold text-(--primary-green)">My Account</p>
        <h1 className="mt-2 text-4xl font-extrabold text-(--secondary-green)">Profile</h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          <aside className="h-fit rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="text-center">
              <div className="relative mx-auto h-24 w-24">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    fullName.charAt(0).toUpperCase()
                  )}
                </div>

                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--primary-green) text-xs font-extrabold text-white shadow-md">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  {avatarUploading ? '...' : '+'}
                </label>
              </div>

              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="mt-3 text-xs font-semibold text-red-500 hover:underline disabled:opacity-60"
                >
                  Remove profile picture
                </button>
              )}

              <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">{fullName}</h2>
              <p className="mt-1 break-all text-sm text-(--muted-green-text)">{user?.email}</p>
            </div>

            <form onSubmit={saveProfile} className="mt-8 space-y-4">
              <label className="block text-sm font-bold text-(--secondary-green)">
                First Name
                <input
                  name="first_name"
                  value={form.first_name || ''}
                  onChange={updateField}
                  required
                  maxLength={80}
                  className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4"
                />
              </label>

              <label className="block text-sm font-bold text-(--secondary-green)">
                Last Name
                <input
                  name="last_name"
                  value={form.last_name || ''}
                  onChange={updateField}
                  required
                  maxLength={80}
                  className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4"
                />
              </label>

              <label className="block text-sm font-bold text-(--secondary-green)">
                Account Type
                <select
                  name="account_type"
                  value={form.account_type || 'Buyer'}
                  onChange={updateField}
                  className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Private Seller">Private Seller</option>
                  <option value="Breeder">Breeder</option>
                  <option value="Shelter / Rescue">Shelter / Rescue</option>
                </select>
              </label>

              <div className="rounded-2xl bg-(--background) p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-(--muted-green-text)">Email</p>
                  {emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
                </div>
                <p className="mt-2 break-all text-sm font-bold text-(--secondary-green)">{user?.email || '-'}</p>
              </div>

              <div className="rounded-2xl border border-(--border-beige) p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-(--secondary-green)">Phone verification</p>
                  {phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}
                </div>

                <div className="grid grid-cols-[105px_1fr] gap-3">
                  <select
                    name="phone_code"
                    value={form.phone_code || '+353'}
                    onChange={updateField}
                    disabled={phoneVerified}
                    className="h-12 rounded-xl border border-(--border-beige) px-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                    type="tel"
                    value={form.phone_number || ''}
                    onChange={updateField}
                    disabled={phoneVerified}
                    placeholder="85 123 4567"
                    autoComplete="tel"
                    className="h-12 rounded-xl border border-(--border-beige) px-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {phoneVerified ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-(--muted-green-text)">
                    This phone number is verified and cannot be changed from the profile. Contact support if it needs to
                    be replaced.
                  </p>
                ) : (
                  <div className="mt-4 rounded-2xl bg-(--background) p-4">
                    <p className="text-xs font-semibold leading-5 text-(--muted-green-text)">
                      Save the number first. Then PawHome will place an automated call and read a four-digit code. No SMS
                      is sent and no PawHome staff member calls you.
                    </p>

                    <button
                      type="button"
                      onClick={startVerificationCall}
                      disabled={busy || phoneChanged || !phoneSaved}
                      className="mt-3 h-10 w-full rounded-xl bg-(--primary-orange) px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? 'Please wait...' : callStarted ? 'Call me again' : 'Call me with a verification code'}
                    </button>

                    {phoneChanged && (
                      <p className="mt-2 text-xs font-semibold text-orange-700">Save Settings before requesting the call.</p>
                    )}

                    {callStarted && (
                      <div className="mt-3 grid gap-2">
                        <input
                          value={phoneCode}
                          onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="Enter the code from the call"
                          className="h-11 rounded-xl border border-(--border-beige) px-4"
                        />
                        <button
                          type="button"
                          onClick={verifyPhoneCode}
                          disabled={busy || !phoneCode.trim()}
                          className="h-10 rounded-xl bg-(--primary-green) text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Verify phone
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="block text-sm font-bold text-(--secondary-green)">
                County
                <input
                  name="county"
                  value={form.county || ''}
                  onChange={updateField}
                  maxLength={80}
                  className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4"
                />
              </label>

              {message && (
                <p className={`rounded-xl px-4 py-3 text-sm font-bold ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={busy || avatarUploading}
                className="h-12 w-full rounded-xl bg-(--primary-green) text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </aside>

          <MyListingsSimple />
        </div>
      </main>

      <Footer />
    </div>
  );
}
