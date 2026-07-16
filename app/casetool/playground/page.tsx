'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Upload, Download, Copy, Check } from 'lucide-react';
import { IMAGE_MODELS, getModelByKey, type Resolution } from '@/lib/image-pricing';
import styles from './playground.module.css';

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [imageModel, setImageModel] = useState('nano');
  const [resolution, setResolution] = useState<Resolution>('1k');
  const [temperature, setTemperature] = useState('0');
  const [runAnalysis, setRunAnalysis] = useState(true);
  const [whiten, setWhiten] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [panelCount, setPanelCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ image: string; finalPrompt: string; analysis: any; seconds: string; modelId: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = localStorage.getItem('bulk_api_key');
    if (k) setApiKey(k);
  }, []);
  useEffect(() => { localStorage.setItem('bulk_api_key', apiKey); }, [apiKey]);

  // Transparent-only tool: always load the 2-panel transparent prompt.
  const loadDefault = useCallback(async (overwrite: boolean) => {
    const res = await fetch(`/casetool/api/playground?case_type=transparent&phone_model=${encodeURIComponent(phoneModel || 'Phone Model')}`);
    const data = await res.json();
    if (data.success) {
      setDefaultPrompt(data.prompt);
      setPanelCount(Array.isArray(data.panels) ? data.panels.length : 0);
      if (overwrite || !prompt) setPrompt(data.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneModel, prompt]);

  useEffect(() => { loadDefault(false); /* eslint-disable-next-line */ }, []);

  const onFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setSrcUrl(URL.createObjectURL(f));
    if (!phoneModel) setPhoneModel(f.name.replace(/\.[a-z0-9]+$/i, ''));
  };

  const generate = async () => {
    if (!file) { setError('Upload a reference image first.'); return; }
    setBusy(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('phone_model', phoneModel || 'Phone Model');
      fd.append('prompt', prompt);
      fd.append('image_model', imageModel);
      fd.append('resolution', resolution);
      fd.append('temperature', temperature);
      fd.append('run_analysis', String(runAnalysis));
      fd.append('whiten', String(whiten));
      if (apiKey.trim()) fd.append('api_key', apiKey.trim());
      const res = await fetch('/casetool/api/playground', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'Failed');
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.image;
    a.download = `${phoneModel || 'mockup'}.png`;
    a.click();
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const dirty = prompt !== defaultPrompt;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <b>Prompt Playground</b>
        <span className={styles.badge}>transparent · {panelCount || 2} panels</span>
        <span className={styles.sub}>Edit the prompt, generate, compare. Nothing here is saved to the database.</span>
        <div className={styles.spacer} />
        <input
          className={styles.key}
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Gemini API key (or set GEMINI_API_KEY)"
        />
      </header>

      <div className={styles.cols}>
        {/* LEFT: controls + prompt */}
        <section className={styles.left}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Reference image</label>
              <button className={styles.upload} onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> {file ? file.name : 'Choose image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0] || null)} />
            </div>
            <div className={styles.field}>
              <label>Phone model</label>
              <input value={phoneModel} onChange={e => setPhoneModel(e.target.value)} placeholder="e.g. Google Pixel 3" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Image model</label>
              <select value={imageModel} onChange={e => setImageModel(e.target.value)}>
                {IMAGE_MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Resolution</label>
              <select value={resolution} onChange={e => setResolution(e.target.value as Resolution)}>
                {getModelByKey(imageModel).resolutions.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Temperature</label>
              <input type="number" step="0.1" min="0" max="1" value={temperature} onChange={e => setTemperature(e.target.value)} />
            </div>
          </div>

          <div className={styles.checks}>
            <label><input type="checkbox" checked={runAnalysis} onChange={e => setRunAnalysis(e.target.checked)} /> Run analysis step (fills <code>{'{{ANALYSIS}}'}</code>)</label>
            <label><input type="checkbox" checked={whiten} onChange={e => setWhiten(e.target.checked)} /> Apply white cleanup</label>
          </div>

          <div className={styles.promptHead}>
            <label>Prompt {dirty && <span className={styles.dirty}>edited</span>}</label>
            <div className={styles.promptBtns}>
              <button className={styles.mini} onClick={copyPrompt}>{copied ? <Check size={13} /> : <Copy size={13} />} Copy</button>
              <button className={styles.mini} onClick={() => loadDefault(true)}><RotateCcw size={13} /> Reset to default</button>
            </div>
          </div>
          <textarea className={styles.prompt} value={prompt} onChange={e => setPrompt(e.target.value)} spellCheck={false} />

          <button className={styles.go} disabled={busy} onClick={generate}>
            <Play size={16} /> {busy ? 'Generating…' : 'Generate'}
          </button>
          {error && <div className={styles.err}>{error}</div>}
        </section>

        {/* RIGHT: images */}
        <section className={styles.right}>
          <div className={styles.pane}>
            <span className={styles.paneTitle}>Reference</span>
            {srcUrl ? <img src={srcUrl} alt="ref" /> : <div className={styles.empty}>No image chosen</div>}
          </div>
          <div className={styles.pane}>
            <span className={styles.paneTitle}>
              Generated
              {result && <em> · {result.modelId} · {result.seconds}s</em>}
            </span>
            {busy ? <div className={styles.empty}><div className={styles.spinner} /></div>
              : result ? <img src={result.image} alt="out" />
              : <div className={styles.empty}>Nothing generated yet</div>}
            {result && (
              <div className={styles.paneFoot}>
                <button className={styles.mini} onClick={download}><Download size={13} /> Download</button>
                <button className={styles.mini} onClick={() => setShowFinal(s => !s)}>
                  {showFinal ? 'Hide' : 'Show'} prompt actually sent
                </button>
              </div>
            )}
          </div>
          {result && showFinal && (
            <pre className={styles.finalPrompt}>{result.finalPrompt}</pre>
          )}
          {result?.analysis && (
            <details className={styles.details}>
              <summary>Analysis output</summary>
              <pre className={styles.finalPrompt}>{JSON.stringify(result.analysis, null, 2)}</pre>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
