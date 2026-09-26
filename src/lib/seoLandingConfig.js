import { counties } from '../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';

export const SEO_PAGE_LIMIT = 24;
export const SEO_FALLBACK_LIMIT = 300;

export const CORE_SEO_ROUTES = [
  ['pets-for-sale', 'Pets for Sale in Ireland', 'Pets for sale in Ireland', '', 'For Sale', 'Browse pets for sale across Ireland, including dogs, cats, puppies, kittens and other animals.'],
  ['pets-for-adoption', 'Pets for Adoption in Ireland', 'Pets for adoption in Ireland', '', 'For Adoption', 'Find pets for adoption across Ireland from rescues, shelters and owners.'],
  ['dogs-for-sale', 'Dogs for Sale in Ireland', 'Dogs for sale in Ireland', 'Dogs', 'For Sale', 'Browse dogs and puppies for sale across Ireland.'],
  ['dogs-for-adoption', 'Dogs for Adoption in Ireland', 'Dogs for adoption in Ireland', 'Dogs', 'For Adoption', 'Find dogs for adoption in Ireland from owners, rescues and shelters.'],
  ['dogs-for-stud', 'Dogs for Stud in Ireland', 'Dogs for stud in Ireland', 'Dogs', 'For Stud', 'Browse dog stud listings across Ireland.'],
  ['puppies-for-sale', 'Puppies for Sale in Ireland', 'Puppies for sale in Ireland', 'Dogs', 'For Sale', 'Find puppies for sale in Ireland by county, breed and seller type.', 'puppies'],
  ['cats-for-sale', 'Cats for Sale in Ireland', 'Cats for sale in Ireland', 'Cats', 'For Sale', 'Browse cats and kittens for sale across Ireland.'],
  ['cats-for-adoption', 'Cats for Adoption in Ireland', 'Cats for adoption in Ireland', 'Cats', 'For Adoption', 'Find cats for adoption in Ireland from shelters, rescues and owners.'],
  ['kittens-for-sale', 'Kittens for Sale in Ireland', 'Kittens for sale in Ireland', 'Cats', 'For Sale', 'Browse kittens for sale in Ireland by county and breed.', 'kittens'],
  ['other-pets-for-sale', 'Other Pets for Sale in Ireland', 'Other pets for sale in Ireland', 'Other Pets', 'For Sale', 'Browse rabbits, birds, reptiles, fish, horses, poultry, livestock and other pets for sale across Ireland.'],
  ['other-pets-for-adoption', 'Other Pets for Adoption in Ireland', 'Other pets for adoption in Ireland', 'Other Pets', 'For Adoption', 'Find rabbits, birds, reptiles, fish, horses and other pets for adoption across Ireland.'],
].map(([slug, title, h1, animalType, listingType, intro, keyword]) => ({
  slug,
  title,
  h1,
  animalType,
  listingType,
  intro,
  keyword: keyword || '',
}));

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalise(value) {
  return slugify(value).replace(/-/g, ' ');
}

export function titleCase(value) {
  return String(value || '')
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function withCountyRoute(base, county) {
  return county ? `${base}/${slugify(county)}` : base;
}

function withCountyText(text, county) {
  return county ? text.replace('in Ireland', `in ${county}`) : text;
}

function getCountyFromSlug(slug) {
  return counties.find((county) => slugify(county) === slug) || '';
}

function getBreedFromSlug(slug, breeds) {
  return breeds.find((breed) => slugify(breed) === slug) || '';
}

function getOtherPetTypeFromSlug(slug) {
  return otherPetTypes.find((type) => slugify(type) === slug) || '';
}

function sentenceCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pluralPetType(value) {
  const text = String(value || '').trim();
  if (!text) return 'Pets';
  return text.endsWith('s') ? text : `${text}s`;
}

export function getSeoRouteConfig(slugParts) {
  const mainSlug = slugParts?.[0] || '';
  const county = slugParts?.[1] ? getCountyFromSlug(slugParts[1]) : '';

  if (!mainSlug || slugParts.length > 2 || (slugParts[1] && !county)) return null;

  const core = CORE_SEO_ROUTES.find((route) => route.slug === mainSlug);
  if (core) {
    return {
      ...core,
      county,
      canonical: withCountyRoute(core.slug, county),
      title: withCountyText(core.title, county),
      h1: withCountyText(core.h1, county),
      description: withCountyText(core.intro, county),
    };
  }

  const dogBreedSlug = mainSlug.endsWith('-puppies')
    ? mainSlug.replace(/-puppies$/, '')
    : mainSlug.endsWith('-dogs')
      ? mainSlug.replace(/-dogs$/, '')
      : '';
  const dogBreed = getBreedFromSlug(dogBreedSlug, dogBreeds);

  if (dogBreed) {
    const isPuppy = mainSlug.endsWith('-puppies');
    const phrase = isPuppy ? `${dogBreed} puppies for sale` : `${dogBreed} dogs for sale`;
    const baseSlug = `${slugify(dogBreed)}-${isPuppy ? 'puppies' : 'dogs'}`;
    const location = county ? `in ${county}` : 'in Ireland';

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${sentenceCase(phrase)} ${location}`,
      h1: `${sentenceCase(phrase)} ${location}`,
      description: `Browse ${phrase} ${location} and compare age, sex, photos, microchip status and seller information.`,
      animalType: 'Dogs',
      breed: dogBreed,
      listingType: 'For Sale',
      keyword: isPuppy ? 'puppies' : 'dogs',
      county,
    };
  }

  const catBreedSlug = mainSlug.endsWith('-kittens')
    ? mainSlug.replace(/-kittens$/, '')
    : mainSlug.endsWith('-cats')
      ? mainSlug.replace(/-cats$/, '')
      : '';
  const catBreed = getBreedFromSlug(catBreedSlug, catBreeds);

  if (catBreed) {
    const isKitten = mainSlug.endsWith('-kittens');
    const phrase = isKitten ? `${catBreed} kittens for sale` : `${catBreed} cats for sale`;
    const baseSlug = `${slugify(catBreed)}-${isKitten ? 'kittens' : 'cats'}`;
    const location = county ? `in ${county}` : 'in Ireland';

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${sentenceCase(phrase)} ${location}`,
      h1: `${sentenceCase(phrase)} ${location}`,
      description: `Browse ${phrase} ${location} and compare age, sex, photos and seller information.`,
      animalType: 'Cats',
      breed: catBreed,
      listingType: 'For Sale',
      keyword: isKitten ? 'kittens' : 'cats',
      county,
    };
  }

  const otherTypeSlug = mainSlug.endsWith('-for-adoption')
    ? mainSlug.replace(/-for-adoption$/, '')
    : mainSlug.endsWith('-for-sale')
      ? mainSlug.replace(/-for-sale$/, '')
      : '';
  const otherType = getOtherPetTypeFromSlug(otherTypeSlug);

  if (otherType) {
    const listingType = mainSlug.endsWith('-for-adoption') ? 'For Adoption' : 'For Sale';
    const phrase = `${pluralPetType(otherType).toLowerCase()} ${listingType === 'For Adoption' ? 'for adoption' : 'for sale'}`;
    const baseSlug = `${slugify(otherType)}-${listingType === 'For Adoption' ? 'for-adoption' : 'for-sale'}`;
    const location = county ? `in ${county}` : 'in Ireland';

    return {
      slug: baseSlug,
      canonical: withCountyRoute(baseSlug, county),
      title: `${titleCase(phrase)} ${location}`,
      h1: `${titleCase(phrase)} ${location}`,
      description: `Browse ${phrase} ${location} on PawHome and compare location, photos and seller details.`,
      animalType: 'Other Pets',
      breed: otherType,
      listingType,
      county,
    };
  }

  return null;
}

export function buildListingsHref(config) {
  const params = new URLSearchParams();
  if (config.animalType) params.set('animalType', config.animalType);
  if (config.breed) params.set('breed', config.breed);
  if (config.county) params.set('county', config.county);
  if (config.listingType) params.set('listingType', config.listingType);
  const query = params.toString();
  return query ? `/listings?${query}` : '/listings';
}

function matchAnimalType(listing, expectedAnimalType) {
  if (!expectedAnimalType) return true;
  const actual = normalise(listing.animal_type);
  const expected = normalise(expectedAnimalType);

  if (expected === 'dogs') return ['dog', 'dogs'].includes(actual);
  if (expected === 'cats') return ['cat', 'cats'].includes(actual);
  if (expected === 'other pets') return ['other', 'other pet', 'other pets'].includes(actual) || !['dog', 'dogs', 'cat', 'cats'].includes(actual);
  return actual === expected;
}

function matchBreedOrType(listing, expectedBreed) {
  if (!expectedBreed) return true;
  const expected = normalise(expectedBreed);
  const searchable = [listing.breed, listing.title, listing.description, listing.animal_type].map(normalise).join(' ');
  return searchable.includes(expected);
}

export function matchesSeoConfig(listing, config) {
  return (
    normalise(listing.status || 'approved') === 'approved' &&
    matchAnimalType(listing, config.animalType) &&
    (!config.listingType || normalise(listing.listing_type) === normalise(config.listingType)) &&
    (!config.county || slugify(listing.county) === slugify(config.county)) &&
    matchBreedOrType(listing, config.breed)
  );
}

export function getRelatedSeoLinks(config) {
  const popularCounties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Kildare', 'Meath', 'Waterford', 'Wexford'];
  const links = [];

  if (!config.county) {
    popularCounties.forEach((county) => {
      links.push({ href: `/${withCountyRoute(config.slug, county)}`, label: config.h1.replace('in Ireland', `in ${county}`) });
    });
  }

  CORE_SEO_ROUTES.filter((route) => route.slug !== config.slug)
    .slice(0, 8)
    .forEach((route) => {
      links.push({
        href: `/${withCountyRoute(route.slug, config.county)}`,
        label: withCountyText(route.h1, config.county),
      });
    });

  return links.slice(0, 14);
}
