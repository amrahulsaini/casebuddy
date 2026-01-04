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
  order_status?: string | null;
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
  shipment_status?: string | null;
  shipment_updated_at?: string | null;
  shiprocket_awb?: string | null;
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

type Shipment = {
  shiprocket_awb: string | null;
  tracking_url: string | null;
};

type TrackingScan = {
  status: string;
  location: string;
  date: string;
  time: string;
  timestamp: string;
  instructions: string;
};

type TrackingData = {
  scans: TrackingScan[];
  tracking_url: string | null;
  etd: string | null;
  current_status: string | null;
};

function normalizePlacement(value: unknown) {
  if (!value) return null;
  return String(value).replace(/_/g, ' ');
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const verifiedAtRaw = localStorage.getItem('ordersEmailVerifiedAt');
    const verifiedAt = verifiedAtRaw ? Number(verifiedAtRaw) : 0;
    const isFresh = verifiedAt && Date.now() - verifiedAt < 24 * 60 * 60 * 1000;
    if (!userEmail) {
      router.push('/orders');
      return;
    }

    if (!isFresh) {
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

        // Fetch tracking activity log
        fetchTrackingDetails();

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

  const fetchTrackingDetails = async () => {
    if (!params.id) return;
    setLoadingTracking(true);
    try {
      const userEmail = localStorage.getItem('customerEmail');
      const res = await fetch(`/api/orders/${params.id}/tracking`, {
        headers: {
          'x-customer-email': (userEmail || '').trim().toLowerCase(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoadingTracking(false);
    }
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
    
    if (s.includes('deliver') || s.includes('complet')) return <CheckCircle size={24} />;
    if (s.includes('transit') || s.includes('ship') || s.includes('process') || s.includes('pack') || s.includes('pick')) return <Truck size={24} />;
    if (s.includes('pending')) return <Clock size={24} />;
    if (s.includes('cancel') || s.includes('fail') || s.includes('rto') || s.includes('return')) return <XCircle size={24} />;
    
    return <Package size={24} />;
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

  const displayStatus = order.shipment_status || order.order_status || 'Pending';

  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          productId: null,
          productName: order.product_name,
          phoneModel: order.phone_model,
          designName: null,
          quantity: order.quantity,
          imageUrl: null,
        },
      ];

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

      <div className={styles.grid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Package size={20} />
              Order Items
            </h2>
            {items.map((it, idx) => (
              <div className={styles.orderItem} key={idx}>
                <div className={styles.itemDetails}>
                  <div className={styles.itemHeaderRow}>
                    {it.imageUrl && (
                      <img
                        src={it.imageUrl}
                        alt={it.productName}
                        className={styles.itemImage}
                        loading="lazy"
                      />
                    )}
                    <div>
                      <h3>{it.productName}</h3>
                      {it.phoneModel && <p className={styles.itemMeta}>Phone Model: {it.phoneModel}</p>}
                      {it.designName && <p className={styles.itemMeta}>Design: {it.designName}</p>}
                      <p className={styles.itemMeta}>Quantity: {it.quantity}</p>
                    </div>
                  </div>

                  {it.customization && (it.customization.customText || it.customization.font || it.customization.placement || it.customization.designPosition) && (
                    <div className={styles.customization}>
                      <strong>🎨 Customization</strong>
                      {it.customization.designPosition && (
                        <p>Design Position: {it.customization.designPosition === 'right_design' ? 'Right Design' : 'Left Design'}</p>
                      )}
                      {it.customization.customText && <p>Text: "{it.customization.customText}"</p>}
                      {it.customization.font && <p>Font: {it.customization.font}</p>}
                      {it.customization.placement && (
                        <p>Placement: {normalizePlacement(it.customization.placement)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

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

          {/* Tracking Activity Log */}
          {trackingData && trackingData.scans && trackingData.scans.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Truck size={20} />
                Shipment Tracking Activity
              </h2>
              
              {trackingData.tracking_url && (
                <a 
                  href={trackingData.tracking_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.trackingLink}
                >
                  View Full Tracking Details
                </a>
              )}

              {trackingData.etd && (
                <div className={styles.etdInfo}>
                  <strong>Expected Delivery:</strong> {trackingData.etd}
                </div>
              )}

              <div className={styles.trackingTimeline}>
                {trackingData.scans.map((scan, index) => (
                  <div key={index} className={styles.trackingEvent}>
                    <div className={styles.trackingDot}></div>
                    <div className={styles.trackingContent}>
                      <div className={styles.trackingStatus}>
                        {scan.status}
                      </div>
                      {scan.location && (
                        <div className={styles.trackingLocation}>
                          <MapPin size={14} />
                          {scan.location}
                        </div>
                      )}
                      <div className={styles.trackingTime}>
                        <Clock size={14} />
                        {scan.date} {scan.time}
                      </div>
                      {scan.instructions && (
                        <div className={styles.trackingInstructions}>
                          {scan.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingTracking && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Truck size={20} />
                Shipment Tracking Activity
              </h2>
              <p className={styles.loadingText}>Loading tracking details...</p>
            </div>
          )}

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
          {shipment && (shipment.tracking_url || shipment.shiprocket_awb) && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Truck size={20} />
                Shipping Tracking
              </h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>AWB:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_awb || '—'}</span>
                </div>
                {shipment.tracking_url && (
                  <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className={styles.backBtn}>
                    Open Tracking
                  </a>
                )}
              </div>
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
