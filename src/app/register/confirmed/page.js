'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';
import { supabase } from '../../../lib/supabaseClient';

export default function RegisterConfirmedPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setSignedIn(Boolean(session));
      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  const openLogin = () => {
    window.dispatchEvent(new Event('open-login-modal'));
  };

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto flex min-h-[70vh] max-w-[900px] items-center justify-center px-6 py-12">
        <section className="w-full rounded-3xl border border-(--border-beige) bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <span className="text-4xl text-green-700">✓</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-(--secondary-green)">Email verified successfully</h1>

          <p className="mx-auto mt-4 max-w-[620px] text-sm leading-7 text-(--muted-green-text)">
            Your email address is confirmed. The next step is to log in, save your phone number, and verify it through an
            automated call before posting an ad.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {checkingSession ? (
              <span className="rounded-full bg-(--background) px-7 py-3 text-sm font-bold text-(--secondary-green)">
                Checking your account...
              </span>
            ) : signedIn ? (
              <Link
                href="/profile"
                className="rounded-full bg-(--primary-green) px-7 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-green)"
              >
                Continue to profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="rounded-full bg-(--primary-green) px-7 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-green)"
              >
                Log in
              </button>
            )}

            <Link
              href="/"
              className="rounded-full border border-(--border-beige) bg-white px-7 py-3 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
