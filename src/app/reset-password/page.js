'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage('');

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
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

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage('Password updated successfully. You can now log in.');
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--soft-cream-bg)] px-4 py-16">
      <section className="w-full max-w-[520px] rounded-[24px] border border-[var(--border-beige)] bg-white p-8 shadow-[0_20px_60px_rgba(18,53,36,0.14)]">
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-[var(--deep-text-green)]">Reset password</h1>
          <p className="mt-2 text-sm text-[var(--muted-green-text)]">Enter your new password below.</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--deep-text-green)]">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className="w-full rounded-xl border border-[var(--border-beige)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary-dark-green)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--deep-text-green)]">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="w-full rounded-xl border border-[var(--border-beige)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary-dark-green)]"
            />
          </div>

          {message && (
            <p className="rounded-xl bg-[var(--soft-peach-highlight)] px-4 py-3 text-sm text-[var(--deep-text-green)]">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--primary-dark-green)] px-5 py-3 font-bold text-white hover:bg-[#0A3F21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  );
}
