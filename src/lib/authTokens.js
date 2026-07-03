import { supabase } from './supabaseClient';

function openLoginModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-login-modal'));
  }
}

export async function getVerifiedAccessToken({ openLogin = true } = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return session.access_token;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (openLogin) openLoginModal();
    return null;
  }

  const {
    data: { session: refreshedSession },
  } = await supabase.auth.getSession();

  if (!refreshedSession?.access_token) {
    if (openLogin) openLoginModal();
    return null;
  }

  return refreshedSession.access_token;
}

export async function getVerifiedAdminAccessToken({ setAccessDenied } = {}) {
  const token = await getVerifiedAccessToken();

  if (!token && setAccessDenied) {
    setAccessDenied(true);
  }

  return token;
}
