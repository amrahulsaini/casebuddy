'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, Package, MapPin, Clock, ShieldCheck, Heart, ShoppingCart, User, Menu, Zap, Instagram, Facebook, Twitter, Mail, Phone } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './shipping.module.css';

export default function ShippingPage() {
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
        <Truck size={64} className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Shipping Information</h1>
        <p className={styles.heroSubtitle}>
          Fast, reliable, and affordable delivery across India
        </p>
      </section>

      {/* Main Content */}
      <section className={styles.content}>
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Package className={styles.cardIcon} size={48} />
            <h3 className={styles.cardTitle}>Free Shipping</h3>
            <p className={styles.cardText}>
              On all orders above ₹499. Shop more, save more on delivery!
            </p>
          </div>

          <div className={styles.infoCard}>
            <Clock className={styles.cardIcon} size={48} />
            <h3 className={styles.cardTitle}>7-10 Days Delivery</h3>
            <p className={styles.cardText}>
              Standard delivery time across all major cities and towns in India.
            </p>
          </div>

          <div className={styles.infoCard}>
            <MapPin className={styles.cardIcon} size={48} />
            <h3 className={styles.cardTitle}>Pan-India Delivery</h3>
            <p className={styles.cardText}>
              We deliver to every corner of India. Check your pin code at checkout.
            </p>
          </div>

          <div className={styles.infoCard}>
            <ShieldCheck className={styles.cardIcon} size={48} />
            <h3 className={styles.cardTitle}>Secure Packaging</h3>
            <p className={styles.cardText}>
              All products are carefully packaged to ensure safe delivery to your doorstep.
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Shipping Charges</h2>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Order Value</div>
              <div className={styles.tableCell}>Shipping Charge</div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>Below ₹499</div>
              <div className={styles.tableCell}>₹80</div>
            </div>
            <div className={styles.tableRow}>
              <div className={styles.tableCell}>₹499 and above</div>
              <div className={styles.tableCell}><strong>FREE</strong></div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Delivery Timeline</h2>
          <p className={styles.paragraph}>
            Once your order is confirmed, it typically takes:
          </p>
          <ul className={styles.list}>
            <li>1-2 business days for order processing and quality check</li>
            <li>5-8 business days for delivery to your location</li>
            <li>Total: 7-10 business days from order placement</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>Note:</strong> Delivery times may vary for remote areas or during peak seasons and festivals.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Order Tracking</h2>
          <p className={styles.paragraph}>
            Once your order is shipped, you'll receive:
          </p>
          <ul className={styles.list}>
            <li>Email notification with tracking number</li>
            <li>SMS with delivery partner details</li>
            <li>Real-time tracking updates on your registered email and phone</li>
            <li>Estimated delivery date</li>
          </ul>
          <p className={styles.paragraph}>
            You can track your order status anytime by visiting the order tracking page with your order ID.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Shipping Locations</h2>
          <p className={styles.paragraph}>
            We currently ship to all serviceable pin codes across India, including:
          </p>
          <div className={styles.locationGrid}>
            <div className={styles.locationCard}>
              <h4>Major Cities</h4>
              <p>Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad, and more</p>
            </div>
            <div className={styles.locationCard}>
              <h4>Tier 2 & 3 Cities</h4>
              <p>Jaipur, Lucknow, Nagpur, Indore, Bhopal, Chandigarh, Coimbatore, and hundreds more</p>
            </div>
            <div className={styles.locationCard}>
              <h4>Rural Areas</h4>
              <p>We deliver to remote locations too! Check serviceability at checkout</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>International Shipping</h2>
          <p className={styles.paragraph}>
            Currently, we only ship within India. International shipping is coming soon! 
            Subscribe to our newsletter to get notified when we start shipping internationally.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Need Help?</h2>
          <p className={styles.paragraph}>
            For any shipping-related queries, please contact our customer support:
          </p>
          <div className={styles.contactInfo}>
            <div><Phone size={20} /> <span>+918107624752</span></div>
            <div><Mail size={20} /> <span>info@casebuddy.co.in</span></div>
            <div><Clock size={20} /> <span>Mon-Sat, 9:00 AM - 7:00 PM IST</span></div>
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
              <a href="https://www.instagram.com/casebuddy25" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/share/17fhSRLQR4/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/918107624752" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                <Mail size={24} />
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
