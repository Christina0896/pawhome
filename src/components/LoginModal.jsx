'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const LoginModal = ({ onClose }) => {
  // Modal mode: login form or password reset form
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

  // UI state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Update login form fields
  const handleLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Login user with Supabase
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      setMessage('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setMessage('Login successful. Redirecting...');
    window.location.href = '/';
  };

  // Send password reset email
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      setMessage('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setMessage('Password reset email sent. Check your inbox.');
    setLoading(false);
  };

  const openForgotPassword = () => {
    setMode('forgot');
    setMessage('');
    setResetEmail(loginForm.email);
  };

  const backToLogin = () => {
    setMode('login');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-7 top-7 cursor-pointer text-2xl font-semibold leading-none text-(--secondary-green) transition hover:text-(--primary-orange)"
          aria-label="Close login modal"
        >
          ×
        </button>

        {mode === 'login' && (
          <>
            {/* Login header */}
            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-(--secondary-green)">Login</h2>

              <p className="mt-2 text-sm text-(--muted-green-text)">Welcome back to PawHome.</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">Email</label>

                <input
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">Password</label>

                <input
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Your password"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
                />
              </div>

              <div className="flex items-center justify-end text-sm">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="cursor-pointer font-semibold text-(--primary-green) transition hover:text-(--primary-orange)"
                >
                  Forgot password?
                </button>
              </div>

              {message && (
                <p className="rounded-xl bg-(--light-orange) px-4 py-3 text-sm text-(--secondary-green)">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-(--primary-green) px-5 py-3 font-bold text-white transition hover:bg-(--secondary-green) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-(--muted-green-text)">
              No account yet?{' '}
              <Link
                href="/register"
                className="cursor-pointer font-semibold text-(--primary-orange) transition hover:text-(--secondary-orange)"
              >
                Register
              </Link>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            {/* Reset header */}
            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-(--secondary-green)">Reset password</h2>

              <p className="mt-2 text-sm text-(--muted-green-text)">
                Enter your email and we will send you a password reset link.
              </p>
            </div>

            {/* Reset form */}
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--secondary-green)">Email</label>

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
                />
              </div>

              {message && (
                <p className="rounded-xl bg-(--light-orange) px-4 py-3 text-sm text-(--secondary-green)">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-(--primary-green) px-5 py-3 font-bold text-white transition hover:bg-(--secondary-green) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="w-full cursor-pointer text-sm font-semibold text-(--primary-green) transition hover:text-(--primary-orange)"
              >
                Back to login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
