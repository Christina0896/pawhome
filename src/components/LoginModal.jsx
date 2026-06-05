'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LoginModal = ({ onClose }) => {
  const [mode, setMode] = useState('login'); // login | forgot

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [resetEmail, setResetEmail] = useState('');

  const [loginMessage, setLoginMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      setLoginMessage(error.message);
      setLoginLoading(false);
      return;
    }

    setLoginMessage('Login successful. Redirecting...');
    window.location.href = '/post-ad';
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setLoginMessage(error.message);
      setLoginLoading(false);
      return;
    }

    setLoginMessage('Password reset email sent. Check your inbox.');
    setLoginLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-[520px] rounded-xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-7 top-7 text-2xl font-semibold leading-none cursor-pointer text-(--primary-dark-green) hover:text-(--orange)"
        >
          ×
        </button>

        {mode === 'login' && (
          <>
            <div className="mb-8">
              <h2 className="text-[26px]  font-bold text-(--primary-dark-green)">Login</h2>
              <p className="mt-2 text-sm text-(--muted-green-text)">Welcome back to PawHome.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--primary-dark-green)">Email</label>
                <input
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-dark-green)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-(--primary-dark-green)">Password</label>
                <input
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Your password"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-dark-green)"
                />
              </div>

              <div className="flex items-center cursor-pointer justify-end text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setLoginMessage('');
                    setResetEmail(loginForm.email);
                  }}
                  className="font-semibold cursor-pointer text-(--primary-dark-green) hover:text-(--primary-orange)"
                >
                  Forgot password?
                </button>
              </div>

              {loginMessage && (
                <p className="rounded-xl  bg-(--orange) px-4 py-3 text-sm text-(--primary-dark-green)">
                  {loginMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl  bg-(--primary-green) px-5 py-3 font-bold text-white hover:bg-(--secondary-green) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-(--muted-green-text)">
              No account yet?{' '}
              <a href="/register" className="font-semibold text-(--orange) cursor-pointer hover:text-(--orange-hover)">
                Register
              </a>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-(--primary-dark-green)">Reset password</h2>
              <p className="mt-2 text-sm text-(--muted-green-text)">
                Enter your email and we will send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-(--primary-dark-green)">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-dark-green)"
                />
              </div>

              {loginMessage && (
                <p className="rounded-xl bg-(--light-orange) px-4 py-3 text-sm text-(--primary-dark-green)">
                  {loginMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-(--primary-dark-green) px-5 py-3 font-bold text-white hover:bg-[#0A3F21] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? 'Sending...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginMessage('');
                }}
                className="w-full text-sm font-semibold text-(--primary-dark-green) hover:text-(--orange)"
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
