'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Truck, Package, Zap, ShoppingCart, User, Menu, Heart } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import { getShippingConfig } from '@/lib/shipping';
import homeStyles from '@/app/home.module.css';

interface MainHeaderProps {
  scrollY: number;
  headerVisible: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function MainHeader({ scrollY, headerVisible, mobileMenuOpen, setMobileMenuOpen }: MainHeaderProps) {
  const { freeShippingThreshold } = getShippingConfig();

  return (
    <>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
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
      <header className={`${homeStyles.header} ${scrollY > 50 ? homeStyles.scrolled : ''} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} className={homeStyles.logoImg} priority />
          </Link>
          <div className={homeStyles.navLinks}>
            <Link href="/" className={homeStyles.navLink}>Home</Link>
            <Link href="/shop" className={homeStyles.navLink}>Shop</Link>
            <Link href="/about" className={homeStyles.navLink}>About</Link>
            <Link href="/contact" className={homeStyles.navLink}>Contact</Link>
          </div>
          <div className={homeStyles.navActions}>
            <SearchBar />
            <Link href="/wishlist" className={homeStyles.iconButton}>
              <Heart size={22} />
              <WishlistBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/cart" className={homeStyles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/orders" className={homeStyles.iconButton}>
              <User size={22} />
            </Link>
            <button className={homeStyles.mobileMenu} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={homeStyles.mobileMenuOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={homeStyles.mobileMenuContent} onClick={(e) => e.stopPropagation()}>
            <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link href="/wishlist" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              <Heart size={20} /> Wishlist
            </Link>
            <Link href="/cart" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart size={20} /> Cart
            </Link>
            <Link href="/orders" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              <User size={20} /> My Orders
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
