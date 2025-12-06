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
  }, []);

  if (!mounted) return null;
  if (cartCount === 0) return null;

  return <span className={className}>{cartCount}</span>;
}

export function WishlistBadge({ className = 'cartBadge' }: BadgeProps) {
  const { wishlist } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (wishlist.length === 0) return null;

  return <span className={className}>{wishlist.length}</span>;
}
