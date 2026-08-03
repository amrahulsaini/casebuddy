'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IndianRupee, RotateCcw, Lock, ArrowLeft, Activity, Download } from 'lucide-react';
import { RATE_INR, IMAGE_MODELS } from '@/lib/image-pricing';
import styles from './billing.module.css';

const BULK_PASS = 'Bulk@321';

interface Billing {
  calls: number;
  inr: number;
  ok: number;
  failed: number;
  today: { calls: number; inr: number };
  byModel: { imageModel: string; label: string; modelKey: string; calls: number; inr: number }[];
  daily: { day: string; calls: number; inr: number }[];
  recent: {
    id: number; caseType: string; fileName: string; modelName: string; label: string;
    costInr: number; status: string; createdAt: string; genUrl: string | null;
  }[];
  byPhone: {
    fileName: string; caseType: string; modelName: string;
    attempts: number; ok: number; inr: number; latestGen: string | null;
  }[];
}

const refUrl = (fileName: string, caseType: string) =>
  `/casetool/api/bulk-thumb?name=${encodeURIComponent(fileName)}&case_type=${encodeURIComponent(caseType || 'transparent')}`;

/** Single-image download URL — saves the file under the phone model's name. */
const oneUrl = (genUrl: string, modelName: string) =>
  `${genUrl}${genUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(modelName || 'image')}`;

export default function BulkBillingPage() {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [data, setData] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(false);
  const [dl, setDl] = useState<string | null>(null);
  const [dlError, setDlError] = useState('');
  const [dlNote, setDlNote] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('bulk_auth') === 'yes') setAuthed(true);
  }, []);

  const tryLogin = () => {
    if (passInput === BULK_PASS) {
      sessionStorage.setItem('bulk_auth', 'yes');
      setAuthed(true);
      setPassError('');
    } else setPassError('Wrong password');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/casetool/api/bulk-billing');
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  /**
   * Downloads a zip of every generated image for the period. Files inside are
   * named after the phone model, so the archive is usable as-is.
   *
   * A quick count request first, so a bad period fails instantly with a real
   * message; then the URL is handed to the browser's own downloader. The zip is
   * streamed straight to disk with a native progress bar — nothing is held in
   * the tab's memory, so thousands of images download fine.
   */
  const download = useCallback(async (key: string, params: string) => {
    setDl(key);
    setDlError('');
    setDlNote('');
    try {
      const res = await fetch(`/casetool/api/bulk-download?${params}&count=1`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setDlError(json?.error || 'Could not start download');
        return;
      }
      if (!json.count) {
        setDlError('No images found for this period');
        return;
      }
      const frame = document.createElement('iframe');
      frame.style.display = 'none';
      frame.src = `/casetool/api/bulk-download?${params}`;
      document.body.appendChild(frame);
      setTimeout(() => frame.remove(), 10 * 60 * 1000);
      setDlNote(`Downloading ${json.count} image${json.count === 1 ? '' : 's'} — check your browser downloads.`);
    } catch {
      setDlError('Could not start download');
    } finally {
      setDl(null);
    }
  }, []);

  const dayKey = (d: string | Date) => {
    const dt = new Date(d);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  };

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!authed) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <Lock size={34} className={styles.gateIcon} />
          <h1>Bulk Billing</h1>
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
      <header className={styles.header}>
        <div className={styles.brand}>
          <IndianRupee size={20} />
          <span>Bulk Billing</span>
        </div>
        <Link href="/casetool/bulk" className={styles.backBtn}><ArrowLeft size={15} /> Back to Studio</Link>
        <button className={styles.iconBtn} onClick={load} disabled={loading}>
          <RotateCcw size={15} /> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      <section className={styles.statRow}>
        <div className={`${styles.stat} ${styles.statHero}`}>
          <span>Total billed</span>
          <b>{fmt(data?.inr ?? 0)}</b>
          <small>{data?.calls ?? 0} image API calls</small>
        </div>
        <div className={styles.stat}>
          <span>Today</span>
          <b>{fmt(data?.today.inr ?? 0)}</b>
          <small>{data?.today.calls ?? 0} calls</small>
        </div>
        <div className={styles.stat}>
          <span>Successful</span>
          <b className={styles.ok}>{data?.ok ?? 0}</b>
          <small>returned an image</small>
        </div>
        <div className={styles.stat}>
          <span>Failed / no image</span>
          <b className={styles.bad}>{data?.failed ?? 0}</b>
          <small>still billed</small>
        </div>
      </section>

      <section className={styles.panel}>
        <h2><Download size={15} /> Download images</h2>
        <p className={styles.note}>
          Downloads a zip of every successfully generated image for the period. Each file inside is
          named after the phone model it was generated for.
        </p>
        <div className={styles.dlRow}>
          <button className={styles.dlBtn} disabled={!!dl} onClick={() => download('today', 'range=today')}>
            <Download size={14} /> {dl === 'today' ? 'Starting…' : 'Today'}
          </button>
          <button className={styles.dlBtn} disabled={!!dl} onClick={() => download('week', 'range=week')}>
            <Download size={14} /> {dl === 'week' ? 'Starting…' : 'This week'}
          </button>
          <button className={styles.dlBtn} disabled={!!dl} onClick={() => download('month', 'range=month')}>
            <Download size={14} /> {dl === 'month' ? 'Starting…' : 'Last 30 days'}
          </button>
          <button className={`${styles.dlBtn} ${styles.dlPrimary}`} disabled={!!dl} onClick={() => download('all', 'range=all')}>
            <Download size={14} /> {dl === 'all' ? 'Starting…' : 'All time'}
          </button>
        </div>
        {dlError && <p className={styles.dlErr}>{dlError}</p>}
        {dlNote && <p className={styles.dlOk}>{dlNote}</p>}
      </section>

      <section className={styles.panel}>
        <h2><Activity size={15} /> Rate card</h2>
        <p className={styles.note}>Every image API call is billed at this fixed rate, including retries and regenerations.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Model</th><th>Model ID</th><th>Rate / call</th><th>×100</th><th>×1000</th></tr></thead>
            <tbody>
              {IMAGE_MODELS.map(m => (
                <tr key={m.key}>
                  <td><b>{m.label}</b></td>
                  <td><code>{m.id}</code></td>
                  <td><b>{fmt(RATE_INR[m.key] ?? 0)}</b></td>
                  <td>{fmt((RATE_INR[m.key] ?? 0) * 100)}</td>
                  <td>{fmt((RATE_INR[m.key] ?? 0) * 1000)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Spend by model</h2>
        {data && data.byModel.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Model</th><th>Model ID</th><th>Calls</th><th>Billed</th></tr></thead>
              <tbody>
                {data.byModel.map(b => (
                  <tr key={b.imageModel}>
                    <td><b>{b.label}</b></td>
                    <td><code>{b.imageModel}</code></td>
                    <td>{b.calls}</td>
                    <td><b>{fmt(b.inr)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>No API calls billed yet.</p>}
      </section>

      <section className={styles.panel}>
        <h2>Daily spend (last 30 days)</h2>
        {data && data.daily.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Date</th><th>Calls</th><th>Billed</th><th>Images</th></tr></thead>
              <tbody>
                {data.daily.map(d => (
                  <tr key={String(d.day)}>
                    <td>{new Date(d.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{d.calls}</td>
                    <td><b>{fmt(d.inr)}</b></td>
                    <td>
                      <button
                        className={styles.dlSmall}
                        disabled={!!dl}
                        onClick={() => download(`day-${dayKey(d.day)}`, `day=${dayKey(d.day)}`)}
                      >
                        <Download size={12} /> {dl === `day-${dayKey(d.day)}` ? 'Starting…' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>No activity yet.</p>}
      </section>

      <section className={styles.panel}>
        <h2>All API calls ({data?.recent.length ?? 0})</h2>
        <p className={styles.note}>Every image API call ever made, newest first — including retries and regenerations.</p>
        {data && data.recent.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>#</th><th>Reference</th><th>Generated</th><th>Model</th><th>Image model</th><th>Status</th><th>Billed</th><th>When</th><th>Save</th></tr>
              </thead>
              <tbody>
                {data.recent.map(r => (
                  <tr key={r.id} className={styles.callRow}>
                    <td>{r.id}</td>
                    <td>
                      <img className={styles.thumb} src={refUrl(r.fileName, r.caseType)} alt="ref" loading="lazy" decoding="async"
                           onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                    </td>
                    <td>
                      {r.genUrl
                        ? <a href={r.genUrl} target="_blank" rel="noreferrer">
                            <img className={styles.thumbWide} src={r.genUrl} alt="out" loading="lazy" decoding="async" />
                          </a>
                        : <span className={styles.dash}>—</span>}
                    </td>
                    <td><b>{r.modelName}</b></td>
                    <td>{r.label}</td>
                    <td><span className={r.status === 'success' ? styles.pillOk : styles.pillBad}>{r.status}</span></td>
                    <td><b>{fmt(r.costInr)}</b></td>
                    <td>{new Date(r.createdAt).toLocaleString('en-IN')}</td>
                    <td>
                      {r.genUrl
                        ? <a className={styles.dlSmall} href={oneUrl(r.genUrl, r.modelName)} download>
                            <Download size={12} /> Save
                          </a>
                        : <span className={styles.dash}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>No calls logged yet.</p>}
      </section>
    </div>
  );
}
