'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  section_key: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Page {
  id: number;
  page_key: string;
  page_name: string;
  slug: string;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  page_id: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Filters
  const [filterPageId, setFilterPageId] = useState<string>('');
  const [filterSectionKey, setFilterSectionKey] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    section_key: '',
    page_id: '',
    sort_order: '0',
    is_active: true,
  });

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchPages();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (filterPageId) {
      fetchSectionsForPage(filterPageId);
    } else {
      setSections([]);
      setFilterSectionKey('');
    }
  }, [filterPageId]);

  useEffect(() => {
    if (formData.page_id) {
      fetchSectionsForPage(formData.page_id);
    }
  }, [formData.page_id]);

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchSectionsForPage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}/sections`);
      if (response.ok) {
        const data = await response.json();
        setSections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: '',
      section_key: '',
      page_id: '',
      sort_order: '0',
      is_active: true,
    });
    setImagePreview('');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'category');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image_url: data.url }));
      setImagePreview(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    
    // Find page_id from section_key
    const section = sections.find(s => s.section_key === category.section_key);
    const pageId = section?.page_id?.toString() || '';
    
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id?.toString() || '',
      section_key: category.section_key || '',
      page_id: pageId,
      sort_order: category.sort_order.toString(),
      is_active: category.is_active,
    });
    setImagePreview(category.image_url || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      section_key: formData.section_key || null,
      sort_order: parseInt(formData.sort_order),
    };

    try {
      if (editingCategory) {
        await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData({ ...formData, name, slug });
  };

  const getCategoryPath = (category: Category): string => {
    if (!category.parent_id) return category.name;
    const parent = categories.find((c) => c.id === category.parent_id);
    return parent ? `${parent.name} > ${category.name}` : category.name;
  };

  const filteredCategories = categories.filter((category) => {
    if (filterPageId && filterSectionKey) {
      return category.section_key === filterSectionKey;
    }
    if (filterSectionKey) {
      return category.section_key === filterSectionKey;
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Categories</h1>
        <button onClick={handleAdd} className={styles.addButton}>
          + Add Category
        </button>
      </div>

      {/* Hierarchical Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Filter by Page:</label>
          <select
            value={filterPageId}
            onChange={(e) => setFilterPageId(e.target.value)}
            className={styles.select}
          >
            <option value="">All Pages</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.page_name}
              </option>
            ))}
          </select>
        </div>

        {filterPageId && (
          <div className={styles.filterGroup}>
            <label>Filter by Section:</label>
            <select
              value={filterSectionKey}
              onChange={(e) => setFilterSectionKey(e.target.value)}
              className={styles.select}
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.section_key}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {(filterPageId || filterSectionKey) && (
          <button
            onClick={() => {
              setFilterPageId('');
              setFilterSectionKey('');
            }}
            className={styles.clearButton}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className={styles.categoryName}>
                      {getCategoryPath(category)}
                    </div>
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    {category.parent_id
                      ? categories.find((c) => c.id === category.parent_id)
                          ?.name || '-'
                      : 'Root'}
                  </td>
                  <td>{category.sort_order}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        category.is_active ? styles.active : styles.inactive
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEdit(category)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className={styles.fileInput}
                />
                {uploading && <span className={styles.uploadingText}>Uploading...</span>}
                {(imagePreview || formData.image_url) && (
                  <div className={styles.imagePreview}>
                    <Image
                      src={imagePreview || formData.image_url}
                      width={200}
                      height={200}
                      alt="Category preview"
                      className={styles.previewImage}
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Page (for parent categories)</label>
                <select
                  value={formData.page_id}
                  onChange={(e) =>
                    setFormData({ ...formData, page_id: e.target.value, section_key: '' })
                  }
                  disabled={!!formData.parent_id}
                >
                  <option value="">None</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.page_name}
                    </option>
                  ))}
                </select>
                {formData.parent_id && (
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    Only root categories can be assigned to pages
                  </small>
                )}
              </div>

              {formData.page_id && !formData.parent_id && (
                <div className={styles.formGroup}>
                  <label>Section *</label>
                  <select
                    value={formData.section_key}
                    onChange={(e) =>
                      setFormData({ ...formData, section_key: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.section_key}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
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

              <div className={styles.formGroup}>
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
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
