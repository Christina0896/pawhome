'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  if (card) card.remove();
}

function getActiveAdminTab() {
  const buttons = [...document.querySelectorAll('button')];
  const activeButton = buttons.find(
    (button) => button.className.includes('bg-(--primary-green)') && button.textContent?.trim(),
  );
  return activeButton?.textContent?.trim().toLowerCase() || '';
}

function syncAdminActions() {
  if (window.location.pathname !== '/admin') return;

  const activeTab = getActiveAdminTab();
  const rejectButtons = [...document.querySelectorAll('button')].filter(
    (button) => button.textContent?.trim() === 'Reject',
  );

  rejectButtons.forEach((button) => {
    button.style.display = activeTab === 'approved' ? 'none' : '';
  });
}

function findEditLitterSection() {
  const heading = [...document.querySelectorAll('h2')].find((item) => item.textContent?.includes('Litter Information'));
  return heading?.closest('section') || null;
}

function syncEditLitterSection() {
  if (!window.location.pathname.match(/^\/profile\/listings\/[^/]+\/edit$/)) return;

  const sexSelect = document.querySelector('select[name="sex"]');
  const litterSection = findEditLitterSection();

  if (!sexSelect || !litterSection) return;

  litterSection.style.display = sexSelect.value === 'Mixed Litter' ? '' : 'none';
}

export default function ReviewPing() {
  const pathname = usePathname() || '';

  useEffect(() => {
    const shouldRun = pathname.includes('/profile/listings/') || pathname === '/admin';
    if (!shouldRun) return undefined;

    const syncPage = () => {
      syncAdminActions();
      syncEditLitterSection();
    };

    syncPage();

    const observer = new MutationObserver(syncPage);
    observer.observe(document.body, { childList: true, subtree: true });

    const syncAfterInteraction = () => window.setTimeout(syncPage, 0);
    document.addEventListener('click', syncAfterInteraction, true);
    document.addEventListener('change', syncAfterInteraction, true);

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
      observer.disconnect();
      document.removeEventListener('click', syncAfterInteraction, true);
      document.removeEventListener('change', syncAfterInteraction, true);
      window.fetch = baseFetch;
    };
  }, [pathname]);

  return null;
}
