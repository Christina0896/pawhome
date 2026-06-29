'use client';

import { useEffect } from 'react';

function getEditId(url) {
  const match = String(url || '').match(/\/api\/profile\/listings\/(\d+)/);
  return match?.[1] || '';
}

function getAuth(headers) {
  if (!headers) return '';
  if (headers instanceof Headers) return headers.get('Authorization') || headers.get('authorization') || '';
  if (Array.isArray(headers)) return headers.find(([key]) => String(key).toLowerCase() === 'authorization')?.[1] || '';
  return headers.Authorization || headers.authorization || '';
}

export default function ReviewPing() {
  useEffect(() => {
    if (!window.location.pathname.includes('/profile/listings/')) return undefined;

    const baseFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init.method || 'GET').toUpperCase();
      const listingId = getEditId(url);
      const response = await baseFetch(input, init);

      if (listingId && method === 'PATCH' && response.ok) {
        const auth = getAuth(init.headers);

        if (auth) {
          await baseFetch('/api/notify-listing-review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
            body: JSON.stringify({ listingId }),
          }).catch(() => {});
        }
      }

      return response;
    };

    return () => {
      window.fetch = baseFetch;
    };
  }, []);

  return null;
}
