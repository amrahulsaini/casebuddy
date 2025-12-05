'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './sections.module.css';

interface HomepageSection {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  category_count?: number;
}

export default function HomepageSectionsPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [formData, setFormData] = useState({
    section_key: '',
    title: '',
    subtitle: '',
    icon: '',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/homepage-sections');
      
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSection(null);
    setFormData({
      section_key: '',
      title: '',
      subtitle: '',
      icon: '🌸',
      sort_order: sections.length.toString(),
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setFormData({
      section_key: section.section_key,
      title: section.title,
      subtitle: section.subtitle,
      icon: section.icon,
      sort_order: section.sort_order.toString(),
      is_active: section.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this homepage section? All categories in this section will be unlinked.')) return;

    try {
      const response = await fetch(`/api/admin/homepage-sections/${id}`, { method: 'DELETE' });
      
      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to delete section');
      }
      
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      sort_order: parseInt(formData.sort_order),
    };

    try {
      const url = editingSection
        ? `/api/admin/homepage-sections/${editingSection.id}`
        : '/api/admin/homepage-sections';
      
      const method = editingSection ? 'PUT' : 'POST';
      
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
        throw new Error(error.error || 'Failed to save section');
      }

      setShowModal(false);
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      alert(error instanceof Error ? error.message : 'Error saving section');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Homepage Sections</h1>
          <p className={styles.subtitle}>Manage your homepage section pages</p>
        </div>
        <button onClick={handleAdd} className={styles.addButton}>
          + Add Section
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.sectionsGrid}>
          {sections.map((section) => (
            <div key={section.id} className={styles.sectionCard}>
              <div className={styles.sectionIcon}>{section.icon}</div>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <p className={styles.sectionSubtitle}>{section.subtitle}</p>
              
              <div className={styles.sectionStats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{section.category_count || 0}</span>
                  <span className={styles.statLabel}>Categories</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Order: {section.sort_order}</span>
                </div>
              </div>

              <div className={styles.sectionActions}>
                <Link 
                  href={`/admin/dashboard/homepage-sections/${section.section_key}/categories`}
                  className={styles.manageButton}
                >
                  Manage Categories
                </Link>
                <button
                  onClick={() => handleEdit(section)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>

              {!section.is_active && (
                <div className={styles.inactiveBadge}>Inactive</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingSection ? 'Edit Section' : 'Add Section'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Section Key (URL-friendly) *</label>
                <input
                  type="text"
                  value={formData.section_key}
                  onChange={(e) =>
                    setFormData({ ...formData, section_key: e.target.value })
                  }
                  placeholder="custom-cases"
                  required
                  disabled={!!editingSection}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Our Custom Designed Cases"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="Exclusive designs you won't find anywhere else"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="🌸"
                  maxLength={10}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: e.target.value })
                  }
                />
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                Active
              </label>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
