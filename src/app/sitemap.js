import { counties } from '../data/countyList';
import { breedGuides } from '../data/breedGuides';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { getSupabaseServerClient } from '../lib/supabaseServer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

const coreSeoSlugs = [
  'pets-for-sale',
  'pets-for-adoption',
  'dogs-for-sale',
  'dogs-for-adoption',
  'dogs-for-stud',
  'puppies-for-sale',
  'cats-for-sale',
  'cats-for-adoption',
  'kittens-for-sale',
  'other-pets-for-sale',
  'other-pets-for-adoption',
];

const priorityDogBreeds = [
  'Golden Retriever',
  'Labrador Retriever',
  'German Shepherd',
  'French Bulldog',
  'Cocker Spaniel',
  'Cockapoo',
  'Cavalier King Charles Spaniel',
  'Poodle',
  'Toy Poodle',
  'Border Collie',
  'Australian Shepherd',
  'Dachshund',
  'Jack Russell Terrier',
  'Rottweiler',
  'Staffordshire Bull Terrier',
  'Whippet',
  'Greyhound',
  'Mixed Breed',
];

const priorityCatBreeds = [
  'Maine Coon',
  'British Shorthair',
  'Bengal',
  'Ragdoll',
  'Persian',
  'Siamese',
  'Sphynx',
  'Russian Blue',
  'Scottish Fold',
  'Mixed Breed',
];

const priorityCounties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Kildare', 'Meath', 'Waterford', 'Wexford'];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildSeoLandingRoutes() {
  const routes = [];

  coreSeoSlugs.forEach((slug) => {
    routes.push(slug);
    priorityCounties.forEach((county) => routes.push(`${slug}/${slugify(county)}`));
  });

  priorityDogBreeds
    .filter((breed) => dogBreeds.includes(breed))
    .forEach((breed) => {
      const basePuppySlug = `${slugify(breed)}-puppies`;
      const baseDogSlug = `${slugify(breed)}-dogs`;
      routes.push(basePuppySlug, baseDogSlug);
      priorityCounties.forEach((county) => {
        routes.push(`${basePuppySlug}/${slugify(county)}`);
        routes.push(`${baseDogSlug}/${slugify(county)}`);
      });
    });

  priorityCatBreeds
    .filter((breed) => catBreeds.includes(breed))
    .forEach((breed) => {
      const baseKittenSlug = `${slugify(breed)}-kittens`;
      const baseCatSlug = `${slugify(breed)}-cats`;
      routes.push(baseKittenSlug, baseCatSlug);
      priorityCounties.forEach((county) => {
        routes.push(`${baseKittenSlug}/${slugify(county)}`);
        routes.push(`${baseCatSlug}/${slugify(county)}`);
      });
    });

  otherPetTypes.forEach((type) => {
    const saleSlug = `${slugify(type)}-for-sale`;
    const adoptionSlug = `${slugify(type)}-for-adoption`;
    routes.push(saleSlug, adoptionSlug);
    priorityCounties.forEach((county) => {
      routes.push(`${saleSlug}/${slugify(county)}`);
      routes.push(`${adoptionSlug}/${slugify(county)}`);
    });
  });

  return unique(routes).map((slug) => ({
    url: `${siteUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: slug.includes('/') ? 0.72 : 0.78,
  }));
}

function buildBreedGuideRoutes() {
  return Object.keys(breedGuides).map((slug) => ({
    url: `${siteUrl}/breed-guide/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.76,
  }));
}

export default async function sitemap() {
  const staticRoutes = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/listings`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/shelters`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/breed-guide`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/buying-safely`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ].map((route) => ({
    ...route,
    lastModified: new Date(),
  }));

  const seoLandingRoutes = buildSeoLandingRoutes();
  const breedGuideRoutes = buildBreedGuideRoutes();
  const supabase = getSupabaseServerClient();

  if (!supabase) return [...staticRoutes, ...breedGuideRoutes, ...seoLandingRoutes];

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(500);

  const listingRoutes = (listings || []).map((listing) => ({
    url: `${siteUrl}/listings/${listing.id}`,
    lastModified: new Date(listing.updated_at || listing.created_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...breedGuideRoutes, ...seoLandingRoutes, ...listingRoutes];
}
