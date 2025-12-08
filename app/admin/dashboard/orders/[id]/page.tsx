'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, Phone, Mail, MapPin, CreditCard, Clock, Save, Edit } from 'lucide-react';
import styles from './order-detail.module.css';

interface Order {
  id: number;
  order_number: string;
  customer_email: string;
  customer_mobile: string;
  customer_name: string;
  product_name: string;
  phone_model: string;
  quantity: number;
  unit_price: number;
  shipping_cost: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  payment_id: string | null;
  customization_data: string | null;
  notes: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
  updated_at: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        setOrderStatus(data.order_status);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    setSuccessMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order?.id, orderStatus }),
      });

      if (response.ok) {
        setSuccessMessage('Order status updated successfully');
        fetchOrderDetails();
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>{error}</h2>
          <Link href="/admin/dashboard/orders" className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  let customData = null;
  try {
    customData = order.customization_data ? JSON.parse(order.customization_data) : null;
  } catch (e) {}

  return (
    <div className={styles.container}>
      <Link href="/admin/dashboard/orders" className={styles.backLink}>
        <ArrowLeft size={20} />
        Back to Orders
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order #{order.order_number}</h1>
          <p className={styles.date}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {successMessage && <div className={styles.success}>{successMessage}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.grid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Package size={20} />
              Order Items
            </h2>
            <div className={styles.orderItem}>
              <div className={styles.itemDetails}>
                <h3>{order.product_name}</h3>
                <p className={styles.itemMeta}>Phone Model: {order.phone_model}</p>
                <p className={styles.itemMeta}>Quantity: {order.quantity}</p>
                <p className={styles.itemMeta}>Price per unit: ₹{order.unit_price}</p>
              </div>
              <div className={styles.itemPrice}>
                ₹{order.unit_price * order.quantity}
              </div>
            </div>

            {customData && (
              <div className={styles.customization}>
                <strong>🎨 Customization Details</strong>
                {customData.customText && <p>Custom Text: "{customData.customText}"</p>}
                {customData.font && <p>Font Style: {customData.font}</p>}
                {customData.placement && <p>Text Placement: {customData.placement.replace(/_/g, ' ')}</p>}
              </div>
            )}

            {order.notes && (
              <div className={styles.notes}>
                <strong>📝 Customer Notes</strong>
                <p>{order.notes}</p>
              </div>
            )}

            <div className={styles.priceSummary}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <span>₹{order.unit_price * order.quantity}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Shipping</span>
                <span>₹{order.shipping_cost}</span>
              </div>
              <div className={styles.priceRowTotal}>
                <span>Total</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <MapPin size={20} />
              Shipping Address
            </h2>
            <div className={styles.address}>
              <p><strong>{order.customer_name}</strong></p>
              <p>{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Edit size={20} />
              Order Status
            </h2>
            <div className={styles.statusControl}>
              <label className={styles.label}>Update Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className={styles.statusSelect}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={saving || orderStatus === order.order_status}
                className={styles.saveBtn}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <User size={20} />
              Customer Info
            </h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <User size={16} />
                <span>{order.customer_name}</span>
              </div>
              <div className={styles.infoItem}>
                <Mail size={16} />
                <span>{order.customer_email}</span>
              </div>
              <div className={styles.infoItem}>
                <Phone size={16} />
                <span>{order.customer_mobile}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <CreditCard size={20} />
              Payment Info
            </h2>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Payment Status:</span>
                <span 
                  className={styles.badge}
                  style={{ backgroundColor: getStatusColor(order.payment_status) }}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.payment_id && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Payment ID:</span>
                  <span className={styles.valueSmall}>{order.payment_id}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.label}>Amount:</span>
                <span className={styles.valueBold}>₹{order.total_amount}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Clock size={20} />
              Timeline
            </h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div>
                  <p className={styles.timelineLabel}>Order Created</p>
                  <p className={styles.timelineDate}>
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {order.updated_at !== order.created_at && (
                <div className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div>
                    <p className={styles.timelineLabel}>Last Updated</p>
                    <p className={styles.timelineDate}>
                      {new Date(order.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
