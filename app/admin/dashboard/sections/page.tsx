'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './sections.module.css';

interface Page {
  id: number;
  page_name: string;
  page_key: string;
}

interface Section {
  id: number;
  page_id: number;
  section_key: string;
  title: string;
  subtitle: string;
  icon: string;
  sort_order: number;
  is_active: number;
  page_name?: string;
}

export default function SectionsPage() {
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [filterPage, setFilterPage] = useState<string>('');

  const [formData, setFormData] = useState({
    page_id: '',
    title: '',
    subtitle: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchPages();
    fetchSections();
    
    // Auto-select page from URL query
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setFilterPage(pageParam);
      setFormData(prev => ({ ...prev, page_id: pageParam }));
    }
  }, [searchParams]);

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/homepage-sections');
      if (response.ok) {
        const data = await response.json();
        // Fetch page names for each section
        const sectionsWithPages = await Promise.all(
          data.map(async (section: Section) => {
            if (section.page_id) {
              const page = pages.find((p) => p.id === section.page_id);
              return { ...section, page_name: page?.page_name || 'Unknown' };
            }
            return { ...section, page_name: 'No Page' };
          })
        );
        setSections(sectionsWithPages);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sectionData = {
      ...formData,
      page_id: parseInt(formData.page_id),
      section_key: formData.title.toLowerCase().replace(/\s+/g, '-'),
    };

    try {
      const url = editingSection
        ? `/api/admin/homepage-sections/${editingSection.id}`
        : '/api/admin/homepage-sections';
      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchSections();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save section');
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    }
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      page_id: section.page_id.toString(),
      title: section.title,
      subtitle: section.subtitle || '',
      icon: section.icon || '',
      sort_order: section.sort_order,
      is_active: section.is_active === 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const response = await fetch(`/api/admin/homepage-sections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSections();
      } else {
        alert('Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const resetForm = () => {
    setFormData({
      page_id: '',
      title: '',
      subtitle: '',
      icon: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingSection(null);
  };

  const filteredSections = filterPage
    ? sections.filter((s) => s.page_id === parseInt(filterPage))
    : sections;

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sections</h1>
          <p className={styles.subtitle}>Manage sections for each page</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className={styles.addButton}
        >
          + Add Section
        </button>
      </div>

      {/* Filter by Page */}
      <div className={styles.filterBar}>
        <label>Filter by Page:</label>
        <select
          value={filterPage}
          onChange={(e) => setFilterPage(e.target.value)}
          className={styles.select}
        >
          <option value="">All Pages</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.page_name}
            </option>
          ))}
        </select>
        {filterPage && (
          <button onClick={() => setFilterPage('')} className={styles.clearButton}>
            Clear Filter
          </button>
        )}
      </div>

      {/* Sections Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Page</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No sections found. Create your first section!
                </td>
              </tr>
            ) : (
              filteredSections.map((section) => (
                <tr key={section.id}>
                  <td className={styles.iconCell}>{section.icon}</td>
                  <td className={styles.titleCell}>{section.title}</td>
                  <td>{section.subtitle}</td>
                  <td>
                    <span className={styles.pageBadge}>
                      {section.page_name || 'No Page'}
                    </span>
                  </td>
                  <td>{section.sort_order}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        section.is_active ? styles.active : styles.inactive
                      }`}
                    >
                      {section.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={styles.actions}>
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Page *</label>
                <select
                  value={formData.page_id}
                  onChange={(e) =>
                    setFormData({ ...formData, page_id: e.target.value })
                  }
                  required
                  className={styles.input}
                >
                  <option value="">Select a page</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.page_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className={styles.input}
                  placeholder="e.g., Our Custom Designed Cases"
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
                  className={styles.input}
                  placeholder="e.g., Choose from our wide range"
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
                  className={styles.input}
                  placeholder="e.g., 📱"
                  maxLength={10}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value),
                    })
                  }
                  className={styles.input}
                  min={0}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
