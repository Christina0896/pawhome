'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const RECOVERY_AUTH_KEY = 'pawhome_password_recovery_session';

function markRecoverySession() {
  window.sessionStorage.setItem(RECOVERY_AUTH_KEY, '1');
}

function clearRecoverySession() {
  window.sessionStorage.removeItem(RECOVERY_AUTH_KEY);
}

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    const prepareResetSession = async () => {
      setMessage('');
      setCheckingLink(true);
      setPasswordUpdated(false);

      try {
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (!active) return;

          if (error) {
            clearRecoverySession();
            setMessage('This password reset link is invalid or has expired. Please request a new link.');
            return;
          }

          markRecoverySession();
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!active) return;

          if (error) {
            clearRecoverySession();
            setMessage('This password reset link is invalid or has expired. Please request a new link.');
            return;
          }

          markRecoverySession();
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) markRecoverySession();
      } catch (error) {
        if (active) setMessage('Password reset link could not be verified. Please request a new link.');
      } finally {
        if (active) setCheckingLink(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY') {
        markRecoverySession();
        window.history.replaceState({}, document.title, '/reset-password');
        setMessage('');
        setCheckingLink(false);
        setPasswordUpdated(false);
      }
    });

    prepareResetSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleLeaveReset = async () => {
    setLoading(true);
    clearRecoverySession();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      setMessage('This reset page is missing the secure reset session. Please request a new password reset email and open the newest link.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setMessage('Password could not be updated. Please request a new reset link.');
      return;
    }

    clearRecoverySession();
    await supabase.auth.signOut();

    setLoading(false);
    setPasswordUpdated(true);
    setPassword('');
    setConfirmPassword('');
    setMessage('Password updated successfully. You can now log in with your new password.');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF6EC] px-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h1 className="text-[26px] font-bold text-(--secondary-green)">Reset password</h1>
        <p className="mt-2 text-sm text-(--muted-green-text)">Choose a new password for your PawHome account.</p>

        {checkingLink && (
          <p className="mt-5 rounded-xl bg-[#FFF4EA] px-4 py-3 text-sm font-semibold text-(--secondary-green)">
            Checking reset link...
          </p>
        )}

        {message && (
          <p className="mt-5 rounded-xl bg-[#FFF4EA] px-4 py-3 text-sm font-semibold text-(--secondary-green)">
            {message}
          </p>
        )}

        {!passwordUpdated && (
          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-(--primary-green) px-5 py-3 font-bold text-white transition hover:bg-(--secondary-green) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        {passwordUpdated && (
          <div className="mt-6 space-y-3">
            <Link href="/" className="block w-full rounded-xl bg-(--primary-green) px-5 py-3 text-center font-bold text-white transition hover:bg-(--secondary-green)">
              Go to PawHome and log in
            </Link>
          </div>
        )}

        {!passwordUpdated && (
          <button
            type="button"
            onClick={handleLeaveReset}
            disabled={loading}
            className="mt-6 block w-full text-center text-sm font-bold text-(--primary-orange) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Leave reset page and sign out
          </button>
        )}
      </div>
    </main>
  );
}
