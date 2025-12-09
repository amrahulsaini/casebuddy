import './globals.css';
import { Sora } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import WhatsAppButton from '@/components/WhatsAppButton';

const sora = Sora({ subsets: ['latin'] });

export const metadata = {
  title: 'CaseBuddy - AI Phone Case Mockup Studio',
  description: 'Generate professional phone case mockups with AI',
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
