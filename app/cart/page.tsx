'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, X, Truck, Package, Zap, ShoppingCart, User, Menu, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import styles from './cart.module.css';
import homeStyles from '../home.module.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleCheckout = () => {
    console.log('Checkout button clicked!');
    
    if (cart.length === 0) {
      console.log('Cart is empty, returning');
      return;
    }
    
    const firstItem = cart[0];
    
    // Calculate total from all items
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 499 ? 0 : 80;
    const totalPrice = subtotal + shipping;
    
    const params = new URLSearchParams({
      productId: firstItem.productId.toString(),
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

    const checkoutUrl = `/checkout?${params.toString()}`;
    console.log('Navigating to:', checkoutUrl);
    
    // Navigate to checkout
    window.location.href = checkoutUrl;
  };

  return (
    <div className={styles.container}>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
            <span><Truck size={16} /> Free Shipping Above ₹499</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
            <span><Truck size={16} /> Free Shipping Above ₹499</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`${homeStyles.header} ${scrollY > 50 ? homeStyles.scrolled : ''} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} className={homeStyles.logoImg} priority />
          </Link>
          <div className={homeStyles.navLinks}>
            <Link href="/" className={homeStyles.navLink}>Home</Link>
            <Link href="/shop" className={homeStyles.navLink}>Shop</Link>
            <Link href="/about" className={homeStyles.navLink}>About</Link>
            <Link href="/contact" className={homeStyles.navLink}>Contact</Link>
          </div>
          <div className={homeStyles.navActions}>
            <SearchBar />
            <Link href="/wishlist" className={homeStyles.iconButton}>
              <Heart size={22} />
              <WishlistBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/cart" className={homeStyles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/orders" className={homeStyles.iconButton}>
              <User size={22} />
            </Link>
            <button className={homeStyles.mobileMenu} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={homeStyles.mobileNav}>
          <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      <div className={styles.contentWrapper}>
        {cart.length === 0 ? (
          <div className={styles.emptyContainer}>
            <ShoppingBag size={80} className={styles.emptyIcon} />
            <h1>Your Cart is Empty</h1>
            <p>Add some amazing phone cases to get started!</p>
            <Link href="/" className={styles.shopButton}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.pageHeader}>
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
                            <p><strong>Text:</strong> &quot;{item.customText}&quot; ({item.font})</p>
                            <p><strong>Placement:</strong> {item.placement?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p>
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
                  {cartTotal >= 499 ? (
                    <span className={styles.free}>FREE</span>
                  ) : (
                    <span>₹80</span>
                  )}
                </div>

                <div className={styles.summaryDivider}></div>

                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>₹{(cartTotal + (cartTotal >= 499 ? 0 : 80)).toFixed(2)}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
