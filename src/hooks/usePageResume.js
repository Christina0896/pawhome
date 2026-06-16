'use client';

import { useEffect } from 'react';

export default function usePageResume(callback) {
  useEffect(() => {
    if (!callback) return;

    const run = () => {
      setTimeout(() => {
        callback();
      }, 0);
    };

    const handlePageShow = () => run();
    const handlePopState = () => run();
    const handleFocus = () => run();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        run();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback]);
}
