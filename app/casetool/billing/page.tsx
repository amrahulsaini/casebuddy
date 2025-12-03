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
  created_at: string;
}

interface BillingSummary {
  total_operations: number;
  total_cost_usd: number;
  total_cost_inr: number;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/casetool/api/billing');
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
          });
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
              <div className={styles.tableCell}>Operation</div>
              <div className={styles.tableCell}>Model</div>
              <div className={styles.tableCell}>Input</div>
              <div className={styles.tableCell}>Output</div>
              <div className={styles.tableCell}>Cost (USD)</div>
              <div className={styles.tableCell}>Cost (INR)</div>
            </div>

            {usageLogs.map((log) => (
              <div key={log.id} className={styles.tableRow}>
                <div className={styles.tableCell}>{formatDate(log.created_at)}</div>
                <div className={styles.tableCell}>
                  <span className={styles.operationType}>{getOperationLabel(log.operation_type)}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.modelName}>{getModelLabel(log.model_name)}</span>
                </div>
                <div className={styles.tableCell}>
                  {log.input_images > 0 && `${log.input_images} img`}
                </div>
                <div className={styles.tableCell}>
                  {log.output_images > 0 && `${log.output_images} img`}
                  {log.output_tokens > 0 && ` ${log.output_tokens} tokens`}
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.costUsd}>${Number(log.cost_usd).toFixed(4)}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.costInr}>₹{Number(log.cost_inr).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
