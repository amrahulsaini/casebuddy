'use client';

import { useState, useEffect } from 'react';
import styles from './customizations.module.css';

interface Product {
  id: number;
  name: string;
}

interface CustomizationType {
  id: number;
  type_name: string;
  display_name: string;
  input_type: string;
}

interface ProductCustomizationOption {
  id: number;
  customization_type_id: number;
  type_name: string;
  display_name: string;
  input_type: string;
  is_required: boolean;
  sort_order: number;
}

interface CustomizationValue {
  id: number;
  customization_type_id: number;
  product_id: number | null;
  value_name: string;
  value_data: string;
  price_modifier: number;
  sort_order: number;
  is_active: boolean;
}

export default function ProductCustomizationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customizationTypes, setCustomizationTypes] = useState<CustomizationType[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productOptions, setProductOptions] = useState<ProductCustomizationOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [values, setValues] = useState<CustomizationValue[]>([]);
  
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CustomizationValue | null>(null);

  const [optionForm, setOptionForm] = useState({
    customization_type_id: '',
    is_required: false,
    sort_order: 0
  });

  const [valueForm, setValueForm] = useState({
    value_name: '',
    value_data: '',
    price_modifier: 0,
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomizationTypes();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductOptions(selectedProductId);
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedOptionId) {
      const option = productOptions.find(o => o.id === selectedOptionId);
      if (option && selectedProductId) {
        fetchValues(option.customization_type_id, selectedProductId);
      }
    }
  }, [selectedOptionId]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCustomizationTypes = async () => {
    try {
      const res = await fetch('/api/customization-types');
      const data = await res.json();
      setCustomizationTypes(data.types || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProductOptions = async (productId: number) => {
    try {
      const res = await fetch(`/api/product-customization-options?product_id=${productId}`);
      const data = await res.json();
      setProductOptions(data.options || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchValues = async (typeId: number, productId: number) => {
    try {
      const res = await fetch(`/api/customization-values?customization_type_id=${typeId}&product_id=${productId}`);
      const data = await res.json();
      setValues(data.values || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    try {
      const res = await fetch('/api/product-customization-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          ...optionForm
        })
      });

      if (res.ok) {
        alert('Customization option added successfully!');
        fetchProductOptions(selectedProductId);
        setShowAddOptionModal(false);
        setOptionForm({ customization_type_id: '', is_required: false, sort_order: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add option');
    }
  };

  const handleRemoveOption = async (optionId: number) => {
    if (!confirm('Remove this customization option from product?')) return;

    try {
      const res = await fetch(`/api/product-customization-options?id=${optionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Option removed successfully!');
        if (selectedProductId) fetchProductOptions(selectedProductId);
        if (selectedOptionId === optionId) {
          setSelectedOptionId(null);
          setValues([]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    const option = productOptions.find(o => o.id === selectedOptionId);
    if (!option) return;

    try {
      if (editingValue) {
        const res = await fetch(`/api/customization-values/${editingValue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(valueForm)
        });

        if (res.ok) {
          alert('Value updated successfully!');
          fetchValues(option.customization_type_id, selectedProductId!);
          setShowAddValueModal(false);
          setEditingValue(null);
        }
      } else {
        const res = await fetch('/api/customization-values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customization_type_id: option.customization_type_id,
            product_id: selectedProductId,
            ...valueForm
          })
        });

        if (res.ok) {
          alert('Value added successfully!');
          fetchValues(option.customization_type_id, selectedProductId!);
          setShowAddValueModal(false);
        }
      }

      setValueForm({ value_name: '', value_data: '', price_modifier: 0, sort_order: 0, is_active: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteValue = async (valueId: number) => {
    if (!confirm('Delete this value?')) return;

    try {
      const res = await fetch(`/api/customization-values/${valueId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Value deleted successfully!');
        const option = productOptions.find(o => o.id === selectedOptionId);
        if (option && selectedProductId) {
          fetchValues(option.customization_type_id, selectedProductId);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEditValueModal = (value: CustomizationValue) => {
    setEditingValue(value);
    setValueForm({
      value_name: value.value_name,
      value_data: value.value_data,
      price_modifier: value.price_modifier,
      sort_order: value.sort_order,
      is_active: value.is_active
    });
    setShowAddValueModal(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Product Customizations Manager</h1>
      <p className={styles.subtitle}>Configure what customization options each product has (designs, styles, fonts, etc.)</p>

      {/* Step 1: Select Product */}
      <div className={styles.step}>
        <h2>Step 1: Select Product</h2>
        <select
          value={selectedProductId || ''}
          onChange={(e) => {
            setSelectedProductId(Number(e.target.value));
            setSelectedOptionId(null);
            setValues([]);
          }}
          className={styles.select}
        >
          <option value="">-- Choose a Product --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedProductId && (
        <>
          {/* Step 2: Manage Customization Options */}
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <h2>Step 2: Customization Options for This Product</h2>
              <button onClick={() => setShowAddOptionModal(true)} className={styles.addBtn}>
                + Add Customization Option
              </button>
            </div>

            {productOptions.length === 0 ? (
              <p className={styles.empty}>No customization options. Click "+ Add" to get started.</p>
            ) : (
              <div className={styles.optionsList}>
                {productOptions.map(opt => (
                  <div 
                    key={opt.id} 
                    className={`${styles.optionCard} ${selectedOptionId === opt.id ? styles.selected : ''}`}
                    onClick={() => setSelectedOptionId(opt.id)}
                  >
                    <div className={styles.optionInfo}>
                      <h3>{opt.display_name}</h3>
                      <p>Type: <strong>{opt.input_type}</strong></p>
                      <p>{opt.is_required ? 'Required' : 'Optional'}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveOption(opt.id); }}
                      className={styles.removeBtn}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Manage Values */}
          {selectedOptionId && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h2>Step 3: Manage Values</h2>
                <button onClick={() => { setEditingValue(null); setShowAddValueModal(true); }} className={styles.addBtn}>
                  + Add Value
                </button>
              </div>

              {values.length === 0 ? (
                <p className={styles.empty}>No values yet. Add some options for customers to choose from.</p>
              ) : (
                <div className={styles.valuesGrid}>
                  {values.map(val => (
                    <div key={val.id} className={styles.valueCard}>
                      {val.value_data && val.value_data.includes('image') && (
                        <img src={JSON.parse(val.value_data).image} alt={val.value_name} className={styles.valueImg} />
                      )}
                      <h4>{val.value_name}</h4>
                      <p>Price: +₹{val.price_modifier}</p>
                      <p className={val.is_active ? styles.activeTag : styles.inactiveTag}>
                        {val.is_active ? 'Active' : 'Inactive'}
                      </p>
                      <div className={styles.valueActions}>
                        <button onClick={() => openEditValueModal(val)} className={styles.editBtn}>Edit</button>
                        <button onClick={() => handleDeleteValue(val.id)} className={styles.deleteBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Option Modal */}
      {showAddOptionModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add Customization Option</h2>
            <form onSubmit={handleAddOption}>
              <div className={styles.formGroup}>
                <label>Customization Type</label>
                <select
                  value={optionForm.customization_type_id}
                  onChange={(e) => setOptionForm({ ...optionForm, customization_type_id: e.target.value })}
                  required
                >
                  <option value="">-- Select --</option>
                  {customizationTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.display_name} ({ct.input_type})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={optionForm.is_required}
                    onChange={(e) => setOptionForm({ ...optionForm, is_required: e.target.checked })}
                  />
                  Required
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={optionForm.sort_order}
                  onChange={(e) => setOptionForm({ ...optionForm, sort_order: Number(e.target.value) })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>Add</button>
                <button type="button" onClick={() => setShowAddOptionModal(false)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Value Modal */}
      {showAddValueModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingValue ? 'Edit Value' : 'Add Value'}</h2>
            <form onSubmit={handleAddValue}>
              <div className={styles.formGroup}>
                <label>Value Name</label>
                <input
                  type="text"
                  value={valueForm.value_name}
                  onChange={(e) => setValueForm({ ...valueForm, value_name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Value Data (JSON or text)</label>
                <textarea
                  value={valueForm.value_data}
                  onChange={(e) => setValueForm({ ...valueForm, value_data: e.target.value })}
                  placeholder='e.g., {"image": "/path/to/image.jpg"}'
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Price Modifier (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valueForm.price_modifier}
                  onChange={(e) => setValueForm({ ...valueForm, price_modifier: Number(e.target.value) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sort Order</label>
                <input
                  type="number"
                  value={valueForm.sort_order}
                  onChange={(e) => setValueForm({ ...valueForm, sort_order: Number(e.target.value) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={valueForm.is_active}
                    onChange={(e) => setValueForm({ ...valueForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>{editingValue ? 'Update' : 'Add'}</button>
                <button type="button" onClick={() => { setShowAddValueModal(false); setEditingValue(null); }} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
