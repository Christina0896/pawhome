'use client';

import { useEffect } from 'react';

function getEditId(url) {
  const match = String(url || '').match(/\/api\/profile\/listings\/(\d+)/);
  return match?.[1] || '';
}

function getAdminListingId(url) {
  const match = String(url || '').match(/\/api\/admin\/listings\/(\d+)/);
  return match?.[1] || '';
}

function getAuth(headers) {
  if (!headers) return '';
  if (headers instanceof Headers) return headers.get('Authorization') || headers.get('authorization') || '';
  if (Array.isArray(headers)) return headers.find(([key]) => String(key).toLowerCase() === 'authorization')?.[1] || '';
  return headers.Authorization || headers.authorization || '';
}

function removeAdminCard(listingId) {
  if (!listingId || window.location.pathname !== '/admin') return;

  const previewLink = document.querySelector(`a[href="/listings/${listingId}?adminPreview=true"]`);
  const card = previewLink?.closest('article');

  if (card) {
    card.remove();
  }
}

export default function ReviewPing() {
  useEffect(() => {
    const shouldRun =
      window.location.pathname.includes('/profile/listings/') || window.location.pathname === '/admin';

    if (!shouldRun) return undefined;

    const baseFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init.method || 'GET').toUpperCase();
      const listingId = getEditId(url);
      const adminListingId = getAdminListingId(url);
      const response = await baseFetch(input, init);

      if (adminListingId && (method === 'PATCH' || method === 'DELETE') && response.ok) {
        removeAdminCard(adminListingId);
      }

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
