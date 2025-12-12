'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Mail, Eye, CheckCircle, Clock, XCircle, Truck, ShoppingCart, User, Menu, Heart, Instagram, Facebook, Phone, MapPin, Zap } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import styles from './orders.module.css';
import homeStyles from '../home.module.css';

interface Order {
  id: number;
  order_number: string;
  customer_email: string;
  customer_mobile: string;
  customer_name: string;
  product_name: string;
  phone_model: string;
  quantity: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  customization_data: string | null;
  notes: string | null;
  created_at: string;
}

export default function OrdersPage() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setIsLoggedIn(true);
      fetchOrders(savedEmail);
    }
  }, []);

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

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    localStorage.setItem('userEmail', email);
    setIsLoggedIn(true);
    fetchOrders(email);
  };

  const fetchOrders = async (userEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/user/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      setError('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setEmail('');
    setOrders([]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#4CAF50';
      case 'processing':
      case 'shipped':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle size={20} />;
      case 'processing':
      case 'shipped':
        return <Truck size={20} />;
      case 'pending':
        return <Clock size={20} />;
      case 'cancelled':
      case 'failed':
        return <XCircle size={20} />;
      default:
        return <Package size={20} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        {/* Announcement Banner */}
        <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
          <div className={homeStyles.marquee}>
            <div className={homeStyles.marqueeContent}>
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
          <div className={homeStyles.mobileNav}>
            <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </div>
        )}

        <div className={styles.contentWrapper}>
          <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <Package size={48} />
            <h1>Track Your Orders</h1>
            <p>Enter your email to view your order history</p>
          </div>
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Mail size={20} />
                Email Address
              </label>
              <input
                type="email"
                className={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <button type="submit" className={styles.loginBtn}>
              View My Orders
            </button>
          </form>
          
          <div className={styles.loginFooter}>
            <p>Don&apos;t have an account? Orders are automatically saved when you checkout.</p>
          </div>
        </div>
        </div>

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

  return (
    <div className={styles.container}>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
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
        <div className={homeStyles.mobileNav}>
          <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div className={styles.pageHeader}>
          <div>
            <Link href="/" className={styles.backBtn}>
              ← Back to Home
            </Link>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.subtitle}>Logged in as: {email}</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <Package size={64} />
          <h2>No Orders Found</h2>
          <p>You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className={styles.shopBtn}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            let customData = null;
            try {
              customData = order.customization_data ? JSON.parse(order.customization_data) : null;
            } catch {}

            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <h3>Order #{order.order_number}</h3>
                    <p className={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={styles.orderStatus}>
                    <div 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(order.payment_status) }}
                    >
                      {getStatusIcon(order.payment_status)}
                      {order.payment_status}
                    </div>
                    <div 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(order.order_status) }}
                    >
                      {getStatusIcon(order.order_status)}
                      {order.order_status}
                    </div>
                  </div>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.productInfo}>
                    <h4>{order.product_name}</h4>
                    <p>Phone Model: {order.phone_model}</p>
                    <p>Quantity: {order.quantity}</p>
                    
                    {customData && (
                      <div className={styles.customization}>
                        <strong>Customization:</strong>
                        {customData.customText && <p>Text: &quot;{customData.customText}&quot;</p>}
                        {customData.font && <p>Font: {customData.font}</p>}
                        {customData.placement && <p>Placement: {customData.placement.replace(/_/g, ' ')}</p>}
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className={styles.notes}>
                        <strong>Notes:</strong>
                        <p>{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.orderTotal}>
                    <div className={styles.totalLabel}>Total</div>
                    <div className={styles.totalAmount}>₹{order.total_amount}</div>
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <Link href={`/orders/${order.id}`} className={styles.viewBtn}>
                    <Eye size={16} />
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

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
