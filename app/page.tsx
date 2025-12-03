'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, Truck, Gift, Star, TrendingUp, Zap, ArrowRight, Package, Headphones, ShoppingCart, User, Menu, Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './home.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<{ custom: Category[], regular: Category[] }>({ custom: [], regular: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const { custom: customDesignedCases, regular: ourCategories } = categories;

  return (
    <div className={styles.container}>
      {/* Announcement Banner */}
      <div className={styles.announcementBar}>
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
      <header className={styles.header}>
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
            </button>
            <button className={styles.iconButton}>
              <ShoppingCart size={22} />
              <span className={styles.cartBadge}>0</span>
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
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <Sparkles size={48} className={styles.sparkleIcon} />
          </div>
          <h1 className={styles.heroTitle}>
            Premium Custom Phone Cases
          </h1>
          <p className={styles.heroSubtitle}>
            Protect your phone with style. Browse our exclusive collection of designer cases.
          </p>
          <Link href="/shop" className={styles.heroButton}>
            Shop Now <ArrowRight size={20} className={styles.arrowIcon} />
          </Link>
        </div>
        <div className={styles.heroBackground}></div>
      </section>

      {/* Features Bar */}
      <section className={styles.features}>
        <div className={styles.feature}>
          <Truck size={32} className={styles.featureIcon} />
          <span>Free Shipping</span>
        </div>
        <div className={styles.feature}>
          <ShieldCheck size={32} className={styles.featureIcon} />
          <span>Money Back Guarantee</span>
        </div>
        <div className={styles.feature}>
          <Zap size={32} className={styles.featureIcon} />
          <span>Fast Delivery</span>
        </div>
        <div className={styles.feature}>
          <Headphones size={32} className={styles.featureIcon} />
          <span>24/7 Support</span>
        </div>
      </section>

      {/* Section 1: Our Custom Designed Cases */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.floralDecor}>🌸</div>
          <h2 className={styles.sectionTitle}>Our Custom Designed Cases</h2>
          <p className={styles.sectionSubtitle}>Exclusive designs you won't find anywhere else</p>
        </div>
        
        <div className={styles.horizontalScroll}>
          <div className={styles.scrollContent}>
            {customDesignedCases.map((category, index) => (
              <Link 
                key={category.id}
                href={`/shop/${category.slug}`}
                className={styles.horizontalCard}
              >
                <div className={styles.horizontalImageWrapper}>
                  <Image 
                    src={category.image_url} 
                    alt={category.name}
                    width={280}
                    height={380}
                    className={styles.horizontalImage}
                  />
                </div>
                <div className={styles.horizontalInfo}>
                  <h3 className={styles.horizontalName}>{category.name}</h3>
                </div>
              </Link>
            ))}
            {customDesignedCases.map((category, index) => (
              <Link 
                key={`duplicate-${category.id}`}
                href={`/shop/${category.slug}`}
                className={styles.horizontalCard}
              >
                <div className={styles.horizontalImageWrapper}>
                  <Image 
                    src={category.image_url} 
                    alt={category.name}
                    width={280}
                    height={380}
                    className={styles.horizontalImage}
                  />
                </div>
                <div className={styles.horizontalInfo}>
                  <h3 className={styles.horizontalName}>{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Our Categories */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionHeader}>
          <div className={styles.floralDecor}>🌺</div>
          <h2 className={styles.sectionTitle}>Our Categories</h2>
          <p className={styles.sectionSubtitle}>Find the perfect case for your device</p>
        </div>
        
        <div className={styles.categoryGrid}>
          {ourCategories.map((category, index) => (
            <Link 
              key={category.id}
              href={`/shop/${category.slug}`}
              className={styles.verticalCard}
              data-index={index}
            >
              <div className={styles.verticalImageWrapper}>
                <Image 
                  src={category.image_url} 
                  alt={category.name}
                  width={320}
                  height={420}
                  className={styles.verticalImage}
                />
                <div className={styles.verticalOverlay}>
                  <span className={styles.overlayText}>{category.name}</span>
                  <div className={styles.overlayButton}>
                    View Collection <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className={styles.sectionHeader}>
          <div className={styles.floralDecor}>🌷</div>
          <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
          <p className={styles.sectionSubtitle}>Join thousands of happy customers</p>
        </div>
        
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.floralRating}>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
            </div>
            <p className={styles.testimonialText}>
              "Amazing quality! The print is crystal clear and the case fits perfectly. Best purchase I've made this year!"
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>RK</div>
              <div>
                <div className={styles.authorName}>Rahul Kumar</div>
                <div className={styles.authorTitle}>Verified Buyer</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.floralRating}>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
            </div>
            <p className={styles.testimonialText}>
              "Fast delivery and excellent packaging. The custom design looks exactly like the preview. Highly recommend!"
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>PS</div>
              <div>
                <div className={styles.authorName}>Priya Sharma</div>
                <div className={styles.authorTitle}>Verified Buyer</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.floralRating}>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
              <span>🌸</span>
            </div>
            <p className={styles.testimonialText}>
              "Best phone case website! Great designs, affordable prices, and the quality is top-notch. Will order again!"
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>AS</div>
              <div>
                <div className={styles.authorName}>Amit Singh</div>
                <div className={styles.authorTitle}>Verified Buyer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
