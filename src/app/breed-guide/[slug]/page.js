import { notFound } from 'next/navigation';
import BreedGuideTemplate from '../../../components/BreedGuideTemplate';
import { breedGuides, getBreedGuide } from '../../../data/breedGuides';

export function generateStaticParams() {
  return Object.keys(breedGuides).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const guide = getBreedGuide(params.slug);

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

export default function BreedGuideDetailPage({ params }) {
  const guide = getBreedGuide(params.slug);

  if (!guide) notFound();

  return <BreedGuideTemplate guide={guide} />;
}
