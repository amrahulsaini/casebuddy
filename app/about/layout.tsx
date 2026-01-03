import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about CaseBuddy - India\'s premium custom phone case brand. Our mission is to help you express your unique style through personalized phone protection.',
  openGraph: {
    title: 'About CaseBuddy - Premium Custom Phone Cases',
    description: 'Learn about India\'s leading custom phone case brand and our commitment to quality and personalization.',
    url: 'https://casebuddy.co.in/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
