'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import homeStyles from '@/app/home.module.css';

export default function MainFooter() {
  return (
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
            <a href="https://www.instagram.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
              <Instagram size={24} />
            </a>
            <a href="https://www.facebook.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
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
  );
}
