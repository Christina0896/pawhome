'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
const RECOVERY_AUTH_KEY = 'pawhome_password_recovery_session';

function isPasswordRecoveryActive() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(RECOVERY_AUTH_KEY) === '1';
}

function markPasswordRecoveryActive() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(RECOVERY_AUTH_KEY, '1');
}

function clearPasswordRecoveryActive() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(RECOVERY_AUTH_KEY);
}

function keepRecoveryOnResetPage() {
  if (typeof window === 'undefined') return;
  if (!isPasswordRecoveryActive()) return;

  const currentPath = window.location.pathname;
  if (currentPath === '/reset-password') return;

  window.location.replace('/reset-password?recovery=1');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (isPasswordRecoveryActive()) {
      keepRecoveryOnResetPage();
      setSession(null);
      setUser(null);
      setAuthLoading(false);
      return null;
    }

    setSession(session || null);
    setUser(session?.user || null);
    setAuthLoading(false);

    return session?.user || null;
  }, []);

  const signOut = useCallback(async () => {
    clearPasswordRecoveryActive();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (isPasswordRecoveryActive()) {
        keepRecoveryOnResetPage();
        setSession(null);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setSession(session || null);
      setUser(session?.user || null);
      setAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearPasswordRecoveryActive();
      }

      if (event === 'PASSWORD_RECOVERY') {
        markPasswordRecoveryActive();
        keepRecoveryOnResetPage();
        setSession(null);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      if (isPasswordRecoveryActive()) {
        keepRecoveryOnResetPage();
        setSession(null);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setSession(session || null);
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      authLoading,
      isAuthenticated: Boolean(user),
      refreshAuth,
      signOut,
    }),
    [user, session, authLoading, refreshAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
