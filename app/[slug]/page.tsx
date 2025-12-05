import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './dynamic-page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  categories: Category[];
}

interface PageData {
  page: {
    id: number;
    page_key: string;
    page_name: string;
    slug: string;
    description: string;
  };
  sections: Section[];
}

async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/pages/${slug}`;
    console.log('Fetching page data from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch page:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    console.log('Page data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching page data:', error);
    return null;
  }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPageData(slug);

  if (!data || !data.page) {
    notFound();
  }

  const { page, sections } = data;

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.pageHero}>
        <div className={styles.pageHeroBackground}></div>
        <div className={styles.pageHeroContent}>
          <h1 className={styles.pageHeroTitle}>{page.page_name}</h1>
          {page.description && (
            <p className={styles.pageHeroDescription}>{page.description}</p>
          )}
        </div>
      </section>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className={styles.emptyState}>
          <p>No content available for this page yet. Add sections from admin dashboard.</p>
        </div>
      )}

      {/* Dynamic Sections */}
      {sections.map((section, sectionIndex) => {
        // Skip sections with no categories
        if (!section.categories || section.categories.length === 0) {
          return null;
        }
        
        return (
          <section key={section.id} className={styles.pageSection}>
            <div className={styles.pageSection}>
              <h2 className={styles.pageSectionTitle}>{section.title}</h2>
              {section.subtitle && (
                <p className={styles.pageSectionSubtitle}>{section.subtitle}</p>
              )}
            </div>
            
            <div className={styles.categoriesGrid}>
              {section.categories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/shop/${category.slug}`}
                  className={styles.categoryCard}
                >
                  <div className={styles.categoryImageWrapper}>
                    <Image 
                      src={category.image_url} 
                      alt={category.name}
                      width={400}
                      height={320}
                      className={styles.categoryImage}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.categoryInfo}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    {category.description && (
                      <p className={styles.categoryDescription}>{category.description}</p>
                    )}
                    <div className={styles.categoryButton}>
                      View Collection <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
