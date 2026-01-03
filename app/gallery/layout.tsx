import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Gallery',
  description: 'See real customer designs and reviews. Browse through thousands of custom phone cases created by our happy customers. Get inspired for your own design.',
  openGraph: {
    title: 'Customer Gallery - Real Phone Case Designs | CaseBuddy',
    description: 'Browse real custom phone cases created by our customers. Get inspired for your own unique design.',
    url: 'https://casebuddy.co.in/gallery',
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
