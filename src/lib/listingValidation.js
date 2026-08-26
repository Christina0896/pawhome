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

export function isValidAgeLabel(age) {
  return /^\d{1,3}\s+(day|days|week|weeks|month|months|year|years)$/.test(cleanText(age, 40).toLowerCase());
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

export function getSellerTypeFromAccountType(accountType) {
  const cleaned = cleanText(accountType, 80);

  if (cleaned === 'Private Seller') {
    return 'Private Seller';
  }

  if (cleaned === 'Breeder') {
    return 'Registered Breeder';
  }

  return '';
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

export function addWeeksToDate(dateString, weeks) {
  if (!dateString || !weeks) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + weeks * 7);

  return date;
}
