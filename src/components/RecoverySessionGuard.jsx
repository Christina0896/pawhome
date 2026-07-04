'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const RECOVERY_AUTH_KEY = 'pawhome_password_recovery_session';
const ACTIVE_RESET_TAB_KEY = 'pawhome_active_password_reset_tab';

function hasRecoveryMarker() {
  return window.localStorage.getItem(RECOVERY_AUTH_KEY) === '1' || window.sessionStorage.getItem(RECOVERY_AUTH_KEY) === '1';
}

function clearRecoveryMarkers() {
  window.localStorage.removeItem(RECOVERY_AUTH_KEY);
  window.sessionStorage.removeItem(RECOVERY_AUTH_KEY);
  window.localStorage.removeItem(ACTIVE_RESET_TAB_KEY);
}

export default function RecoverySessionGuard() {
  useEffect(() => {
    let active = true;

    const protectRecoverySession = async () => {
      if (!hasRecoveryMarker()) return;
      if (window.location.pathname === '/reset-password') return;

      clearRecoveryMarkers();
      await supabase.auth.signOut();

      if (active) {
        window.location.replace('/');
      }
    };

    protectRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
