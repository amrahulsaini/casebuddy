'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle className={styles.icon} />,
    error: <XCircle className={styles.icon} />,
    info: <Info className={styles.icon} />,
    warning: <AlertTriangle className={styles.icon} />
  };

  const titles = {
    success: title || 'Success',
    error: title || 'Error',
    info: title || 'Info',
    warning: title || 'Warning'
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}>
      {icons[type]}
      <div className={styles.content}>
        <div className={styles.title}>{titles[type]}</div>
        <div className={styles.message}>{message}</div>
      </div>
      <button className={styles.closeBtn} onClick={handleClose}>
        <X size={18} />
      </button>
    </div>
  );
}
