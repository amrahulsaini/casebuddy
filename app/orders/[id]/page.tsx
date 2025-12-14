'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, Phone, Mail, MapPin, CreditCard, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
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

type Shipment = {
  id: number;
  order_id: number;
  status: string | null;
  shiprocket_awb: string | null;
  shiprocket_courier_name?: string | null;
  tracking_url: string | null;
  updated_at?: string;
  current_status?: string | null;
  customer_status?: 'shipped' | 'delivered' | 'cancelled' | null;
  events?: Array<{ date: string | null; location: string | null; status: string | null; message: string | null }>;
};

function formatCustomerShipmentStatus(status: Shipment['customer_status']) {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'delivered') return 'Delivered';
  if (status === 'shipped') return 'Shipped';
  return '—';
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      router.push('/orders');
      return;
    }

    const normalized = userEmail.trim().toLowerCase();
    if (normalized && normalized !== userEmail) {
      localStorage.setItem('userEmail', normalized);
    }

    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const userEmail = localStorage.getItem('userEmail');
        const expected = (userEmail || '').trim().toLowerCase();
        const actual = String(data.customer_email || '').trim().toLowerCase();
        
        // Verify this order belongs to the logged-in user
        if (!expected || !actual || actual !== expected) {
          setError('Unauthorized access');
          return;
        }
        
        setOrder(data);

        // Try to fetch shipment info for tracking (if available)
        try {
          const shipRes = await fetch(`/api/orders/${params.id}/shipment`, {
            headers: {
              'x-customer-email': (userEmail || '').trim().toLowerCase(),
            },
          });
          if (shipRes.ok) {
            const shipData = await shipRes.json();
            setShipment(shipData);
          }
        } catch (e) {
          // ignore
        }
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle size={24} />;
      case 'processing':
      case 'shipped':
        return <Truck size={24} />;
      case 'pending':
        return <Clock size={24} />;
      case 'cancelled':
      case 'failed':
        return <XCircle size={24} />;
      default:
        return <Package size={24} />;
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

  if (error || !order) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <XCircle size={64} />
          <h2>{error || 'Order not found'}</h2>
          <Link href="/orders" className={styles.backBtn}>
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  let customData = null;
  try {
    customData = order.customization_data ? JSON.parse(order.customization_data) : null;
  } catch (e) {}

  return (
    <div className={styles.container}>
      <Link href="/orders" className={styles.backLink}>
        <ArrowLeft size={20} />
        Back to Orders
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order #{order.order_number}</h1>
          <p className={styles.date}>
            Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className={styles.statusBadges}>
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(order.payment_status) }}
          >
            {getStatusIcon(order.payment_status)}
            {order.payment_status}
          </div>
        </div>
      </div>

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
              </div>
              <div className={styles.itemPrice}>
                ₹{order.unit_price} × {order.quantity}
              </div>
            </div>

            {customData && (
              <div className={styles.customization}>
                <strong>🎨 Customization</strong>
                {customData.customText && <p>Text: "{customData.customText}"</p>}
                {customData.font && <p>Font: {customData.font}</p>}
                {customData.placement && <p>Placement: {customData.placement.replace(/_/g, ' ')}</p>}
              </div>
            )}

            {order.notes && (
              <div className={styles.notes}>
                <strong>📝 Special Instructions</strong>
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
          {shipment && (shipment.tracking_url || shipment.shiprocket_awb || shipment.status) && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Truck size={20} />
                Shipping Tracking
              </h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Status:</span>
                  <span className={styles.value}>{formatCustomerShipmentStatus(shipment.customer_status)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Courier:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_courier_name || '—'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>AWB:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_awb || '—'}</span>
                </div>
                {shipment.updated_at && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Last Update:</span>
                    <span className={styles.valueSmall}>{new Date(shipment.updated_at).toLocaleString()}</span>
                  </div>
                )}
                {shipment.tracking_url && (
                  <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className={styles.backBtn}>
                    Open Tracking
                  </a>
                )}
              </div>

              {shipment.events && shipment.events.length > 0 && (
                <div className={styles.timeline}>
                  {shipment.events.map((ev, idx) => (
                    <div className={styles.timelineItem} key={idx}>
                      <div className={styles.timelineDot}></div>
                      <div>
                        <p className={styles.timelineLabel}>{ev.status || ev.message || 'Update'}</p>
                        <p className={styles.timelineDate}>
                          {[ev.location, ev.date].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              <div className={styles.infoItem}>
                <span className={styles.label}>Status:</span>
                <span className={styles.value} style={{ color: getStatusColor(order.payment_status) }}>
                  {order.payment_status}
                </span>
              </div>
              {order.payment_id && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Payment ID:</span>
                  <span className={styles.valueSmall}>{order.payment_id}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.label}>Amount:</span>
                <span className={styles.value}>₹{order.total_amount}</span>
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
                  <p className={styles.timelineLabel}>Order Placed</p>
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
