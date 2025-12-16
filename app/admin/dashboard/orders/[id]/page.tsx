'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, Phone, Mail, MapPin, CreditCard, Clock } from 'lucide-react';
import { isNumericOnly, shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';
import styles from './order-detail.module.css';

type Shipment = {
  id: number;
  order_id: number;
  provider: string;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  shiprocket_awb: string | null;
  shiprocket_courier_id: string | null;
  shiprocket_courier_name: string | null;
  status: string | null;
  tracking_url: string | null;
  label_url: string | null;
  created_at: string;
  updated_at: string;
};

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
    };
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipError, setShipError] = useState('');
  const [shipSuccess, setShipSuccess] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  useEffect(() => {
    fetchShipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      setShipError('');
      const res = await fetch(`/api/admin/shipments?orderId=${params.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setShipment(data);
    } catch (e) {
      // ignore
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const shipAction = async (path: string, body: any) => {
    if (String(order?.order_status || '').toLowerCase().includes('cancel')) {
      setShipError('Order is cancelled. Shipping actions are disabled.');
      return;
    }
    setShipLoading(true);
    setShipError('');
    setShipSuccess('');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setShipError(data?.error || 'Shiprocket action failed');
        return;
      }
      if (data?.shipment) setShipment(data.shipment);
      setShipSuccess('Done');

      // Always re-fetch from server so any "auto-repair" logic
      // (AWB/courier extracted from response_json) is reflected in the UI.
      await fetchShipment();
    } catch (e) {
      setShipError('Shiprocket action failed');
    } finally {
      setShipLoading(false);
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

  const isOrderCancelled = (() => {
    const os = String(order.order_status || '').toLowerCase();
    const ps = String(order.payment_status || '').toLowerCase();
    return os.includes('cancel') || ps.includes('cancel') || ps === 'failed';
  })();

  const shipNowTriggered = !!shipment?.shiprocket_awb;
  const canProceedInAdmin = shipNowTriggered;

  const isPaid = ['paid', 'completed', 'success'].includes(String(order.payment_status || '').toLowerCase());
  const trackingLabel = (() => {
    if (!isPaid) return 'Pending Payment';
    if (!shipment) return 'Pending Dispatch';
    if (!shipment.shiprocket_shipment_id && !shipment.shiprocket_order_id) return 'Pending Dispatch';
    if (!shipment.shiprocket_awb) return 'Pending AWB (Ship Now)';
    const raw = String(shipment.status || '').trim();
    const mapped = raw && isNumericOnly(raw) ? (shiprocketStatusCodeToLabel(raw) || raw) : raw;
    const combined = `${mapped}`.toLowerCase();
    if (combined.includes('deliver')) return 'Delivered';
    if (combined.includes('cancel')) return 'Cancelled';
    if (combined.includes('rto')) return 'RTO';
    if (combined.includes('in transit') || combined.includes('shipped')) return 'In Transit';
    return mapped || 'Shipped';
  })();

  const prettyShipmentStatus = (() => {
    const raw = String(shipment?.status || '').trim();
    if (!raw) return '—';
    if (isNumericOnly(raw)) {
      return shiprocketStatusCodeToLabel(raw) || `Tracking in progress (code ${raw})`;
    }
    return raw;
  })();

  let customData = null;
  try {
    customData = order.customization_data ? JSON.parse(order.customization_data) : null;
  } catch (e) {}

  const formatPlacement = (placement: unknown) => {
    if (typeof placement !== 'string') return null;
    return placement.replace(/_/g, ' ');
  };

  const getCustomizationFields = (value: any) => {
    if (!value || typeof value !== 'object') return null;
    const customText = typeof value.customText === 'string' ? value.customText : null;
    const font = typeof value.font === 'string' ? value.font : null;
    const placement = formatPlacement(value.placement);
    if (!customText && !font && !placement) return null;
    return { customText, font, placement };
  };

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

      {(() => {
        // Normalize items for display (supports multi-item orders)
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
          <>

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
                      {idx === 0 && (
                        <p className={styles.itemMeta}>Price per unit: ₹{order.unit_price}</p>
                      )}
                    </div>
                  </div>
                </div>
                {idx === 0 && (
                  <div className={styles.itemPrice}>
                    ₹{order.unit_price * order.quantity}
                  </div>
                )}
              </div>
            ))}

            {customData && (
              <div className={styles.customization}>
                <strong>🎨 Customization Details</strong>
                {Array.isArray(customData?.items) ? (
                  customData.items.map((it: any, idx: number) => {
                    const titleParts: string[] = [];
                    if (typeof it?.productName === 'string' && it.productName.trim()) titleParts.push(it.productName.trim());
                    if (typeof it?.phoneModel === 'string' && it.phoneModel.trim()) titleParts.push(it.phoneModel.trim());
                    const title = titleParts.join(' — ') || `Item ${idx + 1}`;

                    const customizationCandidate = it?.customizationOptions ?? it?.customization ?? it;
                    const fields = getCustomizationFields(customizationCandidate);

                    return (
                      <div key={idx}>
                        <p><strong>{title}</strong>{it?.quantity ? ` (Qty: ${it.quantity})` : ''}</p>
                        {fields?.customText && <p>Custom Text: "{fields.customText}"</p>}
                        {fields?.font && <p>Font Style: {fields.font}</p>}
                        {fields?.placement && <p>Text Placement: {fields.placement}</p>}
                      </div>
                    );
                  })
                ) : (
                  (() => {
                    const fields = getCustomizationFields(customData);
                    if (!fields) return null;
                    return (
                      <>
                        {fields.customText && <p>Custom Text: "{fields.customText}"</p>}
                        {fields.font && <p>Font Style: {fields.font}</p>}
                        {fields.placement && <p>Text Placement: {fields.placement}</p>}
                      </>
                    );
                  })()
                )}
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
              <Package size={20} />
              Shiprocket Shipment
            </h2>

            {shipError && <div className={styles.errorMsg}>{shipError}</div>}
            {shipSuccess && <div className={styles.success}>{shipSuccess}</div>}

            {!shipment ? (
              <button
                onClick={() => shipAction('/api/admin/shipments/create', { orderId: order.id })}
                disabled={shipLoading || isOrderCancelled}
                className={styles.saveBtn}
              >
                {shipLoading ? 'Working...' : 'Create Shipment'}
              </button>
            ) : (
              <div className={styles.infoList}>
                {!shipment.shiprocket_shipment_id && (
                  <div className={styles.notes}>
                    <strong>Shipment not created in Shiprocket</strong>
                    <p>
                      Fix <code>SHIPROCKET_PICKUP_LOCATION</code> (must exactly match a Shiprocket pickup location),
                      then click Retry.
                    </p>
                    <button
                      onClick={() => shipAction('/api/admin/shipments/create', { orderId: order.id })}
                      disabled={shipLoading || isOrderCancelled}
                      className={styles.saveBtn}
                    >
                      {shipLoading ? 'Working...' : 'Retry Create Shipment'}
                    </button>
                  </div>
                )}

                {!!shipment.shiprocket_shipment_id && !shipNowTriggered && (
                  <div className={styles.notes}>
                    <strong>Waiting for Shiprocket “Ship Now”</strong>
                    <p>
                      Open Shiprocket dashboard and click <b>Ship Now</b>. After that, click Sync here to fetch AWB/courier.
                    </p>
                    <button
                      onClick={() => shipAction('/api/admin/shipments/sync', { orderId: order.id })}
                      disabled={shipLoading || isOrderCancelled}
                      className={styles.saveBtn}
                    >
                      {shipLoading ? 'Working...' : 'Sync From Shiprocket'}
                    </button>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.label}>Status:</span>
                  <span className={styles.valueSmall}>{prettyShipmentStatus}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Shipment ID:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_shipment_id || '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>AWB:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_awb || '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Courier:</span>
                  <span className={styles.valueSmall}>{shipment.shiprocket_courier_name || '—'}</span>
                </div>

                <button
                  onClick={() => shipAction('/api/admin/shipments/assign-awb', { orderId: order.id })}
                  disabled={shipLoading || isOrderCancelled || !canProceedInAdmin || !!shipment.shiprocket_awb}
                  className={styles.saveBtn}
                >
                  {shipLoading ? 'Working...' : shipment.shiprocket_awb ? 'AWB Assigned' : 'Assign AWB'}
                </button>

                <button
                  onClick={() => shipAction('/api/admin/shipments/generate-label', { orderId: order.id })}
                  disabled={shipLoading || isOrderCancelled || !canProceedInAdmin || !shipment.shiprocket_shipment_id}
                  className={styles.saveBtn}
                >
                  {shipLoading ? 'Working...' : 'Generate Label'}
                </button>

                {shipment.label_url && (
                  <a href={shipment.label_url} target="_blank" rel="noreferrer" className={styles.backBtn}>
                    Download Label
                  </a>
                )}

                <button
                  onClick={() => shipAction('/api/admin/shipments/track', { orderId: order.id })}
                  disabled={shipLoading || isOrderCancelled || !canProceedInAdmin || !shipment.shiprocket_awb}
                  className={styles.saveBtn}
                >
                  {shipLoading ? 'Working...' : 'Refresh Tracking'}
                </button>

                {shipment.tracking_url && (
                  <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className={styles.backBtn}>
                    Open Tracking
                  </a>
                )}

                <button
                  onClick={() => shipAction('/api/admin/shipments/cancel', { orderId: order.id })}
                  disabled={shipLoading || isOrderCancelled}
                  className={styles.saveBtn}
                >
                  {shipLoading ? 'Working...' : 'Cancel Shipment'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Package size={20} />
              Tracking Status
            </h2>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Status:</span>
                <span
                  className={styles.badge}
                  style={{ backgroundColor: getStatusColor(trackingLabel) }}
                >
                  {trackingLabel}
                </span>
              </div>
              {shipment?.updated_at && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Last Sync:</span>
                  <span>{new Date(shipment.updated_at).toLocaleString()}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.label}>Sync:</span>
                <span>Use “Sync From Shiprocket” to update customer view.</span>
              </div>
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
          </>
        );
      })()}
    </div>
  );
}
