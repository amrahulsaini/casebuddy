'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Download, Smartphone, Palette, Menu, X, Sparkles, Scissors, Wand2, Image, Grid } from 'lucide-react';
import styles from './page.module.css';

export default function TemplatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const templates = [
    { id: 1, name: 'Minimal Black', category: 'Premium', color: '#000000' },
    { id: 2, name: 'Gradient Pink', category: 'Colorful', color: '#ec4899' },
    { id: 3, name: 'Clear Classic', category: 'Transparent', color: '#ffffff' },
    { id: 4, name: 'Carbon Fiber', category: 'Textured', color: '#1a1a1a' },
    { id: 5, name: 'Pastel Blue', category: 'Soft', color: '#93c5fd' },
    { id: 6, name: 'Neon Green', category: 'Bold', color: '#4ade80' },
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
            <Link href="/gallery" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Image size={20} />
              <span>Gallery</span>
            </Link>
          </div>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Resources</div>
            <Link href="/templates" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => setSidebarOpen(false)}>
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
            <Zap size={48} />
          </div>
          <h1 className={styles.heroTitle}>Template Library</h1>
          <p className={styles.heroDescription}>
            Pre-made templates to kickstart your phone case mockup designs
          </p>
        </div>

        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              <div
                className={styles.templatePreview}
                style={{ background: template.color }}
              >
                <Smartphone size={64} color={template.color === '#ffffff' ? '#000' : '#fff'} />
              </div>
              <div className={styles.templateInfo}>
                <div className={styles.templateCategory}>{template.category}</div>
                <div className={styles.templateName}>{template.name}</div>
                <button className={styles.templateButton}>
                  <Download size={16} />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaSection}>
          <Palette size={48} />
          <h2>Need Custom Templates?</h2>
          <p>Contact us to create custom templates for your brand</p>
          <button className={styles.ctaButton}>Get in Touch</button>
        </div>
      </div>
    </div>
  );
}
