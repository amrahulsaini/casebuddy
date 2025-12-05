'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  section?: 'custom_cases' | 'device_categories';
  sort_order: number;
  is_active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    section: 'device_categories' as 'custom_cases' | 'device_categories',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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
      section: 'device_categories',
      sort_order: '0',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id?.toString() || '',
      section: category.section,
      sort_order: category.sort_order.toString(),
      is_active: category.is_active,
    });
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Categories</h1>
        <button onClick={handleAdd} className={styles.addButton}>
          + Add Category
        </button>
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
              {categories.map((category) => (
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
                <label>Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Section *</label>
                <select
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value as 'custom_cases' | 'device_categories' })
                  }
                  required
                >
                  <option value="custom_cases">Custom Cases (Homepage Section 1)</option>
                  <option value="device_categories">Device Categories (Homepage Section 2)</option>
                </select>
              </div>

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
