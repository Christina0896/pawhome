export const metadata = {
  title: 'Dog and Cat Breed Guide Ireland',
  description:
    'Explore PawHome breed guides for dogs, cats and other pets. Learn about temperament, care needs and what to check before choosing a pet in Ireland.',
  alternates: {
    canonical: '/BreedGuide',
  },
  openGraph: {
    title: 'Dog and Cat Breed Guide Ireland | PawHome',
    description:
      'Research breeds before choosing a pet. Read PawHome breed information for buyers and adopters in Ireland.',
    url: '/BreedGuide',
    type: 'website',
  },
};

export default function BreedGuideLayout({ children }) {
  return children;
}
