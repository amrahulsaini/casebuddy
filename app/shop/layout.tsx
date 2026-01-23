export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Custom Phone Cases',
  description: 'Browse our complete collection of premium custom phone cases. Personalized designs, designer patterns, bumper cases, and more. Find the perfect case for your phone.',
  keywords: [
    'buy phone cases online',
    'custom phone covers',
    'designer phone cases',
    'premium mobile covers',
    'phone case shop India',
  ],
  openGraph: {
    title: 'Shop Custom Phone Cases | CaseBuddy',
    description: 'Browse our complete collection of premium custom phone cases. Designer patterns, personalized designs, and more.',
    url: 'https://casebuddy.co.in/shop',
    type: 'website',
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
