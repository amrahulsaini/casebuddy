'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Scissors, Download, Sparkles, Menu, X, Smartphone, Wand2, Image as ImageIcon, Grid, LogOut, Maximize2 } from 'lucide-react';
import styles from './page.module.css';

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

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

      console.log('Sending enhancement request...');
      const response = await fetch('/editor/api/enhance', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enhancement request failed:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Enhancement response:', data);
      
      if (data.success) {
        // Add timestamp to prevent caching
        const imageUrl = data.url + '?t=' + Date.now();
        console.log('Setting enhanced image URL:', imageUrl);
        setEnhancedImage(imageUrl);
      } else {
        console.error('Enhancement failed:', data.error);
        alert('Failed to enhance image: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      alert('Failed to enhance image: ' + (error.message || 'Network error'));
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
      {/* Sidebar */}
      <div className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoIcon}>
              <Image src="/favicon.ico" alt="CaseBuddy" width={40} height={40} />
            </div>
            <span className={styles.sidebarLogoText}>CaseBuddy</span>
          </div>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Tools</div>
            <Link href="/casetool" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Sparkles size={20} />
              <span>AI Generator</span>
            </Link>
            <Link href="/editor" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => setSidebarOpen(false)}>
              <Scissors size={20} />
              <span>Image Editor</span>
            </Link>
            <Link href="/casetool/gallery" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <ImageIcon size={20} />
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
          <div className={styles.navSection}>
            <button 
              className={`${styles.navLink} ${styles.logoutButton}`} 
              onClick={async () => {
                await fetch('/casetool/api/auth', { method: 'DELETE' });
                window.location.href = '/casetool/login';
              }}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
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
            <Image src="/favicon.ico" alt="CaseBuddy" width={40} height={40} />
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
                    <div className={styles.imageWrapper}>
                      <img src={uploadedImage} alt="Original" />
                      <button 
                        onClick={() => handleFullscreen(uploadedImage)} 
                        className={styles.fullscreenButton}
                        title="View fullscreen"
                      >
                        <Maximize2 size={20} />
                      </button>
                    </div>
                  </div>
                  {isEnhancing ? (
                    <div className={styles.previewItem}>
                      <h4>Enhanced</h4>
                      <div className={styles.enhancingLoader}>
                        <Sparkles size={32} className={styles.spinIcon} />
                        <p>Enhancing image quality to 4K...</p>
                      </div>
                    </div>
                  ) : enhancedImage ? (
                    <div className={styles.previewItem}>
                      <h4>Enhanced (4K Quality)</h4>
                      <div className={styles.imageWrapper}>
                        <img 
                          src={enhancedImage} 
                          alt="Enhanced" 
                          onLoad={() => console.log('Enhanced image loaded successfully:', enhancedImage)}
                          onError={(e) => {
                            console.error('Enhanced image failed to load:', enhancedImage);
                            console.error('Image error event:', e);
                          }}
                        />
                        <button 
                          onClick={() => handleFullscreen(enhancedImage)} 
                          className={styles.fullscreenButton}
                          title="View fullscreen"
                        >
                          <Maximize2 size={20} />
                        </button>
                      </div>
                      <button 
                        className={styles.downloadButton}
                        onClick={() => handleDownload(enhancedImage, `enhanced_4k_${uploadedFileName}`)}
                      >
                        <Download size={18} />
                        Download Enhanced 4K
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className={styles.toolsPanel}>
            <h3 className={styles.panelTitle}>AI Enhancement Features</h3>
            <div className={styles.toolsList}>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>4K Upscaling</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Detail Preservation</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Sharpness Enhancement</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Color Accuracy</span>
              </div>
              <div className={styles.toolItem}>
                <Sparkles size={20} />
                <span>Noise Reduction</span>
              </div>
              <div className={styles.toolItem}>
                <Download size={20} />
                <span>4K Export Ready</span>
              </div>
            </div>
            <div className={styles.infoBox}>
              <p><strong>AI-Powered Enhancement</strong></p>
              <p>Our advanced AI model upscales your images to 4K quality while preserving all original details, colors, and composition. Perfect for professional product listings.</p>
            </div>
          </div>
        </div>
      </div>

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
