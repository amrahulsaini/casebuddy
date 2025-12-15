'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './gallery.module.css';
import { 
  ArrowLeft,
  Download,
  Clock,
  Smartphone,
  Image as ImageIcon,
  Calendar,
  TrendingUp,
  Maximize2,
  X
} from 'lucide-react';

interface GenerationLog {
  id: number;
  session_id: string;
  user_id: number | null;
  user_email: string | null;
  phone_model: string;
  original_image_name: string;
  original_image_url?: string | null;
  ai_prompt: string;
  generated_image_url: string;
  generation_time: number;
  status: string;
  feedback_status: string;
  created_at: string;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  status: 'all' | 'completed' | 'failed';
}

export default function GalleryPage() {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 24, total: 0, totalPages: 0, status: 'all' });
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(1, filter);
  }, []);

  const fetchLogs = async (page: number, status: 'all' | 'completed' | 'failed') => {
    try {
      const response = await fetch(`/casetool/api/gallery?page=${page}&pageSize=${pagination.pageSize}&status=${status}`);
      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs);

        if (data.stats) {
          setStats({
            total: Number(data.stats.total) || 0,
            completed: Number(data.stats.completed) || 0,
            failed: Number(data.stats.failed) || 0,
          });
        }

        if (data.pagination) {
          setPagination({
            page: Number(data.pagination.page) || page,
            pageSize: Number(data.pagination.pageSize) || pagination.pageSize,
            total: Number(data.pagination.total) || 0,
            totalPages: Number(data.pagination.totalPages) || 0,
            status: (data.pagination.status as any) || status,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeFilter = (next: 'all' | 'completed' | 'failed') => {
    setFilter(next);
    setLoading(true);
    fetchLogs(1, next);
  };

  const goToPrevPage = () => {
    if (pagination.page <= 1) return;
    setLoading(true);
    fetchLogs(pagination.page - 1, filter);
  };

  const goToNextPage = () => {
    if (pagination.totalPages > 0 && pagination.page >= pagination.totalPages) return;
    setLoading(true);
    fetchLogs(pagination.page + 1, filter);
  };

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

  const handleFullscreen = (url: string) => {
    setFullscreenImageUrl(url);
    setFullscreenModalOpen(true);
  };

  const closeFullscreenModal = () => {
    setFullscreenModalOpen(false);
    setFullscreenImageUrl(null);
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
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.failed}</div>
            <div className={styles.statLabel}>Failed</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button 
          className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => onChangeFilter('all')}
        >
          All ({stats.total})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'completed' ? styles.filterTabActive : ''}`}
          onClick={() => onChangeFilter('completed')}
        >
          Completed ({stats.completed})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'failed' ? styles.filterTabActive : ''}`}
          onClick={() => onChangeFilter('failed')}
        >
          Failed ({stats.failed})
        </button>
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.paginationBar}>
          <button className={styles.pageButton} onClick={goToPrevPage} disabled={pagination.page <= 1}>
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

      {/* Gallery Grid */}
      <div className={styles.galleryGrid}>
        {loading ? (
          <div className={styles.loading}>Loading gallery...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>
            <ImageIcon size={48} />
            <p>No generations found</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={styles.galleryCard}>
              <div className={styles.imageSection}>
                <img src={log.generated_image_url} alt={log.phone_model} />
                <button 
                  onClick={() => handleFullscreen(log.generated_image_url)} 
                  className={styles.galleryFullscreenButton}
                  title="View fullscreen"
                >
                  <Maximize2 size={20} />
                </button>
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
                    {log.original_image_url ? (
                      <a
                        href={log.original_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.originalFileLink}
                        title={log.original_image_url}
                      >
                        {log.original_image_name.length > 25
                          ? log.original_image_name.substring(0, 25) + '...'
                          : log.original_image_name}
                      </a>
                    ) : (
                      <span title={log.original_image_name}>
                        {log.original_image_name.length > 25 
                          ? log.original_image_name.substring(0, 25) + '...' 
                          : log.original_image_name}
                      </span>
                    )}
                  </div>
                  {log.user_email && (
                    <div className={styles.userEmail} title={log.user_email}>
                      📧 {log.user_email.length > 20 
                        ? log.user_email.substring(0, 20) + '...' 
                        : log.user_email}
                    </div>
                  )}
                  {log.feedback_status && (
                    <div className={`${styles.feedbackBadge} ${styles[`feedback${log.feedback_status}`]}`}>
                      {log.feedback_status === 'accurate' ? '✓' : log.feedback_status === 'inaccurate' ? '✗' : '⏳'} {log.feedback_status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.paginationBarBottom}>
          <button className={styles.pageButton} onClick={goToPrevPage} disabled={pagination.page <= 1}>
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

      {/* Fullscreen Modal */}
      {fullscreenModalOpen && fullscreenImageUrl && (
        <div className={styles.fullscreenModal} onClick={closeFullscreenModal}>
          <button className={styles.fullscreenCloseButton} onClick={closeFullscreenModal}>
            <X size={32} />
          </button>
          <img 
            src={fullscreenImageUrl} 
            alt="Fullscreen view" 
            className={styles.fullscreenImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
