'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

const RECOVERY_AUTH_KEY = 'pawhome_password_recovery_session';
const RESET_CHANNEL_NAME = 'pawhome_password_reset';
const ACTIVE_RESET_TAB_KEY = 'pawhome_active_password_reset_tab';

function markRecoverySession() {
  window.sessionStorage.setItem(RECOVERY_AUTH_KEY, '1');
}

function clearRecoverySession() {
  window.sessionStorage.removeItem(RECOVERY_AUTH_KEY);
}

function createTabId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random()}`;
}

function getActiveResetTabId() {
  try {
    const stored = window.localStorage.getItem(ACTIVE_RESET_TAB_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed?.tabId || null;
  } catch {
    return null;
  }
}

function setActiveResetTabId(tabId) {
  window.localStorage.setItem(
    ACTIVE_RESET_TAB_KEY,
    JSON.stringify({
      tabId,
      updatedAt: Date.now(),
    }),
  );
}

function clearActiveResetTabId() {
  window.localStorage.removeItem(ACTIVE_RESET_TAB_KEY);
}

function isCurrentPageAResetLink(searchParams) {
  if (searchParams.get('code')) return true;

  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  return hashParams.get('type') === 'recovery' && hashParams.get('access_token') && hashParams.get('refresh_token');
}

function getPasswordUpdateMessage(error) {
  const rawMessage = error?.message || '';
  const message = rawMessage.toLowerCase();

  if (message.includes('same') || message.includes('different')) {
    return 'New password must be different from your current password.';
  }

  if (message.includes('weak') || message.includes('password')) {
    return rawMessage || 'Password does not meet the security requirements.';
  }

  if (message.includes('session') || message.includes('jwt') || message.includes('expired') || message.includes('invalid')) {
    return 'This reset link is no longer valid. Please request a new password reset email and open the newest link.';
  }

  return rawMessage || 'Password could not be updated. Please request a new reset link.';
}

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const tabIdRef = useRef(createTabId());
  const resetChannelRef = useRef(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [inactiveDuplicateTab, setInactiveDuplicateTab] = useState(false);

  const deactivateThisTab = () => {
    markRecoverySession();
    setInactiveDuplicateTab(true);
    setPassword('');
    setConfirmPassword('');
    setCheckingLink(false);
    setMessage('A newer password reset link was opened in another tab. Continue there.');
  };

  const activateThisResetTab = () => {
    markRecoverySession();
    setActiveResetTabId(tabIdRef.current);
    setInactiveDuplicateTab(false);
    resetChannelRef.current?.postMessage({ type: 'active-reset-tab', tabId: tabIdRef.current });
  };

  const checkIfThisTabIsInactive = () => {
    if (isCurrentPageAResetLink(searchParams)) {
      return false;
    }

    const activeTabId = getActiveResetTabId();

    if (activeTabId && activeTabId !== tabIdRef.current) {
      deactivateThisTab();
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;

    const channel = new BroadcastChannel(RESET_CHANNEL_NAME);
    resetChannelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type !== 'active-reset-tab') return;
      if (event.data?.tabId === tabIdRef.current) return;
      if (isCurrentPageAResetLink(searchParams)) return;

      deactivateThisTab();
    };

    return () => {
      channel.close();
      resetChannelRef.current = null;
    };
  }, [searchParams]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== ACTIVE_RESET_TAB_KEY) return;
      checkIfThisTabIsInactive();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkIfThisTabIsInactive();
    };

    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(checkIfThisTabIsInactive, 1500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const prepareResetSession = async () => {
      setMessage('');
      setCheckingLink(true);
      setPasswordUpdated(false);

      if (isCurrentPageAResetLink(searchParams)) {
        setInactiveDuplicateTab(false);
        setActiveResetTabId(tabIdRef.current);
      }

      try {
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (!active) return;

          if (error) {
            clearRecoverySession();
            console.error('Password reset code exchange failed:', error);
            setMessage('This password reset link is invalid or has expired. Please request a new link.');
            return;
          }

          activateThisResetTab();
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
            console.error('Password reset session setup failed:', error);
            setMessage('This password reset link is invalid or has expired. Please request a new link.');
            return;
          }

          activateThisResetTab();
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          markRecoverySession();
          checkIfThisTabIsInactive();
        }
      } catch (error) {
        console.error('Password reset link verification failed:', error);
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
        activateThisResetTab();
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
    clearActiveResetTabId();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (inactiveDuplicateTab || checkIfThisTabIsInactive()) {
      setMessage('A newer password reset link was opened in another tab. Continue there.');
      return;
    }

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
      console.error('Password update failed:', error);
      setLoading(false);
      setMessage(getPasswordUpdateMessage(error));
      return;
    }

    clearRecoverySession();
    clearActiveResetTabId();
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

        {!passwordUpdated && !inactiveDuplicateTab && (
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
