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
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/dashboard/products', icon: '📦', label: 'Products' },
    { href: '/admin/dashboard/categories', icon: '📁', label: 'Categories' },
    { href: '/admin/dashboard/orders', icon: '🛒', label: 'Orders' },
    { href: '/admin/dashboard/users', icon: '👥', label: 'Admin Users', adminOnly: true },
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
            <span className={styles.icon}>{item.icon}</span>
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
