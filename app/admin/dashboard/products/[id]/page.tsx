'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import styles from './edit.module.css';

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id?: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_price: number | null;
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  categories: Category[];
  images: any[];
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    sku: '',
    stock_quantity: '0',
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    params.then((p) => {
      setProductId(p.id);
      fetchProduct(p.id);
      fetchImages(p.id);
    });
    fetchCategories();
  }, []);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`);
      const data = await response.json();
      setProduct(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        short_description: data.short_description || '',
        price: data.price.toString(),
        compare_price: data.compare_price?.toString() || '',
        sku: data.sku || '',
        stock_quantity: data.stock_quantity.toString(),
        is_featured: data.is_featured,
        is_active: data.is_active,
      });
      setSelectedCategories(data.categories.map((c: Category) => c.id));
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
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

  const fetchImages = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/images`);
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
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

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
      stock_quantity: parseInt(formData.stock_quantity),
      categories: selectedCategories,
    };

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/admin/dashboard/products');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Product</h1>
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
            />
          </div>

          <div className={styles.formGroup}>
            <label>Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
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
            productId={productId}
            images={images}
            onImagesChange={setImages}
            mode="edit"
          />
        </div>

        <div className={styles.formCard}>
          <h2>Categories</h2>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <label key={category.id} className={styles.categoryCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
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
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
