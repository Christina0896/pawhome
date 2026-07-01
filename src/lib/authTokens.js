import { supabase } from './supabaseClient';

function openLoginModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-login-modal'));
  }
}

export async function getVerifiedAccessToken({ openLogin = true } = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (openLogin) openLoginModal();
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (openLogin) openLoginModal();
    return null;
  }

  return session.access_token;
}

export async function getVerifiedAdminAccessToken({ setAccessDenied } = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    openLoginModal();
    return null;
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminData) {
    if (setAccessDenied) setAccessDenied(true);
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    openLoginModal();
    return null;
  }

  return session.access_token;
}
