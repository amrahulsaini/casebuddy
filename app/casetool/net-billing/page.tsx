'use client';

import { useState, useEffect } from 'react';
import styles from './net-billing.module.css';
import { ArrowLeft, IndianRupee, Activity, Calendar, Users, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DownloadLog {
  id: number;
  user_id: number;
  generation_log_id: number;
  amount_inr: number;
  phone_model: string;
  case_type: string;
  original_image_url: string | null;
  generated_image_url: string | null;
  is_downloaded: number;
  download_date: string | null;
  created_at: string;
  email: string;
  model_name: string;
}

interface BillingSummary {
  total_users: number;
  total_generations: number;
  total_cost_inr: number;
  total_download_cost_inr: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface User {
  id: number;
  email: string;
}

export default function NetBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 100, total: 0, totalPages: 0 });
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterDownloaded, setFilterDownloaded] = useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchBillingData(1);
  }, [filterDate, filterUserId, filterDownloaded]);

  const fetchBillingData = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pagination.pageSize.toString());
      if (filterDate) params.append('filter_date', filterDate);
      if (filterUserId) params.append('filter_user_id', filterUserId);
      if (filterDownloaded) params.append('filter_downloaded', '1');
      
      const response = await fetch(`/casetool/api/net-billing?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setDownloadLogs(data.logs || []);
        setSummary(data.summary || null);
        setAvailableUsers(data.availableUsers || []);
        setPagination(data.pagination || { page, pageSize: pagination.pageSize, total: 0, totalPages: 0 });
        
        if (data.message) {
          setErrorMessage(data.message);
        }
      } else {
        setErrorMessage(data.error || 'Failed to load billing data');
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      setErrorMessage('Network error: Unable to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const goToPrevPage = () => {
    if (pagination.page <= 1) return;
    fetchBillingData(pagination.page - 1);
  };

  const goToNextPage = () => {
    if (pagination.totalPages > 0 && pagination.page >= pagination.totalPages) return;
    fetchBillingData(pagination.page + 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading billing data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/casetool')}>
          <ArrowLeft size={20} />
          <span>Back to Generator</span>
        </button>
        <h1 className={styles.title}>Net Billing - All Users</h1>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Users size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Users</div>
              <div className={styles.cardValue}>{summary.total_users}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Activity size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Generations</div>
              <div className={styles.cardValue}>{summary.total_generations}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <IndianRupee size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Cost (INR)</div>
              <div className={styles.cardValue}>₹{summary.total_cost_inr.toFixed(2)}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <IndianRupee size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Download Cost (INR)</div>
              <div className={styles.cardValue}>₹{summary.total_download_cost_inr.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.logsSection}>
        <div className={styles.filterBar}>
          <h2 className={styles.sectionTitle}>
            <Calendar size={20} />
            {filterDownloaded ? 'Downloaded Billing' : 'Download History'}
          </h2>
          
          <div className={styles.filters}>
            <button
              className={`${styles.downloadedButton} ${filterDownloaded ? styles.active : ''}`}
              onClick={() => setFilterDownloaded(!filterDownloaded)}
            >
              {filterDownloaded ? '✓ Downloaded Only' : 'Show Downloaded'}
            </button>
            <select 
              value={filterUserId} 
              onChange={(e) => setFilterUserId(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Users</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>ID: {user.id} - {user.email}</option>
              ))}
            </select>
            
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={styles.filterInput}
            />
            
            {(filterUserId || filterDate || filterDownloaded) && (
              <button 
                className={styles.clearButton} 
                onClick={() => { setFilterUserId(''); setFilterDate(''); setFilterDownloaded(false); }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.paginationBar}>
            <button
              className={styles.pageButton}
              onClick={goToPrevPage}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <div className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              className={styles.pageButton}
              onClick={goToNextPage}
              disabled={pagination.totalPages > 0 && pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}

        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {downloadLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No downloads recorded yet.</p>
            <p>Billing is recorded when users download images.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Date & Time</div>
              <div className={styles.tableCell}>User</div>
              <div className={styles.tableCell}>Phone Model</div>
              <div className={styles.tableCell}>Case Type</div>
              <div className={styles.tableCell}>Original</div>
              <div className={styles.tableCell}>Generated</div>
              <div className={styles.tableCell}>Downloaded</div>
              <div className={styles.tableCell}>Amount</div>
            </div>
            {downloadLogs.map((log) => (
              <div key={log.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <div>{formatDate(log.created_at)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{log.model_name}</div>
                </div>
                <div className={styles.tableCell}>
                  <div>ID: {log.user_id}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{log.email}</div>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.phoneModel}>{log.phone_model || 'N/A'}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.badge}>{log.case_type || 'N/A'}</span>
                </div>
                <div className={styles.tableCell}>
                  {log.original_image_url ? (
                    <a href={log.original_image_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={log.original_image_url} 
                        alt="Original" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </a>
                  ) : 'N/A'}
                </div>
                <div className={styles.tableCell}>
                  {log.generated_image_url ? (
                    <a href={log.generated_image_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={log.generated_image_url} 
                        alt="Generated" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                      />
                    </a>
                  ) : 'N/A'}
                </div>
                <div className={styles.tableCell}>
                  {log.is_downloaded ? (
                    <div>
                      <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Yes</span>
                      {log.download_date && (
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          {formatDate(log.download_date)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>✗ No</span>
                  )}
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.costInr}>₹{Number(log.amount_inr).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className={styles.paginationBarBottom}>
            <button
              className={styles.pageButton}
              onClick={goToPrevPage}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <div className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              className={styles.pageButton}
              onClick={goToNextPage}
              disabled={pagination.totalPages > 0 && pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
