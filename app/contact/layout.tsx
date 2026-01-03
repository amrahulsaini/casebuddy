import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with CaseBuddy. Contact us for custom orders, bulk inquiries, or any questions about our phone cases. Call, email, or WhatsApp us.',
  openGraph: {
    title: 'Contact CaseBuddy - Custom Phone Cases',
    description: 'Reach out to us for custom orders, questions, or support. We\'re here to help!',
    url: 'https://casebuddy.co.in/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
