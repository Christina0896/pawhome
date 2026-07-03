'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/header';
import { getVerifiedAccessToken } from '../../lib/authTokens';
import PostAdPageClient from './PostAdPageClient';

function GateMessage({ title, message, primaryHref = '/profile', primaryLabel = 'Go to Profile', secondaryHref = '/', secondaryLabel = 'Back to Home' }) {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-[760px] items-center justify-center px-6 py-12">
        <section className="w-full rounded-3xl border border-(--border-beige) bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold text-(--secondary-green)">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-(--muted-green-text)">{message}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="rounded-xl bg-(--primary-orange) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-orange)">{primaryLabel}</Link>
            <Link href={secondaryHref} className="rounded-xl border border-(--border-beige) bg-white px-6 py-3 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)">{secondaryLabel}</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PostAdAccessGate() {
  const [status, setStatus] = useState({ loading: true, allowed: false, reason: '' });

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const accessToken = await getVerifiedAccessToken({ openLogin: false });

        if (!active) return;

        if (!accessToken) {
          setStatus({ loading: false, allowed: false, reason: 'not_logged_in' });
          return;
        }

        const response = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json().catch(() => ({}));

        if (!active) return;

        if (!response.ok) {
          setStatus({ loading: false, allowed: false, reason: 'profile_error' });
          return;
        }

        const emailVerified = Boolean(result.user?.email_confirmed_at || result.user?.confirmed_at);

        if (!emailVerified) {
          setStatus({ loading: false, allowed: false, reason: 'email_unverified' });
          return;
        }

        if (!result.profile?.phone_verified) {
          setStatus({ loading: false, allowed: false, reason: 'phone_unverified' });
          return;
        }

        setStatus({ loading: false, allowed: true, reason: '' });
      } catch (error) {
        console.error('Post ad access gate failed:', error);
        if (active) setStatus({ loading: false, allowed: false, reason: 'profile_error' });
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (status.loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-(--secondary-green)">Checking account...</p>
        </main>
      </div>
    );
  }

  if (!status.allowed) {
    if (status.reason === 'not_logged_in') {
      return (
        <GateMessage
          title="Log in to post an ad"
          message="Only logged-in PawHome users can create listings. Please log in or register, then verify your email and phone number."
          primaryHref="/login"
          primaryLabel="Log In"
          secondaryHref="/register"
          secondaryLabel="Register"
        />
      );
    }

    if (status.reason === 'email_unverified') {
      return (
        <GateMessage
          title="Verify your email first"
          message="You need to verify your email address before posting an ad. Check your inbox for the PawHome verification email."
          primaryHref="/profile"
          primaryLabel="Go to Profile"
        />
      );
    }

    if (status.reason === 'phone_unverified') {
      return (
        <GateMessage
          title="Verify your phone first"
          message="You need a verified phone number before posting an ad. This helps prevent fake listings and duplicate accounts."
          primaryHref="/profile"
          primaryLabel="Verify Phone"
        />
      );
    }

    return (
      <GateMessage
        title="Cannot open post form"
        message="Your account could not be checked. Please open your profile and confirm your details before posting an ad."
        primaryHref="/profile"
        primaryLabel="Go to Profile"
      />
    );
  }

  return <PostAdPageClient />;
}
