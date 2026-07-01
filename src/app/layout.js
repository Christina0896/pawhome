import { Nunito_Sans, Lora } from 'next/font/google';
import './globals.css';
import ReviewPing from '../components/ReviewPing';
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

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'PawHome',
      url: siteUrl,
      logo: `${siteUrl}/img/logo.png`,
      description:
        'PawHome is a pet marketplace for dogs, cats, puppies, kittens, adoption listings, breeders, rescues and shelters across Ireland.',
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'PawHome',
      url: siteUrl,
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/listings?breed={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData).replace(/</g, '\\u003c') }}
        />
        <ToastProvider>
          <AuthProvider>
            <ReviewPing />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
