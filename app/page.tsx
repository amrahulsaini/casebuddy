'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ShieldCheck, Truck, Gift, Star, TrendingUp, Zap, ArrowRight, Package, Headphones, ShoppingCart, User, Menu, Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './home.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

interface HomepageSection {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  sort_order: number;
  categories: Category[];
}

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    fetch('/api/homepage-sections')
      .then(res => res.json())
      .then(data => {
        setSections(data);
        setLoading(false);
      });

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    e.preventDefault();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
              <WishlistBadge className={styles.cartBadge} />
            </button>
            <button className={styles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={styles.cartBadge} />
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
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <Sparkles size={32} />
              <div>
                <div className={styles.statNumber}>10K+</div>
                <div className={styles.statLabel}>Happy Customers</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <Package size={32} />
              <div>
                <div className={styles.statNumber}>500+</div>
                <div className={styles.statLabel}>Unique Designs</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <Zap size={32} />
              <div>
                <div className={styles.statNumber}>24hrs</div>
                <div className={styles.statLabel}>Fast Delivery</div>
              </div>
            </div>
          </div>
          <h1 className={styles.heroTitle}>
            Design Your Dream Phone Case
          </h1>
          <p className={styles.heroSubtitle}>
            Premium quality • Unique designs • Express yourself
          </p>
          <div className={styles.heroCTA}>
            <Link href="/shop" className={styles.heroButton}>
              Explore Collection <ArrowRight size={20} />
            </Link>
            <Link href="/templates" className={styles.heroButtonSecondary}>
              <Sparkles size={18} /> Custom Design
            </Link>
          </div>
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

      {/* Dynamic Homepage Sections */}
      {sections.map((section, sectionIndex) => (
        <section 
          key={section.id} 
          className={sectionIndex === 0 ? styles.sectionFullWidth : styles.sectionAltFullWidth}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionSubtitle}>{section.subtitle}</p>
          </div>
          
          {sectionIndex === 0 ? (
            // First section: Horizontal scroll
            <div className={styles.horizontalScrollWrapper}>
              <button 
                className={styles.scrollButton + ' ' + styles.scrollButtonLeft}
                onClick={() => scroll('left')}
                aria-label="Scroll left"
              >
                <ChevronLeft size={32} />
              </button>
              <div 
                className={styles.horizontalScroll}
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div className={styles.scrollContent}>
                  {section.categories.map((category) => (
                    <Link 
                      key={category.id}
                      href={`/shop/${category.slug}`}
                      className={styles.horizontalCard}
                      draggable={false}
                      onClick={(e) => isDragging && e.preventDefault()}
                    >
                      <div className={styles.horizontalImageWrapper}>
                        <Image 
                          src={category.image_url} 
                          alt={category.name}
                          width={280}
                          height={380}
                          className={styles.horizontalImage}
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                      <div className={styles.horizontalInfo}>
                        <h3 className={styles.horizontalName}>{category.name}</h3>
                      </div>
                    </Link>
                  ))}
                  {section.categories.map((category) => (
                    <Link 
                      key={`duplicate-${category.id}`}
                      href={`/shop/${category.slug}`}
                      className={styles.horizontalCard}
                      draggable={false}
                      onClick={(e) => isDragging && e.preventDefault()}
                    >
                      <div className={styles.horizontalImageWrapper}>
                        <Image 
                          src={category.image_url} 
                          alt={category.name}
                          width={280}
                          height={380}
                          className={styles.horizontalImage}
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                      <div className={styles.horizontalInfo}>
                        <h3 className={styles.horizontalName}>{category.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <button 
                className={styles.scrollButton + ' ' + styles.scrollButtonRight}
                onClick={() => scroll('right')}
                aria-label="Scroll right"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          ) : (
            // Other sections: Grid layout
            <div className={styles.categoryGrid}>
              {section.categories.map((category, index) => (
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
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjQyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjQyMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=="
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
          )}
        </section>
      ))}

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className={styles.sectionHeader}>
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
