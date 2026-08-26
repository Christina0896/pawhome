export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const IMAGE_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_LISTING_TYPES = ['For Sale', 'For Stud', 'For Adoption'];
export const ALLOWED_ANIMAL_TYPES = ['Dogs', 'Cats', 'Other Pets'];
export const ALLOWED_SEXES = ['Male', 'Female', 'Mixed Litter'];
export const ALLOWED_YES_NO = ['Yes', 'No'];
export const ALLOWED_SELLER_TYPES = ['Private Seller', 'Registered Breeder', 'Shelter / Rescue'];
export const ALLOWED_AGE_UNITS = ['days', 'weeks', 'months', 'years'];

const DAY_MS = 24 * 60 * 60 * 1000;

export function cleanText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function cleanPhone(value) {
  return String(value || '')
    .replace(/[^\d+\s()-]/g, '')
    .trim()
    .slice(0, 30);
}

export function cleanNullableText(value, maxLength = 120) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

export function cleanBoolean(value) {
  return String(value) === 'true';
}

export function normalizeAgeUnit(value) {
  const unit = cleanText(value, 20).toLowerCase();

  if (ALLOWED_AGE_UNITS.includes(unit)) return unit;

  return '';
}

export function buildAgeLabel(ageValue, ageUnit) {
  const value = cleanText(ageValue, 10).replace(/\D/g, '');
  const unit = normalizeAgeUnit(ageUnit);

  if (!value || !unit) return '';

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1 || number > 999) return '';

  const labelUnit = number === 1 ? unit.replace(/s$/, '') : unit;

  return `${number} ${labelUnit}`;
}

export function parseAgeLabel(age) {
  const cleaned = cleanText(age, 40).toLowerCase();
  const match = cleaned.match(/^(\d{1,3})\s+(day|days|week|weeks|month|months|year|years)$/);

  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isInteger(value) || value < 1 || value > 999) return null;

  const rawUnit = match[2];
  const unit = rawUnit.endsWith('s') ? rawUnit : `${rawUnit}s`;

  return { value, unit };
}

export function isValidAgeLabel(age) {
  return Boolean(parseAgeLabel(age));
}

export function ageLabelToDays(age) {
  const parsed = parseAgeLabel(age);
  if (!parsed) return null;

  if (parsed.unit === 'days') return parsed.value;
  if (parsed.unit === 'weeks') return parsed.value * 7;
  if (parsed.unit === 'months') return Math.round(parsed.value * 30.4375);
  if (parsed.unit === 'years') return Math.round(parsed.value * 365.25);

  return null;
}

export function validateImageFile(file) {
  if (!file || typeof file === 'string') {
    return 'Invalid image file.';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed.';
  }

  if (file.name?.toLowerCase().endsWith('.svg')) {
    return 'SVG images are not allowed.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Each photo must be 5 MB or smaller.';
  }

  return '';
}

function hasImageSignature(bytes, mimeType) {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

export async function validateImageFileContent(file) {
  const basicError = validateImageFile(file);

  if (basicError) return basicError;

  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

    if (!hasImageSignature(header, file.type)) {
      return 'Image file content does not match an allowed image type.';
    }
  } catch {
    return 'Image file could not be checked.';
  }

  return '';
}

export function getImageExtension(file) {
  return IMAGE_EXTENSION_BY_TYPE[file?.type] || '';
}

export function normalizeSellerType(value) {
  const cleaned = cleanText(value, 80);

  if (cleaned === 'Registered Breeder' || cleaned === 'Breeder') {
    return 'Registered Breeder';
  }

  if (cleaned === 'Private Seller' || cleaned === 'Seller' || cleaned === 'Private Owner') {
    return 'Private Seller';
  }

  if (cleaned === 'Shelter / Rescue' || cleaned === 'Shelter' || cleaned === 'Rescue') {
    return 'Shelter / Rescue';
  }

  return '';
}

export function getMinimumLegalAgeWeeks(animalType, breed) {
  const cleanAnimalType = String(animalType || '')
    .trim()
    .toLowerCase();
  const cleanBreed = String(breed || '')
    .trim()
    .toLowerCase();

  if (cleanAnimalType === 'dogs' || cleanAnimalType === 'cats') return 8;
  if (cleanBreed.includes('rabbit')) return 6;

  if (
    cleanBreed.includes('guinea pig') ||
    cleanBreed.includes('gerbil') ||
    cleanBreed.includes('hamster') ||
    cleanBreed.includes('mouse') ||
    cleanBreed.includes('mice') ||
    cleanBreed.includes('rat')
  ) {
    return 4;
  }

  if (cleanBreed.includes('ferret')) return 8;

  return null;
}

export function parseDateInput(dateString) {
  const value = cleanText(dateString, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;

  return date;
}

export function addWeeksToDate(dateString, weeks) {
  if (!dateString || !weeks) return null;

  const date = parseDateInput(dateString);
  if (!date) return null;

  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date;
}

export function validateListingAgeAndDates({
  animalType,
  breed,
  age,
  dateOfBirth,
  readyToLeave,
  requireDates = false,
  now = new Date(),
}) {
  if (!isValidAgeLabel(age)) {
    return "Please enter the pet's age as a number and select days, weeks, months, or years.";
  }

  const minimumWeeks = getMinimumLegalAgeWeeks(animalType, breed);
  const minimumDays = minimumWeeks ? minimumWeeks * 7 : null;
  const ageDays = ageLabelToDays(age);
  const birthDate = dateOfBirth ? parseDateInput(dateOfBirth) : null;
  const readyDate = readyToLeave ? parseDateInput(readyToLeave) : null;
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (dateOfBirth && !birthDate) return 'Please enter a valid date of birth.';
  if (readyToLeave && !readyDate) return 'Please enter a valid ready-to-leave date.';
  if (birthDate && birthDate > todayUtc) return 'Date of birth cannot be in the future.';
  if ((dateOfBirth && !readyToLeave) || (!dateOfBirth && readyToLeave)) {
    return 'Date of birth and ready-to-leave date must be entered together.';
  }

  if (requireDates && (!birthDate || !readyDate)) {
    return 'Please enter the date of birth and ready-to-leave date.';
  }

  if (birthDate && readyDate) {
    if (readyDate < birthDate) return 'Ready-to-leave date cannot be before the date of birth.';

    if (minimumWeeks) {
      const minimumReadyDate = addWeeksToDate(dateOfBirth, minimumWeeks);
      if (minimumReadyDate && readyDate < minimumReadyDate) {
        return `This animal is too young to leave. Minimum age is ${minimumWeeks} weeks.`;
      }
    }

    const actualAgeDays = Math.max(Math.floor((todayUtc.getTime() - birthDate.getTime()) / DAY_MS), 0);
    if (ageDays !== null && Math.abs(actualAgeDays - ageDays) > 45) {
      return 'The age does not match the date of birth. Please correct one of them.';
    }
  }

  if (minimumDays && ageDays !== null && ageDays < minimumDays && (!birthDate || !readyDate)) {
    return `Animals younger than ${minimumWeeks} weeks must include a date of birth and a legal ready-to-leave date.`;
  }

  return '';
}
