'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, Package, CheckCircle, XCircle, ShoppingCart, User, Menu, Heart, Truck, Zap, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './returns.module.css';

export default function ReturnsPage() {
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
        <RefreshCw size={64} className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Returns & Exchanges</h1>
        <p className={styles.heroSubtitle}>
          Hassle-free 7-day return policy. Your satisfaction is our priority.
        </p>
      </section>

      {/* Main Content */}
      <section className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Return Policy</h2>
          <p className={styles.paragraph}>
            We want you to be completely satisfied with your purchase. If for any reason you're not happy with your order, 
            you can return it within <strong>7 days of delivery</strong> for a full refund or exchange.
          </p>
        </div>

        <div className={styles.policyCards}>
          <div className={styles.policyCard}>
            <CheckCircle className={styles.policyIcon} size={48} />
            <h3 className={styles.policyTitle}>Eligible for Return</h3>
            <ul className={styles.policyList}>
              <li>Product is unused and in original condition</li>
              <li>Original packaging is intact</li>
              <li>All tags and labels are attached</li>
              <li>Product is not damaged or modified</li>
              <li>Return requested within 7 days of delivery</li>
            </ul>
          </div>

          <div className={styles.policyCard}>
            <XCircle className={styles.policyIcon} size={48} />
            <h3 className={styles.policyTitle}>Not Eligible for Return</h3>
            <ul className={styles.policyList}>
              <li>Product is used or damaged</li>
              <li>Original packaging is missing or damaged</li>
              <li>Tags and labels are removed</li>
              <li>Customized or personalized products</li>
              <li>Return request made after 7 days</li>
            </ul>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>How to Return</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Initiate Return</h3>
              <p className={styles.stepText}>
                Contact our customer support at <strong>+918107624752</strong> or email <strong>info@casebuddy.co.in</strong> 
                with your order number and reason for return.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Pack the Product</h3>
              <p className={styles.stepText}>
                Pack the product securely in its original packaging with all tags, labels, and accessories. 
                Include a copy of the invoice.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Ship the Product</h3>
              <p className={styles.stepText}>
                We'll provide you with a return shipping label or arrange pickup. Ship the product back to us 
                using the provided method.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Receive Refund</h3>
              <p className={styles.stepText}>
                Once we receive and inspect the product, we'll process your refund within 5-7 business days 
                to your original payment method.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Exchange Policy</h2>
          <p className={styles.paragraph}>
            Want to exchange for a different design or model? No problem!
          </p>
          <ul className={styles.list}>
            <li>Exchanges are subject to product availability</li>
            <li>Same eligibility criteria as returns apply</li>
            <li>Price difference (if any) will be adjusted</li>
            <li>Exchange process takes 10-14 business days</li>
            <li>No exchange for customized products</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Refund Timeline</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <strong>Day 1-2:</strong> Return request received and approved
            </div>
            <div className={styles.timelineItem}>
              <strong>Day 3-5:</strong> Product in transit back to us
            </div>
            <div className={styles.timelineItem}>
              <strong>Day 6-7:</strong> Product received and quality check
            </div>
            <div className={styles.timelineItem}>
              <strong>Day 8-12:</strong> Refund processed to your account
            </div>
          </div>
          <p className={styles.paragraph}>
            <strong>Note:</strong> Refund timeline may vary depending on your bank or payment method.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Return Shipping</h2>
          <p className={styles.paragraph}>
            <strong>For defective or wrong products:</strong> We'll cover the return shipping cost. 
            We'll provide a prepaid return label or arrange free pickup.
          </p>
          <p className={styles.paragraph}>
            <strong>For change of mind:</strong> Return shipping cost of ₹80 will be deducted from your refund amount.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Important Notes</h2>
          <div className={styles.noteBox}>
            <ul className={styles.list}>
              <li>Customized products with personal photos or text are not eligible for return or exchange</li>
              <li>Products on sale or clearance are eligible for return but not exchange</li>
              <li>Damaged or defective products will be replaced free of cost</li>
              <li>We reserve the right to reject returns that don't meet our policy criteria</li>
              <li>Partial returns are accepted for multi-item orders</li>
            </ul>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Need Help?</h2>
          <p className={styles.paragraph}>
            For any questions about returns or exchanges, please contact us:
          </p>
          <div className={styles.contactInfo}>
            <div><Phone size={20} /> <span>+918107624752</span></div>
            <div><Mail size={20} /> <span>info@casebuddy.co.in</span></div>
            <div><MapPin size={20} /> <span>CaseBuddy, Rajgarh, Rajasthan 331023</span></div>
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
