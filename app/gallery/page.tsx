'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid, Download, Eye, Trash2, Menu, X, Smartphone, Sparkles, Scissors, Wand2, Image } from 'lucide-react';
import styles from './page.module.css';

export default function GalleryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mockImages = [
    { id: 1, title: 'Galaxy S23 Case', date: '2 hours ago' },
    { id: 2, title: 'iPhone 15 Pro Case', date: '5 hours ago' },
    { id: 3, title: 'Pixel 8 Case', date: '1 day ago' },
    { id: 4, title: 'OnePlus 12 Case', date: '2 days ago' },
    { id: 5, title: 'Xiaomi 14 Case', date: '3 days ago' },
    { id: 6, title: 'Realme GT Case', date: '1 week ago' },
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoIcon}>CB</div>
            <span className={styles.sidebarLogoText}>CaseBuddy</span>
          </div>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Tools</div>
            <Link href="/tool" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Sparkles size={20} />
              <span>AI Generator</span>
            </Link>
            <Link href="/editor" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Scissors size={20} />
              <span>Image Editor</span>
            </Link>
            <Link href="/gallery" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => setSidebarOpen(false)}>
              <Image size={20} />
              <span>Gallery</span>
            </Link>
          </div>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Resources</div>
            <Link href="/templates" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Grid size={20} />
              <span>Templates</span>
            </Link>
          </div>
        </nav>
      </div>

      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Smartphone size={24} />
          </div>
          <span className={styles.logoText}>CaseBuddy</span>
        </div>
        <button className={styles.menuButton} onClick={handleMenuClick}>
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </header>

      <div className={styles.wrapper}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Grid size={48} />
          </div>
          <h1 className={styles.heroTitle}>Your Gallery</h1>
          <p className={styles.heroDescription}>
            Browse and manage all your generated phone case mockups
          </p>
        </div>

        <div className={styles.galleryStats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>12</div>
            <div className={styles.statLabel}>Total Mockups</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>3</div>
            <div className={styles.statLabel}>This Week</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>45</div>
            <div className={styles.statLabel}>Downloads</div>
          </div>
        </div>

        <div className={styles.galleryGrid}>
          {mockImages.map((img) => (
            <div key={img.id} className={styles.galleryCard}>
              <div className={styles.galleryImage}>
                <div className={styles.imagePlaceholder}>📱</div>
                <div className={styles.galleryOverlay}>
                  <button className={styles.overlayButton}>
                    <Eye size={20} />
                  </button>
                  <button className={styles.overlayButton}>
                    <Download size={20} />
                  </button>
                  <button className={styles.overlayButton}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className={styles.galleryInfo}>
                <div className={styles.galleryTitle}>{img.title}</div>
                <div className={styles.galleryDate}>{img.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
