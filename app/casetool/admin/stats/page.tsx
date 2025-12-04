'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  DollarSign, 
  RefreshCw,
  Mail,
  Calendar,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';

interface UserStat {
  id: number;
  email: string;
  created_at: string;
  last_login: string;
  total_generations: number;
  successful_generations: number;
  failed_generations: number;
  accurate_feedbacks: number;
  inaccurate_feedbacks: number;
  pending_feedbacks: number;
  total_billable_cost: number;
  total_refunded_cost: number;
}

interface PlatformStats {
  total_users: number;
  total_generations: number;
  total_revenue: number;
  total_refunds: number;
}

export default function AdminStatsPage() {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [sortBy, setSortBy] = useState<'cost' | 'generations' | 'recent'>('cost');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/casetool/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setPlatformStats(data.platformStats);
        setUserStats(data.userStats || []);
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Network error: Unable to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = [...userStats].sort((a, b) => {
    switch (sortBy) {
      case 'cost':
        return b.total_billable_cost - a.total_billable_cost;
      case 'generations':
        return b.total_generations - a.total_generations;
      case 'recent':
        return new Date(b.last_login).getTime() - new Date(a.last_login).getTime();
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/casetool" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.subtitle}>User statistics and billing overview</p>
          </div>
          <button onClick={fetchStats} className={styles.refreshButton}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading statistics...</div>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchStats} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Platform Stats */}
          {platformStats && (
            <div className={styles.platformStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Users size={28} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{platformStats.total_users}</div>
                  <div className={styles.statLabel}>Total Users</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <ImageIcon size={28} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{platformStats.total_generations}</div>
                  <div className={styles.statLabel}>Total Generations</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <DollarSign size={28} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{formatCurrency(platformStats.total_revenue)}</div>
                  <div className={styles.statLabel}>Total Revenue</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <RefreshCw size={28} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{formatCurrency(platformStats.total_refunds)}</div>
                  <div className={styles.statLabel}>Total Refunds</div>
                </div>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className={styles.sortControls}>
            <button 
              className={`${styles.sortBtn} ${sortBy === 'cost' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortBy('cost')}
            >
              Highest Billing
            </button>
            <button 
              className={`${styles.sortBtn} ${sortBy === 'generations' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortBy('generations')}
            >
              Most Generations
            </button>
            <button 
              className={`${styles.sortBtn} ${sortBy === 'recent' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortBy('recent')}
            >
              Recently Active
            </button>
          </div>

          {/* User Stats Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th><Mail size={16} /> Email</th>
                  <th><Calendar size={16} /> Joined</th>
                  <th><Clock size={16} /> Last Login</th>
                  <th><ImageIcon size={16} /> Generations</th>
                  <th><ThumbsUp size={16} /> Accurate</th>
                  <th><ThumbsDown size={16} /> Inaccurate</th>
                  <th><TrendingUp size={16} /> Billable</th>
                  <th><RefreshCw size={16} /> Refunded</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <div className={styles.generationStats}>
                        <span className={styles.total}>{user.total_generations}</span>
                        <span className={styles.breakdown}>
                          ({user.successful_generations} / {user.failed_generations})
                        </span>
                      </div>
                    </td>
                    <td className={styles.accurateCell}>{user.accurate_feedbacks}</td>
                    <td className={styles.inaccurateCell}>{user.inaccurate_feedbacks}</td>
                    <td className={styles.billableCell}>{formatCurrency(user.total_billable_cost)}</td>
                    <td className={styles.refundedCell}>{formatCurrency(user.total_refunded_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
