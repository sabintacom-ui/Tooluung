"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Scissors,
  Youtube,
  Search,
  Globe,
  Settings,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  PlusCircle,
  X,
  Sliders,
  FileText
} from "lucide-react";

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

  // Planner Modal state
  const [selectedSourceForPlan, setSelectedSourceForPlan] = useState<ClipperSource | null>(null);
  const [planMode, setPlanMode] = useState<"auto" | "manual">("auto");
  const [numClips, setNumClips] = useState(3);
  const [minDuration, setMinDuration] = useState(15);
  const [maxDuration, setMaxDuration] = useState(60);
  const [startSec, setStartSec] = useState("");
  const [endSec, setEndSec] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [hookText, setHookText] = useState("");

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

  // Triggered from our custom Highlight Planner Modal
  async function executePlan() {
    if (!adminToken || !selectedSourceForPlan) return;
    setBusy(true);
    setMessage(planMode === "auto" ? "🧠 Snifox AI sedang mendeteksi highlight terbaik..." : "🎬 Menambahkan pekerjaan pemotongan manual...");
    const sourceId = selectedSourceForPlan.id;

    // Helper to parse time format e.g. "1:30" or "90"
    const parseTime = (val: string) => {
      if (val.includes(":")) {
        const parts = val.split(":").map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return Number(val);
    };

    try {
      const payload = planMode === "auto"
        ? { sourceId, mode: "auto", numClips, minDuration, maxDuration }
        : {
            sourceId,
            mode: "manual",
            startSec: parseTime(startSec),
            endSec: parseTime(endSec),
            suggestedTitle: suggestedTitle || undefined,
            hookText: hookText || undefined
          };

      const res = await fetch("/api/clipper/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Plan gagal");
      setMessage(planMode === "auto"
        ? `✅ ${data.jobs?.length || 0} clip job dibuat secara otomatis`
        : `✅ Pekerjaan pemotongan manual berhasil dibuat`
      );
      setSelectedSourceForPlan(null); // Close modal
      // Reset form fields
      setStartSec("");
      setEndSec("");
      setSuggestedTitle("");
      setHookText("");
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
    setMessage("🌐 Auto-discover trending Indonesia...");
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
          <div className="brand-logo" style={{ overflow: "hidden", background: "none" }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
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
      <section className="hero split">
        <div className="hero-left-col">
          <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div className="eyebrow">clipper shorts ai</div>
          <h1>Otomasi Clip Shorts Kajian & Dakwah</h1>
          <p className="lede">
            Potong otomatis video YouTube berdurasi panjang menjadi klip vertikal 9:16 menarik lengkap dengan transkripsi AI dan upload otomatis.
          </p>
        </div>

        <div className="hero-right-col">
          <div className="hero-image-card">
            <div className="hero-image-glow" />
            <img src="/calligraphy-glass.png" alt="Stained Calligraphy AI render" className="hero-showcase-img" />
            <div className="hero-image-overlay">
              <span className="overlay-badge">⚡ Clipper Studio</span>
              <p className="overlay-desc">Auto-Segmenting Whisper Transcription Pipeline</p>
            </div>
          </div>
        </div>
      </section>

      {/* ADMIN & WORKER CREDENTIALS */}
      <section className="card">
        <div className="card-title-row">
          <div className="card-icon">
            <Lock size={18} />
          </div>
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
          <h3>
            <Youtube size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle", color: "#ef4444" }} />
            Scan YouTube URL
          </h3>
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
            {busy ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />} Scan URL
          </button>
        </form>

        <div className="action-card">
          <h3>
            <Sparkles size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle", color: "var(--gold)" }} />
            Auto-Discover Trending
          </h3>
          <p>
            Cari video trending dakwah/edukasi di Indonesia secara otomatis. 2 video teratas akan langsung di-scan.
          </p>
          <button onClick={handleDiscover} className="btn-gold" disabled={autoDiscoverBusy}>
            {autoDiscoverBusy ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />} Discover & Scan
          </button>
          <button onClick={handleTrigger} className="btn-outline-teal" disabled={busy} style={{ marginTop: 'auto' }}>
            <Settings size={14} /> Trigger Clip Worker (1 step)
          </button>
        </div>
      </section>

      {/* SOURCES */}
      <section className="card" style={{ marginBottom: 32 }}>
        <div className="card-head">
          <div className="card-title-row">
            <div className="card-icon">
              <FileVideo size={18} />
            </div>
            <h2>Kumpulan Video Sumber ({sources.length})</h2>
          </div>
          <button className="ghost" onClick={loadStatus}>
            <RefreshCw size={14} /> Refresh
          </button>
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
                    <FileVideo size={24} />
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
                    onClick={() => {
                      setSelectedSourceForPlan(s);
                      setPlanMode("auto");
                    }}
                    disabled={busy}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '100px' }}
                  >
                    <PlusCircle size={14} /> Plan Clips
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
            <div className="card-icon">
              <Scissors size={18} />
            </div>
            <h2>Pekerjaan Pemotongan ({jobs.length})</h2>
          </div>
          <button className="ghost" onClick={loadStatus}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="muted">Belum ada clip job. Klik "Plan Clips" pada video sumber di atas.</p>
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
                      {isCompleted ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> : isFailed ? <AlertCircle size={12} style={{ marginRight: 4 }} /> : null}
                      {j.status}
                    </span>
                  </div>

                  <div className="job-meta">
                    <Clock size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    Waktu Highlight: <strong>{fmtTime(j.start_sec)}</strong> → <strong>{fmtTime(j.end_sec)}</strong> ({Math.round(j.end_sec - j.start_sec)}s)
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
                      <Play size={12} /> Buka Hasil Upload Shorts ({j.youtube_url})
                    </a>
                  )}

                  {j.error_message && (
                    <div className="job-error">
                      <AlertCircle size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                      Error: {j.error_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HIGHLIGHT PLANNER MODAL */}
      {selectedSourceForPlan && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Highlight Planner AI</h3>
              <button 
                onClick={() => setSelectedSourceForPlan(null)} 
                className="ghost" 
                style={{ padding: 6, borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: '1px solid var(--line)' }}>
                <strong>Target Video:</strong><br />
                <span style={{ color: 'var(--text-bright)' }}>{selectedSourceForPlan.title || selectedSourceForPlan.youtube_video_id}</span>
              </div>

              <div className="tab-buttons">
                <button 
                  className={`tab-btn ${planMode === 'auto' ? 'active' : ''}`} 
                  onClick={() => setPlanMode('auto')}
                >
                  <Sparkles size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Auto Plan (AI)
                </button>
                <button 
                  className={`tab-btn ${planMode === 'manual' ? 'active' : ''}`} 
                  onClick={() => setPlanMode('manual')}
                >
                  <Sliders size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Manual Crop
                </button>
              </div>

              {planMode === 'auto' ? (
                <>
                  <label className="config-label">
                    Jumlah Klip AI (1-5)
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={numClips} 
                      onChange={(e) => setNumClips(Number(e.target.value))} 
                    />
                  </label>
                  <div className="row">
                    <label className="config-label">
                      Min Durasi (detik)
                      <input 
                        type="number" 
                        value={minDuration} 
                        onChange={(e) => setMinDuration(Number(e.target.value))} 
                      />
                    </label>
                    <label className="config-label">
                      Max Durasi (detik)
                      <input 
                        type="number" 
                        value={maxDuration} 
                        onChange={(e) => setMaxDuration(Number(e.target.value))} 
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="row">
                    <label className="config-label">
                      Mulai (e.g. 1:30 atau 90)
                      <input 
                        type="text" 
                        placeholder="0:00" 
                        value={startSec} 
                        onChange={(e) => setStartSec(e.target.value)} 
                      />
                    </label>
                    <label className="config-label">
                      Selesai (e.g. 2:15 atau 135)
                      <input 
                        type="text" 
                        placeholder="1:00" 
                        value={endSec} 
                        onChange={(e) => setEndSec(e.target.value)} 
                      />
                    </label>
                  </div>
                  <label className="config-label">
                    Judul Klip (Suggested Title)
                    <input 
                      type="text" 
                      placeholder="Judul menarik kajian..." 
                      value={suggestedTitle} 
                      onChange={(e) => setSuggestedTitle(e.target.value)} 
                    />
                  </label>
                  <label className="config-label">
                    Caption Hook Text
                    <textarea 
                      placeholder="Deskripsi singkat atau teks hook vertikal..." 
                      value={hookText} 
                      onChange={(e) => setHookText(e.target.value)} 
                    />
                  </label>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedSourceForPlan(null)} className="btn-secondary">
                Batal
              </button>
              <button onClick={executePlan} className="btn-primary" disabled={busy}>
                {busy ? <RefreshCw className="animate-spin" size={14} /> : <PlusCircle size={14} />} Buat Highlight
              </button>
            </div>
          </div>
        </div>
      )}

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
