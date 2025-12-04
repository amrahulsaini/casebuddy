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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
      });

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Products</h1>
        <Link href="/admin/dashboard/products/new" className={styles.addButton}>
          + Add Product
        </Link>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
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
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
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
