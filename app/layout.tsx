import './globals.css';
import { Sora } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import WhatsAppButton from '@/components/WhatsAppButton';

const sora = Sora({ subsets: ['latin'] });

export const metadata = {
  title: 'CaseBuddy - Premium Custom Phone Cases Online',
  description: 'Shop premium custom phone cases with personalized designs. Protect your phone with style - custom printed cases, bumper cases, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={sora.className}>
        <CartProvider>
          {children}
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
