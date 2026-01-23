export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Phone Case Mockup Studio',
  description: 'Generate professional phone case mockups with AI',
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
