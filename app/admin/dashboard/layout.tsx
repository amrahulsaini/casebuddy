export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import styles from './layout.module.css';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar user={user} />
      <div className={styles.mainContent}>
        <AdminHeader user={user} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
