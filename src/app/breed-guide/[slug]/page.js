import { notFound } from 'next/navigation';
import BreedGuideTemplate from '../../../components/BreedGuideTemplate';
import { breedGuides, getBreedGuide } from '../../../data/breedGuides';

export function generateStaticParams() {
  return Object.keys(breedGuides).map((slug) => ({ slug }));
}

async function resolveParams(params) {
  return typeof params?.then === 'function' ? await params : params;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await resolveParams(params);
  const guide = getBreedGuide(resolvedParams?.slug);

  if (!guide) return {};

  return {
    title: guide.seoTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `/breed-guide/${guide.slug}`,
    },
    openGraph: {
      title: guide.seoTitle,
      description: guide.metaDescription,
      url: `/breed-guide/${guide.slug}`,
      siteName: 'PawHome',
      type: 'article',
    },
  };
}

export default async function BreedGuideDetailPage({ params }) {
  const resolvedParams = await resolveParams(params);
  const guide = getBreedGuide(resolvedParams?.slug);

  if (!guide) notFound();

  return <BreedGuideTemplate guide={guide} />;
}
