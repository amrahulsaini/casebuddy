'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface BadgeProps {
  className?: string;
}

export function CartBadge({ className = 'cartBadge' }: BadgeProps) {
  const { cartCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('CartBadge mounted, cartCount:', cartCount);
  }, []);

  useEffect(() => {
    console.log('CartBadge cartCount changed:', cartCount, 'mounted:', mounted);
  }, [cartCount, mounted]);

  if (!mounted) {
    console.log('CartBadge not mounted yet');
    return null;
  }
  if (cartCount === 0) {
    console.log('CartBadge cartCount is 0, not rendering');
    return null;
  }

  console.log('CartBadge rendering with count:', cartCount);
  return <span className={className}>{cartCount}</span>;
}

export function WishlistBadge({ className = 'cartBadge' }: BadgeProps) {
  const { wishlist } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('WishlistBadge mounted, wishlist length:', wishlist.length);
  }, []);

  useEffect(() => {
    console.log('WishlistBadge wishlist changed:', wishlist.length, 'mounted:', mounted);
  }, [wishlist, mounted]);

  if (!mounted) {
    console.log('WishlistBadge not mounted yet');
    return null;
  }
  if (wishlist.length === 0) {
    console.log('WishlistBadge wishlist is empty, not rendering');
    return null;
  }

  console.log('WishlistBadge rendering with count:', wishlist.length);
  return <span className={className}>{wishlist.length}</span>;
}
