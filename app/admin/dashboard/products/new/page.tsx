'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import styles from './new.module.css';

interface Page {
  id: number;
  page_name: string;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  page_id: number;
}

interface Category {
  id: number;
  name: string;
  section_key: string | null;
  parent_id: number | null;
}

interface ProductImage {
  id?: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export default function ProductNewPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categorySortOrders, setCategorySortOrders] = useState<Record<number, number>>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    sku: '',
    stock_quantity: '999',
    is_featured: false,
    is_active: true,
    design_addon_enabled: false,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchSectionsForPage(selectedPage);
      setSelectedSection('');
      setSelectedCategories([]);
    } else {
      setSections([]);
      setCategories([]);
    }
  }, [selectedPage]);

  useEffect(() => {
    if (selectedSection) {
      fetchCategoriesForSection(selectedSection);
      setSelectedCategories([]);
    } else {
      setCategories([]);
    }
  }, [selectedSection]);

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

  const fetchCategoriesForSection = async (sectionKey: string) => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      // Filter categories by section_key and only parent categories
      const filtered = data.filter((cat: Category) => 
        cat.section_key === sectionKey && cat.parent_id === null
      );
      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      stock_quantity: parseInt(formData.stock_quantity),
      categories: selectedCategories.map(catId => ({
        categoryId: catId,
        sortOrder: categorySortOrders[catId] || 0
      })),
    };

    try {
      // Create the product first
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        const productId = result.productId;

        // Add all images to the product
        for (const image of images) {
          await fetch(`/api/admin/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(image),
          });
        }

        router.push('/admin/dashboard/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Add New Product</h1>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formCard}>
          <h2>Basic Information</h2>

          <div className={styles.formGroup}>
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Enter product name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="product-slug"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Short Description</label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) =>
                setFormData({ ...formData, short_description: e.target.value })
              }
              maxLength={500}
              placeholder="Brief description for product listing"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              placeholder="Detailed product description"
            />
          </div>
        </div>

        <div className={styles.formCard}>
          <h2>Pricing & Inventory</h2>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="299.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Compare Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.compare_price}
                onChange={(e) =>
                  setFormData({ ...formData, compare_price: e.target.value })
                }
                placeholder="399.00"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-001"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h2>Product Images</h2>
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            mode="create"
          />
          {images.length === 0 && (
            <p className={styles.hint}>Please upload at least one product image</p>
          )}
        </div>

        <div className={styles.formCard}>
          <h2>Categories (Select Page → Section → Category)</h2>
          
          <div className={styles.formGroup}>
            <label>1. Select Page *</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Choose a page...</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.page_name}
                </option>
              ))}
            </select>
          </div>

          {selectedPage && (
            <div className={styles.formGroup}>
              <label>2. Select Section *</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                required
                className={styles.select}
              >
                <option value="">Choose a section...</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.section_key}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSection && (
            <>
              <div className={styles.formGroup}>
                <label>3. Select Categories *</label>
                <div className={styles.categoryGrid}>
                  {categories.length === 0 ? (
                    <p className={styles.hint}>No categories found for this section</p>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className={styles.categoryItem}>
                        <label className={styles.categoryCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                          />
                          {category.name}
                        </label>
                        {selectedCategories.includes(category.id) && (
                          <input
                            type="number"
                            placeholder="Sort order"
                            value={categorySortOrders[category.id] || 0}
                            onChange={(e) => setCategorySortOrders(prev => ({
                              ...prev,
                              [category.id]: parseInt(e.target.value) || 0
                            }))}
                            className={styles.sortOrderInput}
                            min="0"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {selectedCategories.length === 0 && categories.length > 0 && (
                <p className={styles.hint}>Please select at least one category</p>
              )}
            </>
          )}
        </div>

        <div className={styles.formCard}>
          <h2>Settings</h2>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked })
              }
            />
            Featured Product
          </label>

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

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.design_addon_enabled}
              onChange={(e) =>
                setFormData({ ...formData, design_addon_enabled: e.target.checked })
              }
            />
            Enable Design Position Add-on (Right Design / Left Design)
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || selectedCategories.length === 0}
            className={styles.saveButton}
          >
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
