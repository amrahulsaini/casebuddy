'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Mail, Eye, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import styles from './orders.module.css';

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
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setIsLoggedIn(true);
      fetchOrders(savedEmail);
    }
  }, []);

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
            <p>Don't have an account? Orders are automatically saved when you checkout.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
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
          <p>You haven't placed any orders yet.</p>
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
            } catch (e) {}

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
                        {customData.customText && <p>Text: "{customData.customText}"</p>}
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
  );
}
