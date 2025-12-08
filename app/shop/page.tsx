'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './shop.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  image_url: string;
  category_name: string;
  category_slug: string;
  stock_quantity: number;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy, priceRange]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(p => {
        const price = p.sale_price || p.price;
        if (priceRange === '0-500') return price <= 500;
        if (priceRange === '500-1000') return price > 500 && price <= 1000;
        if (priceRange === '1000-2000') return price > 1000 && price <= 2000;
        if (priceRange === '2000+') return price > 2000;
        return true;
      });
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(filtered);
  };

  const calculateDiscount = (price: number, salePrice: number | null) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading amazing products...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Discover Our Collection</h1>
        <p className={styles.heroSubtitle}>Premium phone cases designed for style and protection</p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>

          <select 
            value={priceRange} 
            onChange={(e) => setPriceRange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Prices</option>
            <option value="0-500">Under ₹500</option>
            <option value="500-1000">₹500 - ₹1000</option>
            <option value="1000-2000">₹1000 - ₹2000</option>
            <option value="2000+">Above ₹2000</option>
          </select>
        </div>
      </div>

      <div className={styles.resultsInfo}>
        <p>{filteredProducts.length} products found</p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.noResults}>
          <svg className={styles.noResultsIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => {
            const discount = calculateDiscount(product.price, product.sale_price);
            const finalPrice = product.sale_price || product.price;
            const isOnSale = product.sale_price && product.sale_price < product.price;

            return (
              <Link 
                href={`/shop/${product.category_slug}/${product.slug}`} 
                key={product.id}
                className={styles.productCard}
              >
                <div className={styles.imageWrapper}>
                  {isOnSale && (
                    <div className={styles.badge}>
                      {discount}% OFF
                    </div>
                  )}
                  {product.stock_quantity === 0 && (
                    <div className={styles.outOfStock}>Out of Stock</div>
                  )}
                  <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    width={400}
                    height={400}
                    className={styles.productImage}
                  />
                  <div className={styles.imageOverlay}>
                    <span className={styles.viewButton}>View Details</span>
                  </div>
                </div>

                <div className={styles.productInfo}>
                  <p className={styles.category}>{product.category_name}</p>
                  <h3 className={styles.productName}>{product.name}</h3>
                  {product.description && (
                    <p className={styles.description}>{product.description.slice(0, 80)}...</p>
                  )}
                  
                  <div className={styles.priceSection}>
                    <div className={styles.priceRow}>
                      <span className={styles.currentPrice}>₹{finalPrice.toFixed(2)}</span>
                      {isOnSale && (
                        <span className={styles.originalPrice}>₹{product.price.toFixed(2)}</span>
                      )}
                    </div>
                    {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                      <p className={styles.lowStock}>Only {product.stock_quantity} left!</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
