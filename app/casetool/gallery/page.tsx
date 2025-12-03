'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './gallery.module.css';
import { 
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Image as ImageIcon,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface GenerationLog {
  id: number;
  session_id: string;
  phone_model: string;
  original_image_name: string;
  ai_prompt: string;
  generated_image_url: string;
  generation_time: number;
  status: string;
  user_feedback: string | null;
  feedback_note: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function GalleryPage() {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/casetool/api/gallery');
      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs);
        
        // Calculate stats
        const total = data.logs.length;
        const approved = data.logs.filter((log: GenerationLog) => log.user_feedback === 'approved').length;
        const rejected = data.logs.filter((log: GenerationLog) => log.user_feedback === 'rejected').length;
        const pending = data.logs.filter((log: GenerationLog) => !log.user_feedback).length;
        
        setStats({ total, approved, rejected, pending });
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !log.user_feedback;
    return log.user_feedback === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/casetool" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Back to Generator</span>
          </Link>
          <div className={styles.logoSection}>
            <Image src="/favicon.ico" alt="CaseBuddy" width={36} height={36} />
            <h1 className={styles.pageTitle}>Generation Gallery</h1>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Generated</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.approved}</div>
            <div className={styles.statLabel}>Approved</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <XCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.rejected}</div>
            <div className={styles.statLabel}>Rejected</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending Feedback</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button 
          className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'approved' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({stats.approved})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'rejected' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({stats.rejected})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'pending' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
      </div>

      {/* Gallery Grid */}
      <div className={styles.galleryGrid}>
        {loading ? (
          <div className={styles.loading}>Loading gallery...</div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.empty}>
            <ImageIcon size={48} />
            <p>No generations found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={styles.galleryCard}>
              <div className={styles.imageSection}>
                <img src={log.generated_image_url} alt={log.phone_model} />
                {log.user_feedback && (
                  <div className={`${styles.feedbackBadge} ${styles[log.user_feedback]}`}>
                    {log.user_feedback === 'approved' ? (
                      <><CheckCircle size={14} /> Approved</>
                    ) : (
                      <><XCircle size={14} /> Rejected</>
                    )}
                  </div>
                )}
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <Smartphone size={16} />
                    {log.phone_model}
                  </h3>
                  <a 
                    href={log.generated_image_url} 
                    download 
                    className={styles.downloadBtn}
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                </div>

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Calendar size={14} />
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{log.generation_time}s</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.originalFile}>
                    <ImageIcon size={14} />
                    <span title={log.original_image_name}>
                      {log.original_image_name.length > 25 
                        ? log.original_image_name.substring(0, 25) + '...' 
                        : log.original_image_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
