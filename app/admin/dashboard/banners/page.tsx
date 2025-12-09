'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import styles from './banners.module.css';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_link: string;
  gradient: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export default function HeroBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({});

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/hero-banners');
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData(banner);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/hero-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchBanners();
        handleCancel();
      }
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch(`/api/admin/hero-banners?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBanners();
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleAdd = async () => {
    const newBanner = {
      title: 'New Banner',
      subtitle: 'Add Subtitle',
      description: 'Add description here',
      cta_text: 'Click Here',
      cta_link: '/shop',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      image_url: '',
      sort_order: banners.length + 1,
      is_active: true
    };

    try {
      const response = await fetch('/api/admin/hero-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner),
      });

      if (response.ok) {
        await fetchBanners();
      }
    } catch (error) {
      console.error('Error creating banner:', error);
    }
  };

  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hero Banners</h1>
          <p className={styles.subtitle}>Manage homepage slider banners</p>
        </div>
        <button onClick={handleAdd} className={styles.addBtn}>
          <Plus size={20} />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading banners...</div>
      ) : (
        <div className={styles.bannersGrid}>
          {banners.map((banner) => (
            <div key={banner.id} className={styles.bannerCard}>
              {editingId === banner.id ? (
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Background Image URL (optional - overrides gradient)</label>
                    <input
                      type="text"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className={styles.input}
                      placeholder="https://example.com/image.jpg or /cdn/banner.jpg"
                    />
                    {formData.image_url && (
                      <div className={styles.imagePreview}>
                        <img src={formData.image_url} alt="Preview" />
                      </div>
                    )}
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Button Text</label>
                      <input
                        type="text"
                        value={formData.cta_text || ''}
                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Button Link</label>
                      <input
                        type="text"
                        value={formData.cta_link || ''}
                        onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Gradient (choose preset or enter custom)</label>
                    <div className={styles.gradientPicker}>
                      {gradientPresets.map((grad, idx) => (
                        <div
                          key={idx}
                          className={styles.gradientSwatch}
                          style={{ background: grad }}
                          onClick={() => setFormData({ ...formData, gradient: grad })}
                          title={grad}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.gradient || ''}
                      onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                      className={styles.input}
                      placeholder="linear-gradient(...)"
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button onClick={handleSave} className={styles.saveBtn}>
                      <Save size={18} />
                      Save
                    </button>
                    <button onClick={handleCancel} className={styles.cancelBtn}>
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className={styles.preview} 
                    style={{ 
                      background: banner.image_url 
                        ? `url(${banner.image_url}) center/cover no-repeat` 
                        : banner.gradient 
                    }}
                  >
                    <h3>{banner.title}</h3>
                    <p>{banner.subtitle}</p>
                  </div>
                  <div className={styles.bannerInfo}>
                    <div className={styles.bannerMeta}>
                      <strong>{banner.title}</strong>
                      <span>Order: {banner.sort_order}</span>
                      <span className={banner.is_active ? styles.active : styles.inactive}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={styles.bannerActions}>
                      <button onClick={() => handleEdit(banner)} className={styles.iconBtn}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(banner.id)} className={styles.iconBtnDanger}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
