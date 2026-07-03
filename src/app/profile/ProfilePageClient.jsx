'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/header';
import Footer from '../../components/footer';
import { ShieldCheckIcon } from '../../components/Icons';
import { getVerifiedAccessToken } from '../../lib/authTokens';

const DEFAULT_PROFILE = {
  first_name: '',
  last_name: '',
  account_type: 'Buyer',
  phone_code: '+353',
  phone_number: '',
  county: '',
  phone_verified: false,
};

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

function VerifiedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700"><ShieldCheckIcon className="h-3.5 w-3.5" /> Verified</span>;
}

function NotVerifiedBadge() {
  return <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">Not verified</span>;
}

export default function ProfilePageClient() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const token = await getVerifiedAccessToken();
        if (!token) throw new Error('Please log in again.');

        const { response, data } = await fetchJson('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(data.error || 'Could not load profile.');

        const safeProfile = data.profile || DEFAULT_PROFILE;
        if (!active) return;

        setUser(data.user || null);
        setProfile(safeProfile);
        setForm({ ...DEFAULT_PROFILE, ...safeProfile });
      } catch (error) {
        if (active) setMessage(error.message || 'Could not load profile.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'PawHome User';
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const phoneVerified = Boolean(profile?.phone_verified);
  const phoneChanged = !phoneVerified && (profile.phone_code !== form.phone_code || profile.phone_number !== form.phone_number);

  const updateField = (event) => {
    const { name, value } = event.target;

    if (phoneVerified && (name === 'phone_code' || name === 'phone_number')) {
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');

    if (name === 'phone_code' || name === 'phone_number') {
      setPhoneCodeSent(false);
      setPhoneCode('');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

      setProfile(data.profile || DEFAULT_PROFILE);
      setForm({ ...DEFAULT_PROFILE, ...(data.profile || {}) });
      setPhoneCodeSent(false);
      setPhoneCode('');
      setMessage('Settings saved.');
    } catch (error) {
      setMessage(error.message || 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneCode = async () => {
    if (phoneChanged) {
      setMessage('Save your phone number before verifying it.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson('/api/phone/send-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(data.error || 'Could not send verification code.');

      setPhoneCodeSent(true);
      setMessage(`Verification code sent to ${data.phone || 'your phone'}.`);
    } catch (error) {
      setMessage(error.message || 'Could not send verification code.');
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneCode = async () => {
    setBusy(true);
    setMessage('');

    try {
      const token = await getVerifiedAccessToken();
      if (!token) throw new Error('Please log in again.');

      const { response, data } = await fetchJson('/api/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: phoneCode.trim() }),
      });

      if (!response.ok) throw new Error(data.error || 'Could not verify code.');

      setProfile(data.profile || DEFAULT_PROFILE);
      setForm({ ...DEFAULT_PROFILE, ...(data.profile || {}) });
      setPhoneCodeSent(false);
      setPhoneCode('');
      setMessage('Phone number verified. You can now post ads.');
    } catch (error) {
      setMessage(error.message || 'Could not verify code.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-(--background)"><Header /><main className="mx-auto max-w-[1440px] px-6 py-10">Loading profile...</main></div>;
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
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">{fullName.charAt(0).toUpperCase()}</div>
              <h2 className="mt-5 text-2xl font-extrabold text-(--secondary-green)">{fullName}</h2>
              <p className="mt-1 break-all text-sm text-(--muted-green-text)">{user?.email}</p>
            </div>

            <form onSubmit={saveProfile} className="mt-8 space-y-4">
              <label className="block text-sm font-bold text-(--secondary-green)">First Name<input name="first_name" value={form.first_name || ''} onChange={updateField} required className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4" /></label>
              <label className="block text-sm font-bold text-(--secondary-green)">Last Name<input name="last_name" value={form.last_name || ''} onChange={updateField} required className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4" /></label>

              <label className="block text-sm font-bold text-(--secondary-green)">Account Type<select name="account_type" value={form.account_type || 'Buyer'} onChange={updateField} className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4"><option value="Buyer">Buyer</option><option value="Private Seller">Private Seller</option><option value="Breeder">Breeder</option><option value="Shelter / Rescue">Shelter / Rescue</option></select></label>

              <div className="rounded-2xl bg-(--background) p-4">
                <div className="flex items-center justify-between"><p className="text-xs text-(--muted-green-text)">Email</p>{emailVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}</div>
                <p className="mt-2 break-all text-sm font-bold text-(--secondary-green)">{user?.email || '-'}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold text-(--secondary-green)">Phone</p>{phoneVerified ? <VerifiedBadge /> : <NotVerifiedBadge />}</div>
                <div className="grid grid-cols-[105px_1fr] gap-3">
                  <select name="phone_code" value={form.phone_code || '+353'} onChange={updateField} disabled={phoneVerified} className="h-12 rounded-xl border border-(--border-beige) px-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"><option value="+353">+353</option><option value="+44">+44</option><option value="+49">+49</option><option value="+351">+351</option><option value="+33">+33</option><option value="+34">+34</option></select>
                  <input name="phone_number" value={form.phone_number || ''} onChange={updateField} disabled={phoneVerified} className="h-12 rounded-xl border border-(--border-beige) px-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                {phoneVerified && <p className="mt-2 text-xs font-semibold text-(--muted-green-text)">Verified phone numbers cannot be changed. Please contact support if this number is wrong.</p>}
                {!phoneVerified && <div className="mt-3 rounded-2xl bg-(--background) p-4"><p className="text-xs font-semibold text-(--muted-green-text)">Verify this number by SMS before posting ads.</p><button type="button" onClick={sendPhoneCode} disabled={busy || phoneChanged || !form.phone_number} className="mt-3 h-10 w-full rounded-xl bg-(--primary-orange) text-sm font-bold text-white disabled:opacity-60">{phoneCodeSent ? 'Send code again' : 'Send verification code'}</button>{phoneCodeSent && <div className="mt-3 grid gap-2"><input value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} placeholder="Enter SMS code" className="h-11 rounded-xl border border-(--border-beige) px-4" /><button type="button" onClick={verifyPhoneCode} disabled={busy || !phoneCode.trim()} className="h-10 rounded-xl bg-(--primary-green) text-sm font-bold text-white disabled:opacity-60">Verify phone</button></div>}</div>}
              </div>

              <label className="block text-sm font-bold text-(--secondary-green)">County<input name="county" value={form.county || ''} onChange={updateField} className="mt-2 h-12 w-full rounded-xl border border-(--border-beige) px-4" /></label>

              {message && <p className={`text-sm font-bold ${message.includes('saved') || message.includes('verified') || message.includes('sent') ? 'text-green-700' : 'text-red-600'}`}>{message}</p>}
              <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-(--primary-green) text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save Settings'}</button>
            </form>
          </aside>

          <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 className="text-2xl font-extrabold text-(--secondary-green)">My Listings</h2><p className="mt-1 text-sm text-(--muted-green-text)">Temporarily simplified while the profile page is stabilized.</p></div>
              <Link href="/post-ad" className="rounded-xl bg-(--primary-orange) px-5 py-3 text-center text-sm font-bold text-white">Post new ad</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
