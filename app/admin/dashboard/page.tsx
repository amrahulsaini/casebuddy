import { productsPool } from '@/lib/db';
import styles from './page.module.css';

export default async function AdminDashboardPage() {
  const connection = await productsPool.getConnection();
  
  try {
    // Get statistics
    const [productsCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [categoriesCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [ordersCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await connection.execute(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );

    const stats = {
      products: (productsCount as any[])[0].count,
      categories: (categoriesCount as any[])[0].count,
      orders: (ordersCount as any[])[0].count,
      pending: (pendingOrders as any[])[0].count,
    };

    // Get recent orders
    const [recentOrders] = await connection.execute(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    return (
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Dashboard</h1>
        
        <div className={styles.quickLinks}>
          <a href="/admin/dashboard/pages" className={styles.quickLink}>
            <div className={styles.linkIcon}>📄</div>
            <div>
              <div className={styles.linkTitle}>Pages</div>
              <div className={styles.linkDesc}>Manage website pages</div>
            </div>
          </a>

          <a href="/admin/dashboard/page-sections" className={styles.quickLink}>
            <div className={styles.linkIcon}>🏠</div>
            <div>
              <div className={styles.linkTitle}>Page Sections</div>
              <div className={styles.linkDesc}>Manage page sections</div>
            </div>
          </a>

          <a href="/admin/dashboard/categories" className={styles.quickLink}>
            <div className={styles.linkIcon}>📁</div>
            <div>
              <div className={styles.linkTitle}>Categories</div>
              <div className={styles.linkDesc}>{stats.categories} categories</div>
            </div>
          </a>

          <a href="/admin/dashboard/products" className={styles.quickLink}>
            <div className={styles.linkIcon}>📦</div>
            <div>
              <div className={styles.linkTitle}>Products</div>
              <div className={styles.linkDesc}>{stats.products} products</div>
            </div>
          </a>

          <a href="/admin/dashboard/category-phones" className={styles.quickLink}>
            <div className={styles.linkIcon}>📱</div>
            <div>
              <div className={styles.linkTitle}>Category Phones</div>
              <div className={styles.linkDesc}>Set phone compatibility</div>
            </div>
          </a>

          <a href="/admin/dashboard/phone-brands" className={styles.quickLink}>
            <div className={styles.linkIcon}>🔧</div>
            <div>
              <div className={styles.linkTitle}>Phone Brands</div>
              <div className={styles.linkDesc}>Manage phone models</div>
            </div>
          </a>

          <a href="/admin/dashboard/orders" className={styles.quickLink}>
            <div className={styles.linkIcon}>🛒</div>
            <div>
              <div className={styles.linkTitle}>Orders</div>
              <div className={styles.linkDesc}>{stats.pending} pending</div>
            </div>
          </a>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Total Products</p>
              <p className={styles.statValue}>{stats.products}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📁</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Categories</p>
              <p className={styles.statValue}>{stats.categories}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🛒</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Total Orders</p>
              <p className={styles.statValue}>{stats.orders}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Pending Orders</p>
              <p className={styles.statValue}>{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className={styles.recentOrders}>
          <h2>Recent Orders</h2>
          {(recentOrders as any[]).length > 0 ? (
            <div className={styles.ordersTable}>
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders as any[]).map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.customer_name}</td>
                      <td>₹{parseFloat(order.total).toFixed(2)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.noData}>No orders yet</p>
          )}
        </div>
      </div>
    );
  } finally {
    connection.release();
  }
}
