import { MetadataRoute } from 'next';
import caseMainPool from '@/lib/db-main';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://casebuddy.co.in';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    // Fetch all categories
    const [categories] = await caseMainPool.query<any[]>(
      'SELECT slug, updated_at FROM categories WHERE is_active = true ORDER BY sort_order'
    );

    const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
      url: `${baseUrl}/shop/${category.slug}`,
      lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch all products
    const [products] = await caseMainPool.query<any[]>(
      'SELECT slug, updated_at FROM products WHERE status = "active" ORDER BY id DESC'
    );

    const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
      url: `${baseUrl}/shop/product/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Fetch all dynamic pages
    const [pages] = await caseMainPool.query<any[]>(
      'SELECT slug, updated_at FROM pages WHERE status = "published" ORDER BY id'
    );

    const dynamicPages: MetadataRoute.Sitemap = pages.map((page: any) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages, ...dynamicPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if database fails
    return staticPages;
  }
}
