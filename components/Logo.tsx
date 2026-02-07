'use client';

import styles from './Logo.module.css';

export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <div className={styles.letterL}>L</div>
      <div className={styles.letterW}>W</div>
    </div>
  );
}
