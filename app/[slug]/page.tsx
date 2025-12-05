import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from '../home.module.css';

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
    <div className={styles.container}>
      {/* Hero Section for Page */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{page.page_name}</h1>
          {page.description && (
            <p className={styles.heroSubtitle}>{page.description}</p>
          )}
        </div>
        <div className={styles.heroBackground}></div>
      </section>

      {/* Empty State */}
      {sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
          <p>No content available for this page yet. Add sections from admin dashboard.</p>
        </div>
      )}

      {/* Dynamic Sections */}
      {sections.map((section, sectionIndex) => {
        // Skip sections with no categories to avoid empty display
        if (!section.categories || section.categories.length === 0) {
          return null;
        }
        
        return (
        <section 
          key={section.id} 
          className={sectionIndex === 0 ? styles.sectionFullWidth : styles.sectionAltFullWidth}
        >
          <div className={styles.sectionHeader}>
            <div className={styles.floralDecor}>{section.icon}</div>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubtitle}>{section.subtitle}</p>
          </div>
          
          {sectionIndex === 0 ? (
            // First section: Horizontal scroll (no animation, no duplicates)
            <div className={styles.horizontalScroll}>
              <div className={styles.scrollContent} style={{ animation: 'none' }}>
                {section.categories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/shop/${category.slug}`}
                    className={styles.horizontalCard}
                  >
                    <div className={styles.horizontalImageWrapper}>
                      <Image 
                        src={category.image_url} 
                        alt={category.name}
                        width={280}
                        height={380}
                        className={styles.horizontalImage}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.horizontalInfo}>
                      <h3 className={styles.horizontalName}>{category.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            // Other sections: Grid layout
            <div className={styles.categoryGrid}>
              {section.categories.map((category, index) => (
                <Link 
                  key={category.id}
                  href={`/shop/${category.slug}`}
                  className={styles.verticalCard}
                  data-index={index}
                >
                  <div className={styles.verticalImageWrapper}>
                    <Image 
                      src={category.image_url} 
                      alt={category.name}
                      width={320}
                      height={420}
                      className={styles.verticalImage}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjQyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjQyMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=="
                    />
                    <div className={styles.verticalOverlay}>
                      <span className={styles.overlayText}>{category.name}</span>
                      <div className={styles.overlayButton}>
                        View Collection <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        );
      })}
    </div>
  );
}
