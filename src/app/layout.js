import { Nunito_Sans, Lora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

export const metadata = {
  title: 'PawHome | Pet Marketplace in Ireland',
  description: 'Find dogs, cats, and other pets from trusted sellers across Ireland.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} ${lora.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
