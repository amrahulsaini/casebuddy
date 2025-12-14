'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart, Star, Grid3x3, List, Eye, User, Menu, Truck, Package, Zap, Instagram, Facebook, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import { getShippingConfig } from '@/lib/shipping';
import styles from './shop.module.css';
import homeStyles from '../../home.module.css';

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
  const { freeShippingThreshold } = getShippingConfig();
  const params = useParams();
  const categorySlug = params?.slug as string;
  const { toggleWishlist, isInWishlist } = useCart();

  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 24;

  useEffect(() => {
    if (!categorySlug) return;
    
    setLoading(true);
    const offset = (currentPage - 1) * productsPerPage;
    
    Promise.all([
      fetch(`/api/products?category=${categorySlug}&limit=${productsPerPage}&offset=${offset}`).then(res => res.json()),
      fetch(`/api/categories/${categorySlug}`).then(res => res.json())
    ]).then(([productsData, categoryData]) => {
      if (productsData.success) {
        setProducts(productsData.products);
        setTotalProducts(productsData.total || 0);
      }
      if (categoryData.success) {
        setCategory(categoryData.category);
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error loading shop data:', error);
      setLoading(false);
    });
  }, [categorySlug, currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      setScrollY(currentScrollY);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handleToggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
            <span><Truck size={16} /> Free Shipping Above ₹{freeShippingThreshold}</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
            <span><Truck size={16} /> Free Shipping Above ₹{freeShippingThreshold}</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`${homeStyles.header} ${scrollY > 50 ? homeStyles.scrolled : ''} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} className={homeStyles.logoImg} priority />
          </Link>
          <div className={homeStyles.navLinks}>
            <Link href="/" className={homeStyles.navLink}>Home</Link>
            <Link href="/shop" className={homeStyles.navLink}>Shop</Link>
            <Link href="/about" className={homeStyles.navLink}>About</Link>
            <Link href="/contact" className={homeStyles.navLink}>Contact</Link>
          </div>
          <div className={homeStyles.navActions}>
            <SearchBar />
            <Link href="/wishlist" className={homeStyles.iconButton}>
              <Heart size={22} />
              <WishlistBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/cart" className={homeStyles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/orders" className={homeStyles.iconButton}>
              <User size={22} />
            </Link>
            <button className={homeStyles.mobileMenu} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={homeStyles.mobileNav}>
          <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      <main className={styles.container}>
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
          <span className={styles.resultCount}>{totalProducts} Products</span>
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
              <button 
                className={`${styles.wishlistButton} ${isInWishlist(product.id) ? styles.wishlisted : ''}`}
                onClick={(e) => handleToggleWishlist(e, product.id)}
              >
                <Heart size={20} fill={isInWishlist(product.id) ? '#ff6b00' : 'none'} />
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
              <div className={styles.productActions}>
                <Link 
                  href={`/shop/${categorySlug}/${product.slug}`}
                  className={styles.iconButton}
                  title="View Details"
                >
                  <Eye size={20} />
                </Link>
              </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className={styles.pageNumbers}>
            {(() => {
              const pages = [];
              const showEllipsisStart = currentPage > 3;
              const showEllipsisEnd = currentPage < totalPages - 2;

              // Always show first page
              pages.push(
                <button
                  key={1}
                  className={`${styles.pageNumber} ${currentPage === 1 ? styles.activePage : ''}`}
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </button>
              );

              // Show ellipsis if current page is far from start
              if (showEllipsisStart) {
                pages.push(
                  <span key="ellipsis-start" className={styles.ellipsis}>...</span>
                );
              }

              // Show pages around current page
              const start = Math.max(2, currentPage - 1);
              const end = Math.min(totalPages - 1, currentPage + 1);

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`${styles.pageNumber} ${currentPage === i ? styles.activePage : ''}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }

              // Show ellipsis if current page is far from end
              if (showEllipsisEnd) {
                pages.push(
                  <span key="ellipsis-end" className={styles.ellipsis}>...</span>
                );
              }

              // Always show last page (if more than 1 page)
              if (totalPages > 1) {
                pages.push(
                  <button
                    key={totalPages}
                    className={`${styles.pageNumber} ${currentPage === totalPages ? styles.activePage : ''}`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>
          <button 
            className={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      </main>

      {/* Footer */}
      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerContent}>
          <div className={homeStyles.footerSection}>
            <div className={homeStyles.footerLogo}>
              <div className={homeStyles.footerLogoWrapper}>
                <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={160} height={45} />
              </div>
            </div>
            <p className={homeStyles.footerDesc}>
              Your one-stop shop for premium custom phone cases. Protect your device with style.
            </p>
            <div className={homeStyles.socialLinks}>
              <a href="https://www.instagram.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/918107624752" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <MessageCircle size={24} />
              </a>
            </div>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Quick Links</h4>
            <ul className={homeStyles.footerLinks}>
              <li><Link href="/shop">Shop All</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Customer Service</h4>
            <ul className={homeStyles.footerLinks}>
              <li><Link href="/shipping">Shipping Info</Link></li>
              <li><Link href="/returns">Returns & Exchanges</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Contact Us</h4>
            <ul className={homeStyles.footerContact}>
              <li>
                <Phone size={20} />
                <span>+918107624752</span>
              </li>
              <li>
                <Mail size={20} />
                <a href="mailto:info@casebuddy.co.in">info@casebuddy.co.in</a>
              </li>
              <li>
                <MapPin size={20} />
                <span>Rajgarh, Rajasthan 331023</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={homeStyles.footerBottom}>
          <p className={homeStyles.footerText}>
            © 2025 CaseBuddy. All rights reserved.
          </p>
          <div className={homeStyles.paymentMethods}>
            <span>We Accept:</span>
            <div className={homeStyles.paymentIcons}>💳 UPI | Cards | Wallets</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
