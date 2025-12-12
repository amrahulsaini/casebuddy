'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import styles from './cart.module.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const firstItem = cart[0];
    
    // Calculate total from all items
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 80;
    const totalPrice = subtotal + shipping;
    
    const params = new URLSearchParams({
      productName: firstItem.name,
      phoneModel: firstItem.phoneModel,
      price: totalPrice.toString(),
      quantity: totalQuantity.toString(),
      image: firstItem.image || '',
    });

    // Add customization if present
    if (firstItem.customText) {
      params.append('customText', firstItem.customText);
      params.append('font', firstItem.font || 'Arial');
      params.append('placement', firstItem.placement || 'center');
    }

    // Add notes if present
    if (firstItem.additionalNotes) {
      params.append('notes', firstItem.additionalNotes);
    }
    
    // Add warning if multiple items
    if (cart.length > 1) {
      params.append('notes', `Multiple items: ${cart.map(item => `${item.name} (${item.quantity})`).join(', ')}`);
    }

    // Navigate to checkout
    window.location.href = `/checkout?${params.toString()}`;
  };

  if (cart.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <ShoppingBag size={80} className={styles.emptyIcon} />
        <h1>Your Cart is Empty</h1>
        <p>Add some amazing phone cases to get started!</p>
        <Link href="/" className={styles.shopButton}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          Continue Shopping
        </Link>
        <h1>Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h1>
        <button 
          onClick={() => setShowClearConfirm(true)} 
          className={styles.clearButton}
        >
          Clear Cart
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.cartItems}>
          {cart.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemImage}>
                <Image 
                  src={item.image || '/placeholder.jpg'} 
                  alt={item.name}
                  width={120}
                  height={160}
                  className={styles.image}
                />
              </div>

              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <div className={styles.customizationDetails}>
                  <p><strong>Phone:</strong> {item.phoneBrand} - {item.phoneModel}</p>
                  {item.customText && (
                    <>
                      <p><strong>Text:</strong> "{item.customText}" ({item.font})</p>
                      <p><strong>Placement:</strong> {item.placement?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </>
                  )}
                  {item.additionalNotes && (
                    <p><strong>Notes:</strong> {item.additionalNotes}</p>
                  )}
                </div>
              </div>

              <div className={styles.itemActions}>
                <div className={styles.quantityControl}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className={styles.quantityButton}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className={styles.quantityButton}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className={styles.itemPrice}>
                  <span className={styles.price}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  <span className={styles.unitPrice}>₹{item.price} each</span>
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)}
                  className={styles.removeButton}
                  title="Remove from cart"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2>Order Summary</h2>
          
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>₹80</span>
          </div>

          <div className={styles.summaryDivider}></div>

          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>₹{(cartTotal + 80).toFixed(2)}</span>
          </div>

          <button 
            type="button"
            className={styles.checkoutButton} 
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>

          <Link href="/" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Clear Cart Confirmation */}
      {showClearConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              onClick={() => setShowClearConfirm(false)}
              className={styles.modalClose}
            >
              <X size={24} />
            </button>
            <h3>Clear Cart?</h3>
            <p>Are you sure you want to remove all items from your cart?</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className={styles.confirmButton}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
