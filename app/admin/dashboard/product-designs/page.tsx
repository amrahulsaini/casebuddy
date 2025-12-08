'use client';

import { useState, useEffect } from 'react';
import styles from './product-designs.module.css';

interface Product {
  id: number;
  name: string;
}

interface ProductDesign {
  id: number;
  product_id: number;
  design_name: string;
  design_image_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function ProductDesignsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [designs, setDesigns] = useState<ProductDesign[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState<ProductDesign | null>(null);
  
  const [formData, setFormData] = useState({
    design_name: '',
    design_image_url: '',
    sort_order: 0,
    is_active: true
  });

  // Fetch all products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch designs when product is selected
  useEffect(() => {
    if (selectedProductId) {
      fetchDesigns(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchDesigns = async (productId: number) => {
    try {
      const res = await fetch(`/api/product-designs?product_id=${productId}`);
      const data = await res.json();
      setDesigns(data.designs || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  const handleOpenModal = (design?: ProductDesign) => {
    if (design) {
      setEditingDesign(design);
      setFormData({
        design_name: design.design_name,
        design_image_url: design.design_image_url,
        sort_order: design.sort_order,
        is_active: design.is_active
      });
    } else {
      setEditingDesign(null);
      setFormData({
        design_name: '',
        design_image_url: '',
        sort_order: designs.length,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDesign(null);
    setFormData({
      design_name: '',
      design_image_url: '',
      sort_order: 0,
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId) {
      alert('Please select a product first');
      return;
    }

    try {
      if (editingDesign) {
        // Update existing design
        const res = await fetch(`/api/product-designs/${editingDesign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          alert('Design updated successfully');
          fetchDesigns(selectedProductId);
          handleCloseModal();
        } else {
          alert('Failed to update design');
        }
      } else {
        // Create new design
        const res = await fetch('/api/product-designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            product_id: selectedProductId
          })
        });

        if (res.ok) {
          alert('Design created successfully');
          fetchDesigns(selectedProductId);
          handleCloseModal();
        } else {
          alert('Failed to create design');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const res = await fetch(`/api/product-designs/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Design deleted successfully');
        if (selectedProductId) fetchDesigns(selectedProductId);
      } else {
        alert('Failed to delete design');
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Product Designs Management</h1>

      <div className={styles.productSelector}>
        <label htmlFor="product">Select Product:</label>
        <select
          id="product"
          value={selectedProductId || ''}
          onChange={(e) => setSelectedProductId(Number(e.target.value))}
          className={styles.select}
        >
          <option value="">-- Choose a Product --</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProductId && (
        <>
          <div className={styles.actions}>
            <button onClick={() => handleOpenModal()} className={styles.addButton}>
              + Add New Design
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Design Name</th>
                  <th>Image</th>
                  <th>Sort Order</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {designs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.empty}>No designs found for this product</td>
                  </tr>
                ) : (
                  designs.map(design => (
                    <tr key={design.id}>
                      <td>{design.id}</td>
                      <td>{design.design_name}</td>
                      <td>
                        <img
                          src={design.design_image_url}
                          alt={design.design_name}
                          className={styles.thumbnail}
                        />
                      </td>
                      <td>{design.sort_order}</td>
                      <td>
                        <span className={design.is_active ? styles.active : styles.inactive}>
                          {design.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className={styles.actionButtons}>
                        <button
                          onClick={() => handleOpenModal(design)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(design.id)}
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
        </>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingDesign ? 'Edit Design' : 'Add New Design'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="design_name">Design Name *</label>
                <input
                  type="text"
                  id="design_name"
                  value={formData.design_name}
                  onChange={(e) => setFormData({ ...formData, design_name: e.target.value })}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="design_image_url">Image URL *</label>
                <input
                  type="text"
                  id="design_image_url"
                  value={formData.design_image_url}
                  onChange={(e) => setFormData({ ...formData, design_image_url: e.target.value })}
                  required
                  className={styles.input}
                />
                {formData.design_image_url && (
                  <img
                    src={formData.design_image_url}
                    alt="Preview"
                    className={styles.preview}
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="sort_order">Sort Order</label>
                <input
                  type="number"
                  id="sort_order"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className={styles.input}
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

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitButton}>
                  {editingDesign ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
