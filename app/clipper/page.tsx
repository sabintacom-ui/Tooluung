"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ClipperSource = {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title?: string;
  channel?: string;
  duration_sec?: number;
  view_count?: number;
  thumbnail_url?: string;
  relevance_score?: number;
  status: string;
  source_mode: string;
  created_at?: string;
};

type ClipperJob = {
  id: string;
  source_id: string;
  start_sec: number;
  end_sec: number;
  duration_sec?: number;
  hook_text?: string;
  suggested_title?: string;
  output_url?: string;
  status: string;
  current_step?: string;
  steps_completed?: string[];
  error_message?: string;
  youtube_video_id?: string;
  youtube_url?: string;
  created_at?: string;
};

const CLIP_STEPS = [
  { key: "download_segment", label: "📥 Download" },
  { key: "transcribe", label: "🎤 Whisper" },
  { key: "render_vertical", label: "🎬 Render 9:16" },
  { key: "upload_youtube", label: "📤 Upload" },
];

function fmtTime(sec?: number) {
  if (!sec && sec !== 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ClipperPage() {
  const [adminToken, setAdminToken] = useState("");
  const [workerSecret, setWorkerSecret] = useState("");
  const [scanUrl, setScanUrl] = useState("");
  const [sources, setSources] = useState<ClipperSource[]>([]);
  const [jobs, setJobs] = useState<ClipperJob[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoDiscoverBusy, setAutoDiscoverBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("clipper_admin_token");
    if (saved) setAdminToken(saved);
    const ws = localStorage.getItem("clipper_worker_secret");
    if (ws) setWorkerSecret(ws);

    // PWA install prompt
    let installEvt: any = null;
    const onInstall = (e: any) => {
      e.preventDefault();
      installEvt = e;
      (window as any).__sibermasInstallEvt = e;
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  const persistTokens = () => {
    localStorage.setItem("clipper_admin_token", adminToken);
    localStorage.setItem("clipper_worker_secret", workerSecret);
  };

  const loadStatus = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/clipper/status?limit=20", {
        cache: "no-store",
        headers: { "x-admin-token": adminToken },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memuat status");
      setSources(data.sources || []);
      setJobs(data.jobs || []);
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    loadStatus();
    const id = setInterval(loadStatus, 8000);
    return () => clearInterval(id);
  }, [adminToken, loadStatus]);

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    if (!adminToken || !scanUrl) {
      setMessage("Token + URL wajib diisi");
      return;
    }
    persistTokens();
    setBusy(true);
    setMessage("🔍 Scanning YouTube URL...");
    try {
      const res = await fetch("/api/clipper/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ url: scanUrl, mode: "manual" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Scan gagal");
      setMessage(`✅ Source disimpan: ${data.source.title || data.source.youtube_video_id}`);
      setScanUrl("");
      loadStatus();
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePlan(sourceId: string) {
    if (!adminToken) return;
    setBusy(true);
    setMessage("🧠 Snifox memilih highlights...");
    try {
      const res = await fetch("/api/clipper/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ sourceId, mode: "auto", numClips: 3 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Plan gagal");
      setMessage(`✅ ${data.jobs.length} clip job dibuat`);
      loadStatus();
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscover() {
    if (!adminToken) {
      setMessage("Admin token wajib diisi");
      return;
    }
    persistTokens();
    setAutoDiscoverBusy(true);
    setMessage("🌐 Auto-discover trending Indonesia Indonesia...");
    try {
      const res = await fetch("/api/clipper/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ autoScan: true, topN: 2 }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Discover gagal");
      setMessage(
        `✅ ${data.scored} kandidat scored, ${data.scanned?.length || 0} di-scan. Top: ${
          data.picks?.map((p: { candidate: { title: string } }) => p.candidate.title.slice(0, 40)).join(" | ") || "(none)"
        }`
      );
      loadStatus();
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setAutoDiscoverBusy(false);
    }
  }

  async function handleTrigger() {
    if (!workerSecret) {
      setMessage("Worker secret wajib diisi untuk trigger");
      return;
    }
    persistTokens();
    setBusy(true);
    setMessage("⚙️ Triggering clip worker...");
    try {
      const res = await fetch("/api/clipper/trigger", {
        method: "POST",
        headers: { "x-worker-secret": workerSecret },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Trigger gagal");
      setMessage(
        data.processed
          ? `✅ Job advanced: ${data.job?.current_step || data.job?.status}`
          : `ℹ️ ${data.message || "No pending"}`
      );
      loadStatus();
    } catch (err) {
      setMessage(`❌ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleInstall() {
    const evt = (window as any).__sibermasInstallEvt;
    if (evt) {
      evt.prompt();
      await evt.userChoice;
      setShowInstall(false);
    }
  }

  return (
    <main className="shell">
      {/* TOP NAV */}
      <nav className="nav">
        <div className="brand">
          <div className="brand-logo">SC</div>
          <div>
            <div>sibermas-Clipper</div>
            <small>Sibermas UIN SAIZU</small>
          </div>
        </div>
        <div className="nav-actions">
          <span className="badge-online">Online</span>
          <Link className="btn-secondary" href="/">← Dashboard Utama</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div className="eyebrow">clipper shorts ai</div>
        <h1>Otomasi Clip Shorts Kajian & Dakwah</h1>
        <p className="lede">
          Potong otomatis video YouTube berdurasi panjang menjadi klip vertikal 9:16 menarik lengkap dengan transkripsi AI dan upload otomatis.
        </p>
      </section>

      {/* ADMIN & WORKER CREDENTIALS */}
      <section className="card">
        <div className="card-title-row">
          <div className="card-icon">🔐</div>
          <div>
            <h2>Kredensial Otorisasi</h2>
            <p className="muted">Token admin & worker secret untuk sinkronisasi database & memicu pemrosesan</p>
          </div>
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <label className="config-label">
            Admin Token
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              onBlur={persistTokens}
              placeholder="ADMIN_API_TOKEN"
            />
          </label>
          <label className="config-label">
            Worker Secret
            <input
              type="password"
              value={workerSecret}
              onChange={(e) => setWorkerSecret(e.target.value)}
              onBlur={persistTokens}
              placeholder="WORKER_SECRET"
            />
          </label>
        </div>
      </section>

      {/* STATUS MESSAGE */}
      {message && (
        <div className="message-banner">
          <span>🔔</span>
          <div>{message}</div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <section className="actions-section">
        <form onSubmit={handleScan}>
          <h3>📌 Scan YouTube URL</h3>
          <p>
            Tempel URL video panjang (kajian/edukasi/dakwah). AI akan membaca metadata dan subtitle untuk diproses.
          </p>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Scanning..." : "🔍 Scan URL"}
          </button>
        </form>

        <div className="action-card">
          <h3>🌐 Auto-Discover Trending</h3>
          <p>
            Cari video trending dakwah/edukasi di Indonesia secara otomatis. 2 video teratas akan langsung di-scan.
          </p>
          <button onClick={handleDiscover} className="btn-gold" disabled={autoDiscoverBusy}>
            {autoDiscoverBusy ? "Discovering..." : "✨ Discover & Scan"}
          </button>
          <button onClick={handleTrigger} className="btn-outline-teal" disabled={busy} style={{ marginTop: 'auto' }}>
            ⚙️ Trigger Clip Worker (1 step)
          </button>
        </div>
      </section>

      {/* SOURCES */}
      <section className="card" style={{ marginBottom: 32 }}>
        <div className="card-head">
          <div className="card-title-row">
            <div className="card-icon">📚</div>
            <h2>Kumpulan Video Sumber ({sources.length})</h2>
          </div>
          <button className="ghost" onClick={loadStatus}>Refresh</button>
        </div>

        {sources.length === 0 ? (
          <p className="muted">Belum ada video sumber. Mulai dengan men-scan URL atau auto-discover.</p>
        ) : (
          <div className="items">
            {sources.map((s) => (
              <article className="history-item" key={s.id}>
                <div className="history-thumb">
                  {s.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumbnail_url} alt={s.title || s.youtube_video_id} />
                  ) : (
                    "🎬"
                  )}
                </div>

                <div className="history-body">
                  <div className="history-title" title={s.title || s.youtube_video_id}>
                    {s.title || s.youtube_video_id}
                  </div>
                  <div className="history-meta">
                    <strong>{s.channel || "—"}</strong> · {fmtTime(s.duration_sec)} · {s.view_count?.toLocaleString() || 0} views
                  </div>
                  <div className="history-steps">
                    Status: <strong>{s.status}</strong> · Mode: {s.source_mode}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={() => handlePlan(s.id)}
                    disabled={busy}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '100px' }}
                  >
                    🎯 Auto Plan
                  </button>
                  <a
                    href={s.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ghost"
                    style={{ fontSize: '0.75rem', padding: '6px 12px', textAlign: 'center', borderRadius: '100px', display: 'block' }}
                  >
                    Buka Asli →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* JOBS */}
      <section className="card">
        <div className="card-head">
          <div className="card-title-row">
            <div className="card-icon">⚙️</div>
            <h2>Pekerjaan Pemotongan ({jobs.length})</h2>
          </div>
          <button className="ghost" onClick={loadStatus}>Refresh</button>
        </div>

        {jobs.length === 0 ? (
          <p className="muted">Belum ada clip job. Klik "Auto Plan" pada video sumber di atas.</p>
        ) : (
          <div className="items">
            {jobs.map((j) => {
              const completed = j.steps_completed || [];
              const isCompleted = j.status === "completed";
              const isFailed = j.status === "failed";

              return (
                <div
                  key={j.id}
                  className={`job-item ${isCompleted ? 'completed' : isFailed ? 'failed' : ''}`}
                >
                  <div className="job-header">
                    <div className="job-title">
                      {j.suggested_title || j.hook_text || `Job ID: ${j.id.slice(0, 8)}`}
                    </div>
                    <span className={`status-chip ${j.status}`}>
                      {j.status}
                    </span>
                  </div>

                  <div className="job-meta">
                    ⏱️ Waktu Highlight: <strong>{fmtTime(j.start_sec)}</strong> → <strong>{fmtTime(j.end_sec)}</strong> ({Math.round(j.end_sec - j.start_sec)}s)
                  </div>

                  <div className="job-steps-row">
                    {CLIP_STEPS.map((step) => {
                      const done = completed.includes(step.key);
                      const active = j.current_step === step.key;
                      return (
                        <span
                          key={step.key}
                          className={`job-step-badge ${done ? 'done' : active ? 'active' : ''}`}
                        >
                          {step.label}
                        </span>
                      );
                    })}
                  </div>

                  {j.youtube_url && (
                    <a
                      href={j.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-link"
                    >
                      ▶️ Buka Hasil Upload Shorts ({j.youtube_url})
                    </a>
                  )}

                  {j.error_message && (
                    <div className="job-error">
                      ❌ Error: {j.error_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <strong>sibermas-Clipper</strong> — Otomasi Shorts YouTube untuk <strong>Sibermas UIN SAIZU</strong>
        <div className="footer-links">
          <Link href="/generator">Generator Video</Link>
          <a href="/api/health">Health</a>
          <a href="https://uin-saizu.ac.id" target="_blank" rel="noreferrer">UIN SAIZU</a>
        </div>
        <p style={{ marginTop: 10, fontSize: ".78rem" }}>© 2026 sibermas-Clipper · Powered by Next.js + Snifox AI + local PG</p>
      </footer>

      {/* PWA INSTALL BANNER */}
      {showInstall && (
        <div className="install-banner">
          <div className="install-banner-text">
            <h4>📲 Install sibermas-YT</h4>
            <p>Buka lebih cepat seperti aplikasi</p>
          </div>
          <div className="install-actions">
            <button onClick={handleInstall} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Install</button>
            <button className="ghost" onClick={() => setShowInstall(false)}>Nanti</button>
          </div>
        </div>
      )}
    </main>
  );
}
