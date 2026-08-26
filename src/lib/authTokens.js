import { supabase } from './supabaseClient';

const AUTH_TIMEOUT_MS = 4000;

function openLoginModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-login-modal'));
  }
}

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), AUTH_TIMEOUT_MS);
    }),
  ]);
}

export async function getVerifiedAccessToken({ openLogin = true } = {}) {
  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), 'Auth session lookup');

    if (session?.access_token) {
      return session.access_token;
    }

    const {
      data: { user },
      error: userError,
    } = await withTimeout(supabase.auth.getUser(), 'Auth user lookup');

    if (userError || !user) {
      if (openLogin) openLoginModal();
      return null;
    }

    const {
      data: { session: refreshedSession },
    } = await withTimeout(supabase.auth.getSession(), 'Auth refreshed session lookup');

    if (!refreshedSession?.access_token) {
      if (openLogin) openLoginModal();
      return null;
    }

    return refreshedSession.access_token;
  } catch (error) {
    console.error('Access token lookup failed:', error);
    if (openLogin) openLoginModal();
    return null;
  }
}

export async function getVerifiedAdminAccessToken({ setAccessDenied } = {}) {
  const token = await getVerifiedAccessToken();

  if (!token && setAccessDenied) {
    setAccessDenied(true);
  }

  return token;
}
