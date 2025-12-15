'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Download, Eye, RefreshCw } from 'lucide-react';
import styles from './orders.module.css';

interface Order {
  id: number;
  order_number: string;
  customer_email: string;
  customer_mobile: string;
  customer_name: string;
  product_name: string;
  phone_model: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  shipment_status?: string | null;
  shipment_updated_at?: string | null;
  shiprocket_awb?: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, paymentFilter, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(search) ||
        order.customer_name.toLowerCase().includes(search) ||
        order.customer_email.toLowerCase().includes(search) ||
        order.customer_mobile.includes(search) ||
        order.product_name.toLowerCase().includes(search)
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer Name', 'Email', 'Mobile', 'Product', 'Phone Model', 'Quantity', 'Amount', 'Payment Status', 'Shipment Status', 'Shipment Updated', 'Date'];
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.customer_name,
      order.customer_email,
      order.customer_mobile,
      order.product_name,
      order.phone_model,
      order.quantity,
      order.total_amount,
      order.payment_status,
      order.shipment_status || '',
      order.shipment_updated_at ? new Date(order.shipment_updated_at).toLocaleString() : '',
      new Date(order.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#4CAF50';
      case 'processing':
      case 'shipped':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.payment_status === 'completed').length,
    revenue: orders.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + o.total_amount, 0)
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders Management</h1>
          <p className={styles.subtitle}>View and manage all customer orders</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={fetchOrders} className={styles.refreshBtn}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={exportToCSV} className={styles.exportBtn}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e3f2fd' }}>
            <Package size={24} style={{ color: '#2196F3' }} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff3e0' }}>
            <Package size={24} style={{ color: '#FF9800' }} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Paid</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e1f5fe' }}>
            <Package size={24} style={{ color: '#03A9F4' }} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total - stats.completed}</div>
            <div className={styles.statLabel}>Unpaid</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e8f5e9' }}>
            <Package size={24} style={{ color: '#4CAF50' }} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>₹{stats.revenue.toLocaleString()}</div>
            <div className={styles.statLabel}>Revenue</div>
          </div>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by order number, customer, email, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.empty}>
          <Package size={64} />
          <h2>No Orders Found</h2>
          <p>{searchTerm || paymentFilter !== 'all' 
            ? 'Try adjusting your filters' 
            : 'No orders have been placed yet'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Shipment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className={styles.orderNumber}>#{order.order_number}</div>
                  </td>
                  <td>
                    <div className={styles.customerInfo}>
                      <div className={styles.customerName}>{order.customer_name}</div>
                      <div className={styles.customerMeta}>{order.customer_email}</div>
                      <div className={styles.customerMeta}>{order.customer_mobile}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{order.product_name}</div>
                      <div className={styles.productMeta}>{order.phone_model} × {order.quantity}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.amount}>₹{order.total_amount}</div>
                  </td>
                  <td>
                    <span
                      className={styles.paymentBadge}
                      style={{ backgroundColor: getStatusColor(order.payment_status) }}
                    >
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>
                        {order.shipment_status ? order.shipment_status : '—'}
                      </div>
                      <div className={styles.productMeta}>
                        {order.shipment_updated_at ? new Date(order.shipment_updated_at).toLocaleString() : '—'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.date}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/dashboard/orders/${order.id}`} className={styles.actionBtn}>
                      <Eye size={16} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              Previous
            </button>
            
            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePage : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Last
            </button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p>Total: {totalOrders} orders</p>
      </div>
    </div>
  );
}
