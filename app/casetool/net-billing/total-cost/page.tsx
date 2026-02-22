'use client';

import { useState, useEffect } from 'react';
import styles from '../net-billing.module.css';
import { ArrowLeft, IndianRupee, Calendar, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
}

export default function TotalCostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    fetchTotalCost();
  }, [filterDate, filterUserId]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/casetool/api/net-billing');
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.availableUsers || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTotalCost = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.append('filter_date', filterDate);
      if (filterUserId) params.append('filter_user_id', filterUserId);
      
      const response = await fetch(`/casetool/api/total-cost?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTotalCost(data.total_cost_inr || 0);
      } else {
        setErrorMessage(data.error || 'Failed to load total cost');
      }
    } catch (error) {
      console.error('Failed to fetch total cost:', error);
      setErrorMessage('Network error: Unable to fetch total cost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/casetool/net-billing')} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Net Billing
        </button>
        <h1 className={styles.title}>Total Cost Report</h1>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <p>{errorMessage}</p>
        </div>
      )}

      <div className={styles.filterBar}>
        <h2 className={styles.sectionTitle}>
          <Filter size={20} />
          Filters
        </h2>
        
        <div className={styles.filters}>
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
          
          {(filterUserId || filterDate) && (
            <button 
              className={styles.clearButton} 
              onClick={() => { setFilterUserId(''); setFilterDate(''); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className={styles.totalCostSection}>
        <div className={styles.totalCostCard}>
          <div className={styles.cardIcon} style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            width: '80px',
            height: '80px'
          }}>
            <IndianRupee size={48} />
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardLabel} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Total Cost (INR)
            </div>
            <div className={styles.cardValue} style={{ fontSize: '4rem', fontWeight: 'bold' }}>
              {loading ? (
                <div className={styles.spinner}></div>
              ) : (
                `₹${totalCost.toFixed(2)}`
              )}
            </div>
          </div>
        </div>

        <div className={styles.infoBox}>
          <h3>About Total Cost</h3>
          <p>This shows the total cost from <code>api_usage_logs</code> table for image generation operations.</p>
          <ul>
            <li>Includes all API usage costs</li>
            <li>Filtered by image generation operations</li>
            <li>Can be filtered by user and date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
