'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Mail, Eye, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import MainHeader from '@/components/MainHeader';
import MainFooter from '@/components/MainFooter';
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
  order_status?: string | null;
  payment_status: string;
  customization_data: string | null;
  notes: string | null;
  created_at: string;
  primary_image_url?: string | null;
  shipment_status?: string | null;
  shipment_updated_at?: string | null;
  shiprocket_awb?: string | null;
  product_slug?: string | null;
  category_slug?: string | null;
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
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'failed'>('paid');
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
        console.log('Orders fetched:', data);
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

  const filteredOrders = orders.filter(order => {
    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'paid') {
      return order.payment_status?.toLowerCase() === 'paid' || 
             order.payment_status?.toLowerCase() === 'success' || 
             order.payment_status?.toLowerCase() === 'completed';
    }
    if (paymentFilter === 'failed') {
      return order.payment_status?.toLowerCase() === 'failed' || 
             order.payment_status?.toLowerCase() === 'pending';
    }
    return true;
  });

  const getPopularStatusLabel = (orderStatusRaw: unknown, paymentStatusRaw: unknown) => {
    const raw = String(orderStatusRaw || '').trim();
    const s = raw.toLowerCase();

    if (!s) return 'Pending';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('deliver') || s.includes('complete')) return 'Delivered';
    if (s.includes('rto')) return 'RTO';
    if (s.includes('return')) return 'Returned';
    if (s.includes('ship') || s.includes('transit')) return 'Shipped';
    if (s.includes('process') || s.includes('pack') || s.includes('print')) return 'Processing';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('pickup')) return 'Pickup Generated';
    if (s.includes('fail')) return 'Failed';

    // Title-case fallback
    return raw
      .split(/[_\s]+/g)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    
    if (s.includes('deliver')) return '#4CAF50';
    if (s.includes('complet')) return '#4CAF50';
    if (s.includes('transit') || s.includes('ship')) return '#2196F3';
    if (s.includes('process') || s.includes('pack') || s.includes('pick')) return '#2196F3';
    if (s.includes('pending')) return '#FF9800';
    if (s.includes('cancel')) return '#f44336';
    if (s.includes('fail')) return '#f44336';
    if (s.includes('rto') || s.includes('return')) return '#f44336';
    
    return '#757575';
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    
    if (s.includes('deliver') || s.includes('complet')) return <CheckCircle size={20} />;
    if (s.includes('transit') || s.includes('ship') || s.includes('process') || s.includes('pack') || s.includes('pick')) return <Truck size={20} />;
    if (s.includes('pending')) return <Clock size={20} />;
    if (s.includes('cancel') || s.includes('fail') || s.includes('rto') || s.includes('return')) return <XCircle size={20} />;
    
    return <Package size={20} />;
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <MainHeader scrollY={scrollY} headerVisible={headerVisible} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

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

      <MainFooter />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <MainHeader scrollY={scrollY} headerVisible={headerVisible} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

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

        <div className={styles.filterBar}>
          <label className={styles.filterLabel}>Show:</label>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterBtn} ${paymentFilter === 'paid' ? styles.filterBtnActive : ''}`}
              onClick={() => setPaymentFilter('paid')}
            >
              Paid Orders {orders.filter(o => 
                o.payment_status?.toLowerCase() === 'paid' || 
                o.payment_status?.toLowerCase() === 'success' || 
                o.payment_status?.toLowerCase() === 'completed'
              ).length > 0 && `(${orders.filter(o => 
                o.payment_status?.toLowerCase() === 'paid' || 
                o.payment_status?.toLowerCase() === 'success' || 
                o.payment_status?.toLowerCase() === 'completed'
              ).length})`}
            </button>
            <button 
              className={`${styles.filterBtn} ${paymentFilter === 'failed' ? styles.filterBtnActive : ''}`}
              onClick={() => setPaymentFilter('failed')}
            >
              Failed Orders {orders.filter(o => 
                o.payment_status?.toLowerCase() === 'failed' || 
                o.payment_status?.toLowerCase() === 'pending'
              ).length > 0 && `(${orders.filter(o => 
                o.payment_status?.toLowerCase() === 'failed' || 
                o.payment_status?.toLowerCase() === 'pending'
              ).length})`}
            </button>
            <button 
              className={`${styles.filterBtn} ${paymentFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setPaymentFilter('all')}
            >
              All Orders ({orders.length})
            </button>
          </div>
        </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.noOrders}>
          <Package size={64} />
          <h2>No {paymentFilter === 'paid' ? 'Paid' : paymentFilter === 'failed' ? 'Failed' : ''} Orders Found</h2>
          <p>
            {paymentFilter === 'paid' && 'You have no successful orders yet.'}
            {paymentFilter === 'failed' && 'You have no failed payment orders.'}
            {paymentFilter === 'all' && 'You haven\'t placed any orders yet.'}
          </p>
          {paymentFilter !== 'all' && orders.length > 0 && (
            <button onClick={() => setPaymentFilter('all')} className={styles.shopBtn}>
              View All Orders
            </button>
          )}
          {orders.length === 0 && (
            <Link href="/shop" className={styles.shopBtn}>
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => {
            const displayStatus = order.shipment_status || order.order_status || 'Pending';
            console.log('Order:', order.order_number, 'shipment_status:', order.shipment_status, 'order_status:', order.order_status, 'displayStatus:', displayStatus);
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
                      style={{ backgroundColor: getStatusColor(displayStatus) }}
                    >
                      {getStatusIcon(displayStatus)}
                      {displayStatus}
                    </div>
                    {order.shipment_updated_at && (
                      <div className={styles.statusDate}>
                        Updated: {new Date(order.shipment_updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.productInfo}>
                    <div className={styles.productRow}>
                      {order.product_slug && order.category_slug && order.primary_image_url ? (
                        <Link href={`/shop/${order.category_slug}/${order.product_slug}`} className={styles.productImageLink}>
                          <img
                            src={order.primary_image_url}
                            alt={items?.[0]?.productName || 'Product'}
                            className={styles.productImage}
                            loading="lazy"
                          />
                        </Link>
                      ) : order.primary_image_url ? (
                        <img
                          src={order.primary_image_url}
                          alt={items?.[0]?.productName || 'Product'}
                          className={styles.productImage}
                          loading="lazy"
                        />
                      ) : null}
                      <div style={{ flex: 1 }}>
                        {order.product_slug && order.category_slug ? (
                          <Link href={`/shop/${order.category_slug}/${order.product_slug}`} className={styles.productNameLink}>
                            <h4>{items.length === 1 ? items[0].productName : `${items.length} items`}</h4>
                          </Link>
                        ) : (
                          <h4>{items.length === 1 ? items[0].productName : `${items.length} items`}</h4>
                        )}
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

    <MainFooter />
    </div>
  );
}
