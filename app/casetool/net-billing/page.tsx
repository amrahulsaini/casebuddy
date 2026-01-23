'use client';

import { useState, useEffect } from 'react';
import styles from './net-billing.module.css';
import { ArrowLeft, IndianRupee, Activity, Calendar, Download, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DownloadLog {
  day: string;
  user_id: number;
  email: string;
  images_downloaded: number;
  total_inr: number;
  models: string[];
}

interface BillingSummary {
  total_users: number;
  total_downloads: number;
  total_download_cost_inr: number;
  total_operations: number;
  total_cost_inr: number;
}

export default function NetBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [filterModel, setFilterModel] = useState<string>('');

  useEffect(() => {
    fetchBillingData();
  }, [filterDate, filterModel]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      let url = '/casetool/api/net-billing';
      const params = new URLSearchParams();
      if (filterDate) params.append('filter_date', filterDate);
      if (filterModel) params.append('filter_model', filterModel);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setDownloadLogs(result.data.downloadBilling || []);
        setSummary(result.data.summary || null);
        setAvailableModels(result.data.availableModels || []);
        setErrorMessage('');
      } else {
        setErrorMessage(result.error || 'Failed to load billing data');
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      setErrorMessage('Network error: Unable to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
              <div className={styles.cardLabel}>Total Operations</div>
              <div className={styles.cardValue}>{summary.total_operations}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <IndianRupee size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Generation Cost (INR)</div>
              <div className={styles.cardValue}>₹{summary.total_cost_inr.toFixed(2)}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <Download size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Total Downloads</div>
              <div className={styles.cardValue}>{summary.total_downloads || 0}</div>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>
              <IndianRupee size={24} />
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>Download Cost (INR)</div>
              <div className={styles.cardValue}>₹{(summary.total_download_cost_inr || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.logsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Calendar size={20} />
            Download History - All Users
          </h2>
          
          <div className={styles.filters}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={styles.filterInput}
            />
            {filterDate && (
              <button className={styles.clearButton} onClick={() => setFilterDate('')}>
                Clear Date
              </button>
            )}
            
            <select 
              value={filterModel} 
              onChange={(e) => setFilterModel(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Models</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {filterModel && (
              <button className={styles.clearButton} onClick={() => setFilterModel('')}>
                Clear Model
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {downloadLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No download records found.</p>
            <p>Billing is recorded when users download images.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Date</div>
              <div className={styles.tableCell}>User ID</div>
              <div className={styles.tableCell}>Email</div>
              <div className={styles.tableCell}>Images Downloaded</div>
              <div className={styles.tableCell}>Phone Models</div>
              <div className={styles.tableCell}>Amount (INR)</div>
            </div>
            {downloadLogs.map((log, index) => (
              <div key={index} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(log.day)}</div>
                <div className={styles.tableCell}>{log.user_id}</div>
                <div className={styles.tableCell}>{log.email}</div>
                <div className={styles.tableCell}>{log.images_downloaded}</div>
                <div className={styles.tableCell}>{log.models.join(', ') || 'N/A'}</div>
                <div className={styles.tableCell}>₹{log.total_inr.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
