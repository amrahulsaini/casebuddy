'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  categories: string;
  primary_image: string;
}

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
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPage, setFilterPage] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchProducts();
  }, [page, search, filterCategory]);

  useEffect(() => {
    if (filterPage) {
      fetchSectionsForPage(filterPage);
      setFilterSection('');
      setFilterCategory('');
    } else {
      setSections([]);
      setCategories([]);
    }
  }, [filterPage]);

  useEffect(() => {
    if (filterSection) {
      fetchCategoriesForSection(filterSection);
      setFilterCategory('');
    } else {
      setCategories([]);
    }
  }, [filterSection]);

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
      const filtered = data.filter((cat: Category) => cat.section_key === sectionKey);
      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
      });

      if (filterCategory) {
        params.append('category', filterCategory);
      }

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelectProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedProducts).map(id =>
        fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Some products failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Generate pagination page numbers with ellipsis
  const generatePagination = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Render pagination component
  const renderPagination = () => (
    <div className={styles.paginationCompact}>
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className={styles.paginationButton}
      >
        Previous
      </button>
      
      <div className={styles.pageNumbers}>
        {generatePagination().map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                ...
              </span>
            );
          }
          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum as number)}
              className={`${styles.pageNumber} ${
                page === pageNum ? styles.activePageNumber : ''
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className={styles.paginationButton}
      >
        Next
      </button>
      
      <select
        value={page}
        onChange={(e) => setPage(Number(e.target.value))}
        className={styles.pagePicker}
        title="Jump to page"
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <option key={p} value={p}>
            Page {p}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Products</h1>
        <div className={styles.headerActions}>
          {totalPages > 1 && renderPagination()}
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className={styles.bulkDeleteButton}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : `Delete Selected (${selectedProducts.size})`}
            </button>
          )}
          <Link href="/admin/dashboard/products/new" className={styles.addButton}>
            + Add Product
          </Link>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Filter by Page:</label>
          <select
            value={filterPage}
            onChange={(e) => {
              setFilterPage(e.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">All Pages</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.page_name}
              </option>
            ))}
          </select>
        </div>

        {filterPage && (
          <div className={styles.filterGroup}>
            <label>Filter by Section:</label>
            <select
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setPage(1);
              }}
              className={styles.select}
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.section_key}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterSection && (
          <div className={styles.filterGroup}>
            <label>Filter by Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className={styles.select}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
        
        {(filterPage || filterSection || filterCategory) && (
          <button
            onClick={() => {
              setFilterPage('');
              setFilterSection('');
              setFilterCategory('');
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
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedProducts.size === products.length}
                      onChange={toggleSelectAll}
                      className={styles.checkbox}
                    />
                  </th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Categories</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td>
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.noImage}>No image</div>
                      )}
                    </td>
                    <td>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productSlug}>{product.slug}</div>
                    </td>
                    <td>{product.slug.toUpperCase()}</td>
                    <td>₹{parseFloat(product.price.toString()).toFixed(2)}</td>
                    <td>{product.stock_quantity}</td>
                    <td>{product.categories || '-'}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          product.is_active ? styles.active : styles.inactive
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/dashboard/products/${product.id}`}
                          className={styles.editButton}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
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

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {generatePagination().map((pageNum, idx) => {
                  if (pageNum === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum as number)}
                      className={`${styles.pageNumber} ${
                        page === pageNum ? styles.activePageNumber : ''
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
