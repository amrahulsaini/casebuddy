'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to safely access localStorage
const getLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setLocalStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize with function to avoid SSR hydration issues
  const [cart, setCart] = useState<CartItem[]>(() => {
    const initial = getLocalStorage('casebuddy_cart', []);
    console.log('CartProvider initial cart from localStorage:', initial);
    return initial;
  });
  const [wishlist, setWishlist] = useState<number[]>(() => {
    const initial = getLocalStorage('casebuddy_wishlist', []);
    console.log('CartProvider initial wishlist from localStorage:', initial);
    return initial;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    console.log('CartProvider hydrating...');
    const loadedCart = getLocalStorage('casebuddy_cart', []);
    const loadedWishlist = getLocalStorage('casebuddy_wishlist', []);
    console.log('CartProvider loaded from localStorage - cart:', loadedCart, 'wishlist:', loadedWishlist);
    setCart(loadedCart);
    setWishlist(loadedWishlist);
    setIsHydrated(true);
    console.log('CartProvider hydration complete');
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (isHydrated) {
      console.log('CartProvider saving cart to localStorage:', cart);
      setLocalStorage('casebuddy_cart', cart);
    }
  }, [cart, isHydrated]);

  // Sync wishlist to localStorage
  useEffect(() => {
    if (isHydrated) {
      console.log('CartProvider saving wishlist to localStorage:', wishlist);
      setLocalStorage('casebuddy_wishlist', wishlist);
    }
  }, [wishlist, isHydrated]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const toggleWishlist = (id: number) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.includes(id)) {
        return prevWishlist.filter((itemId) => itemId !== id);
      }
      return [...prevWishlist, id];
    });
  };

  const isInWishlist = (id: number) => {
    return wishlist.includes(id);
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
