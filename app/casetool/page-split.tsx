'use client';

import { useState, FormEvent, useRef } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { 
  Sparkles, 
  Upload, 
  Wand2, 
  Download,
  Menu,
  Loader2,
  X,
  XCircle,
  LogOut,
  RotateCcw
} from 'lucide-react';

interface GeneratedImage {
  url: string;
  title: string;
  isProcessing?: boolean;
  logId?: number;
}

export default function CaseToolPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recordDownload = (logId: number) => {
    try {
      const payload = new Blob([JSON.stringify({ logId })], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/casetool/api/billing/download', payload);
        return;
      }
    } catch {
      // ignore
    }

    fetch('/casetool/api/billing/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId }),
      keepalive: true,
    }).catch(() => undefined);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInputRef.current.files = dataTransfer.files;
      setUploadedFileName(files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsGenerating(true);
    setProgress(0);
    setStatus('Initializing...');
    setImages([]);
    setError('');

    const formData = new FormData(e.currentTarget);
    setLastFormData(formData);

    try {
      const response = await fetch('/casetool/api/generate', {
        method: 'POST',
        body: formData,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            handleStreamData(data);
          } catch (err) {
            console.error('Parse error', err, line);
          }
        }
      }
    } catch (err: any) {
      setError('Network Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStreamData = (data: any) => {
    if (typeof data.progress === 'number') {
      setProgress(data.progress);
    }

    if (data.msg) {
      setStatus(data.msg);
    }

    switch (data.type) {
      case 'data_log':
        if (data.payload && data.payload.prompt) {
          setLastPrompt(data.payload.prompt);
        }
        break;

      case 'image_result':
        setImages([{ 
          url: data.payload.url, 
          title: data.payload.title, 
          isProcessing: false,
          logId: data.payload.logId 
        }]);
        break;

      case 'image_start':
        setImages([{ url: '', title: data.msg || 'Generating...', isProcessing: true }]);
        break;

      case 'error':
        setError(data.msg);
        setImages((prev) => prev.filter(img => !img.isProcessing));
        break;

      case 'done':
        setStatus('Generation Complete!');
        setImages((prev) => prev.filter(img => !img.isProcessing));
        break;

      default:
        break;
    }
  };

  const handleGenerateAnother = async () => {
    if (!lastFormData) return;
    
    setIsGenerating(true);
    setProgress(0);
    setStatus('');
    setError('');

    const newFormData = new FormData();
    for (const [key, value] of lastFormData.entries()) {
      newFormData.append(key, value);
    }
    
    if (lastPrompt) {
      newFormData.append('reuse_prompt', lastPrompt);
    }

    try {
      const res = await fetch('/casetool/api/generate', {
        method: 'POST',
        body: newFormData,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            handleStreamData(data);
          } catch (err) {
            console.error('Parse error', err, line);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setUploadedFileName('');
    setLastFormData(null);
    setLastPrompt('');
    setProgress(0);
    setStatus('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarLogo}>
                <Image src="/favicon.ico" alt="CaseBuddy" width={32} height={32} />
                <span>CaseBuddy</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <button 
              className={styles.logoutBtn}
              onClick={async () => {
                await fetch('/casetool/api/auth', { method: 'DELETE' });
                window.location.href = '/casetool/login';
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}

      {/* Main Content - Split Screen */}
      <div className={styles.splitScreen}>
        {/* Left Panel - Input */}
        <div className={styles.leftPanel}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Image src="/favicon.ico" alt="CaseBuddy" width={36} height={36} />
              <span>CaseBuddy AI</span>
            </div>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
          </div>

          <div className={styles.inputContent}>
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>AI-Powered Mockup Studio</span>
            </div>

            <h1 className={styles.pageTitle}>
              Professional Phone Case Mockups in Seconds
            </h1>

            <p className={styles.pageSubtitle}>
              Upload your case design and our AI creates stunning Amazon-ready product renders with perfect lighting and multiple angles.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formField}>
                <label>Phone Model</label>
                <input
                  type="text"
                  name="phone_model"
                  placeholder="e.g., Galaxy A35 5G"
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className={styles.formField}>
                <label>Upload Case Image</label>
                <div 
                  className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${uploadedFileName ? styles.hasFile : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload size={32} />
                  <p>{uploadedFileName || 'Drop your image here or click to browse'}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="case_image"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.generateBtn}
                disabled={isGenerating || images.length > 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className={styles.spinning} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    <span>Generate Mockup</span>
                  </>
                )}
              </button>
            </form>

            {(isGenerating || progress > 0) && (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={styles.progressText}>{status}</p>
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>
                <XCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.rightPanel}>
          {images.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Sparkles size={64} />
              </div>
              <h2>Your mockup will appear here</h2>
              <p>Upload a case image and click generate to see the magic happen</p>
            </div>
          ) : (
            <div className={styles.previewContent}>
              {images.map((img, idx) => (
                <div key={idx} className={styles.mockupPreview}>
                  {img.isProcessing ? (
                    <div className={styles.loadingState}>
                      <Loader2 size={48} className={styles.spinning} />
                      <p>Creating your mockup...</p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.imageWrapper}>
                        <img src={img.url} alt={img.title} />
                      </div>

                      <div className={styles.actions}>
                        <button 
                          className={styles.actionBtn}
                          onClick={handleGenerateAnother}
                          disabled={isGenerating}
                        >
                          <Wand2 size={18} />
                          <span>Generate Another</span>
                        </button>
                        <a
                          href={img.url}
                          download
                          className={styles.actionBtn}
                          onClick={() => {
                            if (img.logId) recordDownload(img.logId);
                          }}
                        >
                          <Download size={18} />
                          <span>Download</span>
                        </a>
                        <button className={styles.resetBtn} onClick={handleReset}>
                          <RotateCcw size={18} />
                          <span>Start Over</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
