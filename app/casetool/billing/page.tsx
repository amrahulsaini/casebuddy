'use client';

import { useState, useEffect } from 'react';
import styles from './billing.module.css';
import { ArrowLeft, IndianRupee, Activity, Calendar, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DownloadBillingLog {
  id: number;
  generation_log_id: number;
  amount_inr: number;
  phone_model: string;
  generated_image_url: string | null;
  created_at: string;
}

interface BillingSummary {
  total_downloads: number;
  total_cost_inr: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloadLogs, setDownloadLogs] = useState<DownloadBillingLog[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 100, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchBillingData(1);
  }, []);

  const fetchBillingData = async (page: number) => {
    try {
      const response = await fetch(`/casetool/api/billing?page=${page}&pageSize=${pagination.pageSize}`);
      const data = await response.json();
      
      if (data.success) {
        setDownloadLogs(data.logs || []);
        // Convert string numbers to actual numbers
        const rawSummary = data.summary || null;
        if (rawSummary) {
          setSummary({
            total_downloads: Number(rawSummary.total_downloads) || 0,
            total_cost_inr: Number(rawSummary.total_cost_inr) || 0,
          });
        }

        const rawPagination = data.pagination || null;
        if (rawPagination) {
          setPagination({
            page: Number(rawPagination.page) || page,
            pageSize: Number(rawPagination.pageSize) || pagination.pageSize,
            total: Number(rawPagination.total) || 0,
            totalPages: Number(rawPagination.totalPages) || 0,
          });
        } else {
          // Backward compatible fallback
          const total = Number(rawSummary?.total_downloads) || 0;
          const totalPages = total > 0 ? Math.ceil(total / pagination.pageSize) : 0;
          setPagination({ page, pageSize: pagination.pageSize, total, totalPages });
        }

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
    setLoading(true);
    fetchBillingData(pagination.page - 1);
  };

  const goToNextPage = () => {
    if (pagination.totalPages > 0 && pagination.page >= pagination.totalPages) return;
    setLoading(true);
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
      <div className={styles.paymentCapturedDialog} role="dialog" aria-label="Payment captured">
        <div className={styles.paymentCapturedTitle}>Payment captured</div>
        <div className={styles.paymentCapturedText}>Your payment of ₹3200 was captured. Please keep using the tool.</div>
      </div>

      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/casetool')}>
          <ArrowLeft size={20} />
          <span>Back to Generator</span>
        </button>
        <h1 className={styles.title}>API Usage & Billing</h1>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Activity size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Downloads</div>
              <div className={styles.cardValue}>{summary.total_downloads}</div>
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
        </div>
      )}

      <div className={styles.logsSection}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={20} />
          Usage History
        </h2>

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
            <p>Billing is recorded when you download an image.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Date & Time</div>
              <div className={styles.tableCell}>Phone Model</div>
              <div className={styles.tableCell}>Amount (INR)</div>
              <div className={styles.tableCell}>File</div>
            </div>

            {downloadLogs.map((log) => (
              <div key={log.id} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(log.created_at)}</div>
                <div className={styles.tableCell}>
                  <span className={styles.phoneModel}>{log.phone_model}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.costInr}>₹{Number(log.amount_inr).toFixed(2)}</span>
                </div>
                <div className={styles.tableCell}>
                  {log.generated_image_url ? (
                    <a href={log.generated_image_url} className={styles.fileLink} target="_blank" rel="noreferrer">
                      <Download size={16} />
                      View
                    </a>
                  ) : (
                    <span className={styles.fileMissing}>—</span>
                  )}
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
