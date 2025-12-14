'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, ShoppingCart, User, Menu, Heart, Truck, Package, Zap, Instagram, Facebook, Twitter, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import { getShippingConfig } from '@/lib/shipping';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const { freeShippingThreshold } = getShippingConfig();
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
          <Link href="/about" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <Shield size={64} className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Privacy Policy</h1>
        <p className={styles.heroSubtitle}>
          Your privacy is important to us. Learn how we protect your data.
        </p>
        <p className={styles.lastUpdated}>Last Updated: December 8, 2025</p>
      </section>

      {/* Privacy Content */}
      <section className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Introduction</h2>
          <p className={styles.paragraph}>
            Welcome to CaseBuddy. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
            our website and make purchases from us.
          </p>
          <p className={styles.paragraph}>
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access the site or use our services.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          <h3 className={styles.subTitle}>Personal Information</h3>
          <p className={styles.paragraph}>
            When you make a purchase or attempt to make a purchase through the Site, we collect certain information 
            from you, including:
          </p>
          <ul className={styles.list}>
            <li>Name and contact information (email, phone number)</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information (processed securely through payment gateways)</li>
            <li>Order history and preferences</li>
            <li>Communication history with customer support</li>
          </ul>

          <h3 className={styles.subTitle}>Automatically Collected Information</h3>
          <p className={styles.paragraph}>
            When you visit our website, we automatically collect certain information about your device, including:
          </p>
          <ul className={styles.list}>
            <li>IP address and browser type</li>
            <li>Device information and operating system</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website or source</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
          <p className={styles.paragraph}>
            We use the information we collect in various ways, including to:
          </p>
          <ul className={styles.list}>
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Communicate with you about products, services, and promotions</li>
            <li>Improve our website and customer experience</li>
            <li>Prevent fraudulent transactions and protect against security threats</li>
            <li>Comply with legal obligations and resolve disputes</li>
            <li>Analyze usage patterns to enhance our services</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sharing Your Information</h2>
          <p className={styles.paragraph}>
            We may share your information with third parties in the following situations:
          </p>
          <ul className={styles.list}>
            <li><strong>Service Providers:</strong> We share information with third-party vendors who help us operate our business 
            (payment processors, shipping companies, email service providers)</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> We may share information for any other purpose with your consent</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Cookies and Tracking Technologies</h2>
          <p className={styles.paragraph}>
            We use cookies and similar tracking technologies to track activity on our website and store certain information. 
            Cookies are files with small amounts of data that are sent to your browser from a website and stored on your device.
          </p>
          <p className={styles.paragraph}>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
            if you do not accept cookies, you may not be able to use some portions of our website.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Security</h2>
          <p className={styles.paragraph}>
            We implement appropriate technical and organizational security measures to protect your personal information. 
            However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
          <ul className={styles.list}>
            <li>SSL encryption for all data transmission</li>
            <li>Secure payment gateways for processing transactions</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication systems</li>
            <li>Employee training on data protection</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Privacy Rights</h2>
          <p className={styles.paragraph}>
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className={styles.list}>
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
          </ul>
          <p className={styles.paragraph}>
            To exercise these rights, please contact us at <strong>info@casebuddy.co.in</strong> or call <strong>+918107624752</strong>.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Children's Privacy</h2>
          <p className={styles.paragraph}>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect personal 
            information from children. If you are a parent or guardian and believe your child has provided us with 
            personal information, please contact us.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Third-Party Links</h2>
          <p className={styles.paragraph}>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices 
            of these external sites. We encourage you to read their privacy policies before providing any information.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Retention</h2>
          <p className={styles.paragraph}>
            We retain your personal information only for as long as necessary to fulfill the purposes outlined in 
            this privacy policy, unless a longer retention period is required or permitted by law.
          </p>
          <ul className={styles.list}>
            <li>Order information: 5 years (for accounting and legal purposes)</li>
            <li>Account information: Until account deletion or 3 years of inactivity</li>
            <li>Marketing communications: Until you unsubscribe</li>
            <li>Website analytics: Aggregated data retained indefinitely</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Updates to This Policy</h2>
          <p className={styles.paragraph}>
            We may update this privacy policy from time to time to reflect changes in our practices or for legal, 
            operational, or regulatory reasons. We will notify you of any material changes by posting the new 
            privacy policy on this page and updating the "Last Updated" date.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p className={styles.paragraph}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className={styles.contactInfo}>
            <div><strong>CaseBuddy</strong></div>
            <div><MapPin size={20} /> <span>Rajgarh, Rajasthan 331023, India</span></div>
            <div><Phone size={20} /> <span>+918107624752</span></div>
            <div><Mail size={20} /> <span>info@casebuddy.co.in</span></div>
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
              <a href="https://www.instagram.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/918107624752" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <MessageCircle size={24} />
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
