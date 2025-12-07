'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminUser } from '@/lib/auth';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  user: AdminUser;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/dashboard/pages', label: 'Pages' },
    { href: '/admin/dashboard/sections', label: 'Sections' },
    { href: '/admin/dashboard/categories', label: 'Categories' },
    { href: '/admin/dashboard/products', label: 'Products' },
    { href: '/admin/dashboard/category-phones', label: 'Category Phones' },
    { href: '/admin/dashboard/phone-brands', label: 'Phone Brands' },
    { href: '/admin/dashboard/orders', label: 'Orders' },
    { href: '/admin/dashboard/users', label: 'Admin Users', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.adminOnly || user.role === 'admin'
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>CaseBuddy Admin</h1>
        <p className={styles.role}>{user.role}</p>
      </div>

      <nav className={styles.nav}>
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${
              pathname === item.href ? styles.active : ''
            }`}
          >
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.user}>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.full_name || user.username}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
