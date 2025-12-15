'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Package, Truck, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import styles from './order-confirmation.module.css';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      // Clear cart after an order is placed (COD / non-payment flows)
      try {
        clearCart();
        localStorage.removeItem('casebuddy_cart');
      } catch {
        // ignore
      }
      fetchOrderDetails(orderId);
    }
  }, [searchParams]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successIcon}>
          <CheckCircle size={80} />
        </div>
        
        <h1 className={styles.title}>Order Placed Successfully!</h1>
        <p className={styles.subtitle}>
          Thank you for your order. We've sent a confirmation email to your inbox.
        </p>

        {orderDetails && (
          <>
            <div className={styles.orderNumber}>
              Order Number: <strong>#{orderDetails.order_number}</strong>
            </div>

            <div className={styles.infoSection}>
              <h3><Package size={24} /> Order Details</h3>
              <div className={styles.productCard}>
                {orderDetails.product_image && (
                  <Image 
                    src={orderDetails.product_image} 
                    alt={orderDetails.product_name}
                    width={100}
                    height={100}
                    className={styles.productImage}
                  />
                )}
                <div className={styles.productInfo}>
                  <h4>{orderDetails.product_name}</h4>
                  <p>{orderDetails.phone_model}</p>
                  {orderDetails.design_name && <p>Design: {orderDetails.design_name}</p>}
                  <p>Quantity: {orderDetails.quantity}</p>
                  <p className={styles.price}>₹{parseFloat(orderDetails.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3><Truck size={24} /> Shipping Address</h3>
              <div className={styles.addressCard}>
                <p><strong>{orderDetails.customer_name}</strong></p>
                <p>{orderDetails.shipping_address_line1}</p>
                {orderDetails.shipping_address_line2 && <p>{orderDetails.shipping_address_line2}</p>}
                <p>{orderDetails.shipping_city}, {orderDetails.shipping_state} {orderDetails.shipping_pincode}</p>
                <p className={styles.contact}>
                  <Phone size={16} /> {orderDetails.customer_mobile}
                </p>
                <p className={styles.contact}>
                  <Mail size={16} /> {orderDetails.customer_email}
                </p>
              </div>
            </div>

            <div className={styles.timeline}>
              <h3>What's Next?</h3>
              <div className={styles.timelineSteps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>1</div>
                  <div className={styles.stepContent}>
                    <h4>Order Confirmed</h4>
                    <p>We've received your order</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>2</div>
                  <div className={styles.stepContent}>
                    <h4>Processing</h4>
                    <p>Your order is being prepared</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>3</div>
                  <div className={styles.stepContent}>
                    <h4>Shipped</h4>
                    <p>We'll send you tracking details</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>4</div>
                  <div className={styles.stepContent}>
                    <h4>Delivered</h4>
                    <p>Delivery in 7-10 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Continue Shopping
            <ArrowRight size={20} />
          </Link>
          <Link href="/contact" className={styles.secondaryBtn}>
            Need Help?
          </Link>
        </div>

        <div className={styles.supportNote}>
          <p>Questions about your order? Contact us at:</p>
          <p><Phone size={16} /> +918107624752 | <Mail size={16} /> info@casebuddy.co.in</p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
