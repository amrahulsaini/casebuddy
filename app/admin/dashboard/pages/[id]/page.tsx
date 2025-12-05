'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page-details.module.css';

interface Page {
  id: number;
  page_key: string;
  page_name: string;
  slug: string;
  description: string;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  category_count?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  section_key: string;
  is_active: boolean;
}

export default function PageDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pageId, setPageId] = useState<string>('');
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('');

  useEffect(() => {
    params.then((p) => {
      setPageId(p.id);
      fetchPageDetails(p.id);
      fetchSections(p.id);
    });
  }, []);

  useEffect(() => {
    if (selectedSection && pageId) {
      fetchCategoriesForSection(selectedSection);
    } else {
      setCategories([]);
    }
  }, [selectedSection]);

  const fetchPageDetails = async (id: string) => {
    try {
      const response = await fetch('/api/admin/pages');
      if (response.ok) {
        const data = await response.json();
        const foundPage = data.find((p: Page) => p.id.toString() === id);
        setPage(foundPage || null);
      }
    } catch (error) {
      console.error('Error fetching page:', error);
    }
  };

  const fetchSections = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pages/${id}/sections`);
      if (response.ok) {
        const data = await response.json();
        setSections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesForSection = async (sectionKey: string) => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      const filtered = data.filter((cat: Category) => cat.section_key === sectionKey);
      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!page) {
    return <div className={styles.error}>Page not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back to Pages
          </button>
          <h1>{page.page_name}</h1>
          <p className={styles.subtitle}>/{page.slug}</p>
        </div>
        <Link href={`/admin/dashboard/pages/${pageId}/edit`} className={styles.editButton}>
          Edit Page
        </Link>
      </div>

      {page.description && (
        <div className={styles.descCard}>
          <p>{page.description}</p>
        </div>
      )}

      {/* Sections */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Sections ({sections.length})</h2>
          <Link href="/admin/dashboard/homepage-sections" className={styles.addButton}>
            + Add Section
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No sections yet. Add sections to organize content on this page.</p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {sections.map((section) => (
              <div key={section.id} className={styles.card}>
                <div className={styles.cardIcon}>{section.icon}</div>
                <h3>{section.title}</h3>
                <p>{section.subtitle}</p>
                <div className={styles.cardStats}>
                  <span>{section.category_count || 0} categories</span>
                  <span className={`${styles.badge} ${section.is_active ? styles.active : styles.inactive}`}>
                    {section.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSection(section.section_key)}
                  className={styles.viewButton}
                >
                  View Categories
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories for selected section */}
      {selectedSection && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Categories in {sections.find(s => s.section_key === selectedSection)?.title}</h2>
            <Link href="/admin/dashboard/categories" className={styles.addButton}>
              + Add Category
            </Link>
          </div>

          {categories.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No categories in this section yet.</p>
            </div>
          ) : (
            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <div key={category.id} className={styles.categoryCard}>
                  {category.image_url && (
                    <img src={category.image_url} alt={category.name} className={styles.categoryImage} />
                  )}
                  <h4>{category.name}</h4>
                  <Link href={`/admin/dashboard/products?category=${category.id}`} className={styles.linkButton}>
                    View Products →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/admin/dashboard/homepage-sections" className={styles.actionCard}>
            <span className={styles.actionIcon}>📝</span>
            <span>Manage Sections</span>
          </Link>
          <Link href="/admin/dashboard/categories" className={styles.actionCard}>
            <span className={styles.actionIcon}>📁</span>
            <span>Manage Categories</span>
          </Link>
          <Link href="/admin/dashboard/products" className={styles.actionCard}>
            <span className={styles.actionIcon}>📦</span>
            <span>Manage Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
