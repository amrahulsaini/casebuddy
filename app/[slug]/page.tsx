import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './dynamic-page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
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
    const response = await fetch(`${baseUrl}/api/pages/${slug}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching page data:', error);
    return null;
  }
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const data = await getPageData(params.slug);

  if (!data) {
    notFound();
  }

  const { page, sections } = data;

  return (
    <main className={styles.main}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{page.page_name}</h1>
        {page.description && (
          <p className={styles.pageDescription}>{page.description}</p>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} className={styles.section}>
          {/* Section Header */}
          <div className={styles.sectionHeader}>
            {section.icon && (
              <div className={styles.sectionIcon}>{section.icon}</div>
            )}
            <div className={styles.sectionTitleWrapper}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.subtitle && (
                <p className={styles.sectionSubtitle}>{section.subtitle}</p>
              )}
            </div>
          </div>

          {/* Categories Grid */}
          <div className={styles.categoriesGrid}>
            {section.categories.map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                {/* Category Header */}
                <div className={styles.categoryHeader}>
                  {category.icon && (
                    <span className={styles.categoryIcon}>{category.icon}</span>
                  )}
                  <h3 className={styles.categoryTitle}>{category.name}</h3>
                </div>

                {category.description && (
                  <p className={styles.categoryDescription}>{category.description}</p>
                )}

                {/* Category Link - Click to view products */}
                <Link
                  href={`/category/${category.slug}`}
                  className={styles.categoryLink}
                >
                  View {category.name} Products →
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Empty State */}
      {sections.length === 0 && (
        <div className={styles.emptyState}>
          <p>No content available for this page yet.</p>
        </div>
      )}
    </main>
  );
}
