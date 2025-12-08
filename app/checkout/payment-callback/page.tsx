'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import styles from './payment-callback.module.css';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const orderStatus = searchParams.get('order_status');
    
    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment callback. Order ID missing.');
      return;
    }

    // Determine payment status and send confirmation emails if paid
    if (orderStatus === 'PAID') {
      setStatus('success');
      setMessage('Payment successful! Your order has been confirmed.');
      
      // Send confirmation emails after successful payment
      sendPaymentConfirmation(orderId);
      fetchOrderDetails(orderId);
    } else if (orderStatus === 'ACTIVE') {
      setStatus('pending');
      setMessage('Payment is pending. Please complete the payment.');
    } else {
      setStatus('failed');
      setMessage('Payment failed or was cancelled. Please try again.');
    }
  }, [searchParams]);

  const sendPaymentConfirmation = async (orderId: string) => {
    try {
      await fetch('/api/checkout/payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <div className={styles.statusSection}>
            <Loader2 size={64} className={`${styles.icon} ${styles.loading}`} />
            <h1 className={styles.title}>Processing Payment...</h1>
            <p className={styles.message}>Please wait while we verify your payment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.statusSection}>
            <CheckCircle size={64} className={`${styles.icon} ${styles.success}`} />
            <h1 className={styles.title}>Payment Successful!</h1>
            <p className={styles.message}>{message}</p>
            
            {orderDetails && (
              <div className={styles.orderInfo}>
                <h3>Order Details</h3>
                <p>Order Number: <strong>{orderDetails.orderNumber}</strong></p>
                <p>Total Amount: <strong>₹{orderDetails.total}</strong></p>
              </div>
            )}

            <div className={styles.actions}>
              <Link href="/" className={styles.primaryBtn}>
                Continue Shopping
              </Link>
              <Link href="/orders" className={styles.secondaryBtn}>
                View Orders
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className={styles.statusSection}>
            <XCircle size={64} className={`${styles.icon} ${styles.failed}`} />
            <h1 className={styles.title}>Payment Failed</h1>
            <p className={styles.message}>{message}</p>
            
            <div className={styles.actions}>
              <Link href="/cart" className={styles.primaryBtn}>
                Return to Cart
              </Link>
              <Link href="/" className={styles.secondaryBtn}>
                Go to Home
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className={styles.statusSection}>
            <Clock size={64} className={`${styles.icon} ${styles.pending}`} />
            <h1 className={styles.title}>Payment Pending</h1>
            <p className={styles.message}>{message}</p>
            
            <div className={styles.actions}>
              <Link href="/cart" className={styles.primaryBtn}>
                Try Again
              </Link>
              <Link href="/" className={styles.secondaryBtn}>
                Go to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.statusSection}>
            <Loader2 size={64} className={`${styles.icon} ${styles.loading}`} />
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
