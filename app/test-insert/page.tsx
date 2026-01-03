as'use client';

import { FormEvent, useState } from 'react';
import styles from './page.module.css';

type ModelChoice = 'normal' | 'high';
type AspectChoice = '1:1' | '4:5' | '16:9';
type OutputMode = 'single' | 'collage';

interface ApiOk {
  status: 'ok';
  imageUrl: string;
  generationTimeSec: number;
  selectedImageModel: string;
  prompts: {
    editPrompt: string;
  };
}

interface ApiErr {
  status: 'error';
  message: string;
}

export default function TestInsertPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<ApiOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useState<ModelChoice>('normal');
  const [aspect, setAspect] = useState<AspectChoice>('4:5');
  const [mode, setMode] = useState<OutputMode>('single');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Uploading…');
    setResult(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('image_model', modelChoice);
    formData.append('aspect_ratio', aspect);
    formData.append('mode', mode);

    try {
      setStatus(mode === 'collage' ? 'Generating collage (5 panels)…' : 'Generating phone-in-case image…');
      const res = await fetch('/api/test-insert', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as ApiOk | ApiErr;
      if (!res.ok || data.status !== 'ok') {
        const message = (data as ApiErr).message || `Request failed (${res.status})`;
        throw new Error(message);
      }

      setResult(data);
      setStatus('Done.');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Test: Insert Phone Into Printed Case</div>
      <div className={styles.subtle}>
        Upload a straight-on printed case photo + model name. Outputs one image with the phone inserted.
        This is isolated from `/casetool`.
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.row}>
            <label className={styles.label}>
              Phone Model (label)
              <input
                className={styles.input}
                name="phone_model"
                placeholder="e.g., Galaxy A35 5G"
                required
                disabled={isLoading}
              />
            </label>

            <label className={styles.label}>
              Model
              <select
                className={styles.select}
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value as ModelChoice)}
                disabled={isLoading}
              >
                <option value="normal">Normal</option>
                <option value="high">High (enhance model)</option>
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Output
              <select
                className={styles.select}
                value={mode}
                onChange={(e) => setMode(e.target.value as OutputMode)}
                disabled={isLoading}
              >
                <option value="single">Single image (best accuracy)</option>
                <option value="collage">Collage (5 panels, one image)</option>
              </select>
            </label>

            <label className={styles.label}>
              Aspect Ratio
              <select
                className={styles.select}
                value={aspect}
                onChange={(e) => setAspect(e.target.value as AspectChoice)}
                disabled={isLoading}
              >
                <option value="4:5">4:5 (product listing)</option>
                <option value="1:1">1:1 (square)</option>
                <option value="16:9">16:9 (wide)</option>
              </select>
            </label>

            <label className={styles.label}>
              Printed Case Image (straight-on)
              <input
                className={styles.input}
                type="file"
                name="case_image"
                accept="image/*"
                required
                disabled={isLoading}
              />
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.button} type="submit" disabled={isLoading}>
              {isLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {(status || error) && (
            <div className={styles.status}>
              {error ? `Error: ${error}` : status}
            </div>
          )}
        </form>
      </div>

      {result && (
        <>
          <div className={styles.imageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.image} src={result.imageUrl} alt="Generated" />
          </div>
          <div className={styles.details}>
            {`Time: ${result.generationTimeSec.toFixed(2)}s\nModel: ${result.selectedImageModel}\n\nPrompt:\n${result.prompts.editPrompt}`}
          </div>
        </>
      )}
    </div>
  );
}
