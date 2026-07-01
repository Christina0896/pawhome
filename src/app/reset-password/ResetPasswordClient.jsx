'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const prepareResetSession = async () => {
      setMessage('');

      try {
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setMessage('Something went wrong. Please try again.');
            return;
          }

          setSessionReady(true);
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

          if (error) {
            setMessage('Something went wrong. Please try again.');
            return;
          }

          window.history.replaceState({}, document.title, '/reset-password');
          setSessionReady(true);
          return;
        }

        setMessage('Password reset link is invalid or has expired.');
      } catch (error) {
        setMessage('Password reset link could not be verified.');
      }
    };

    prepareResetSession();
  }, [searchParams]);

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

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage('Something went wrong. Please try again.');
      return;
    }

    setMessage('Password updated successfully. You can now log in.');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF6EC] px-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <h1 className="text-[26px] font-bold text-(--secondary-green)">Reset password</h1>

        <p className="mt-2 text-sm text-(--muted-green-text)">Enter your new password below.</p>

        {message && (
          <p className="mt-5 rounded-xl bg-[#FFF4EA] px-4 py-3 text-sm font-semibold text-(--secondary-green)">
            {message}
          </p>
        )}

        {sessionReady && (
          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">New password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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

        <Link href="/" className="mt-6 block text-center text-sm font-bold text-(--primary-orange)">
          Back to PawHome
        </Link>
      </div>
    </main>
  );
}
