import { Suspense } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import ListingsClient from './ListingsClient';

export const metadata = {
  title: 'Pets for Sale and Adoption in Ireland | PawHome',
  description:
    'Browse approved dogs, cats, and other pets for sale or adoption across Ireland from private owners, breeders, rescues, and shelters.',
  alternates: {
    canonical: '/listings',
  },
  openGraph: {
    title: 'Pets for Sale and Adoption in Ireland | PawHome',
    description: 'Find approved pet listings across Ireland from private owners, breeders, rescues, and shelters.',
    url: '/listings',
    siteName: 'PawHome',
    type: 'website',
  },
};

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EC]">
          <Header />

          <main className="mx-auto max-w-[1500px] px-6 py-10">
            <p className="text-sm font-semibold text-[#5F6F64]">Loading listings...</p>
          </main>

          <Footer />
        </div>
      }
    >
      <ListingsClient />
    </Suspense>
  );
}
