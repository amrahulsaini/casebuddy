'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import 'cropperjs/dist/cropper.css';
import { 
  Sparkles, 
  Upload, 
  Scissors, 
  Wand2, 
  Download,
  Menu,
  Smartphone,
  Loader2,
  Camera,
  Zap,
  Clock,
  X,
  Shield,
  Image as ImageIcon,
  Grid,
  LogOut,
  Maximize2,
} from 'lucide-react';

interface GeneratedImage {
  url: string;
  title: string;
  isProcessing?: boolean;
  logId?: number;
}

interface CameraSpecs {
  model_name: string;
  rear_camera_count: number;
  has_torch_light: boolean;
  camera_arrangement: string;
  camera_island_shape: string;
  camera_module_position: string;
  lens_sizes: string;
}

export default function ToolPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [consoleContent, setConsoleContent] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<'normal' | 'high'>('normal');
  const [caseType, setCaseType] = useState<'transparent' | 'doyers' | 'black'>('transparent');
  const [cameraSpecs, setCameraSpecs] = useState<CameraSpecs | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageResultsRef = useRef<HTMLDivElement>(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [cropper, setCropper] = useState<any>(null);

  // Fullscreen modal state
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  // Initialize cropper when modal opens
  useEffect(() => {
    if (cropModalOpen && cropImageUrl && cropImageRef.current) {
      import('cropperjs').then((Cropper) => {
        if (cropImageRef.current) {
          const cropperInstance = new Cropper.default(cropImageRef.current, {
            viewMode: 1,
            autoCrop: false,
            autoCropArea: 0.5,
            background: false,
            dragMode: 'crop',
            movable: false,
            zoomable: true,
            scalable: false,
            rotatable: false,
          });
          setCropper(cropperInstance);
        }
      });
    }

    return () => {
      if (cropper) {
        cropper.destroy();
        setCropper(null);
      }
    };
  }, [cropModalOpen, cropImageUrl]);


  // Drag and drop handlers
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

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const cloneFormData = (src: FormData) => {
    const next = new FormData();
    for (const [key, value] of src.entries()) {
      next.append(key, value);
    }
    return next;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsGenerating(true);
    setProgress(0);
    setStatus('Initializing...');
    setImages([]);
    setConsoleContent('');
    setShowConsole(false);
    setError('');
    setShowError(false);
    setIsError(false);

    const baseFormData = new FormData(e.currentTarget);
    baseFormData.set('image_model', selectedModel);
    baseFormData.set('case_type', caseType);
    setLastFormData(baseFormData);

    const totalRuns = 3;
    let promptToReuse = '';

    const runOneGeneration = async (runIndex: number) => {
      const formData = cloneFormData(baseFormData);
      formData.set('image_model', selectedModel);
      if (runIndex > 1 && promptToReuse) {
        formData.set('reuse_prompt', promptToReuse);
      }

      setStatus(`(${runIndex}/${totalRuns}) Starting...`);

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

            if (typeof data.progress === 'number') {
              const scaled = Math.round((((runIndex - 1) * 100) + data.progress) / totalRuns);
              setProgress(scaled);
            }

            if (data.msg) {
              setStatus(`(${runIndex}/${totalRuns}) ${data.msg}`);
            }

            switch (data.type) {
              case 'data_log':
                if (data.payload && data.payload.prompt) {
                  promptToReuse = data.payload.prompt;
                  setLastPrompt(data.payload.prompt);
                }
                if (data.payload && data.payload.camera_specs) {
                  setCameraSpecs(data.payload.camera_specs);
                }
                break;

              case 'image_start':
                setImages((prev) => [
                  ...prev,
                  { url: '', title: data.msg || `Generating (${runIndex}/${totalRuns})...`, isProcessing: true },
                ]);
                setTimeout(() => {
                  imageResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                break;

              case 'image_result':
                setImages((prev) => {
                  const withoutProcessing = prev.filter(img => !img.isProcessing);
                  return [
                    ...withoutProcessing,
                    {
                      url: data.payload.url,
                      title: data.payload.title,
                      isProcessing: false,
                      logId: data.payload.logId,
                    },
                  ];
                });
                setTimeout(() => {
                  imageResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                break;

              case 'error':
                setError(data.msg);
                setShowError(true);
                setIsError(true);
                setImages((prev) => prev.filter(img => !img.isProcessing));
                throw new Error(data.msg || 'Generation failed');

              case 'done':
                // no-op; overall completion handled after all runs
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('Parse error', err, line);
          }
        }
      }
    };

    try {
      for (let runIndex = 1; runIndex <= totalRuns; runIndex += 1) {
        await runOneGeneration(runIndex);
      }
      setStatus('Generation Complete!');
      setIsError(false);
      setImages((prev) => prev.filter(img => !img.isProcessing));
      setProgress(100);
    } catch (err: any) {
      setError('Network Error: ' + (err?.message || String(err)));
      setShowError(true);
      setIsError(true);
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
        // Save the AI prompt when received
        if (data.payload && data.payload.prompt) {
          setLastPrompt(data.payload.prompt);
        }
        break;

      case 'image_result':
        // Remove processing state and add final image
        setImages((prev) => {
          const withoutProcessing = prev.filter(img => !img.isProcessing);
          return [...withoutProcessing, { 
            url: data.payload.url, 
            title: data.payload.title, 
            isProcessing: false,
            logId: data.payload.logId
          }];
        });
        // Auto-scroll to results
        setTimeout(() => {
          imageResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;

      case 'image_start':
        // Add processing placeholder
        setImages((prev) => [...prev, { 
          url: '', 
          title: data.msg || 'Generating...', 
          isProcessing: true 
        }]);
        // Auto-scroll to results when image generation starts
        setTimeout(() => {
          imageResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;

      case 'error':
        setError(data.msg);
        setShowError(true);
        setIsError(true);
        // Remove processing placeholders on error
        setImages((prev) => prev.filter(img => !img.isProcessing));
        break;

      case 'done':
        setStatus('Generation Complete!');
        setIsError(false);
        // Remove any remaining processing placeholders
        setImages((prev) => prev.filter(img => !img.isProcessing));
        break;

      default:
        break;
    }
  };



  const handleReset = () => {
    setImages([]);
    setUploadedFileName('');
    setLastFormData(null);
    setLastPrompt('');
    setCameraSpecs(null);
    setProgress(0);
    setStatus('');
    setError('');
    setShowError(false);
    setIsError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateAnother = async () => {
    if (!lastFormData) return;
    
    setIsGenerating(true);
    setProgress(0);
    setStatus('');
    setError('');
    setShowError(false);
    setIsError(false);
    setImages([]);

    // Create new FormData with the saved prompt
    const newFormData = new FormData();
    for (const [key, value] of lastFormData.entries()) {
      newFormData.append(key, value);
    }
    
    // Add the saved prompt to force reuse
    if (lastPrompt) {
      newFormData.append('reuse_prompt', lastPrompt);
    }

    try {
      const res = await fetch('/casetool/api/generate', {
        method: 'POST',
        body: newFormData,
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

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
      setShowError(true);
      setIsError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCrop = (url: string) => {
    setCropImageUrl(url);
    setCropModalOpen(true);
  };

  const closeCropModal = () => {
    if (cropper) {
      cropper.destroy();
      setCropper(null);
    }
    setCropModalOpen(false);
  };

  const downloadCrop = () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas();
    if (!canvas) return;

    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mockup_crop.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleFullscreen = (url: string) => {
    setFullscreenImageUrl(url);
    setFullscreenModalOpen(true);
  };

  const closeFullscreenModal = () => {
    setFullscreenModalOpen(false);
    setFullscreenImageUrl(null);
  };

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
            <Link href="/casetool" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => setSidebarOpen(false)}>
              <Sparkles size={20} />
              <span>AI Generator</span>
            </Link>
            <Link href="/editor" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Scissors size={20} />
              <span>Image Editor</span>
            </Link>
            <Link href="/casetool/gallery" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <ImageIcon size={20} />
              <span>Gallery</span>
            </Link>
          </div>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Account</div>
            <Link href="/casetool/billing" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
              <Zap size={20} />
              <span>Usage & Billing</span>
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

      
        {/* Header with Logo and Menu */}
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
        {/* Main Card - Hero Section */}
        <div className={styles.mainCard}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={18} />
              <span>AI-Powered Generator</span>
            </div>
            <h1 className={styles.title}>
              Transform Phone Cases into Pro Product Images
            </h1>
            <p className={styles.description}>
              Upload your phone case photo and watch our AI create stunning, professional Amazon-ready mockups instantly. Multiple angles, perfect lighting, and flawless composition—all automated.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Target Phone Model
              </label>
              <input
                type="text"
                name="phone_model"
                placeholder="e.g. Galaxy A35 5G, Infinix Note 40"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Case Type
              </label>
              <div className={styles.caseTypeSelector}>
                <button
                  type="button"
                  className={`${styles.caseTypeOption} ${caseType === 'transparent' ? styles.caseTypeActive : ''}`}
                  onClick={() => setCaseType('transparent')}
                >
                  <div className={styles.caseTypeIcon}>🔍</div>
                  <span className={styles.caseTypeTitle}>Transparent</span>
                  <span className={styles.caseTypeDesc}>Clear TPU cases</span>
                </button>
                <button
                  type="button"
                  className={`${styles.caseTypeOption} ${caseType === 'doyers' ? styles.caseTypeActive : ''}`}
                  onClick={() => setCaseType('doyers')}
                >
                  <div className={styles.caseTypeIcon}>🎨</div>
                  <span className={styles.caseTypeTitle}>Doyers</span>
                  <span className={styles.caseTypeDesc}>Printed design cases</span>
                </button>
                <button
                  type="button"
                  className={`${styles.caseTypeOption} ${caseType === 'black' ? styles.caseTypeActive : ''}`}
                  onClick={() => setCaseType('black')}
                >
                  <div className={styles.caseTypeIcon}>⚫</div>
                  <span className={styles.caseTypeTitle}>Black</span>
                  <span className={styles.caseTypeDesc}>Black bumper cases</span>
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Quality Model
              </label>
              <div className={styles.modelSelector}>
                <button
                  type="button"
                  className={`${styles.modelOption} ${selectedModel === 'normal' ? styles.modelOptionActive : ''}`}
                  onClick={() => setSelectedModel('normal')}
                >
                  <div className={styles.modelOptionHeader}>
                    <Zap size={20} />
                    <span className={styles.modelOptionTitle}>Standard Quality</span>
                  </div>
                  <div className={styles.modelOptionDesc}>Fast generation • Good quality • ₹4.1</div>
                  <div className={styles.modelOptionBadge}>gemini-2.5-flash</div>
                </button>
                <button
                  type="button"
                  className={`${styles.modelOption} ${selectedModel === 'high' ? styles.modelOptionActive : ''}`}
                  onClick={() => setSelectedModel('high')}
                >
                  <div className={styles.modelOptionHeader}>
                    <Sparkles size={20} />
                    <span className={styles.modelOptionTitle}>Ultra HD Quality</span>
                  </div>
                  <div className={styles.modelOptionDesc}>4K resolution • Best quality • ₹9.39</div>
                  <div className={styles.modelOptionBadge}>gemini-3-pro</div>
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Reference Image (Flat or Angled)
              </label>
              <div 
                className={`${styles.dropZone} ${isDragging ? styles.dragOver : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className={styles.dropZoneContent}>
                  <Upload className={styles.dropZoneIcon} size={48} />
                  <div className={styles.dropZoneText}>
                    {uploadedFileName || 'Drag & Drop your image here'}
                  </div>
                  <div className={styles.dropZoneSubtext}>
                    {uploadedFileName ? 'Click to change file' : 'or click to browse'}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="case_image"
                  accept="image/*"
                  required
                  className={styles.fileInput}
                  onChange={handleFileChange}
                  style={{ 
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || images.length > 0}
              className={styles.submitButton}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className={styles.buttonIconSpinning} />
                  <span>Processing...</span>
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
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${isError ? styles.progressFillError : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={`${styles.statusText} ${isError ? styles.statusTextError : ''}`}>
                {status}
              </div>
            </div>
          )}

          {showError && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          {/* Camera Specs Display */}
          {cameraSpecs && (
            <div className={styles.cameraSpecsCard}>
              <div className={styles.cameraSpecsHeader}>
                <div className={styles.cameraSpecsIcon}>📸</div>
                <h3 className={styles.cameraSpecsTitle}>Researched Camera Specifications</h3>
              </div>
              <div className={styles.cameraSpecsGrid}>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Phone Model</div>
                  <div className={styles.specValue}>{cameraSpecs.model_name}</div>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Camera Count</div>
                  <div className={styles.specValue}>
                    <span className={styles.specBadge}>{cameraSpecs.rear_camera_count} Cameras</span>
                  </div>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Torch Light</div>
                  <div className={styles.specValue}>
                    <span className={`${styles.specBadge} ${cameraSpecs.has_torch_light ? styles.specBadgeSuccess : styles.specBadgeGray}`}>
                      {cameraSpecs.has_torch_light ? '🔦 Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Arrangement</div>
                  <div className={styles.specValue}>{cameraSpecs.camera_arrangement}</div>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Island Shape</div>
                  <div className={styles.specValue}>{cameraSpecs.camera_island_shape}</div>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>Position</div>
                  <div className={styles.specValue}>{cameraSpecs.camera_module_position}</div>
                </div>
                <div className={`${styles.specItem} ${styles.specItemFull}`}>
                  <div className={styles.specLabel}>Lens Configuration</div>
                  <div className={styles.specValue}>{cameraSpecs.lens_sizes}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {images.length > 0 && (
          <div className={styles.resultSection} ref={imageResultsRef}>
            <div className={styles.resultSectionHeader}>
              <h2 className={styles.resultSectionTitle}>Generated Mockups</h2>
              <button
                onClick={handleReset}
                className={styles.resetIconButton}
                disabled={isGenerating}
                title="Reset and upload new image"
              >
                <X size={20} />
                Reset
              </button>
            </div>
            <div className={styles.resultsGridContainer}>
              {images.map((img, idx) => (
                <div key={idx} className={styles.mockupCard}>
                  {img.isProcessing ? (
                    <div className={styles.mockupCardLoading}>
                      <div className={styles.spinnerContainer}>
                        <div className={styles.spinner}></div>
                        <Sparkles size={32} className={styles.sparkleIcon} />
                      </div>
                      <div className={styles.loadingText}>Generating mockup...</div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.mockupImageContainer}>
                        <img src={img.url} alt={img.title} className={styles.mockupImage} />
                        <button 
                          onClick={() => handleFullscreen(img.url)} 
                          className={styles.fullscreenButton}
                          title="View fullscreen"
                        >
                          <Maximize2 size={20} />
                        </button>
                      </div>
                      <div className={styles.mockupCardFooter}>
                        <div className={styles.mockupCardActions}>
                          <a
                            href={img.url}
                            download
                            className={styles.actionBtn}
                            onClick={() => {
                              if (img.logId) recordDownload(img.logId);
                            }}
                          >
                            <Download size={16} />
                            Download
                          </a>
                          <button onClick={() => handleCrop(img.url)} className={styles.actionBtnSecondary}>
                            <Scissors size={16} />
                            Crop
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <div className={styles.actionButtons}>
              <button
                onClick={handleGenerateAnother}
                disabled={isGenerating}
                className={styles.submitButton}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className={styles.buttonIconSpinning} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    <span>Generate Another</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Features Section */}
        {images.length === 0 && !isGenerating && (
          <>
            <div className={styles.infoSection}>
              <h2 className={styles.sectionTitle}>
                <Camera size={32} />
                How It Works
              </h2>
            <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Upload Your Case Photo</h3>
                    <p className={styles.stepDescription}>
                      Simply upload any photo of your phone case. It can be a flat lay, angled shot, or even a quick snapshot.
                    </p>
                  </div>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>AI Analyzes Geometry</h3>
                    <p className={styles.stepDescription}>
                      Our AI examines camera cutouts, button placements, and case dimensions to ensure perfect accuracy.
                    </p>
                  </div>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Professional Images Generated</h3>
                    <p className={styles.stepDescription}>
                      Get 5 high-quality product images with different angles, lighting, and compositions - perfect for listings.
                    </p>
                  </div>
                </div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Download & Use</h3>
                    <p className={styles.stepDescription}>
                      Download individual images or use our crop/split tools to extract specific angles for your needs.
                    </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>
              <Zap size={32} />
              Key Features
            </h2>
            <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <Sparkles size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>AI-Powered Precision</h3>
                  <p className={styles.featureDescription}>
                    Advanced AI detects and preserves exact camera layouts, button positions, and case geometry.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <Camera size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>5 Professional Angles</h3>
                  <p className={styles.featureDescription}>
                    Get front/back hero shots, 3/4 views, material showcases, and technical detail images.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <Clock size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>Lightning Fast</h3>
                  <p className={styles.featureDescription}>
                    Generate all mockups in under 2 minutes. No manual editing or photography skills required.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <Shield size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>Amazon-Ready Quality</h3>
                  <p className={styles.featureDescription}>
                    Studio lighting, professional composition, and high-resolution output ready for any platform.
                </p>
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Crop Modal */}
      {cropModalOpen && cropImageUrl && (
        <div className={styles.cropModal}>
          <div className={styles.cropModalContent}>
            <div className={styles.cropModalBody}>
              <img
                ref={cropImageRef}
                src={cropImageUrl + '?t=' + Date.now()}
                alt="Crop source"
                className={styles.cropModalImage}
              />
            </div>
            <div className={styles.cropModalActions}>
              <button onClick={closeCropModal} className={styles.cropModalButton}>
                Close
              </button>
              <button onClick={downloadCrop} className={`${styles.cropModalButton} ${styles.cropModalButtonPrimary}`}>
                Download Crop
              </button>
            </div>
          </div>
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
