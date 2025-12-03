import './globals.css';
import { Sora } from 'next/font/google';

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
        {children}
      </body>
    </html>
  );
}
