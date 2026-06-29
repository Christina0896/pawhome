'use client';

import { useEffect } from 'react';

const AGE_UNITS = ['days', 'weeks', 'months', 'years'];

function parseAge(value) {
  const text = String(value || '').trim().toLowerCase();
  const match = text.match(/^(\d{1,3})(?:\s+)?(day|days|week|weeks|month|months|year|years)?$/);

  if (!match) {
    return {
      value: text.replace(/\D/g, '').slice(0, 3),
      unit: 'weeks',
    };
  }

  const valuePart = match[1] || '';
  const unitPart = match[2] || 'weeks';
  const pluralUnit = unitPart.endsWith('s') ? unitPart : `${unitPart}s`;

  return {
    value: valuePart,
    unit: AGE_UNITS.includes(pluralUnit) ? pluralUnit : 'weeks',
  };
}

function buildAgeLabel(value, unit) {
  const cleanValue = String(value || '').replace(/\D/g, '').slice(0, 3);
  const cleanUnit = AGE_UNITS.includes(unit) ? unit : 'weeks';

  if (!cleanValue) return '';

  const number = Number(cleanValue);
  const labelUnit = number === 1 ? cleanUnit.replace(/s$/, '') : cleanUnit;

  return `${number} ${labelUnit}`;
}

function dispatchReactInput(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');

  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function enhanceAgeInput(input) {
  if (!input || input.dataset.ageEnhanced === 'true') return;

  const parsed = parseAge(input.value);
  input.dataset.ageEnhanced = 'true';
  input.type = 'text';
  input.inputMode = 'numeric';
  input.pattern = '[0-9]*';
  input.placeholder = '8';
  input.autocomplete = 'off';

  const wrapper = document.createElement('div');
  wrapper.className = `flex h-[45px] w-full items-center overflow-hidden rounded-xl border bg-white text-sm text-(--secondary-green) transition ${
    input.className.includes('border-red-400') ? 'border-red-400' : 'border-(--border-beige) focus-within:border-(--primary-green)'
  }`;

  const originalClassName = input.className;
  input.className = 'h-full min-w-0 flex-1 border-0 bg-white px-4 text-sm text-(--secondary-green) outline-none ring-0 placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0';

  const select = document.createElement('select');
  select.dataset.ageUnitSelect = 'true';
  select.name = 'age_unit_visual';
  select.className = 'h-full shrink-0 border-l border-(--border-beige) bg-white px-3 text-xs font-bold text-(--secondary-green) outline-none';

  AGE_UNITS.forEach((unit) => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit;
    select.appendChild(option);
  });

  select.value = parsed.unit;

  const parent = input.parentElement;

  if (!parent) return;

  parent.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(select);

  dispatchReactInput(input, parsed.value);

  input.addEventListener('input', () => {
    const numericValue = input.value.replace(/\D/g, '').slice(0, 3);

    if (input.value !== numericValue) {
      dispatchReactInput(input, numericValue);
    }
  });

  input.addEventListener('blur', () => {
    input.className = originalClassName.includes('border-red-400')
      ? input.className
      : 'h-full min-w-0 flex-1 border-0 bg-white px-4 text-sm text-(--secondary-green) outline-none ring-0 placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0';
  });
}

function getCurrentAgePayload() {
  const input = document.querySelector('input[name="age"][data-age-enhanced="true"]');
  const select = document.querySelector('select[data-age-unit-select="true"]');

  if (!input) return null;

  const value = input.value.replace(/\D/g, '').slice(0, 3);
  const unit = select?.value || 'weeks';
  const label = buildAgeLabel(value, unit);

  return {
    value,
    unit,
    label,
  };
}

function patchFormDataAge(body) {
  if (!(body instanceof FormData)) return;

  const payload = getCurrentAgePayload();

  if (!payload?.label) return;

  body.set('age', payload.label);
  body.set('age_value', payload.value);
  body.set('age_unit', payload.unit);
}

export default function AgeInputEnhancer() {
  useEffect(() => {
    const enhanceAll = () => {
      const path = window.location.pathname;

      if (!path.startsWith('/post-ad') && !path.includes('/profile/listings/')) return;

      document.querySelectorAll('input[name="age"]').forEach((input) => enhanceAgeInput(input));
    };

    enhanceAll();

    const observer = new MutationObserver(enhanceAll);
    observer.observe(document.body, { childList: true, subtree: true });

    const originalFetch = window.fetch;

    window.fetch = (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const isListingWrite =
        url.includes('/api/listings/create') ||
        (url.includes('/api/profile/listings/') && String(init.method || '').toUpperCase() === 'PATCH');

      if (isListingWrite && init?.body instanceof FormData) {
        patchFormDataAge(init.body);
      }

      return originalFetch(input, init);
    };

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
