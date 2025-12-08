'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ShoppingCart, User, Menu, Heart, Truck, Package, Zap, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import styles from './faq.module.css';

export default function FAQPage() {
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

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

  const faqs = [
    {
      category: 'Orders & Payments',
      questions: [
        {
          q: 'How do I place an order?',
          a: 'Browse our collection, select your phone model and design, add to cart, and proceed to checkout. You can pay using UPI, cards, or digital wallets.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and digital wallets.'
        },
        {
          q: 'Is it safe to pay on your website?',
          a: 'Yes, absolutely! We use industry-standard SSL encryption and secure payment gateways to protect your financial information.'
        },
        {
          q: 'Can I cancel my order?',
          a: 'Order cancellation is not available. However, you can return the product within 7 days of delivery as per our return policy. Please contact us at +918107624752 for assistance.'
        }
      ]
    },
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: 'How long does delivery take?',
          a: 'Standard delivery takes 7-10 business days across India. Remote locations may take an additional 2-3 days.'
        },
        {
          q: 'Do you offer free shipping?',
          a: 'Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a shipping fee of ₹80 applies.'
        },
        {
          q: 'Do you ship internationally?',
          a: 'Currently, we only ship within India. International shipping is coming soon! Subscribe to our newsletter for updates.'
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you\'ll receive a tracking number via email and SMS. Use this number to track your package in real-time.'
        }
      ]
    },
    {
      category: 'Products & Customization',
      questions: [
        {
          q: 'Which phone models do you support?',
          a: 'We support 15+ brands including iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, Moto, and more. Check our shop page for your specific model.'
        },
        {
          q: 'Can I customize my phone case?',
          a: 'Yes! You can upload your own photos, add text, or create custom designs. Visit our customization page to get started.'
        },
        {
          q: 'What material are your cases made of?',
          a: 'Our cases are made from high-quality TPU and polycarbonate materials that offer excellent protection and durability.'
        },
        {
          q: 'Will the print fade over time?',
          a: 'No! We use advanced UV printing technology that ensures vibrant, long-lasting prints that won\'t fade or peel.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 7-day return policy from the date of delivery. Products must be unused, in original packaging with all tags intact.'
        },
        {
          q: 'Can I return a customized product?',
          a: 'Customized products with personal photos or text are not eligible for return unless they are damaged or defective.'
        },
        {
          q: 'How long does refund processing take?',
          a: 'Once we receive and inspect the returned product, refunds are processed within 5-7 business days to your original payment method.'
        },
        {
          q: 'Who pays for return shipping?',
          a: 'For defective or wrong products, we cover return shipping. For other returns, shipping cost of ₹80 is deducted from your refund.'
        }
      ]
    },
    {
      category: 'Account & Support',
      questions: [
        {
          q: 'Do I need to create an account to order?',
          a: 'While guest checkout is available, creating an account helps you track orders, save addresses, and get exclusive offers.'
        },
        {
          q: 'How do I contact customer support?',
          a: 'You can reach us at +918107624752 (Mon-Sat, 9 AM - 7 PM) or email info@casebuddy.co.in. We typically respond within 24 hours.'
        },
        {
          q: 'Can I change my shipping address after ordering?',
          a: 'Yes, if your order hasn\'t shipped yet. Contact us immediately at +918107624752 to update the address.'
        },
        {
          q: 'Do you offer bulk discounts?',
          a: 'Yes! For bulk orders (10+ pieces), please contact us at info@casebuddy.co.in for special pricing.'
        }
      ]
    }
  ];

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
        <HelpCircle size={64} className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
        <p className={styles.heroSubtitle}>
          Find answers to common questions about CaseBuddy
        </p>
      </section>

      {/* FAQ Content */}
      <section className={styles.content}>
        {faqs.map((category, catIndex) => (
          <div key={catIndex} className={styles.faqCategory}>
            <h2 className={styles.categoryTitle}>{category.category}</h2>
            <div className={styles.faqList}>
              {category.questions.map((faq, faqIndex) => {
                const globalIndex = catIndex * 100 + faqIndex;
                return (
                  <div key={faqIndex} className={styles.faqItem}>
                    <button 
                      className={styles.faqQuestion}
                      onClick={() => setOpenFAQ(openFAQ === globalIndex ? null : globalIndex)}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        className={`${styles.chevron} ${openFAQ === globalIndex ? styles.chevronOpen : ''}`} 
                        size={24} 
                      />
                    </button>
                    {openFAQ === globalIndex && (
                      <div className={styles.faqAnswer}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className={styles.contactSection}>
          <h2 className={styles.sectionTitle}>Still Have Questions?</h2>
          <p className={styles.paragraph}>
            Can't find what you're looking for? Our customer support team is here to help!
          </p>
          <div className={styles.contactInfo}>
            <div><Phone size={20} /> <span>+918107624752</span></div>
            <div><Mail size={20} /> <span>info@casebuddy.co.in</span></div>
            <div><MapPin size={20} /> <span>Mon-Sat, 9:00 AM - 7:00 PM IST</span></div>
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
