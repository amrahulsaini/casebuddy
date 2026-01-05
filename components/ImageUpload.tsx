'use client';

import { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

interface ProductImage {
  id?: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

interface ImageUploadProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  mode?: 'edit' | 'create';
}

export default function ImageUpload({
  productId,
  images,
  onImagesChange,
  mode = 'edit',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);

    try {
      for (const file of files) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'product');

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          const imageUrl = data?.absoluteUrl || data?.url;
          const newImage: ProductImage = {
            image_url: imageUrl,
            alt_text: '',
            sort_order: images.length,
            is_primary: images.length === 0,
          };

          if (mode === 'edit' && productId) {
            // If editing existing product, save to database immediately
            await fetch(`/api/admin/products/${productId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newImage),
            });

            // Refresh images list
            const imagesResponse = await fetch(
              `/api/admin/products/${productId}/images`
            );
            const updatedImages = await imagesResponse.json();
            onImagesChange(updatedImages);
          } else {
            // If creating new product, just add to local state
            onImagesChange([...images, newImage]);
          }
        } else {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (index: number) => {
    if (mode === 'edit' && productId && images[index].id) {
      try {
        await fetch(`/api/admin/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'set_primary',
            imageId: images[index].id,
          }),
        });

        // Refresh images
        const response = await fetch(`/api/admin/products/${productId}/images`);
        const updatedImages = await response.json();
        onImagesChange(updatedImages);
      } catch (error) {
        console.error('Error setting primary:', error);
      }
    } else {
      // Local update for create mode
      const updated = images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      onImagesChange(updated);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Delete this image?')) return;

    if (mode === 'edit' && productId && images[index].id) {
      try {
        await fetch(
          `/api/admin/products/${productId}/images?imageId=${images[index].id}`,
          { method: 'DELETE' }
        );

        // Refresh images
        const response = await fetch(`/api/admin/products/${productId}/images`);
        const updatedImages = await response.json();
        onImagesChange(updatedImages);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    } else {
      // Local delete for create mode
      const updated = images.filter((_, i) => i !== index);
      // If we deleted the primary image, make the first one primary
      if (images[index].is_primary && updated.length > 0) {
        updated[0].is_primary = true;
      }
      onImagesChange(updated);
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update sort order
    const updated = reordered.map((img, i) => ({ ...img, sort_order: i }));

    if (mode === 'edit' && productId) {
      try {
        await fetch(`/api/admin/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorder',
            images: updated,
          }),
        });
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }

    onImagesChange(updated);
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.active : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <div className={styles.dropzoneContent}>
          <div className={styles.uploadIcon}>📁</div>
          <p>
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className={styles.hint}>PNG, JPG, WebP up to 5MB</p>
        </div>
      </div>

      {uploading && (
        <div className={styles.uploading}>Uploading images...</div>
      )}

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((image, index) => (
            <div key={image.id || index} className={styles.imageCard}>
              <img src={image.image_url} alt={image.alt_text} />
              <div style={{ marginTop: 6 }}>
                <a href={image.image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                  Open in new tab
                </a>
              </div>
              
              {image.is_primary && (
                <div className={styles.primaryBadge}>Primary</div>
              )}

              <div className={styles.imageActions}>
                {!image.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className={styles.actionButton}
                    title="Set as primary"
                  >
                    ⭐
                  </button>
                )}
                
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index - 1)}
                    className={styles.actionButton}
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index + 1)}
                    className={styles.actionButton}
                    title="Move right"
                  >
                    →
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className={styles.deleteButton}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
