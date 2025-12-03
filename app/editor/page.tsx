'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, Scissors, Download, Sparkles, Menu, X, Smartphone, Wand2, Image, Grid } from 'lucide-react';
import styles from './page.module.css';

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setUploadedFileName(file.name);
      setEnhancedImage(null);
    };
    reader.readAsDataURL(file);

    // Auto-enhance the image
    setIsEnhancing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/editor/api/enhance', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setEnhancedImage(data.url);
      } else {
        console.error('Enhancement failed:', data.error);
        alert('Failed to enhance image: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Failed to enhance image');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
            <Link href="/editor" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => setSidebarOpen(false)}>
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
            <Scissors size={48} />
          </div>
          <h1 className={styles.heroTitle}>Image Editor</h1>
          <p className={styles.heroDescription}>
            Crop, resize, and enhance your phone case mockups with powerful editing tools
          </p>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.editorPanel}>
            {!uploadedImage ? (
              <div 
                className={styles.uploadZone}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload size={48} />
                <h3>Upload Image to Enhance</h3>
                <p>{uploadedFileName || 'Drag and drop or click to upload'}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.uploadButton}>Choose File</label>
              </div>
            ) : (
              <div className={styles.imagePreview}>
                <div className={styles.previewHeader}>
                  <h3>{uploadedFileName}</h3>
                  <button 
                    className={styles.newImageButton}
                    onClick={() => {
                      setUploadedImage(null);
                      setEnhancedImage(null);
                      setUploadedFileName('');
                    }}
                  >
                    Upload New Image
                  </button>
                </div>
                <div className={styles.previewGrid}>
                  <div className={styles.previewItem}>
                    <h4>Original</h4>
                    <img src={uploadedImage} alt="Original" />
                  </div>
                  {isEnhancing ? (
                    <div className={styles.previewItem}>
                      <h4>Enhanced</h4>
                      <div className={styles.enhancingLoader}>
                        <Sparkles size={32} className={styles.spinIcon} />
                        <p>Enhancing image...</p>
                      </div>
                    </div>
                  ) : enhancedImage ? (
                    <div className={styles.previewItem}>
                      <h4>Enhanced</h4>
                      <img src={enhancedImage} alt="Enhanced" />
                      <button 
                        className={styles.downloadButton}
                        onClick={() => handleDownload(enhancedImage, `enhanced_${uploadedFileName}`)}
                      >
                        <Download size={18} />
                        Download Enhanced
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className={styles.toolsPanel}>
            <h3 className={styles.panelTitle}>Enhancement Features</h3>
            <div className={styles.toolsList}>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>2x Upscaling</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Sharpness Enhancement</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Color Normalization</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Quality Optimization</span>
              </div>
              <div className={styles.toolItem}>
                <Download size={20} />
                <span>HD Export</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
