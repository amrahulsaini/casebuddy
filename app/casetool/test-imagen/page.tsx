'use client';

import { useState, FormEvent, useRef } from 'react';
import Image from 'next/image';
import styles from './test-imagen.module.css';
import { 
  Sparkles, 
  Upload, 
  Wand2,
  Loader2,
  Zap,
  Gauge
} from 'lucide-react';

interface GeneratedImage {
  url: string;
  title: string;
}

export default function TestImagenPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<'imagen-4.0-generate-001' | 'imagen-4.0-ultra-generate-001' | 'imagen-4.0-fast-generate-001'>('imagen-4.0-generate-001');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setError('');
    }
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
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          setUploadedFileName(file.name);
          setError('');
        }
      } else {
        setError('Please upload an image file');
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    const phoneModel = formData.get('phone_model') as string;
    const caseImage = formData.get('case_image') as File;
    
    if (!phoneModel || !caseImage) {
      setError('Please fill all required fields');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus('Starting generation...');
    setImages([]);
    setError('');

    try {
      formData.append('imagen_model', selectedModel);
      
      const response = await fetch('/casetool/api/test-imagen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setStatus(data.message);
                setProgress(data.progress);
              } else if (data.type === 'image_result') {
                setImages((prev) => [...prev, { url: data.data.url, title: data.data.title }]);
                setProgress(data.progress);
              } else if (data.type === 'done') {
                setStatus(data.message);
                setProgress(100);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch (parseError) {
              console.error('Parse error:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <Wand2 className={styles.titleIcon} />
            Imagen API Test - CaseTool
          </h1>
          <p className={styles.subtitle}>
            Testing Google Imagen 4.0 models for phone case generation
          </p>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Phone Model
              </label>
              <input
                type="text"
                name="phone_model"
                placeholder="e.g., iPhone 15 Pro Max"
                className={styles.input}
                required
                disabled={isGenerating}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Imagen Model
              </label>
              <div className={styles.modelSelector}>
                <button
                  type="button"
                  className={`${styles.modelOption} ${selectedModel === 'imagen-4.0-fast-generate-001' ? styles.modelOptionActive : ''}`}
                  onClick={() => setSelectedModel('imagen-4.0-fast-generate-001')}
                  disabled={isGenerating}
                >
                  <div className={styles.modelOptionHeader}>
                    <Zap size={20} />
                    <span className={styles.modelOptionTitle}>Fast</span>
                  </div>
                  <div className={styles.modelOptionDesc}>Quick generation</div>
                  <div className={styles.modelOptionBadge}>imagen-4.0-fast</div>
                </button>
                <button
                  type="button"
                  className={`${styles.modelOption} ${selectedModel === 'imagen-4.0-generate-001' ? styles.modelOptionActive : ''}`}
                  onClick={() => setSelectedModel('imagen-4.0-generate-001')}
                  disabled={isGenerating}
                >
                  <div className={styles.modelOptionHeader}>
                    <Gauge size={20} />
                    <span className={styles.modelOptionTitle}>Standard</span>
                  </div>
                  <div className={styles.modelOptionDesc}>Balanced quality</div>
                  <div className={styles.modelOptionBadge}>imagen-4.0</div>
                </button>
                <button
                  type="button"
                  className={`${styles.modelOption} ${selectedModel === 'imagen-4.0-ultra-generate-001' ? styles.modelOptionActive : ''}`}
                  onClick={() => setSelectedModel('imagen-4.0-ultra-generate-001')}
                  disabled={isGenerating}
                >
                  <div className={styles.modelOptionHeader}>
                    <Sparkles size={20} />
                    <span className={styles.modelOptionTitle}>Ultra</span>
                  </div>
                  <div className={styles.modelOptionDesc}>Best quality</div>
                  <div className={styles.modelOptionBadge}>imagen-4.0-ultra</div>
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Reference Image
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
                  disabled={isGenerating}
                />
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate with Imagen
                </>
              )}
            </button>
          </form>
        </div>

        {isGenerating && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.statusText}>{status}</div>
          </div>
        )}

        {images.length > 0 && (
          <div className={styles.resultsSection}>
            <h2 className={styles.resultsTitle}>Generated Images</h2>
            <div className={styles.imageGrid}>
              {images.map((img, idx) => (
                <div key={idx} className={styles.imageCard}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={img.url}
                      alt={img.title}
                      fill
                      className={styles.generatedImage}
                    />
                  </div>
                  <div className={styles.imageTitle}>{img.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
