'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Menu,
  Package,
  Phone,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  Zap,
} from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/contexts/CartContext';
import styles from './wishlist.module.css';
import homeStyles from '../home.module.css';

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
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  return (
    <div className={styles.page}>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
            <span><Truck size={16} /> Free Shipping Above ₹499</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
            <span><Truck size={16} /> Free Shipping Above ₹499</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`${homeStyles.header} ${scrollY > 50 ? homeStyles.scrolled : ''} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles.logo}>
            <Image
              src="/casebuddy-logo.png"
              alt="CaseBuddy"
              width={180}
              height={50}
              className={homeStyles.logoImg}
              priority
            />
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
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Heart size={80} className={styles.emptyIcon} />
            <h1>Your Wishlist is Empty</h1>
            <p>Save your favorite items for later!</p>
            <Link href="/" className={styles.shopButton}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <Link href="/" className={styles.backButton}>
                <ArrowLeft size={20} />
                Continue Shopping
              </Link>
              <h1>
                My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
              </h1>
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
          </>
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
              <a
                href="https://www.instagram.com/casebuddy25"
                target="_blank"
                rel="noopener noreferrer"
                className={homeStyles.socialIcon}
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/share/17fhSRLQR4/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className={homeStyles.socialIcon}
              >
                <Facebook size={24} />
              </a>
              <a
                href="https://wa.me/918107624752"
                target="_blank"
                rel="noopener noreferrer"
                className={homeStyles.socialIcon}
              >
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
