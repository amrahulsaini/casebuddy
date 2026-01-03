import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://casebuddy.co.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
          '/checkout',
          '/order-confirmation/',
          '/orders/',
          '/wishlist',
          '/test-insert/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
          '/checkout',
          '/order-confirmation/',
          '/orders/',
          '/wishlist',
          '/test-insert/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
