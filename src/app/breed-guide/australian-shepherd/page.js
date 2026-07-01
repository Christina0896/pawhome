import { notFound } from 'next/navigation';
import BreedGuideTemplate from '../../../components/BreedGuideTemplate';
import { getBreedGuide } from '../../../data/breedGuides';

const guide = getBreedGuide('australian-shepherd');

export const metadata = guide
  ? {
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
    }
  : {};

export default function AustralianShepherdGuidePage() {
  if (!guide) notFound();

  return <BreedGuideTemplate guide={guide} />;
}
