'use client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Gift, Star, Truck, ShieldCheck, Heart, ShoppingCart, User, Menu, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
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
    console.log('Fetching page data from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch page:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    console.log('Page data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching page data:', error);
    return null;
  }
}

export default function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const { cartCount, wishlist, isLoaded } = useCart();

  useEffect(() => {
    async function loadPage() {
      const { slug } = await params;
      const data = await getPageData(slug);
      if (!data || !data.page) {
        notFound();
      }
      setPageData(data);
      setLoading(false);
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

  if (!pageData) {
    notFound();
  }

  const { page, sections } = pageData;

  return (
    <div className={styles.pageContainer}>
      {/* Announcement Banner */}
      <div className={`${styles.announcementBar} ${!headerVisible ? styles.hidden : ''}`}>
        <div className={styles.marquee}>
          <div className={styles.marqueeContent}>
            <span><Gift size={16} /> First Time Order? Get FREE SHIPPING with code: CASEBUDDY100</span>
            <span><Star size={16} /> Buy 2 Get 10% OFF • Buy 3 Get 20% OFF</span>
            <span><Truck size={16} /> Express Delivery Available • Track Your Order</span>
            <span><ShieldCheck size={16} /> Premium Quality Cases • 30-Day Money Back</span>
            <span><Gift size={16} /> First Time Order? Get FREE SHIPPING with code: CASEBUDDY100</span>
            <span><Star size={16} /> Buy 2 Get 10% OFF • Buy 3 Get 20% OFF</span>
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
            <button className={styles.iconButton}>
              <Heart size={22} />
              {isLoaded && wishlist.length > 0 && <span className={styles.cartBadge}>{wishlist.length}</span>}
            </button>
            <button className={styles.iconButton}>
              <ShoppingCart size={22} />
              {isLoaded && cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
            <button className={styles.iconButton}>
              <User size={22} />
            </button>
            <button className={styles.mobileMenu}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.pageHero}>
        <div className={styles.pageHeroBackground}></div>
        <div className={styles.pageHeroContent}>
          <h1 className={styles.pageHeroTitle}>{page.page_name}</h1>
          {page.description && (
            <p className={styles.pageHeroDescription}>{page.description}</p>
          )}
        </div>
      </section>

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
              <a href="#" className={styles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="#" className={styles.socialIcon}>
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
