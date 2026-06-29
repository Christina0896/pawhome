import { Nunito_Sans, Lora } from 'next/font/google';
import './globals.css';
import AdoptionPriceEnhancer from '../components/AdoptionPriceEnhancer';
import AgeInputEnhancer from '../components/AgeInputEnhancer';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawhome.ie';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PawHome | Pet Marketplace in Ireland',
    template: '%s | PawHome',
  },
  description:
    'Browse pet listings across Ireland. Find dogs, cats, puppies, kittens and adoption listings from responsible owners, breeders and rescues.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PawHome | Pet Marketplace in Ireland',
    description: 'Browse pet listings across Ireland from responsible owners, breeders, rescues and shelters.',
    url: siteUrl,
    siteName: 'PawHome',
    type: 'website',
    locale: 'en_IE',
    images: [
      {
        url: '/img/logo.png',
        width: 1200,
        height: 630,
        alt: 'PawHome pet marketplace Ireland',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawHome | Pet Marketplace in Ireland',
    description: 'Find pet listings across Ireland on PawHome.',
    images: ['/img/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} ${lora.variable}`}>
        <ToastProvider>
          <AuthProvider>
            <AgeInputEnhancer />
            <AdoptionPriceEnhancer />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
