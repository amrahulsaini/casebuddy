'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, MapPin, ShoppingBag, Lock, Check } from 'lucide-react';
import Toast from '@/components/Toast';
import styles from './page.module.css';

interface OrderItem {
  productId: number;
  productName: string;
  phoneModel: string;
  designName?: string;
  customizationOptions?: any;
  price: number;
  quantity: number;
  image: string;
}

interface FormData {
  // Contact Information
  email: string;
  mobile: string;
  
  // Address Information
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  
  // Additional
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    mobile: '',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Verification states
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  
  // Processing state
  const [processing, setProcessing] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    setToast({ show: true, type, message, title });
  };

  // Resend timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailResendTimer > 0) {
      interval = setInterval(() => {
        setEmailResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileResendTimer > 0) {
      interval = setInterval(() => {
        setMobileResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileResendTimer]);

  // Indian states
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // Load order data from URL params
  useEffect(() => {
    const productId = searchParams.get('productId');
    const phoneModel = searchParams.get('phoneModel');
    const designName = searchParams.get('designName');
    const price = searchParams.get('price');
    const quantity = searchParams.get('quantity');
    const image = searchParams.get('image');
    const productName = searchParams.get('productName');

    if (!productId || !phoneModel || !price || !image) {
      router.push('/shop');
      return;
    }

    setOrderItem({
      productId: parseInt(productId),
      productName: productName || 'Custom Phone Case',
      phoneModel,
      designName: designName || undefined,
      price: parseFloat(price),
      quantity: quantity ? parseInt(quantity) : 1,
      image: decodeURIComponent(image)
    });

    setLoading(false);
  }, [searchParams, router]);

  // Form validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
        return '';
      
      case 'mobile':
        if (!value) return 'Mobile number is required';
        if (!/^[6-9]\d{9}$/.test(value)) return 'Invalid mobile number (10 digits starting with 6-9)';
        return '';
      
      case 'fullName':
        if (!value) return 'Full name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        return '';
      
      case 'addressLine1':
        if (!value) return 'Address is required';
        if (value.length < 10) return 'Please enter complete address';
        return '';
      
      case 'city':
        if (!value) return 'City is required';
        return '';
      
      case 'state':
        if (!value) return 'State is required';
        return '';
      
      case 'pincode':
        if (!value) return 'Pincode is required';
        if (!/^\d{6}$/.test(value)) return 'Invalid pincode (6 digits)';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Reset verification if email/mobile changed
    if (name === 'email' && emailVerified) {
      setEmailVerified(false);
      setEmailOtpSent(false);
      setEmailOtp('');
    }
    if (name === 'mobile' && mobileVerified) {
      setMobileVerified(false);
      setMobileOtpSent(false);
      setMobileOtp('');
    }
  };

  // Send Email OTP
  const sendEmailOtp = async () => {
    const error = validateField('email', formData.email);
    if (error) {
      setFormErrors(prev => ({ ...prev, email: error }));
      showToast('error', error);
      return;
    }

    if (emailResendTimer > 0) {
      showToast('warning', `Please wait ${emailResendTimer} seconds before resending`);
      return;
    }

    try {
      const response = await fetch('/api/checkout/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, type: 'email' })
      });

      if (response.ok) {
        setEmailOtpSent(true);
        setEmailResendTimer(60);
        showToast('success', 'OTP has been sent to your email address');
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      showToast('error', 'Failed to send OTP. Please try again.');
    }
  };

  // Send Mobile OTP
  const sendMobileOtp = async () => {
    const error = validateField('mobile', formData.mobile);
    if (error) {
      setFormErrors(prev => ({ ...prev, mobile: error }));
      showToast('error', error);
      return;
    }

    if (mobileResendTimer > 0) {
      showToast('warning', `Please wait ${mobileResendTimer} seconds before resending`);
      return;
    }

    try {
      const response = await fetch('/api/checkout/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobile, type: 'mobile' })
      });

      if (response.ok) {
        setMobileOtpSent(true);
        setMobileResendTimer(60);
        showToast('success', 'OTP has been sent to your mobile number');
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending mobile OTP:', error);
      showToast('error', 'Failed to send OTP. Please try again.');
    }
  };

  // Verify Email OTP
  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      showToast('warning', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await fetch('/api/checkout/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: emailOtp, type: 'email' })
      });

      if (response.ok) {
        setEmailVerified(true);
        showToast('success', 'Email verified successfully!');
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      showToast('error', 'Verification failed. Please try again.');
    }
  };

  // Verify Mobile OTP
  const verifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length !== 6) {
      showToast('warning', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await fetch('/api/checkout/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobile, otp: mobileOtp, type: 'mobile' })
      });

      if (response.ok) {
        setMobileVerified(true);
        showToast('success', 'Mobile number verified successfully!');
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying mobile OTP:', error);
      showToast('error', 'Verification failed. Please try again.');
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!orderItem) return { subtotal: 0, shipping: 0, total: 0 };
    
    const subtotal = orderItem.price * orderItem.quantity;
    const shipping = subtotal >= 499 ? 0 : 80;
    const total = subtotal + shipping;
    
    return { subtotal, shipping, total };
  };

  // Handle checkout
  const handleCheckout = async () => {
    // Validate all fields
    const errors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'addressLine2' && key !== 'notes') {
        const error = validateField(key, formData[key as keyof FormData]);
        if (error) errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('error', 'Please fill all required fields correctly');
      return;
    }

    if (!emailVerified) {
      showToast('warning', 'Please verify your email address');
      return;
    }

    if (!mobileVerified) {
      showToast('warning', 'Please verify your mobile number');
      return;
    }

    if (!orderItem) {
      showToast('error', 'Order details not found');
      return;
    }

    setProcessing(true);

    try {
      // Create order in database
      const { subtotal, shipping, total } = calculateTotals();
      
      const orderData = {
        ...formData,
        orderItem,
        subtotal,
        shipping,
        total,
        emailVerified,
        mobileVerified
      };

      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const { orderId } = await response.json();
        
        showToast('success', 'Order created successfully! Redirecting to payment...');
        
        // TODO: Integrate Cashfree payment gateway
        // For now, redirect to success page
        setTimeout(() => {
          router.push(`/order-confirmation?orderId=${orderId}`);
        }, 1500);
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('error', 'Failed to process checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#333' }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!orderItem) {
    return null;
  }

  const { subtotal, shipping, total } = calculateTotals();

  return (
    <div className={styles.container}>
      <div className={styles.checkoutWrapper}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Contact Information */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={24} />
              Contact Information
            </h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email Address <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    name="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <button
                      type="button"
                      className={styles.verifyBtn}
                      onClick={sendEmailOtp}
                      disabled={!formData.email || (emailOtpSent && emailResendTimer > 0)}
                    >
                      {emailOtpSent && emailResendTimer > 0 ? `Resend in ${emailResendTimer}s` : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {formErrors.email && <span className={styles.error}>{formErrors.email}</span>}
                
                {emailOtpSent && !emailVerified && (
                  <>
                    <div className={styles.inputGroup} style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter 6-digit OTP"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        className={styles.otpBtn}
                        onClick={verifyEmailOtp}
                        disabled={emailOtp.length !== 6}
                      >
                        Verify
                      </button>
                    </div>
                    <p className={styles.otpInfo}>Check your email for OTP</p>
                  </>
                )}
                
                {emailVerified && (
                  <div className={styles.verified}>
                    <Check size={18} />
                    Email verified
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Mobile Number <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="tel"
                    name="mobile"
                    className={styles.input}
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    disabled={mobileVerified}
                    maxLength={10}
                  />
                  {!mobileVerified && (
                    <button
                      type="button"
                      className={styles.verifyBtn}
                      onClick={sendMobileOtp}
                      disabled={!formData.mobile || (mobileOtpSent && mobileResendTimer > 0)}
                    >
                      {mobileOtpSent && mobileResendTimer > 0 ? `Resend in ${mobileResendTimer}s` : mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {formErrors.mobile && <span className={styles.error}>{formErrors.mobile}</span>}
                
                {mobileOtpSent && !mobileVerified && (
                  <>
                    <div className={styles.inputGroup} style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter 6-digit OTP"
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        className={styles.otpBtn}
                        onClick={verifyMobileOtp}
                        disabled={mobileOtp.length !== 6}
                      >
                        Verify
                      </button>
                    </div>
                    <p className={styles.otpInfo}>Check your SMS for OTP</p>
                  </>
                )}
                
                {mobileVerified && (
                  <div className={styles.verified}>
                    <Check size={18} />
                    Mobile verified
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MapPin size={24} />
              Shipping Address
            </h2>
            
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.full}`}>
                <label className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className={styles.input}
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
                {formErrors.fullName && <span className={styles.error}>{formErrors.fullName}</span>}
              </div>

              <div className={`${styles.formGroup} ${styles.full}`}>
                <label className={styles.label}>
                  Address Line 1 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  className={styles.input}
                  placeholder="House/Flat No., Building Name, Street"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                />
                {formErrors.addressLine1 && <span className={styles.error}>{formErrors.addressLine1}</span>}
              </div>

              <div className={`${styles.formGroup} ${styles.full}`}>
                <label className={styles.label}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  className={styles.input}
                  placeholder="Locality, Area (Optional)"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  City <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  className={styles.input}
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
                {formErrors.city && <span className={styles.error}>{formErrors.city}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  State <span className={styles.required}>*</span>
                </label>
                <select
                  name="state"
                  className={styles.select}
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {formErrors.state && <span className={styles.error}>{formErrors.state}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Pincode <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  className={styles.input}
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  maxLength={6}
                />
                {formErrors.pincode && <span className={styles.error}>{formErrors.pincode}</span>}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <ShoppingBag size={24} />
              Order Notes (Optional)
            </h2>
            
            <div className={styles.formGroup}>
              <textarea
                name="notes"
                className={styles.textarea}
                placeholder="Any special instructions or notes for your order..."
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className={styles.orderSummary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          
          <div className={styles.productCard}>
            <img
              src={orderItem.image}
              alt={orderItem.productName}
              className={styles.productImage}
            />
            <div className={styles.productInfo}>
              <div className={styles.productName}>{orderItem.productName}</div>
              <div className={styles.productVariant}>
                {orderItem.phoneModel}
                {orderItem.designName && ` • ${orderItem.designName}`}
              </div>
              <div className={styles.productVariant}>
                Quantity: {orderItem.quantity}
              </div>
              <div className={styles.productPrice}>₹{orderItem.price.toFixed(2)} each</div>
            </div>
          </div>

          <div className={styles.summaryRow}>
            <span>Subtotal ({orderItem.quantity} {orderItem.quantity === 1 ? 'item' : 'items'})</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
          </div>
          
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span className={styles.totalAmount}>₹{total.toFixed(2)}</span>
          </div>

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={processing || !emailVerified || !mobileVerified}
          >
            {processing ? 'Processing...' : 'Proceed to Payment'}
            {!processing && <Lock size={18} />}
          </button>

          <div className={styles.secureNote}>
            <Lock size={14} />
            Secure checkout powered by Cashfree
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#333' }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
