'use client';

import { useEffect } from 'react';

export default function usePageResume(callback) {
  useEffect(() => {
    if (!callback) return;

    const handlePageShow = (event) => {
      // Browser restored page from back/forward cache
      if (event.persisted) {
        callback();
      }
    };

    const handleVisibilityChange = () => {
      // User comes back to this tab/page
      if (document.visibilityState === 'visible') {
        callback();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback]);
}
