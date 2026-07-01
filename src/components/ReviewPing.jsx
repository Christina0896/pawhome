'use client';

import { useEffect, useState } from 'react';
import PostAdFormEnhancer from '../app/post-ad/PostAdFormEnhancer';

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

function getActiveAdminTab() {
  const buttons = [...document.querySelectorAll('button')];
  const activeButton = buttons.find((button) => button.className.includes('bg-(--primary-green)') && button.textContent?.trim());
  return activeButton?.textContent?.trim().toLowerCase() || '';
}

function syncAdminActions() {
  if (window.location.pathname !== '/admin') return;

  const activeTab = getActiveAdminTab();
  const rejectButtons = [...document.querySelectorAll('button')].filter((button) => button.textContent?.trim() === 'Reject');

  rejectButtons.forEach((button) => {
    button.style.display = activeTab === 'approved' ? 'none' : '';
  });
}

function syncProfilePreviewLinks() {
  if (window.location.pathname !== '/profile') return;

  const viewLinks = [...document.querySelectorAll('a[href^="/listings/"]')].filter((link) => {
    const text = link.textContent?.trim().toLowerCase();
    return text === 'view' || text === 'preview';
  });

  viewLinks.forEach((link) => {
    const card = link.closest('.flex.h-full') || link.closest('div');
    const statusText = card?.querySelector('span')?.textContent?.trim().toLowerCase() || '';
    const match = link.getAttribute('href')?.match(/\/listings\/(\d+)/);
    const listingId = match?.[1];

    if (!listingId) return;

    if (statusText && statusText !== 'approved') {
      link.setAttribute('href', `/listings/${listingId}?ownerPreview=true`);
      link.textContent = 'Preview';
    } else {
      link.setAttribute('href', `/listings/${listingId}`);
      link.textContent = 'View';
    }
  });
}

export default function ReviewPing() {
  const [isPostAdPage, setIsPostAdPage] = useState(false);

  useEffect(() => {
    setIsPostAdPage(window.location.pathname.startsWith('/post-ad'));
  }, []);

  useEffect(() => {
    if (window.location.pathname !== '/profile') return undefined;

    syncProfilePreviewLinks();

    const observer = new MutationObserver(syncProfilePreviewLinks);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const shouldRun =
      window.location.pathname.includes('/profile/listings/') || window.location.pathname === '/admin';

    if (!shouldRun) return undefined;

    syncAdminActions();

    const observer = new MutationObserver(syncAdminActions);
    observer.observe(document.body, { childList: true, subtree: true });

    const syncAfterClick = () => window.setTimeout(syncAdminActions, 0);
    document.addEventListener('click', syncAfterClick, true);

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
      document.removeEventListener('click', syncAfterClick, true);
      window.fetch = baseFetch;
    };
  }, []);

  return isPostAdPage ? <PostAdFormEnhancer /> : null;
}
