'use client';

import { useEffect } from 'react';

function getListingIdFromEditUrl(url) {
  const match = String(url || '').match(/\/api\/profile\/listings\/(\d+)/);
  return match?.[1] || '';
}

function getAuthorizationHeader(headers) {
  if (!headers) return '';

  if (headers instanceof Headers) {
    return headers.get('Authorization') || headers.get('authorization') || '';
  }

  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => String(key).toLowerCase() === 'authorization');
    return entry?.[1] || '';
  }

  return headers.Authorization || headers.authorization || '';
}

export default function ListingReviewNotificationEnhancer() {
  useEffect(() => {
    const shouldRun = () => window.location.pathname.includes('/profile/listings/');

    if (!shouldRun()) return undefined;

    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init.method || 'GET').toUpperCase();
      const listingId = getListingIdFromEditUrl(url);
      const isListingEdit = Boolean(listingId) && method === 'PATCH';

      const response = await originalFetch(input, init);

      if (isListingEdit && response.ok) {
        const authorization = getAuthorizationHeader(init.headers);

        if (authorization) {
          try {
            await originalFetch('/api/notify-listing-review', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: authorization,
              },
              body: JSON.stringify({ listingId }),
            });
          } catch (error) {
            console.warn('Listing review notification failed:', error);
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
