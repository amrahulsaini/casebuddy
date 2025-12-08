'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PhoneBrand {
  id: number;
  name: string;
  slug: string;
}

interface PhoneModel {
  id: number;
  brand_id: number;
  model_name: string;
  slug: string;
}

export default function CategoryPhonesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPhoneBrands, setAllPhoneBrands] = useState<PhoneBrand[]>([]);
  const [allPhoneModels, setAllPhoneModels] = useState<PhoneModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAllPhoneBrands();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      // Clear previous selections first
      setSelectedBrands([]);
      setSelectedModels([]);
      // Then fetch new data
      fetchCategoryPhones(selectedCategory);
    } else {
      // If no category selected, clear everything
      setSelectedBrands([]);
      setSelectedModels([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
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

  const fetchAllPhoneBrands = async () => {
    try {
      const response = await fetch('/api/admin/phone-brands');
      const data = await response.json();
      if (data.success) {
        setAllPhoneBrands(data.brands);
        // Fetch all models for all brands
        const modelsPromises = data.brands.map((brand: PhoneBrand) =>
          fetch(`/api/admin/phone-brands/${brand.id}/models`).then(res => res.json())
        );
        const modelsResults = await Promise.all(modelsPromises);
        const allModels: PhoneModel[] = [];
        modelsResults.forEach(result => {
          if (result.success && result.models) {
            allModels.push(...result.models);
          }
        });
        setAllPhoneModels(allModels);
      }
    } catch (error) {
      console.error('Error fetching phone brands:', error);
    }
  };

  const fetchCategoryPhones = async (categoryId: number) => {
    try {
      // Fetch category brands
      const brandsResponse = await fetch(`/api/admin/categories/${categoryId}/phone-brands`);
      const brandsData = await brandsResponse.json();
      if (brandsData.success) {
        setSelectedBrands(brandsData.brands.map((b: any) => b.id));
      }

      // Fetch category models
      const modelsResponse = await fetch(`/api/admin/categories/${categoryId}/phone-models`);
      const modelsData = await modelsResponse.json();
      if (modelsData.success) {
        setSelectedModels(modelsData.models.map((m: any) => m.id));
      }
    } catch (error) {
      console.error('Error fetching category phones:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      // Save brands
      const brandsResponse = await fetch(`/api/admin/categories/${selectedCategory}/phone-brands`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_ids: selectedBrands }),
      });

      // Save models
      const modelsResponse = await fetch(`/api/admin/categories/${selectedCategory}/phone-models`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_ids: selectedModels }),
      });

      if (brandsResponse.ok && modelsResponse.ok) {
        alert('Phone brands and models updated successfully!');
      } else {
        alert('Error updating phone brands/models');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleBrand = (brandId: number) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleModel = (modelId: number) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Manage Category Phone Compatibility</h1>
        <p className={styles.subtitle}>
          Configure which phone brands and models are available for each category
        </p>
      </div>

      <div className={styles.content}>
        {/* Category Selection */}
        <div className={styles.categorySelection}>
          <h2>Select Category</h2>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`${styles.categoryCard} ${
                  selectedCategory === category.id ? styles.active : ''
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className={styles.categoryName}>{category.name}</div>
                <div className={styles.categorySlug}>{category.slug}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Phone Brands & Models Configuration */}
        {selectedCategory && (
          <div className={styles.configSection}>
            <div className={styles.configHeader}>
              <h2>
                Configure Phones for:{' '}
                {categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Phone Brands */}
            <div className={styles.section}>
              <h3>Phone Brands</h3>
              <p className={styles.helpText}>
                Select which phone brands are compatible with this category
              </p>
              <div className={styles.brandGrid}>
                {allPhoneBrands.map((brand) => (
                  <label key={brand.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)}
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Phone Models - Grouped by Brand */}
            <div className={styles.section}>
              <h3>Phone Models</h3>
              <p className={styles.helpText}>
                Select specific models. Only models from selected brands are shown.
              </p>
              {selectedBrands.length === 0 ? (
                <div className={styles.emptyState}>
                  Select phone brands above to see available models
                </div>
              ) : (
                <div className={styles.modelsContainer}>
                  {allPhoneBrands
                    .filter(brand => selectedBrands.includes(brand.id))
                    .map(brand => {
                      const brandModels = allPhoneModels.filter(
                        m => m.brand_id === brand.id
                      );
                      if (brandModels.length === 0) return null;

                      return (
                        <div key={brand.id} className={styles.brandModelsGroup}>
                          <h4 className={styles.brandGroupTitle}>{brand.name}</h4>
                          <div className={styles.modelGrid}>
                            {brandModels.map(model => (
                              <label key={model.id} className={styles.checkbox}>
                                <input
                                  type="checkbox"
                                  checked={selectedModels.includes(model.id)}
                                  onChange={() => toggleModel(model.id)}
                                />
                                <span>{model.model_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedCategory && (
          <div className={styles.emptyState}>
            <p>Select a category above to configure phone compatibility</p>
          </div>
        )}
      </div>
    </div>
  );
}
