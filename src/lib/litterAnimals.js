import { cleanNullableText, cleanText } from './listingValidation';

export const MAX_LITTER_ANIMALS = 12;
export const ALLOWED_LITTER_ANIMAL_SEXES = ['Male', 'Female'];
export const ALLOWED_LITTER_ANIMAL_STATUSES = ['available', 'reserved', 'sold'];

function cleanClientKey(value) {
  return cleanText(value, 80).replace(/[^a-zA-Z0-9_-]/g, '');
}

export function parseLitterAnimalsPayload(value, { allowIds = false } = {}) {
  if (!value) return { animals: [], error: '' };

  let submittedAnimals;

  try {
    submittedAnimals = JSON.parse(String(value));
  } catch {
    return { animals: [], error: 'Litter animal information is invalid.' };
  }

  if (!Array.isArray(submittedAnimals)) {
    return { animals: [], error: 'Litter animal information is invalid.' };
  }

  if (submittedAnimals.length > MAX_LITTER_ANIMALS) {
    return { animals: [], error: `You can add a maximum of ${MAX_LITTER_ANIMALS} animals to one litter.` };
  }

  const animals = [];
  const seenClientKeys = new Set();
  const seenIds = new Set();

  for (let index = 0; index < submittedAnimals.length; index += 1) {
    const item = submittedAnimals[index] || {};
    const clientKey = cleanClientKey(item.client_key);
    const id = allowIds ? cleanNullableText(item.id, 80) : null;
    const name = cleanText(item.name, 80);
    const sex = cleanText(item.sex, 20);
    const colour = cleanNullableText(item.colour, 80);
    const status = cleanText(item.status, 20).toLowerCase();
    const description = cleanNullableText(item.description, 300);
    const priceText = cleanText(item.price, 20);
    const price = priceText === '' ? null : Number(priceText);

    if (!clientKey || seenClientKeys.has(clientKey)) {
      return { animals: [], error: `Animal ${index + 1} has an invalid identifier.` };
    }

    seenClientKeys.add(clientKey);

    if (id) {
      if (seenIds.has(id)) {
        return { animals: [], error: 'The same litter animal was submitted more than once.' };
      }

      seenIds.add(id);
    }

    if (name.length < 1) {
      return { animals: [], error: `Please enter a name or number for animal ${index + 1}.` };
    }

    if (!ALLOWED_LITTER_ANIMAL_SEXES.includes(sex)) {
      return { animals: [], error: `Please select Male or Female for ${name}.` };
    }

    if (!ALLOWED_LITTER_ANIMAL_STATUSES.includes(status)) {
      return { animals: [], error: `Please select a valid status for ${name}.` };
    }

    if (price !== null && (!Number.isFinite(price) || price <= 0 || price > 1000000)) {
      return { animals: [], error: `Please enter a valid price for ${name}.` };
    }

    animals.push({
      id,
      client_key: clientKey,
      name,
      sex,
      colour,
      price,
      status,
      description,
      sort_order: index,
    });
  }

  return { animals, error: '' };
}

export function getLitterCounts(animals = []) {
  const availableAnimals = animals.filter((animal) => animal.status === 'available');

  return {
    available: availableAnimals.length,
    males: availableAnimals.filter((animal) => animal.sex === 'Male').length,
    females: availableAnimals.filter((animal) => animal.sex === 'Female').length,
  };
}

export async function fetchLitterAnimals(supabase, listingId) {
  if (!supabase || !listingId) return [];

  const { data, error } = await supabase
    .from('litter_animals')
    .select('id, listing_id, name, sex, colour, price, status, description, image_url, sort_order, created_at, updated_at')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true });

  if (error) {
    // The feature is deliberately optional during rollout. Listing pages must
    // continue working before the additive migration has been applied.
    console.warn('Litter animals fetch skipped:', {
      message: error.message,
      code: error.code,
    });
    return [];
  }

  return data || [];
}
