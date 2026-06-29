'use client';

import { useEffect } from 'react';

function getSelectedListingType() {
  const nativeSelect = document.querySelector('select[name="listing_type"]');

  if (nativeSelect?.value) return nativeSelect.value;

  const labels = [...document.querySelectorAll('label')];
  const adTypeLabel = labels.find((label) => label.textContent?.toLowerCase().includes('ad type'));
  const root = adTypeLabel?.closest('[data-dropdown-root]');
  const buttonText = root?.querySelector('button span')?.textContent?.trim();

  return buttonText || '';
}

function getNegotiableCheckbox() {
  return [...document.querySelectorAll('input[type="checkbox"]')].find((checkbox) => {
    const label = checkbox.closest('label');
    return label?.textContent?.toLowerCase().includes('negotiable');
  });
}

function syncNegotiableUi() {
  const listingType = getSelectedListingType();
  const isAdoption = listingType === 'For Adoption';
  const checkbox = getNegotiableCheckbox();

  if (!checkbox) return;

  const label = checkbox.closest('label');

  if (isAdoption && checkbox.checked) {
    checkbox.click();
  }

  checkbox.disabled = isAdoption;
  checkbox.setAttribute('aria-disabled', isAdoption ? 'true' : 'false');

  if (label) {
    label.style.display = isAdoption ? 'none' : '';
  }
}

function patchAdoptionPrice(body) {
  if (!(body instanceof FormData)) return;

  if (body.get('listing_type') !== 'For Adoption') return;

  body.set('price_negotiable', 'false');
}

export default function AdoptionPriceEnhancer() {
  useEffect(() => {
    const shouldRun = () => {
      const path = window.location.pathname;
      return path.startsWith('/post-ad') || path.includes('/profile/listings/');
    };

    if (!shouldRun()) return undefined;

    syncNegotiableUi();

    const observer = new MutationObserver(syncNegotiableUi);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });

    document.addEventListener('change', syncNegotiableUi, true);
    document.addEventListener('click', () => window.setTimeout(syncNegotiableUi, 0), true);

    const originalFetch = window.fetch;

    window.fetch = (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init.method || 'GET').toUpperCase();
      const isListingWrite =
        url.includes('/api/listings/create') || (url.includes('/api/profile/listings/') && method === 'PATCH');

      if (isListingWrite && init?.body instanceof FormData) {
        patchAdoptionPrice(init.body);
      }

      return originalFetch(input, init);
    };

    return () => {
      observer.disconnect();
      document.removeEventListener('change', syncNegotiableUi, true);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
