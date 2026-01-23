import './globals.css';
import { Sora } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import WhatsAppButton from '@/components/WhatsAppButton';
import type { Metadata } from 'next';

const sora = Sora({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://casebuddy.co.in'),
  title: {
    default: 'CaseBuddy - Premium Custom Phone Cases Online India',
    template: '%s | CaseBuddy',
  },
  description: 'Shop premium custom phone cases with personalized designs. Design your own case with our online editor. High-quality prints, durable protection, fast delivery across India.',
  keywords: [
    'custom phone cases',
    'personalized phone covers',
    'design your own phone case',
    'printed phone cases India',
    'custom mobile covers',
    'phone case editor',
    'bumper cases',
    'designer phone cases',
    'custom gifts India',
    'CaseBuddy',
  ],
  authors: [{ name: 'CaseBuddy' }],
  creator: 'CaseBuddy',
  publisher: 'CaseBuddy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // viewport moved to separate export below
  icons: {
    icon: [
      export const viewport = {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
      };
      { url: '/favicon.ico' },
      { url: '/casebuddy-logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/casebuddy-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://casebuddy.co.in',
    siteName: 'CaseBuddy',
    title: 'CaseBuddy - Premium Custom Phone Cases Online India',
    description: 'Design your own custom phone case with our easy editor. Premium quality, vibrant prints, durable protection. Fast delivery across India.',
    images: [
      {
        url: '/casebuddy-logo.png',
        width: 1200,
        height: 630,
        alt: 'CaseBuddy Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CaseBuddy - Premium Custom Phone Cases',
    description: 'Design your own custom phone case with our easy editor. Premium quality, fast delivery across India.',
    images: ['/casebuddy-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add from Google Search Console
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/casebuddy-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/casebuddy-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@600;700;800&family=Montserrat:wght@400;600;700;800&family=Roboto:wght@400;500;700&family=Poppins:wght@400;600;700;800&family=Oswald:wght@600;700&family=Raleway:wght@400;600;700&family=Bebas+Neue&family=Dancing+Script:wght@600;700&family=Pacifico&display=swap" rel="stylesheet" />
      </head>
      <body className={sora.className}>
        <CartProvider>
          {children}
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
