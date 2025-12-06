'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface PhoneBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PhoneModel {
  id: number;
  brand_id: number;
  model_name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export default function PhoneBrandsPage() {
  const [brands, setBrands] = useState<PhoneBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<PhoneBrand | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [editingModel, setEditingModel] = useState<PhoneModel | null>(null);

  const [brandFormData, setBrandFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    sort_order: '0',
    is_active: true,
  });

  const [modelFormData, setModelFormData] = useState({
    model_name: '',
    slug: '',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/phone-brands');
      const data = await response.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (brandId: number) => {
    try {
      const response = await fetch(`/api/admin/phone-brands/${brandId}/models`);
      const data = await response.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleAddBrand = () => {
    setEditingBrand(null);
    setBrandFormData({
      name: '',
      slug: '',
      logo_url: '',
      sort_order: '0',
      is_active: true,
    });
    setShowBrandModal(true);
  };

  const handleEditBrand = (brand: PhoneBrand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || '',
      sort_order: brand.sort_order.toString(),
      is_active: brand.is_active,
    });
    setShowBrandModal(true);
  };

  const handleDeleteBrand = async (id: number) => {
    if (!confirm('Are you sure? This will delete all associated models.')) return;

    try {
      await fetch(`/api/admin/phone-brands/${id}`, { method: 'DELETE' });
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  const handleBrandNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setBrandFormData({ ...brandFormData, name, slug });
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...brandFormData,
      sort_order: parseInt(brandFormData.sort_order),
    };

    try {
      if (editingBrand) {
        await fetch(`/api/admin/phone-brands/${editingBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/admin/phone-brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setShowBrandModal(false);
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
    }
  };

  const handleManageModels = async (brandId: number) => {
    setSelectedBrandId(brandId);
    await fetchModels(brandId);
    setShowModelsModal(true);
  };

  const handleAddModel = () => {
    setEditingModel(null);
    setModelFormData({
      model_name: '',
      slug: '',
      sort_order: '0',
      is_active: true,
    });
  };

  const handleEditModel = (model: PhoneModel) => {
    setEditingModel(model);
    setModelFormData({
      model_name: model.model_name,
      slug: model.slug,
      sort_order: model.sort_order.toString(),
      is_active: model.is_active,
    });
  };

  const handleModelNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setModelFormData({ ...modelFormData, model_name: name, slug });
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandId) return;

    const data = {
      ...modelFormData,
      sort_order: parseInt(modelFormData.sort_order),
    };

    try {
      if (editingModel) {
        await fetch(`/api/admin/phone-brands/${selectedBrandId}/models/${editingModel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch(`/api/admin/phone-brands/${selectedBrandId}/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setEditingModel(null);
      setModelFormData({
        model_name: '',
        slug: '',
        sort_order: '0',
        is_active: true,
      });
      await fetchModels(selectedBrandId);
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    if (!selectedBrandId || !confirm('Delete this model?')) return;

    try {
      await fetch(`/api/admin/phone-brands/${selectedBrandId}/models/${modelId}`, {
        method: 'DELETE',
      });
      await fetchModels(selectedBrandId);
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  const getModelCount = (brandId: number) => {
    // This would need to be fetched from API in a real implementation
    return '—';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Phone Brands & Models</h1>
        <button onClick={handleAddBrand} className={styles.addButton}>
          + Add Brand
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Models</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td>
                    <div className={styles.brandInfo}>
                      <div>
                        <div className={styles.brandName}>{brand.name}</div>
                        <div className={styles.brandSlug}>{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.modelCount}>{getModelCount(brand.id)}</td>
                  <td>{brand.sort_order}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        brand.is_active ? styles.active : styles.inactive
                      }`}
                    >
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleManageModels(brand.id)}
                        className={styles.manageModelsButton}
                      >
                        Models
                      </button>
                      <button
                        onClick={() => handleEditBrand(brand)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand.id)}
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

      {/* Brand Modal */}
      {showBrandModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
            <form onSubmit={handleBrandSubmit}>
              <div className={styles.formGroup}>
                <label>Brand Name *</label>
                <input
                  type="text"
                  value={brandFormData.name}
                  onChange={(e) => handleBrandNameChange(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Slug *</label>
                <input
                  type="text"
                  value={brandFormData.slug}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Logo URL</label>
                <input
                  type="text"
                  value={brandFormData.logo_url}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, logo_url: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={brandFormData.sort_order}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, sort_order: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={brandFormData.is_active}
                    onChange={(e) =>
                      setBrandFormData({ ...brandFormData, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Models Modal */}
      {showModelsModal && selectedBrandId && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Manage Models - {brands.find(b => b.id === selectedBrandId)?.name}</h2>
            
            <div className={styles.modelsSection}>
              <h3>Phone Models</h3>
              <div className={styles.modelsList}>
                {models.map((model) => (
                  <div key={model.id} className={styles.modelItem}>
                    <div>
                      <div className={styles.modelName}>{model.model_name}</div>
                      <div className={styles.brandSlug}>{model.slug}</div>
                    </div>
                    <div className={styles.modelActions}>
                      <button
                        onClick={() => handleEditModel(model)}
                        className={styles.modelEditButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className={styles.modelDeleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Model Form */}
              <form onSubmit={handleModelSubmit} style={{ marginTop: '20px' }}>
                <div className={styles.formGroup}>
                  <label>Model Name *</label>
                  <input
                    type="text"
                    value={modelFormData.model_name}
                    onChange={(e) => handleModelNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Slug *</label>
                  <input
                    type="text"
                    value={modelFormData.slug}
                    onChange={(e) =>
                      setModelFormData({ ...modelFormData, slug: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={modelFormData.sort_order}
                    onChange={(e) =>
                      setModelFormData({ ...modelFormData, sort_order: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={modelFormData.is_active}
                      onChange={(e) =>
                        setModelFormData({ ...modelFormData, is_active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>
                    {editingModel ? 'Update Model' : 'Add Model'}
                  </button>
                  {editingModel && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingModel(null);
                        setModelFormData({
                          model_name: '',
                          slug: '',
                          sort_order: '0',
                          is_active: true,
                        });
                      }}
                      className={styles.cancelButton}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className={styles.formActions} style={{ marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowModelsModal(false);
                  setSelectedBrandId(null);
                  setModels([]);
                }}
                className={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
