"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

  useEffect(() => {
    const saved = localStorage.getItem("clipper_admin_token");
    if (saved) setAdminToken(saved);
    const ws = localStorage.getItem("clipper_worker_secret");
    if (ws) setWorkerSecret(ws);
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

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px", fontFamily: "system-ui" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>🎬 Sibermas Clipper</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              YouTube long-form → 9:16 Shorts otomatis dengan Snifox AI
            </p>
          </div>
          <a href="/" style={{ color: "#0D9488", textDecoration: "none", fontSize: 14 }}>
            ← Dashboard utama
          </a>
        </div>
      </header>

      <section
        style={{
          background: "#0F172A",
          color: "white",
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Admin Token
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            onBlur={persistTokens}
            placeholder="ADMIN_API_TOKEN"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "white" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
          Worker Secret
          <input
            type="password"
            value={workerSecret}
            onChange={(e) => setWorkerSecret(e.target.value)}
            onBlur={persistTokens}
            placeholder="WORKER_SECRET"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "white" }}
          />
        </label>
      </section>

      {message && (
        <div style={{ padding: 12, marginBottom: 16, background: "#f1f5f9", borderRadius: 8, fontSize: 14 }}>
          {message}
        </div>
      )}

      <section style={{ marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <form
          onSubmit={handleScan}
          style={{
            padding: 20,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>📌 Scan YouTube URL</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Tempel URL video panjang (ceramah/kajian/edukasi). Bot ambil metadata + subtitle.
          </p>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }}
            required
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "10px 16px",
              background: busy ? "#94a3b8" : "#0D9488",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {busy ? "Scanning..." : "Scan URL"}
          </button>
        </form>

        <div
          style={{
            padding: 20,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>🌐 Auto-Discover Trending</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Cari video trending Indonesia + filter dakwah/edukasi. Top 2 di-scan otomatis.
          </p>
          <button
            onClick={handleDiscover}
            disabled={autoDiscoverBusy}
            style={{
              padding: "10px 16px",
              background: autoDiscoverBusy ? "#94a3b8" : "#FBBF24",
              color: "#0F172A",
              border: "none",
              borderRadius: 6,
              cursor: autoDiscoverBusy ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {autoDiscoverBusy ? "Discovering..." : "Discover & Scan"}
          </button>
          <button
            onClick={handleTrigger}
            disabled={busy}
            style={{
              padding: "8px 12px",
              background: "transparent",
              color: "#0D9488",
              border: "1px solid #0D9488",
              borderRadius: 6,
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            ⚙️ Trigger Clip Worker (1 step)
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>📚 Sources ({sources.length})</h2>
        {sources.length === 0 ? (
          <p style={{ color: "#64748b" }}>Belum ada source. Scan URL atau auto-discover.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {sources.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: 16,
                  padding: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                {s.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.thumbnail_url} alt={s.title || s.youtube_video_id} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 120, height: 68, background: "#e2e8f0", borderRadius: 4 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title || s.youtube_video_id}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {s.channel || "—"} · {fmtTime(s.duration_sec)} · {s.view_count?.toLocaleString() || 0} views
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Status: <strong>{s.status}</strong> · Mode: {s.source_mode}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button
                    onClick={() => handlePlan(s.id)}
                    disabled={busy}
                    style={{
                      padding: "6px 12px",
                      background: "#0D9488",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    🎯 Auto Plan
                  </button>
                  <a
                    href={s.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#64748b", textDecoration: "none", textAlign: "center" }}
                  >
                    Lihat asli →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>⚙️ Clip Jobs ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p style={{ color: "#64748b" }}>Belum ada clip job. Klik "Auto Plan" pada source.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {jobs.map((j) => {
              const completed = j.steps_completed || [];
              const isCompleted = j.status === "completed";
              const isFailed = j.status === "failed";
              return (
                <div
                  key={j.id}
                  style={{
                    padding: 12,
                    border: `1px solid ${isFailed ? "#fca5a5" : isCompleted ? "#86efac" : "#e2e8f0"}`,
                    borderRadius: 8,
                    background: isCompleted ? "#f0fdf4" : isFailed ? "#fef2f2" : "white",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {j.suggested_title || j.hook_text || j.id.slice(0, 8)}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        background: isCompleted ? "#10b981" : isFailed ? "#ef4444" : "#0D9488",
                        color: "white",
                        borderRadius: 4,
                      }}
                    >
                      {j.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {fmtTime(j.start_sec)} → {fmtTime(j.end_sec)} ({Math.round((j.end_sec - j.start_sec))}s)
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CLIP_STEPS.map((step) => {
                      const done = completed.includes(step.key);
                      const active = j.current_step === step.key;
                      return (
                        <span
                          key={step.key}
                          style={{
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: done ? "#10b981" : active ? "#fbbf24" : "#e2e8f0",
                            color: done || active ? "white" : "#64748b",
                          }}
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
                      style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#0D9488" }}
                    >
                      ▶️ {j.youtube_url}
                    </a>
                  )}
                  {j.error_message && (
                    <div style={{ marginTop: 8, padding: 8, background: "#fee2e2", borderRadius: 4, fontSize: 12, color: "#991b1b" }}>
                      ❌ {j.error_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
