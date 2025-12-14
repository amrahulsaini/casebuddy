'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, ShoppingCart, User, Menu, Heart, Truck, Package, Zap, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import { getShippingConfig } from '@/lib/shipping';
import styles from './contact.module.css';
import homeStyles from '../home.module.css';

export default function ContactPage() {
  const { freeShippingThreshold } = getShippingConfig();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.phone,
          subject: formData.subject,
          message: formData.message
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
            <SearchBar />
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
        <h1 className={styles.heroTitle}>Get In Touch</h1>
        <p className={styles.heroSubtitle}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <MapPin className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Our Location</h3>
            <p className={styles.infoText}>
              <a
                href="https://www.google.com/maps?q=CaseBuddy%2C%20Rajgarh%2C%20Rajasthan%20331023%2C%20India"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                CaseBuddy<br />
                Rajgarh, Rajasthan<br />
                331023, India
              </a>
            </p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Phone className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Phone Number</h3>
            <p className={styles.infoText}>
              <a href="tel:+918107624752" className={styles.link}>+91 81076 24752</a>
            </p>
            <p className={styles.infoSubtext}>Mon - Sat, 9 AM - 7 PM</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Mail className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Email Address</h3>
            <p className={styles.infoText}>
              <a href="mailto:info@casebuddy.co.in" className={styles.link}>info@casebuddy.co.in</a>
            </p>
            <p className={styles.infoSubtext}>We'll reply within 24 hours</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Clock className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Business Hours</h3>
            <p className={styles.infoText}>
              Monday - Saturday<br />
              9:00 AM - 7:00 PM IST
            </p>
            <p className={styles.infoSubtext}>Closed on Sundays</p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <MessageSquare className={styles.formIcon} size={48} />
            <h2 className={styles.formTitle}>Send Us a Message</h2>
            <p className={styles.formSubtitle}>
              Fill out the form below and our team will get back to you shortly
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="John Doe"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Mobile Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+91 xxx-xxx-xxxx"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="How can we help?"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className={styles.textarea}
                placeholder="Tell us more about your inquiry..."
                rows={6}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              <Send size={20} />
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            {submitted && (
              <div className={styles.successMessage}>
                ✓ Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                ✗ {error}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>How long does delivery take?</h3>
            <p className={styles.faqAnswer}>
              We deliver across India within 7-10 business days. You'll receive a tracking number once your order ships.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>What is your return policy?</h3>
            <p className={styles.faqAnswer}>
              We offer a 7-day easy return policy. If you're not satisfied with your purchase, you can return it within 7 days for a full refund.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Do you offer custom designs?</h3>
            <p className={styles.faqAnswer}>
              Yes! You can customize phone cases with your own photos, text, and designs. Visit our customization page to get started.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Which phone models do you support?</h3>
            <p className={styles.faqAnswer}>
              We support all major brands including iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more. Check our shop for your model.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Is there a minimum order value?</h3>
            <p className={styles.faqAnswer}>
              No minimum order value! However, orders above ₹{freeShippingThreshold} qualify for free shipping across India.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>How can I track my order?</h3>
            <p className={styles.faqAnswer}>
              Once your order ships, you'll receive a tracking number via email and SMS. Use it to track your package in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>Visit Us</h2>
        <div className={styles.mapContainer}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113647.38526644991!2d75.29579!3d27.2380!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396da27ee6f90a85%3A0x9ab8c0a6b9d0a3c7!2sRajgarh%2C%20Rajasthan%20331023!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={styles.map}
          />
        </div>
      </section>

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
              <a href="https://www.instagram.com/casebuddy25" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/share/17fhSRLQR4/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/918107624752" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
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
