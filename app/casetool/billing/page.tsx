'use client';

import { useState, useEffect } from 'react';
import styles from './billing.module.css';
import { ArrowLeft, DollarSign, IndianRupee, Activity, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageLog {
  id: number;
  model_name: string;
  operation_type: string;
  input_images: number;
  output_images: number;
  output_tokens: number;
  cost_usd: number;
  cost_inr: number;
  is_billable: boolean;
  phone_model: string;
  feedback_status: string;
  created_at: string;
}

interface BillingSummary {
  total_operations: number;
  total_cost_usd: number;
  total_cost_inr: number;
  refunded_cost_inr?: number;
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
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
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
        setUsageLogs(data.logs || []);
        // Convert string numbers to actual numbers
        const rawSummary = data.summary || null;
        if (rawSummary) {
          setSummary({
            total_operations: Number(rawSummary.total_operations) || 0,
            total_cost_usd: Number(rawSummary.total_cost_usd) || 0,
            total_cost_inr: Number(rawSummary.total_cost_inr) || 0,
            refunded_cost_inr: rawSummary.refunded_cost_inr !== undefined ? Number(rawSummary.refunded_cost_inr) || 0 : undefined,
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
          const total = Number(rawSummary?.total_operations) || 0;
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

  const getOperationLabel = (operationType: string) => {
    const labels: Record<string, string> = {
      text_analysis: 'Text Analysis',
      image_generation: 'Image Generation',
      image_enhancement: '4K Enhancement',
    };
    return labels[operationType] || operationType;
  };

  const getModelLabel = (modelName: string) => {
    const labels: Record<string, string> = {
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
      'gemini-3-pro-image-preview': 'Gemini 3 Pro Image',
    };
    return labels[modelName] || modelName;
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
        <h1 className={styles.title}>API Usage & Billing</h1>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Activity size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Operations</div>
              <div className={styles.cardValue}>{summary.total_operations}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Cost (USD)</div>
              <div className={styles.cardValue}>${summary.total_cost_usd.toFixed(4)}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <IndianRupee size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Billable Cost (INR)</div>
              <div className={styles.cardValue}>₹{summary.total_cost_inr.toFixed(2)}</div>
            </div>
          </div>

          {summary.refunded_cost_inr !== undefined && summary.refunded_cost_inr > 0 && (
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                <IndianRupee size={24} />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardLabel}>Refunded (INR)</div>
                <div className={styles.cardValue}>₹{summary.refunded_cost_inr.toFixed(2)}</div>
              </div>
            </div>
          )}
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

        {usageLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No API usage recorded yet.</p>
            <p>Start generating case mockups to see your usage here!</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Date & Time</div>
              <div className={styles.tableCell}>Phone Model</div>
              <div className={styles.tableCell}>Operation</div>
              <div className={styles.tableCell}>Model</div>
              <div className={styles.tableCell}>Status</div>
              <div className={styles.tableCell}>Cost (INR)</div>
            </div>

            {usageLogs.map((log) => (
              <div key={log.id} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(log.created_at)}</div>
                <div className={styles.tableCell}>
                  <span className={styles.phoneModel}>{log.phone_model}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.operationType}>{getOperationLabel(log.operation_type)}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.modelName}>{getModelLabel(log.model_name)}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={`${styles.billingStatus} ${log.is_billable ? styles.billable : styles.refunded}`}>
                    {log.is_billable ? '✓ Billable' : '✗ Refunded'}
                  </span>
                  {log.feedback_status && (
                    <span className={styles.feedbackBadge}>
                      {log.feedback_status === 'accurate' ? '👍' : log.feedback_status === 'inaccurate' ? '👎' : '⏳'}
                    </span>
                  )}
                </div>
                <div className={styles.tableCell}>
                  <span className={log.is_billable ? styles.costInr : styles.costRefunded}>
                    ₹{Number(log.cost_inr).toFixed(2)}
                  </span>
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
