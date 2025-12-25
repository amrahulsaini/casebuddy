'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Mail, Eye, CheckCircle, Clock, XCircle, Truck, ShoppingCart, User, Menu, Heart, Instagram, Facebook, Phone, MapPin, Zap, MessageCircle } from 'lucide-react';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import styles from './orders.module.css';
import homeStyles from '../home.module.css';
import { getShippingConfig } from '@/lib/shipping';

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
  order_status?: string | null;
  payment_status: string;
  customization_data: string | null;
  notes: string | null;
  created_at: string;
  primary_image_url?: string | null;
  items?: Array<{
    productId: number | null;
    productName: string;
    phoneModel?: string | null;
    designName?: string | null;
    quantity: number;
    imageUrl?: string | null;
    customization?: {
      customText?: string;
      font?: string;
      placement?: string;
      designPosition?: string;
    };
  }>;
}

function normalizePlacement(value: unknown) {
  if (!value) return null;
  return String(value).replace(/_/g, ' ');
}

export default function OrdersPage() {
  const { freeShippingThreshold } = getShippingConfig();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
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
    const verifiedAtRaw = localStorage.getItem('ordersEmailVerifiedAt');
    const verifiedAt = verifiedAtRaw ? Number(verifiedAtRaw) : 0;
    const isFresh = verifiedAt && Date.now() - verifiedAt < 24 * 60 * 60 * 1000;

    if (savedEmail && isFresh) {
      const normalized = savedEmail.trim().toLowerCase();
      if (normalized && normalized !== savedEmail) {
        localStorage.setItem('userEmail', normalized);
      }
      setEmail(normalized || savedEmail);
      setIsLoggedIn(true);
      fetchOrders(normalized || savedEmail);
    } else if (savedEmail && !isFresh) {
      // Keep email filled, but require OTP again.
      const normalized = savedEmail.trim().toLowerCase();
      setEmail(normalized || savedEmail);
      setOtpSent(false);
      setOtp('');
      localStorage.removeItem('ordersEmailVerifiedAt');
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

  const validateEmail = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v) return { ok: false, email: '', error: 'Please enter your email address' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, email: v, error: 'Please enter a valid email address' };
    return { ok: true, email: v, error: '' };
  };

  const requestEmailOtp = async (normalizedEmail: string) => {
    setOtpSending(true);
    setError('');
    try {
      const res = await fetch('/api/checkout/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', email: normalizedEmail, purpose: 'orders_login' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to send OTP');
        return;
      }
      setOtpSent(true);
    } catch {
      setError('Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyEmailOtp = async (normalizedEmail: string) => {
    setOtpVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/checkout/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', email: normalizedEmail, otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Invalid OTP');
        return;
      }

      localStorage.setItem('userEmail', normalizedEmail);
      localStorage.setItem('ordersEmailVerifiedAt', String(Date.now()));
      setIsLoggedIn(true);
      fetchOrders(normalizedEmail);
    } catch {
      setError('Failed to verify OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const v = validateEmail(email);
    if (!v.ok) {
      setError(v.error);
      return;
    }

    if (!otpSent) {
      setOtp('');
      await requestEmailOtp(v.email);
      return;
    }

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }

    await verifyEmailOtp(v.email);
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
    localStorage.removeItem('ordersEmailVerifiedAt');
    setIsLoggedIn(false);
    setEmail('');
    setOtp('');
    setOtpSent(false);
    setOrders([]);
  };

  const getPopularStatusLabel = (orderStatusRaw: unknown, paymentStatusRaw: unknown) => {
    const raw = String(orderStatusRaw || '').trim();
    const payment = String(paymentStatusRaw || '').trim();
    const source = raw || payment;
    const s = source.toLowerCase();

    if (!s) return 'Pending';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('deliver') || s.includes('complete')) return 'Delivered';
    if (s.includes('rto')) return 'RTO';
    if (s.includes('return')) return 'Returned';
    if (s.includes('ship') || s.includes('transit')) return 'Shipped';
    if (s.includes('process') || s.includes('pack') || s.includes('print')) return 'Processing';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('paid')) return 'Processing';
    if (s.includes('fail')) return 'Failed';

    // Title-case fallback
    return source
      .split(/[_\s]+/g)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return '#4CAF50';
      case 'processing':
      case 'shipped':
      case 'in transit':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
      case 'rto':
      case 'returned':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <CheckCircle size={20} />;
      case 'processing':
      case 'shipped':
      case 'in transit':
        return <Truck size={20} />;
      case 'pending':
        return <Clock size={20} />;
      case 'cancelled':
      case 'failed':
      case 'rto':
      case 'returned':
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
            <p>Enter your email and verify OTP to view your orders</p>
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
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <CheckCircle size={20} />
                  Email OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            
            {error && <div className={styles.error}>{error}</div>}
            
            <button type="submit" className={styles.loginBtn} disabled={otpSending || otpVerifying}>
              {!otpSent ? (otpSending ? 'Sending OTP...' : 'Send OTP') : (otpVerifying ? 'Verifying...' : 'Verify & View Orders')}
            </button>

            {otpSent && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className={styles.loginBtn}
                  style={{ background: '#fff', color: '#333', border: '1px solid #ddd' }}
                  disabled={otpSending || otpVerifying}
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = validateEmail(email);
                    if (!v.ok) {
                      setError(v.error);
                      return;
                    }
                    requestEmailOtp(v.email);
                  }}
                  className={styles.loginBtn}
                  style={{ background: '#f5f5f5', color: '#333' }}
                  disabled={otpSending || otpVerifying}
                >
                  {otpSending ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            )}
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

  return (
    <div className={styles.container}>
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
            const popularStatus = getPopularStatusLabel(order.order_status, order.payment_status);
            const items = Array.isArray(order.items) && order.items.length > 0
              ? order.items
              : [
                  {
                    productId: null,
                    productName: order.product_name,
                    phoneModel: order.phone_model,
                    designName: null,
                    quantity: order.quantity,
                    imageUrl: order.primary_image_url || null,
                  },
                ];

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
                      style={{ backgroundColor: getStatusColor(popularStatus) }}
                    >
                      {getStatusIcon(popularStatus)}
                      {popularStatus}
                    </div>
                  </div>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.productInfo}>
                    <div className={styles.productRow}>
                      {order.primary_image_url && (
                        // Using <img> to avoid next/image remote domain config issues
                        <img
                          src={order.primary_image_url}
                          alt={items?.[0]?.productName || 'Product'}
                          className={styles.productImage}
                          loading="lazy"
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4>{items.length === 1 ? items[0].productName : `${items.length} items`}</h4>
                        {items.length === 1 && items[0].phoneModel && <p>Phone Model: {items[0].phoneModel}</p>}
                        {items.length === 1 && <p>Quantity: {items[0].quantity}</p>}
                      </div>
                    </div>

                    {items.length > 1 && (
                      <div className={styles.customization}>
                        <strong>Items:</strong>
                        {items.slice(0, 4).map((it, idx) => (
                          <p key={idx}>
                            {it.productName}{it.phoneModel ? ` (${it.phoneModel})` : ''} × {it.quantity}
                          </p>
                        ))}
                        {items.length > 4 && <p>+ {items.length - 4} more…</p>}
                      </div>
                    )}

                    {items.length === 1 && items[0].customization && (
                      <div className={styles.customization}>
                        <strong>Customization:</strong>
                        {items[0].customization.designPosition && (
                          <p>Design Position: {items[0].customization.designPosition === 'right_design' ? 'Right Design' : 'Left Design'}</p>
                        )}
                        {items[0].customization.customText && <p>Text: &quot;{items[0].customization.customText}&quot;</p>}
                        {items[0].customization.font && <p>Font: {items[0].customization.font}</p>}
                        {items[0].customization.placement && (
                          <p>Placement: {normalizePlacement(items[0].customization.placement)}</p>
                        )}
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
