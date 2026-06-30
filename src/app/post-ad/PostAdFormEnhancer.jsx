'use client';

import { useEffect } from 'react';

const AGE_UNITS = ['days', 'weeks', 'months', 'years'];
const MIXED_LITTER_FIELDS = [
  ['litter_size', 'Litter Size', '1'],
  ['available_litter_count', 'Available', '1'],
  ['male_count', 'Number of Boys', '0'],
  ['female_count', 'Number of Girls', '0'],
  ['date_of_birth', 'Date of Birth', ''],
  ['ready_to_leave', 'Ready to Leave', ''],
];

function getField(name) {
  return document.querySelector(`[name="${name}"]`);
}

function getLabel(labelText) {
  return [...document.querySelectorAll('label')].find((item) =>
    item.textContent?.replace('*', '').trim().toLowerCase() === labelText.toLowerCase(),
  );
}

function getFieldByLabel(labelText) {
  const label = getLabel(labelText);

  return label?.closest('div')?.querySelector('input, select, textarea') || null;
}

function getSelectText(labelText) {
  const label = [...document.querySelectorAll('label')].find((item) =>
    item.textContent?.toLowerCase().includes(labelText.toLowerCase()),
  );
  const root = label?.closest('.data-dropdown-root') || label?.parentElement?.parentElement;
  return root?.querySelector('button span')?.textContent?.trim() || '';
}

function isAdoption() {
  return getSelectText('ad type') === 'For Adoption';
}

function isMixedLitter() {
  return getSelectText('sex') === 'Mixed Litter';
}

function isDogSelected() {
  return getSelectText('animal type') === 'Dogs';
}

function cleanNumber(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 3);
}

function cleanAgeUnit(value) {
  return AGE_UNITS.includes(value) ? value : 'weeks';
}

function buildAgeLabel(value, unit) {
  const numberText = cleanNumber(value);
  const cleanUnit = cleanAgeUnit(unit);

  if (!numberText) return '';

  const number = Number(numberText);
  const labelUnit = number === 1 ? cleanUnit.replace(/s$/, '') : cleanUnit;

  return `${numberText} ${labelUnit}`;
}

function parseAge(value) {
  const text = String(value || '').trim().toLowerCase();
  const match = text.match(/^(\d{1,3})(?:\s+)?(day|days|week|weeks|month|months|year|years)?$/);

  if (!match) return { value: cleanNumber(text), unit: 'weeks' };

  const unit = match[2] || 'weeks';
  const pluralUnit = unit.endsWith('s') ? unit : `${unit}s`;

  return {
    value: cleanNumber(match[1]),
    unit: cleanAgeUnit(pluralUnit),
  };
}

function setReactInputValue(input, value) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function enhanceAgeField() {
  const input = getField('age');

  if (!input || input.dataset.postAdAgeEnhanced === 'true') return Boolean(input);

  input.dataset.postAdAgeEnhanced = 'true';

  const parsed = parseAge(input.value);
  const originalClassName = input.className;

  input.type = 'text';
  input.inputMode = 'numeric';
  input.pattern = '[0-9]*';
  input.placeholder = '8';
  input.autocomplete = 'off';
  input.className = 'h-full min-w-0 flex-1 border-0 bg-white px-4 text-sm text-(--secondary-green) outline-none ring-0 placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0';

  const wrapper = document.createElement('div');
  wrapper.className = `flex h-[45px] w-full items-center overflow-hidden rounded-xl border bg-white text-sm text-(--secondary-green) transition ${
    originalClassName.includes('border-red-400') ? 'border-red-400' : 'border-(--border-beige) focus-within:border-(--primary-green)'
  }`;

  const select = document.createElement('select');
  select.name = 'age_unit_visual';
  select.dataset.postAdAgeUnit = 'true';
  select.className = 'h-full shrink-0 border-l border-(--border-beige) bg-white px-3 text-xs font-bold text-(--secondary-green) outline-none';

  AGE_UNITS.forEach((unit) => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit;
    select.appendChild(option);
  });

  select.value = parsed.unit;

  input.parentElement?.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(select);

  setReactInputValue(input, parsed.value);

  input.addEventListener('input', () => {
    const nextValue = cleanNumber(input.value);
    if (input.value !== nextValue) setReactInputValue(input, nextValue);
  });

  return true;
}

function syncAdoptionPrice() {
  const priceInput = getField('price');
  const adoptionSelected = isAdoption();
  const negotiableInput = [...document.querySelectorAll('input[type="checkbox"]')].find((checkbox) =>
    checkbox.closest('label')?.textContent?.toLowerCase().includes('negotiable'),
  );
  const negotiableLabel = negotiableInput?.closest('label');

  if (priceInput) {
    priceInput.required = !adoptionSelected;
  }

  if (negotiableInput) {
    if (adoptionSelected && negotiableInput.checked) negotiableInput.click();
    negotiableInput.disabled = adoptionSelected;
  }

  if (negotiableLabel) {
    negotiableLabel.style.display = adoptionSelected ? 'none' : '';
  }
}

function syncKennelClubField() {
  const label = getLabel('IKC / KC Registered');
  const root = label?.closest('.data-dropdown-root') || label?.closest('.relative') || label?.parentElement;

  if (!root) return;

  const showForDogs = isDogSelected();
  root.style.display = showForDogs ? '' : 'none';
  root.setAttribute('aria-hidden', showForDogs ? 'false' : 'true');
}

function syncRequiredStar(label, required) {
  if (!label) return;

  const existingStar = label.querySelector('[data-required-star="true"]');

  if (required && !existingStar) {
    const star = document.createElement('span');
    star.dataset.requiredStar = 'true';
    star.className = 'text-(--primary-orange)';
    star.textContent = ' *';
    label.appendChild(star);
  }

  if (!required && existingStar) {
    existingStar.remove();
  }
}

function syncMixedLitterFields() {
  const required = isMixedLitter();

  MIXED_LITTER_FIELDS.forEach(([name, labelText, min]) => {
    const field = getField(name) || getFieldByLabel(labelText);
    const label = getLabel(labelText);

    if (!field) return;

    field.required = required;
    field.setAttribute('aria-required', required ? 'true' : 'false');

    if (min !== '' && field.type === 'number') {
      field.min = min;
    }

    syncRequiredStar(label, required);
  });
}

function syncForm() {
  enhanceAgeField();
  syncAdoptionPrice();
  syncKennelClubField();
  syncMixedLitterFields();
}

function patchSubmitData(body) {
  if (!(body instanceof FormData)) return;

  const ageInput = document.querySelector('input[name="age"][data-post-ad-age-enhanced="true"]');
  const ageUnit = document.querySelector('select[data-post-ad-age-unit="true"]')?.value || 'weeks';
  const ageLabel = buildAgeLabel(ageInput?.value, ageUnit);

  if (ageLabel) {
    body.set('age', ageLabel);
    body.set('age_value', cleanNumber(ageInput?.value));
    body.set('age_unit', cleanAgeUnit(ageUnit));
  }

  if (body.get('listing_type') === 'For Adoption') {
    body.set('price_negotiable', 'false');
  }

  if (body.get('animal_type') !== 'Dogs') {
    body.set('kc_registered', '');
    body.set('kennel_club_registered', '');
  }
}

function getSubmitButtons() {
  return [...document.querySelectorAll('button[type="submit"], button')].filter((button) =>
    button.textContent?.toLowerCase().includes('submit') || button.textContent?.toLowerCase().includes('post'),
  );
}

function setSubmittingState(isSubmitting) {
  getSubmitButtons().forEach((button) => {
    if (isSubmitting) {
      button.dataset.originalText = button.dataset.originalText || button.textContent || '';
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('opacity-60', 'cursor-not-allowed');
      button.textContent = 'Submitting...';
    } else {
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      button.classList.remove('opacity-60', 'cursor-not-allowed');

      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  });
}

export default function PostAdFormEnhancer() {
  useEffect(() => {
    let tries = 0;
    let createRequestInFlight = false;
    const interval = window.setInterval(() => {
      tries += 1;
      syncForm();

      if (tries > 40) window.clearInterval(interval);
    }, 250);

    document.addEventListener('click', syncForm, true);
    document.addEventListener('change', syncForm, true);

    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const isCreateListing = url.includes('/api/listings/create') && init?.body instanceof FormData;

      if (!isCreateListing) {
        return originalFetch(input, init);
      }

      if (createRequestInFlight) {
        return Response.json({ error: 'Your ad is already being submitted. Please wait.' }, { status: 409 });
      }

      createRequestInFlight = true;
      setSubmittingState(true);
      patchSubmitData(init.body);

      try {
        return await originalFetch(input, init);
      } finally {
        createRequestInFlight = false;
        setSubmittingState(false);
      }
    };

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('click', syncForm, true);
      document.removeEventListener('change', syncForm, true);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
