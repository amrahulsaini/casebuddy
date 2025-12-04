'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart, Star, Filter, Grid3x3, List } from 'lucide-react';
import styles from './shop.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  price: number;
  compare_price: number | null;
  is_featured: boolean;
  image_url: string;
  alt_text: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function ShopPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    Promise.all([
      fetch(`/api/products?category=${categorySlug}`).then(res => res.json()),
      fetch(`/api/categories/${categorySlug}`).then(res => res.json())
    ]).then(([productsData, categoryData]) => {
      if (productsData.success) {
        setProducts(productsData.products);
      }
      if (categoryData.success) {
        setCategory(categoryData.category);
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error loading shop data:', error);
      setLoading(false);
    });
  }, [categorySlug]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} priority />
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/shop" className={styles.navLink}>Shop</Link>
            <Link href="/templates" className={styles.navLink}>Templates</Link>
            <Link href="/contact" className={styles.navLink}>Contact</Link>
          </div>
          <div className={styles.navActions}>
            <button className={styles.iconButton}>
              <Heart size={22} />
            </button>
            <button className={styles.iconButton}>
              <ShoppingCart size={22} />
              <span className={styles.cartBadge}>0</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Category Header */}
      <section className={styles.categoryHeader}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
        <h1 className={styles.categoryTitle}>{category?.name || 'Products'}</h1>
        <p className={styles.categoryDescription}>{category?.description}</p>
      </section>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.resultCount}>{products.length} Products</span>
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 size={20} />
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={viewMode === 'grid' ? styles.productsGrid : styles.productsList}>
        {products.map((product) => (
          <Link 
            key={product.id}
            href={`/shop/${categorySlug}/${product.slug}`}
            className={styles.productCard}
          >
            <div className={styles.productImageWrapper}>
              <Image 
                src={product.image_url || '/products/default.jpg'}
                alt={product.alt_text || product.name}
                width={300}
                height={400}
                className={styles.productImage}
                loading="lazy"
              />
              {product.compare_price && product.compare_price > product.price && (
                <div className={styles.discountBadge}>
                  {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                </div>
              )}
              <button className={styles.wishlistButton}>
                <Heart size={20} />
              </button>
            </div>
            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <div className={styles.productRating}>
                <Star size={14} fill="#FFD700" color="#FFD700" />
                <Star size={14} fill="#FFD700" color="#FFD700" />
                <Star size={14} fill="#FFD700" color="#FFD700" />
                <Star size={14} fill="#FFD700" color="#FFD700" />
                <Star size={14} fill="#E0E0E0" color="#E0E0E0" />
                <span className={styles.ratingCount}>(4.0)</span>
              </div>
              <div className={styles.productPrice}>
                <span className={styles.price}>₹{product.price.toFixed(2)}</span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className={styles.comparePrice}>₹{product.compare_price.toFixed(2)}</span>
                )}
              </div>
              <button className={styles.addToCartButton}>
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <p>No products found in this category.</p>
          <Link href="/" className={styles.backHomeButton}>
            Back to Home
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2025 CaseBuddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
