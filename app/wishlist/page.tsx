'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import styles from './wishlist.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  image_url: string;
  stock_quantity: number;
  category_slug: string;
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch product details for wishlist items
    fetch(`/api/products/wishlist?ids=${wishlist.join(',')}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching wishlist products:', error);
        setLoading(false);
      });
  }, [wishlist]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <Heart size={80} className={styles.emptyIcon} />
        <h1>Your Wishlist is Empty</h1>
        <p>Save your favorite items for later!</p>
        <Link href="/" className={styles.shopButton}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          Continue Shopping
        </Link>
        <h1>My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})</h1>
      </div>

      <div className={styles.grid}>
        {products.map((product) => {
          const discount = product.compare_price 
            ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
            : 0;

          return (
            <div key={product.id} className={styles.card}>
              <Link href={`/shop/${product.category_slug}/${product.slug}`} className={styles.imageWrapper}>
                <Image 
                  src={product.image_url || '/placeholder.jpg'} 
                  alt={product.name}
                  width={300}
                  height={400}
                  className={styles.image}
                />
                {discount > 0 && (
                  <span className={styles.badge}>-{discount}%</span>
                )}
              </Link>

              <button 
                onClick={() => toggleWishlist(product.id)}
                className={styles.removeButton}
                title="Remove from wishlist"
              >
                <Trash2 size={18} />
              </button>

              <div className={styles.details}>
                <Link href={`/shop/${product.category_slug}/${product.slug}`}>
                  <h3 className={styles.name}>{product.name}</h3>
                </Link>

                <div className={styles.priceRow}>
                  <span className={styles.price}>₹{product.price}</span>
                  {product.compare_price && (
                    <span className={styles.comparePrice}>₹{product.compare_price}</span>
                  )}
                </div>

                <Link 
                  href={`/shop/${product.category_slug}/${product.slug}`}
                  className={styles.viewButton}
                >
                  View Product
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
