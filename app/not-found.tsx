'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ShoppingBag, ArrowLeft, Search } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={150} height={40} priority />
        </Link>
      </header>

      {/* 404 Content */}
      <div className={styles.content}>
        <div className={styles.errorAnimation}>
          <div className={styles.phoneCase}>
            <div className={styles.phone}>404</div>
          </div>
        </div>
        
        <h1 className={styles.title}>Oops! Page Not Found</h1>
        <p className={styles.description}>
          Looks like this page took a different route. Don't worry, we'll help you find your way back!
        </p>
        
        <div className={styles.suggestions}>
          <p className={styles.suggestionTitle}>Here's what you can do:</p>
          <ul className={styles.suggestionList}>
            <li>Check the URL for typos</li>
            <li>Go back to the homepage</li>
            <li>Browse our phone case collections</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            <Home size={20} />
            Back to Home
          </Link>
          <Link href="/#shop" className={styles.secondaryButton}>
            <ShoppingBag size={20} />
            Browse Collections
          </Link>
        </div>

        <Link href="javascript:history.back()" className={styles.backLink}>
          <ArrowLeft size={18} />
          Go Back
        </Link>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2025 CaseBuddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
