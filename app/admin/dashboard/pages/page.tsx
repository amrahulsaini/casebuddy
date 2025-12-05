'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './pages.module.css';

interface Page {
  id: number;
  page_key: string;
  page_name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  section_count?: number;
}

export default function PagesManagementPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    page_key: '',
    page_name: '',
    slug: '',
    description: '',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pages');
      
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setPages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPage(null);
    setFormData({
      page_key: '',
      page_name: '',
      slug: '',
      description: '',
      sort_order: pages.length.toString(),
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      page_key: page.page_key,
      page_name: page.page_name,
      slug: page.slug,
      description: page.description,
      sort_order: page.sort_order.toString(),
      is_active: page.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, pageKey: string) => {
    if (pageKey === 'homepage') {
      alert('Cannot delete homepage!');
      return;
    }

    if (!confirm('Delete this page? All sections and categories in this page will be affected.')) return;

    try {
      const response = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to delete page');
      }
      
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      sort_order: parseInt(formData.sort_order),
    };

    try {
      const url = editingPage
        ? `/api/admin/pages/${editingPage.id}`
        : '/api/admin/pages';
      
      const method = editingPage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      setShowModal(false);
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      alert(error instanceof Error ? error.message : 'Error saving page');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPage(null);
  };

  const handlePageNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    setFormData({ ...formData, page_name: name, slug, page_key: editingPage ? formData.page_key : key });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Pages Management</h1>
          <p className={styles.subtitle}>Create and manage website pages</p>
        </div>
        <button onClick={handleAdd} className={styles.addButton}>
          + Add Page
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.pagesGrid}>
          {pages.map((page) => (
            <div key={page.id} className={styles.pageCard}>
              <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>{page.page_name}</h2>
                <span className={`${styles.badge} ${page.is_active ? styles.active : styles.inactive}`}>
                  {page.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className={styles.pageSlug}>/{page.slug}</p>
              <p className={styles.pageDesc}>{page.description || 'No description'}</p>
              
              <div className={styles.pageStats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{page.section_count || 0}</span>
                  <span className={styles.statLabel}>Sections</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Order: {page.sort_order}</span>
                </div>
              </div>

              <div className={styles.pageActions}>
                <Link 
                  href={`/admin/dashboard/pages/${page.id}/sections`}
                  className={styles.manageButton}
                >
                  Manage Sections
                </Link>
                <button
                  onClick={() => handleEdit(page)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                {page.page_key !== 'homepage' && (
                  <button
                    onClick={() => handleDelete(page.id, page.page_key)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>{editingPage ? 'Edit Page' : 'Add Page'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Page Name *</label>
                <input
                  type="text"
                  value={formData.page_name}
                  onChange={(e) => handlePageNameChange(e.target.value)}
                  required
                  placeholder="e.g., About Us"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Page Key *</label>
                <input
                  type="text"
                  value={formData.page_key}
                  onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                  required
                  disabled={!!editingPage}
                  placeholder="e.g., about_us"
                />
                {editingPage && (
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    Page key cannot be changed after creation
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>URL Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="e.g., about-us"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this page"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={closeModal} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingPage ? 'Update' : 'Create'} Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
