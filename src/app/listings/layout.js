export const metadata = {
  title: 'Pets for Sale and Adoption in Ireland',
  description:
    'Browse dogs, cats and other pets available across Ireland. Filter PawHome listings by county, breed, price, age and listing type.',
  alternates: {
    canonical: '/listings',
  },
  openGraph: {
    title: 'Pets for Sale and Adoption in Ireland | PawHome',
    description:
      'Browse approved pet listings from owners, breeders, rescues and shelters across Ireland.',
    url: '/listings',
    type: 'website',
  },
};

export default function ListingsLayout({ children }) {
  return children;
}
