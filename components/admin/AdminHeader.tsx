'use client';

import { useRouter } from 'next/navigation';
import { AdminUser } from '@/lib/auth';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  user: AdminUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <span>Welcome back, {user.full_name || user.username}!</span>
      </div>

      <div className={styles.actions}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          🚪 Logout
        </button>
      </div>
    </header>
  );
}
