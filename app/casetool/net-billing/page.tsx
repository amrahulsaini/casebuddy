'use client';

import { useState, useEffect } from 'react';
import styles from './net-billing.module.css';
import { ArrowLeft, TrendingUp, Users, Zap, DollarSign, IndianRupee, Download, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserBillingDetail {
  user_id: number;
  email: string;
  total_operations: number;
  text_analysis_count: number;
  image_generation_count: number;
  image_enhancement_count: number;
  total_tokens: number;
  total_images: number;
  total_cost_usd: number;
  total_cost_inr: number;
  last_activity: string;
}

interface ModelUsageDetail {
  model_name: string;
  operation_type: string;
  count: number;
  total_cost_usd: number;
  total_cost_inr: number;
  avg_cost_per_operation: number;
}

interface NetBillingData {
  summary: {
    total_users: number;
    total_operations: number;
    total_cost_usd: number;
    total_cost_inr: number;
    total_tokens: number;
    total_images: number;
  };
  userBilling: UserBillingDetail[];
  modelUsage: ModelUsageDetail[];
}

export default function NetBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NetBillingData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterEmail, setFilterEmail] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [sortBy, setSortBy] = useState<'cost' | 'operations' | 'email'>('cost');

  useEffect(() => {
    fetchNetBillingData();
  }, []);

  const fetchNetBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/casetool/api/net-billing');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setErrorMessage('');
      } else {
        setErrorMessage(result.error || 'Failed to load net billing data');
      }
    } catch (error) {
      console.error('Failed to fetch net billing data:', error);
      setErrorMessage('Network error: Unable to fetch net billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Prepare CSV content
    let csvContent = 'Net Billing Report\n';
    csvContent += new Date().toLocaleString() + '\n\n';

    // Summary section
    csvContent += 'SUMMARY\n';
    csvContent += `Total Users,${data.summary.total_users}\n`;
    csvContent += `Total Operations,${data.summary.total_operations}\n`;
    csvContent += `Total Cost (USD),${data.summary.total_cost_usd.toFixed(4)}\n`;
    csvContent += `Total Cost (INR),${data.summary.total_cost_inr.toFixed(2)}\n`;
    csvContent += `Total Tokens,${data.summary.total_tokens}\n`;
    csvContent += `Total Images,${data.summary.total_images}\n\n`;

    // User billing section
    csvContent += 'USER BILLING DETAILS\n';
    csvContent += 'Email,Total Operations,Text Analysis,Image Generation,Image Enhancement,Total Cost (USD),Total Cost (INR),Last Activity\n';
    data.userBilling.forEach((user) => {
      csvContent += `"${user.email}",${user.total_operations},${user.text_analysis_count},${user.image_generation_count},${user.image_enhancement_count},${user.total_cost_usd.toFixed(4)},${user.total_cost_inr.toFixed(2)},"${user.last_activity}"\n`;
    });

    csvContent += '\n\nMODEL USAGE DETAILS\n';
    csvContent += 'Model,Operation Type,Count,Total Cost (USD),Total Cost (INR),Avg Cost Per Operation\n';
    data.modelUsage.forEach((model) => {
      csvContent += `"${model.model_name}","${model.operation_type}",${model.count},${model.total_cost_usd.toFixed(4)},${model.total_cost_inr.toFixed(2)},${model.avg_cost_per_operation.toFixed(6)}\n`;
    });

    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `net-billing-${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredUsers = data?.userBilling.filter((user) => {
    const matchEmail = user.email.toLowerCase().includes(filterEmail.toLowerCase());
    return matchEmail;
  }) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'cost') return b.total_cost_usd - a.total_cost_usd;
    if (sortBy === 'operations') return b.total_operations - a.total_operations;
    return a.email.localeCompare(b.email);
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading net billing data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.errorBox}>
          <p>Error: {errorMessage}</p>
          <button onClick={fetchNetBillingData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <p>No billing data available</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>Net Billing Dashboard</h1>
        <button onClick={handleExportCSV} className={styles.exportButton}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#e3f2fd' }}>
            <Users size={24} color="#1976d2" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Users</p>
            <p className={styles.cardValue}>{data.summary.total_users}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#f3e5f5' }}>
            <Zap size={24} color="#7b1fa2" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Operations</p>
            <p className={styles.cardValue}>{data.summary.total_operations}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#fff3e0' }}>
            <DollarSign size={24} color="#f57c00" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Cost (USD)</p>
            <p className={styles.cardValue}>${data.summary.total_cost_usd.toFixed(4)}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#e8f5e9' }}>
            <IndianRupee size={24} color="#388e3c" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Cost (INR)</p>
            <p className={styles.cardValue}>₹{data.summary.total_cost_inr.toFixed(2)}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#fce4ec' }}>
            <TrendingUp size={24} color="#c2185b" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Tokens</p>
            <p className={styles.cardValue}>{data.summary.total_tokens.toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#e0f2f1' }}>
            <Filter size={24} color="#00796b" />
          </div>
          <div className={styles.cardContent}>
            <p className={styles.cardLabel}>Total Images</p>
            <p className={styles.cardValue}>{data.summary.total_images}</p>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search by email..."
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.sortGroup}>
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className={styles.sortSelect}>
            <option value="cost">Total Cost (Highest First)</option>
            <option value="operations">Operations (Most First)</option>
            <option value="email">Email (A-Z)</option>
          </select>
        </div>
      </div>

      {/* User Billing Table */}
      <div className={styles.tableSection}>
        <h2>User Billing Details</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email ID</th>
                <th>Total Operations</th>
                <th>Text Analysis</th>
                <th>Image Generation</th>
                <th>Image Enhancement</th>
                <th>Tokens Used</th>
                <th>Images Used</th>
                <th>Cost (USD)</th>
                <th>Cost (INR)</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td className={styles.textCenter}>{user.total_operations}</td>
                    <td className={styles.textCenter}>{user.text_analysis_count}</td>
                    <td className={styles.textCenter}>{user.image_generation_count}</td>
                    <td className={styles.textCenter}>{user.image_enhancement_count}</td>
                    <td className={styles.textCenter}>{user.total_tokens.toLocaleString()}</td>
                    <td className={styles.textCenter}>{user.total_images}</td>
                    <td className={styles.costCell}>${user.total_cost_usd.toFixed(4)}</td>
                    <td className={styles.costCell}>₹{user.total_cost_inr.toFixed(2)}</td>
                    <td className={styles.dateCell}>{new Date(user.last_activity).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className={styles.noData}>
                    No billing data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Usage Table */}
      <div className={styles.tableSection}>
        <h2>Model Usage Breakdown</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Operation Type</th>
                <th>Count</th>
                <th>Total Cost (USD)</th>
                <th>Total Cost (INR)</th>
                <th>Avg Cost per Operation</th>
              </tr>
            </thead>
            <tbody>
              {data.modelUsage.length > 0 ? (
                data.modelUsage.map((model, idx) => (
                  <tr key={idx}>
                    <td className={styles.modelCell}>{model.model_name}</td>
                    <td className={styles.operationCell}>{model.operation_type.replace(/_/g, ' ')}</td>
                    <td className={styles.textCenter}>{model.count}</td>
                    <td className={styles.costCell}>${model.total_cost_usd.toFixed(4)}</td>
                    <td className={styles.costCell}>₹{model.total_cost_inr.toFixed(2)}</td>
                    <td className={styles.costCell}>${model.avg_cost_per_operation.toFixed(6)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    No model usage data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
