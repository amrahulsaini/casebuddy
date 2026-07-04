'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Play, Square, Download, FolderUp, Check, X, Eye, Settings,
  RotateCcw, Lock, KeyRound, Trash2, Pencil, FileArchive, ChevronRight,
} from 'lucide-react';
import styles from './bulk.module.css';

const BULK_PASS = 'Bulk@321';

type Mark = 'none' | 'right' | 'wrong';
type Status = 'pending' | 'generating' | 'done' | 'error';

interface Item {
  id: string;
  file: File | null;  // null after a reload-restore until folder is re-uploaded
  fileName: string;   // original file name (persistence key)
  name: string;       // model name from filename
  srcUrl: string;     // object URL of source image ('' when restored)
  status: Status;
  genUrl?: string;    // generated grid url
  fileBase?: string;
  error?: string;
  mark: Mark;
  prompt?: string;    // reusable analysis prompt
}

// Natural sort so "Vivo y2" < "Vivo y10"
function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function modelNameFromFile(fileName: string) {
  return fileName.replace(/\.[a-z0-9]{2,5}$/i, '').trim() || fileName;
}

export default function BulkPage() {
  // ---- Auth gate ----
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('bulk_auth') === 'yes') {
      setAuthed(true);
    }
  }, []);

  const tryLogin = () => {
    if (passInput === BULK_PASS) {
      sessionStorage.setItem('bulk_auth', 'yes');
      setAuthed(true);
      setPassError('');
    } else {
      setPassError('Wrong password');
    }
  };

  // ---- Settings ----
  const [apiKey, setApiKey] = useState('');
  const [category, setCategory] = useState('transparent');
  const [imageModel, setImageModel] = useState('normal');
  const [backColor, setBackColor] = useState('');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    const k = localStorage.getItem('bulk_api_key');
    if (k) setApiKey(k);
  }, []);
  useEffect(() => {
    localStorage.setItem('bulk_api_key', apiKey);
  }, [apiKey]);

  // ---- Items ----
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const lastIndexRef = useRef(0);

  // Restore previously generated results + marks from the database on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/casetool/api/bulk-list?case_type=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.rows) && data.rows.length) {
          setItems(data.rows.map((r: any, idx: number) => ({
            id: `db_${r.id ?? idx}_${r.file_name}`,
            file: null,
            fileName: r.file_name,
            name: r.model_name,
            srcUrl: r.src_thumb || r.src_url || '',
            status: (r.status as Status) || (r.gen_url ? 'done' : 'pending'),
            genUrl: r.gen_url || undefined,
            fileBase: r.file_base || undefined,
            mark: (r.mark as Mark) || 'none',
            prompt: r.prompt || undefined,
          })));
        }
      } catch { /* offline / not migrated yet */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Range inputs ----
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [genFrom, setGenFrom] = useState('');
  const [genTo, setGenTo] = useState('');

  // ---- Preview modal ----
  const [preview, setPreview] = useState<Item | null>(null);

  // ---- Edit prompt modal ----
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editText, setEditText] = useState('');

  const doneCount = useMemo(() => items.filter(i => i.status === 'done').length, [items]);
  const rightCount = useMemo(() => items.filter(i => i.mark === 'right').length, [items]);
  const wrongCount = useMemo(() => items.filter(i => i.mark === 'wrong').length, [items]);

  // ---- Folder upload ----
  const onFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name));
    files.sort((a, b) => naturalCompare(a.name, b.name));
    setItems(prev => {
      // Carry over previously generated results + marks for matching filenames.
      const byName = new Map(prev.map(i => [i.fileName, i]));
      return files.map((file, idx) => {
        const ex = byName.get(file.name);
        return {
          id: `${Date.now()}_${idx}_${file.name}`,
          file,
          fileName: file.name,
          name: modelNameFromFile(file.name),
          srcUrl: URL.createObjectURL(file),
          status: (ex?.genUrl ? 'done' : 'pending') as Status,
          genUrl: ex?.genUrl,
          fileBase: ex?.fileBase,
          mark: ex?.mark || 'none',
          prompt: ex?.prompt,
        };
      });
    });
    lastIndexRef.current = 0;
    e.target.value = '';
    // Persist source images server-side in the background (batched) so the
    // reference thumbnails survive a reload without re-uploading.
    uploadSources(files);
  };

  const [savingSrc, setSavingSrc] = useState(false);
  const [saveProg, setSaveProg] = useState({ done: 0, total: 0 });

  // Downscale a reference to a small JPEG thumbnail for fast, reliable storage.
  const makeThumb = async (file: File, maxW = 380): Promise<Blob | null> => {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, maxW / bmp.width);
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close?.();
      return await new Promise<Blob | null>(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.72));
    } catch {
      return null;
    }
  };

  const uploadSources = async (files: File[]) => {
    if (files.length === 0) return;
    setSavingSrc(true);
    setSaveProg({ done: 0, total: files.length });
    const CHUNK = 8;       // files per request
    const PARALLEL = 3;    // concurrent requests
    let done = 0;

    // Build chunks of {blob, name}
    const chunks: { thumb: Blob; name: string }[][] = [];
    for (let i = 0; i < files.length; i += CHUNK) {
      const group: { thumb: Blob; name: string }[] = [];
      for (const f of files.slice(i, i + CHUNK)) {
        const thumb = await makeThumb(f);
        group.push({ thumb: thumb || f, name: f.name });
      }
      chunks.push(group);
    }

    const sendChunk = async (group: { thumb: Blob; name: string }[]) => {
      const fd = new FormData();
      fd.append('case_type', category);
      for (const g of group) {
        fd.append('files', g.thumb, g.name.replace(/\.[a-z0-9]+$/i, '.jpg'));
        fd.append('orig_names', g.name);
      }
      await fetch('/casetool/api/bulk-upload', { method: 'POST', body: fd }).catch(() => {});
      done += group.length;
      setSaveProg({ done, total: files.length });
    };

    // Run chunks with limited concurrency
    for (let i = 0; i < chunks.length; i += PARALLEL) {
      await Promise.all(chunks.slice(i, i + PARALLEL).map(sendChunk));
    }
    setSavingSrc(false);
  };

  // Warn before leaving while reference images are still being saved.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (savingSrc) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savingSrc]);

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  // ---- Generate single ----
  const generateOne = useCallback(async (item: Item, customPrompt = '') => {
    if (!item.file) {
      alert('Re-upload the folder to generate — source images are not kept after a page reload (only results are).');
      return;
    }
    updateItem(item.id, { status: 'generating', error: undefined });
    try {
      const fd = new FormData();
      fd.append('case_image', item.file);
      fd.append('phone_model', item.name);
      fd.append('case_type', category);
      fd.append('image_model', imageModel);
      if (apiKey.trim()) fd.append('api_key', apiKey.trim());
      if (backColor.trim()) fd.append('back_color', backColor.trim());
      const steer = (customPrompt || globalPrompt).trim();
      if (steer) fd.append('custom_prompt', steer);

      const res = await fetch('/casetool/api/bulk-generate', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        updateItem(item.id, { status: 'done', genUrl: data.url, fileBase: data.fileBase, prompt: data.prompt });
      } else {
        updateItem(item.id, { status: 'error', error: data.error || 'Failed' });
      }
    } catch (err: any) {
      updateItem(item.id, { status: 'error', error: err?.message || 'Network error' });
    }
  }, [apiKey, backColor, category, globalPrompt, imageModel, updateItem]);

  // ---- Start / resume sequential generation ----
  const start = useCallback(async (fromBeginning: boolean) => {
    if (!apiKey.trim()) { alert('Enter your Gemini API key in Settings first.'); return; }
    if (items.length === 0) { alert('Upload a folder of reference images first.'); return; }
    stopRef.current = false;
    setRunning(true);
    const startIdx = fromBeginning ? 0 : lastIndexRef.current;
    // read latest items via functional snapshot
    const snapshot = await new Promise<Item[]>(resolve => setItems(prev => { resolve(prev); return prev; }));
    for (let i = startIdx; i < snapshot.length; i++) {
      if (stopRef.current) break;
      lastIndexRef.current = i;
      const cur = snapshot[i];
      if (cur.status === 'done') continue; // skip already generated when resuming
      await generateOne(cur);
    }
    lastIndexRef.current = Math.min(lastIndexRef.current + 1, snapshot.length);
    setRunning(false);
  }, [apiKey, generateOne, items.length]);

  // ---- Generate a specific serial range ----
  const generateRange = useCallback(async () => {
    if (!apiKey.trim()) { alert('Enter your Gemini API key in Settings first.'); return; }
    const from = parseInt(genFrom, 10);
    const to = parseInt(genTo, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) { alert('Enter a valid serial range to generate (e.g. 1 to 50).'); return; }
    stopRef.current = false;
    setRunning(true);
    const snapshot = await new Promise<Item[]>(resolve => setItems(prev => { resolve(prev); return prev; }));
    const end = Math.min(to, snapshot.length);
    for (let i = from - 1; i < end; i++) {
      if (stopRef.current) break;
      lastIndexRef.current = i;
      await generateOne(snapshot[i]);
    }
    setRunning(false);
  }, [apiKey, generateOne, genFrom, genTo]);

  const stop = () => { stopRef.current = true; setRunning(false); };

  // ---- Download helpers ----
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadOne = async (item: Item) => {
    if (!item.genUrl) return;
    const res = await fetch(item.genUrl);
    const blob = await res.blob();
    downloadBlob(blob, `${item.name}.png`);
  };

  const downloadRange = async () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) { alert('Enter a valid serial range (e.g. 1 to 50).'); return; }
    const slice = items.slice(from - 1, to).filter(i => i.status === 'done' && i.genUrl);
    if (slice.length === 0) { alert('No generated images in that range yet.'); return; }
    for (const item of slice) {
      await downloadOne(item);
      await new Promise(r => setTimeout(r, 250));
    }
  };

  // ---- Export marked-right as ZIP ----
  const [exporting, setExporting] = useState(false);
  const exportRightZip = async () => {
    const right = items.filter(i => i.mark === 'right' && i.genUrl);
    if (right.length === 0) { alert('No images marked Right yet.'); return; }
    setExporting(true);
    try {
      const zip = new JSZip();
      const used: Record<string, number> = {};
      for (const item of right) {
        const res = await fetch(item.genUrl!);
        const blob = await res.blob();
        let fname = `${item.name}.png`;
        if (used[fname]) { fname = `${item.name}_${used[fname]}.png`; used[`${item.name}.png`]++; }
        else used[fname] = 1;
        zip.file(fname, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `transparent_mockups_${right.length}.zip`);
    } catch (e: any) {
      alert('Export failed: ' + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  // ---- Mark (persisted to DB) ----
  const mark = (item: Item, m: Mark) => {
    if (!item.genUrl) return; // only judge generated output
    const next: Mark = item.mark === m ? 'none' : m;
    updateItem(item.id, { mark: next });
    setPreview(p => (p && p.id === item.id ? { ...p, mark: next } : p));
    const fd = new FormData();
    fd.append('file_name', item.fileName);
    fd.append('case_type', category);
    fd.append('mark', next);
    fetch('/casetool/api/bulk-mark', { method: 'POST', body: fd }).catch(() => {});
  };

  // ---- Edit prompt + regenerate ----
  const openEdit = (item: Item) => { setEditItem(item); setEditText(''); };
  const applyEdit = async () => {
    if (!editItem) return;
    const it = editItem;
    setEditItem(null);
    await generateOne(it, editText);
  };

  const clearAll = async () => {
    if (!confirm('Clear all uploaded images and saved results for this category?')) return;
    items.forEach(i => i.srcUrl && URL.revokeObjectURL(i.srcUrl));
    setItems([]);
    lastIndexRef.current = 0;
    try {
      const fd = new FormData();
      fd.append('case_type', category);
      await fetch('/casetool/api/bulk-clear', { method: 'POST', body: fd });
    } catch { /* ignore */ }
  };

  // ============ RENDER ============
  if (!authed) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <Lock size={34} className={styles.gateIcon} />
          <h1>Bulk Studio</h1>
          <p>Enter the access password to continue.</p>
          <input
            type="password"
            value={passInput}
            placeholder="Password"
            onChange={e => setPassInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
            className={styles.gateInput}
            autoFocus
          />
          {passError && <span className={styles.gateErr}>{passError}</span>}
          <button className={styles.gateBtn} onClick={tryLogin}>Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <FolderUp size={22} />
          <span>Bulk Mockup Studio</span>
          <span className={styles.badge}>{category}</span>
        </div>
        <div className={styles.stats}>
          <span>Total <b>{items.length}</b></span>
          <span>Done <b>{doneCount}</b></span>
          <span className={styles.right}>Right <b>{rightCount}</b></span>
          <span className={styles.wrong}>Wrong <b>{wrongCount}</b></span>
        </div>
        <button className={styles.iconBtn} onClick={() => setShowSettings(s => !s)} title="Settings">
          <Settings size={18} /> Settings
        </button>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <section className={styles.settings}>
          <div className={styles.field}>
            <label><KeyRound size={14} /> Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key"
            />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="transparent">Transparent</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Quality</label>
            <select value={imageModel} onChange={e => setImageModel(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="nano">Nano</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Back color (optional)</label>
            <input value={backColor} onChange={e => setBackColor(e.target.value)} placeholder="e.g. deep green" />
          </div>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label><Pencil size={14} /> Global extra instruction (optional — applies to every image)</label>
            <input value={globalPrompt} onChange={e => setGlobalPrompt(e.target.value)} placeholder="e.g. make the phone body blue" />
          </div>
        </section>
      )}

      {/* Toolbar */}
      <section className={styles.toolbar}>
        <label className={styles.uploadBtn}>
          <FolderUp size={16} /> Upload Folder
          {/* @ts-expect-error webkitdirectory is non-standard */}
          <input type="file" webkitdirectory="" directory="" multiple accept="image/*" onChange={onFolder} hidden />
        </label>
        {savingSrc && <span className={styles.savingTag}>saving refs… {saveProg.done}/{saveProg.total} (don’t refresh yet)</span>}

        <div className={styles.divider} />

        <button className={styles.btnPrimary} disabled={running} onClick={() => start(true)}>
          <Play size={16} /> Start
        </button>
        <button className={styles.btn} disabled={running} onClick={() => start(false)} title="Resume from last processed">
          <ChevronRight size={16} /> Resume
        </button>
        <button className={styles.btnStop} disabled={!running} onClick={stop}>
          <Square size={15} /> Stop
        </button>

        <div className={styles.divider} />

        <div className={styles.rangeBox}>
          <span>Generate</span>
          <input type="number" min={1} value={genFrom} onChange={e => setGenFrom(e.target.value)} placeholder="from" />
          <span>–</span>
          <input type="number" min={1} value={genTo} onChange={e => setGenTo(e.target.value)} placeholder="to" />
          <button className={styles.btnPrimary} disabled={running} onClick={generateRange}><Play size={14} /></button>
        </div>

        <div className={styles.rangeBox}>
          <span>Download</span>
          <input type="number" min={1} value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} placeholder="from" />
          <span>–</span>
          <input type="number" min={1} value={rangeTo} onChange={e => setRangeTo(e.target.value)} placeholder="to" />
          <button className={styles.btn} onClick={downloadRange}><Download size={15} /></button>
        </div>

        <div className={styles.divider} />

        <button className={styles.btnExport} disabled={exporting} onClick={exportRightZip}>
          <FileArchive size={16} /> {exporting ? 'Zipping…' : `Export Right (${rightCount})`}
        </button>

        {items.length > 0 && (
          <button className={styles.btnGhost} onClick={clearAll} title="Clear all">
            <Trash2 size={15} />
          </button>
        )}
      </section>

      {running && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }} />
          <span>Generating… {doneCount}/{items.length}</span>
        </div>
      )}

      {/* Grid of items */}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <FolderUp size={48} />
          <h2>No images loaded</h2>
          <p>Upload a folder of reference case images. Each file name becomes the model name (e.g. <code>Vivo Y95.jpg</code> → <b>Vivo Y95</b>).</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item, idx) => (
            <div key={item.id} className={`${styles.card} ${item.mark === 'right' ? styles.cardRight : ''} ${item.mark === 'wrong' ? styles.cardWrong : ''}`}>
              <div className={styles.cardHead}>
                <span className={styles.serial}>#{idx + 1}</span>
                <span className={styles.model} title={item.name}>{item.name}</span>
                <span className={`${styles.status} ${styles['st_' + item.status]}`}>{item.status}</span>
              </div>

              <div className={styles.thumbs}>
                <div className={styles.thumb} onClick={() => setPreview(item)}>
                  {item.srcUrl ? (
                    <img
                      src={item.srcUrl}
                      alt="source"
                      loading="lazy"
                      decoding="async"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className={styles.thumbWait}>no ref</div>
                  )}
                  <span className={styles.thumbTag}>ref</span>
                </div>
                <div className={`${styles.thumb} ${styles.thumbOut}`} onClick={() => item.genUrl && setPreview(item)}>
                  {item.genUrl ? (
                    <>
                      <img src={item.genUrl} alt="generated" loading="lazy" decoding="async" />
                      <span className={styles.thumbTag}>out</span>
                    </>
                  ) : item.status === 'generating' ? (
                    <div className={styles.spinner} />
                  ) : item.status === 'error' ? (
                    <div className={styles.thumbErr} title={item.error}>error</div>
                  ) : (
                    <div className={styles.thumbWait}>waiting</div>
                  )}
                </div>
              </div>

              <div className={styles.cardActions}>
                <button className={`${styles.act} ${item.mark === 'right' ? styles.actRightOn : ''}`} disabled={!item.genUrl} onClick={() => mark(item, 'right')} title="Mark generated image right"><Check size={15} /></button>
                <button className={`${styles.act} ${item.mark === 'wrong' ? styles.actWrongOn : ''}`} disabled={!item.genUrl} onClick={() => mark(item, 'wrong')} title="Mark generated image wrong"><X size={15} /></button>
                <button className={styles.act} disabled={!item.genUrl} onClick={() => setPreview(item)} title="Preview"><Eye size={15} /></button>
                <button className={styles.act} disabled={!item.genUrl} onClick={() => downloadOne(item)} title="Download"><Download size={15} /></button>
                <button className={styles.act} onClick={() => openEdit(item)} title="Edit prompt & regenerate"><Pencil size={15} /></button>
                <button className={styles.act} disabled={running} onClick={() => generateOne(item)} title="Regenerate"><RotateCcw size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className={styles.modal} onClick={() => setPreview(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <b>{preview.name}</b>
              <button onClick={() => setPreview(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalCol}>
                <span>Reference</span>
                {preview.srcUrl ? <img src={preview.srcUrl} alt="ref" /> : <div className={styles.thumbWait}>No reference stored — re-upload the folder to restore it.</div>}
              </div>
              <div className={styles.modalCol}>
                <span>Generated</span>
                {preview.genUrl ? <img src={preview.genUrl} alt="out" /> : <div className={styles.thumbWait}>Not generated yet</div>}
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={`${styles.act} ${preview.mark === 'right' ? styles.actRightOn : ''}`} disabled={!preview.genUrl} onClick={() => { mark(preview, 'right'); }}><Check size={15} /> Right</button>
              <button className={`${styles.act} ${preview.mark === 'wrong' ? styles.actWrongOn : ''}`} disabled={!preview.genUrl} onClick={() => { mark(preview, 'wrong'); }}><X size={15} /> Wrong</button>
              <button className={styles.btn} disabled={!preview.genUrl} onClick={() => downloadOne(preview)}><Download size={15} /> Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit prompt modal */}
      {editItem && (
        <div className={styles.modal} onClick={() => setEditItem(null)}>
          <div className={styles.modalCardSm} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <b>Steer AI — {editItem.name}</b>
              <button onClick={() => setEditItem(null)}><X size={18} /></button>
            </div>
            <p className={styles.modalNote}>Add an extra instruction sent to the AI on top of the transparent prompt, then regenerate this one image.</p>
            <textarea
              className={styles.editArea}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="e.g. make the phone body royal blue and move the back phone slightly left"
              autoFocus
            />
            <div className={styles.modalFoot}>
              <button className={styles.btnGhost} onClick={() => setEditItem(null)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={applyEdit}><RotateCcw size={15} /> Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
