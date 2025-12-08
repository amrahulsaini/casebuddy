'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Heart, Zap, Award, Users, Globe, Package, Sparkles, ShoppingCart, User, Menu, Truck, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './about.module.css';

export default function AboutPage() {
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

  return (
    <div className={styles.container}>
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
            <button className={styles.iconButton}>
              <User size={22} />
            </button>
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
          <Link href="/about" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to CaseBuddy</h1>
          <p className={styles.heroSubtitle}>
            Your trusted partner for premium phone cases and personalized protection
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.section}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <p className={styles.paragraph}>
              CaseBuddy was born from a simple idea: everyone deserves a phone case that's as unique as they are. 
              We started our journey in 2024 with a mission to revolutionize the way people protect and personalize their phones.
            </p>
            <p className={styles.paragraph}>
              Based in the heart of Rajasthan, we've grown from a small startup to a trusted name in phone accessories. 
              Our passion for quality, design, and customer satisfaction drives everything we do.
            </p>
            <p className={styles.paragraph}>
              Today, CaseBuddy serves thousands of happy customers across India, offering an extensive collection of 
              phone cases for all major brands including iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more.
            </p>
          </div>
          <div className={styles.imageContent}>
            <div className={styles.imageGrid}>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={styles.missionSection}>
        <div className={styles.missionGrid}>
          <div className={styles.missionCard}>
            <Heart className={styles.missionIcon} size={48} />
            <h3 className={styles.missionTitle}>Our Mission</h3>
            <p className={styles.missionText}>
              To provide high-quality, stylish phone cases that combine protection with personality. 
              We believe your phone case should be an extension of your style, not just an accessory.
            </p>
          </div>
          <div className={styles.missionCard}>
            <Sparkles className={styles.missionIcon} size={48} />
            <h3 className={styles.missionTitle}>Our Vision</h3>
            <p className={styles.missionText}>
              To become India's most loved phone case brand by offering unmatched variety, 
              quality, and customization options that help everyone express their unique personality.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <div className={styles.offerGrid}>
          <div className={styles.offerCard}>
            <Package className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Extensive Collection</h3>
            <p className={styles.offerText}>
              From trendy designs to classic styles, we have phone cases for every taste and occasion. 
              Browse hundreds of unique designs curated just for you.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Globe className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>All Brands Supported</h3>
            <p className={styles.offerText}>
              iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more. 
              Find the perfect case for your exact phone model.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Sparkles className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Custom Designs</h3>
            <p className={styles.offerText}>
              Make it truly yours! Customize phone cases with your own photos, text, and designs. 
              Create something unique that tells your story.
            </p>
          </div>
          <div className={styles.offerCard}>
            <ShieldCheck className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Premium Quality</h3>
            <p className={styles.offerText}>
              Every case is made with high-quality materials that provide excellent protection 
              against drops, scratches, and daily wear and tear.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Zap className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Fast Delivery</h3>
            <p className={styles.offerText}>
              Get your orders delivered within 7-10 days anywhere in India. 
              We ensure quick processing and secure packaging.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Award className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>7-Day Returns</h3>
            <p className={styles.offerText}>
              Not satisfied? No problem! Easy 7-day return policy ensures you get 
              exactly what you want, risk-free.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.whySection}>
        <h2 className={styles.sectionTitle}>Why Choose CaseBuddy?</h2>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>01</div>
            <h3 className={styles.whyTitle}>Unmatched Variety</h3>
            <p className={styles.whyText}>
              Thousands of designs across multiple categories - from minimalist to quirky, 
              from professional to playful. There's something for everyone.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>02</div>
            <h3 className={styles.whyTitle}>Quality Guaranteed</h3>
            <p className={styles.whyText}>
              We source only the finest materials and use advanced printing technology 
              to ensure your case looks great and lasts long.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>03</div>
            <h3 className={styles.whyTitle}>Affordable Pricing</h3>
            <p className={styles.whyText}>
              Premium quality doesn't mean premium prices. We offer competitive pricing 
              and regular discounts to make style accessible to all.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>04</div>
            <h3 className={styles.whyTitle}>Customer First</h3>
            <p className={styles.whyText}>
              Your satisfaction is our priority. From browsing to delivery, we ensure 
              a smooth, hassle-free shopping experience every time.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>10,000+</div>
            <div className={styles.statLabel}>Happy Customers</div>
          </div>
          <div className={styles.statCard}>
            <Package className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>Unique Designs</div>
          </div>
          <div className={styles.statCard}>
            <Globe className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>15+</div>
            <div className={styles.statLabel}>Phone Brands</div>
          </div>
          <div className={styles.statCard}>
            <Award className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>4.8/5</div>
            <div className={styles.statLabel}>Customer Rating</div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Core Values</h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Quality First</h3>
            <p className={styles.valueText}>
              We never compromise on quality. Every product goes through rigorous quality checks 
              before reaching you.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Innovation</h3>
            <p className={styles.valueText}>
              We constantly explore new designs, materials, and technologies to bring you 
              the latest and greatest in phone protection.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Sustainability</h3>
            <p className={styles.valueText}>
              We care about the environment. Our packaging is eco-friendly and we're constantly 
              working to reduce our carbon footprint.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Customer Delight</h3>
            <p className={styles.valueText}>
              Going beyond satisfaction, we aim to delight every customer with exceptional 
              products and service.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to Find Your Perfect Case?</h2>
        <p className={styles.ctaText}>
          Explore our collection and discover phone cases that match your style and personality
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/shop" className={styles.ctaButton}>
            Shop Now
          </Link>
          <Link href="/contact" className={styles.ctaButtonOutline}>
            Contact Us
          </Link>
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
                <span>+918107624752</span>
              </li>
              <li>
                <Mail size={20} />
                <span>info@casebuddy.co.in</span>
              </li>
              <li>
                <MapPin size={20} />
                <span>Rajgarh, Rajasthan 331023</span>
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
