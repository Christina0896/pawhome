'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { getVerifiedAccessToken } from '../../lib/authTokens';

async function fetchJson(url, options = {}, timeoutMs = 12000) {
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

function getSavedPhone(profile) {
  return [profile?.phone_code, profile?.phone_number].filter(Boolean).join(' ').trim();
}

export default function VerifyPhonePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const token = await getVerifiedAccessToken();
        if (!token) throw new Error('Please log in to verify your phone number.');

        const { response, data } = await fetchJson('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(data.error || 'Could not load your profile.');
        if (active) setProfile(data.profile || null);
      } catch (error) {
        if (active) setMessage(error.message || 'Could not load your profile.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const phoneVerified = Boolean(profile?.phone_verified);
  const savedPhone = getSavedPhone(profile);

  const startVerificationCall = async () => {
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
        setProfile((current) => ({ ...(current || {}), phone_verified: true }));
        setMessage('Your phone number is already verified.');
        return;
      }

      setCallStarted(true);
      setMessage(`An automated call is being placed to ${data.phone || 'your saved phone number'}.`);
    } catch (error) {
      setMessage(error.message || 'Could not start the verification call.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
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
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) throw new Error(data.error || 'Could not verify the code.');

      if (data.profile) {
        setProfile(data.profile);
      } else {
        setProfile((current) => ({ ...(current || {}), phone_verified: true }));
      }
      setCallStarted(false);
      setCode('');
      setMessage('Phone number verified. You can now post ads.');
    } catch (error) {
      setMessage(error.message || 'Could not verify the code.');
    } finally {
      setBusy(false);
    }
  };

  const successMessage =
    phoneVerified ||
    message.toLowerCase().includes('being placed') ||
    message.toLowerCase().includes('already verified');

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto flex min-h-[70vh] max-w-[760px] items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-(--border-beige) bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-(--primary-orange)">
            Voice verification test
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-(--secondary-green)">Verify your phone by automated call</h1>
          <p className="mt-4 text-sm leading-6 text-(--muted-green-text)">
            Vonage will call your saved phone number and read a four-digit code. This test does not send an SMS and no
            PawHome staff member will call you.
          </p>

          {loading ? (
            <p className="mt-7 rounded-2xl bg-(--background) px-5 py-4 text-sm font-bold text-(--secondary-green)">
              Loading your profile...
            </p>
          ) : (
            <>
              <div className="mt-7 rounded-2xl bg-(--background) p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-(--muted-green-text)">Saved phone</p>
                <p className="mt-2 text-lg font-extrabold text-(--secondary-green)">{savedPhone || 'No phone saved'}</p>
                {!savedPhone && (
                  <Link href="/profile" className="mt-3 inline-flex text-sm font-bold text-(--primary-orange) hover:underline">
                    Save a phone number in your profile
                  </Link>
                )}
              </div>

              {phoneVerified ? (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <h2 className="text-lg font-extrabold text-green-800">Phone verified</h2>
                  <p className="mt-2 text-sm text-green-700">This account can continue to the ad form.</p>
                  <Link
                    href="/post-ad"
                    className="mt-5 inline-flex rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white"
                  >
                    Post an ad
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startVerificationCall}
                    disabled={busy || !savedPhone}
                    className="mt-6 h-12 w-full rounded-xl bg-(--primary-orange) px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Please wait...' : callStarted ? 'Call me again' : 'Call me with a verification code'}
                  </button>

                  <p className="mt-3 text-xs leading-5 text-(--muted-green-text)">
                    Answer the incoming call even if it appears as an unknown or international number. A new call can be
                    requested after one minute, with a maximum of five calls per day.
                  </p>

                  <form onSubmit={verifyCode} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter the code from the call"
                      className="h-12 rounded-xl border border-(--border-beige) px-4 text-sm outline-none focus:border-(--primary-green)"
                    />
                    <button
                      type="submit"
                      disabled={busy || !code.trim()}
                      className="h-12 rounded-xl bg-(--primary-green) px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify code
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          {message && (
            <p
              className={`mt-6 rounded-2xl px-5 py-4 text-sm font-bold ${successMessage ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'}`}
            >
              {message}
            </p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
