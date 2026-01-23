export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design Your Own Phone Case',
  description: 'Create your perfect custom phone case with our online editor. Upload your photos, add text, choose from templates. Easy design tool with instant preview.',
  keywords: [
    'phone case editor',
    'design phone case online',
    'custom case maker',
    'photo phone case',
    'personalize phone cover',
  ],
  openGraph: {
    title: 'Design Your Own Custom Phone Case | CaseBuddy Editor',
    description: 'Create your perfect phone case with our easy-to-use online editor. Upload photos, add text, and see instant previews.',
    url: 'https://casebuddy.co.in/editor',
  },
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
