'use client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Gift, Star, Truck, ShieldCheck, Heart, ShoppingCart, User, Menu, Instagram, Facebook, Twitter, Mail, Phone, MapPin, Package, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './dynamic-page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

interface Section {
  id: number;
  section_key: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  categories: Category[];
}

interface PageData {
  page: {
    id: number;
    page_key: string;
    page_name: string;
    slug: string;
    description: string;
  };
  sections: Section[];
}

async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/pages/${slug}`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export default function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const { slug } = await params;
      const data = await getPageData(slug);
      setLoading(false);
      if (!data || !data.page) {
        setNotFoundError(true);
      } else {
        setPageData(data);
      }
    }
    
    loadPage();

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
  }, [params, lastScrollY]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (notFoundError || !pageData) {
    notFound();
  }

  const { page, sections } = pageData;

  return (
    <div className={styles.pageContainer}>
      {/* Announcement Banner */}
      <div className={`${styles.announcementBar} ${!headerVisible ? styles.hidden : ''}`}>
        <div className={styles.marquee}>
          <div className={styles.marqueeContent}>
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
      <header className={`${styles.header} ${scrollY > 50 ? styles.scrolled : ''} ${!headerVisible ? styles.hidden : ''}`}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} className={styles.logoImg} priority />
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/shop" className={styles.navLink}>Shop</Link>
            <Link href="/templates" className={styles.navLink}>Templates</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
            <Link href="/contact" className={styles.navLink}>Contact</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/wishlist" className={styles.iconButton}>
              <Heart size={22} />
              <WishlistBadge className={styles.cartBadge} />
            </Link>
            <Link href="/cart" className={styles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={styles.cartBadge} />
            </Link>
            <Link href="/orders" className={styles.iconButton}>
              <User size={22} />
            </Link>
            <button className={styles.mobileMenu} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileNav}>
          <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/shop" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/templates" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Templates</Link>
          <Link href="/about" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Empty State */}
        {sections.length === 0 && (
          <div className={styles.emptyState}>
            <p>No content available for this page yet. Add sections from admin dashboard.</p>
          </div>
        )}

        {/* Dynamic Sections */}
        {sections.map((section, sectionIndex) => {
          // Skip sections with no categories
          if (!section.categories || section.categories.length === 0) {
            return null;
          }
          
          return (
            <section key={section.id} className={styles.pageSection}>
              <div className={styles.pageSection}>
                <h2 className={styles.pageSectionTitle}>{section.title}</h2>
                {section.subtitle && (
                  <p className={styles.pageSectionSubtitle}>{section.subtitle}</p>
                )}
              </div>
              
              <div className={styles.categoriesGrid}>
                {section.categories.map((category) => (
                  <Link 
                    key={category.id}
                    href={`/shop/${category.slug}`}
                    className={styles.categoryCard}
                  >
                    <div className={styles.categoryImageWrapper}>
                      <Image 
                        src={category.image_url} 
                        alt={category.name}
                        width={400}
                        height={320}
                        className={styles.categoryImage}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.categoryInfo}>
                      <h3 className={styles.categoryName}>{category.name}</h3>
                      {category.description && (
                        <p className={styles.categoryDescription}>{category.description}</p>
                      )}
                      <div className={styles.categoryButton}>
                        View Collection <ArrowRight size={18} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoWrapper}>
                <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={160} height={45} />
              </div>
            </div>
            <p className={styles.footerDesc}>
              Your one-stop shop for premium custom phone cases. Protect your device with style.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.instagram.com/casebuddy6" className={styles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/casebuddy6" className={styles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="#" className={styles.socialIcon}>
                <Twitter size={24} />
              </a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/shop">Shop All</Link></li>
              <li><Link href="/templates">Templates</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Customer Service</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/shipping">Shipping Info</Link></li>
              <li><Link href="/returns">Returns & Exchanges</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Contact Us</h4>
            <ul className={styles.footerContact}>
              <li>
                <Phone size={20} />
                <span>+91 98765 43210</span>
              </li>
              <li>
                <Mail size={20} />
                <span>support@casebuddy.co.in</span>
              </li>
              <li>
                <MapPin size={20} />
                <span>Mumbai, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerText}>
            © 2025 CaseBuddy. All rights reserved.
          </p>
          <div className={styles.paymentMethods}>
            <span>We Accept:</span>
            <div className={styles.paymentIcons}>💳 UPI | Cards | Wallets</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
