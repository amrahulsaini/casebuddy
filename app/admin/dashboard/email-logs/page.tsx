'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import styles from './logs.module.css';

interface EmailLog {
  id: number;
  order_id: number | null;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
  order_number?: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page, filterType, filterStatus]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/admin/email-logs?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'sent' ? '#4CAF50' : '#f44336';
  };

  const getStatusIcon = (status: string) => {
    return status === 'sent' ? <CheckCircle size={16} /> : <XCircle size={16} />;
  };

  const formatEmailType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Email Logs</h1>
          <p>Track all emails sent from the system</p>
        </div>
        <button onClick={fetchLogs} className={styles.refreshButton}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>
            <Filter size={16} />
            Email Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value="order_confirmation">Order Confirmation</option>
            <option value="order_confirmation_copy">Order Confirmation Copy</option>
            <option value="admin_notification">Admin Notification</option>
            <option value="tracking_update">Tracking Update</option>
            <option value="delivery_notification">Delivery Notification</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {(filterType || filterStatus) && (
          <button
            onClick={() => {
              setFilterType('');
              setFilterStatus('');
              setPage(1);
            }}
            className={styles.clearButton}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading logs...</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>
                      {log.order_id ? (
                        <Link href={`/admin/dashboard/orders/${log.order_id}`} className={styles.orderLink}>
                          #{log.order_number || log.order_id}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={styles.emailType}>
                        <Mail size={14} />
                        {formatEmailType(log.email_type)}
                      </span>
                    </td>
                    <td className={styles.email}>{log.recipient_email}</td>
                    <td className={styles.subject}>{log.subject}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(log.status) }}
                      >
                        {getStatusIcon(log.status)}
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(log.sent_at).toLocaleString()}</td>
                    <td className={styles.error}>
                      {log.error_message ? (
                        <span className={styles.errorText} title={log.error_message}>
                          {log.error_message.substring(0, 50)}...
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
