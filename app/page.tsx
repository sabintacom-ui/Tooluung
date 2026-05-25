"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";

type QueueItem = {
  id: string;
  driveFileId: string;
  title: string;
  schedule: string;
  status: "Pending" | "Uploading" | "Success" | "Failed";
  youtubeUrl?: string;
  error?: string;
};

type PipelineJob = {
  id: string;
  status: string;
  current_step?: string | null;
  steps_completed?: string[] | null;
};

type YouTubeVideo = {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  privacy_status?: string;
};

type RecentJob = PipelineJob & {
  contents?: { topic?: string; selected_title?: string; status?: string } | null;
  youtube_videos?: YouTubeVideo[];
};

const DEFAULT_CHANNEL_ID = "c419026c-6c5a-4999-98c4-bd64131d5d72";
const DEFAULT_TEMPLATE_ID = "5f93c244-4a7a-40df-bfd3-011a311bf286";

const PIPELINE_STEPS = [
  { key: "generate_script", label: "Script", icon: "1" },
  { key: "generate_voice", label: "Suara", icon: "2" },
  { key: "generate_music", label: "Musik", icon: "3" },
  { key: "generate_thumbnail", label: "Thumb", icon: "4" },
  { key: "fetch_footage", label: "Footage", icon: "5" },
  { key: "render_video", label: "Render", icon: "6" },
  { key: "upload_youtube", label: "Upload", icon: "7" },
];

const QUICK_ACTIONS = [
  { icon: "🎬", title: "Generate Video", desc: "Pipeline AI 7-langkah", href: "#pipeline", featured: true, isNew: true },
  { icon: "📋", title: "Antrean", desc: "Drive → YouTube", href: "#queue" },
  { icon: "📚", title: "Riwayat", desc: "Semua produksi", href: "#history" },
  { icon: "✅", title: "Health Check", desc: "Status sistem", href: "/api/health" },
  { icon: "▶️", title: "YouTube OAuth", desc: "Refresh token", href: "/api/youtube/status" },
  { icon: "📡", title: "Manual Trigger", desc: "x-worker-secret", href: "#pipeline" },
];

function getYouTubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export default function Home() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [pipelineJob, setPipelineJob] = useState<PipelineJob | null>(null);
  const [pipelineVideos, setPipelineVideos] = useState<YouTubeVideo[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [pipelineMessage, setPipelineMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showInstall, setShowInstall] = useState(false);

  async function loadQueue() {
    if (!adminToken) {
      setMessage("Masukkan admin token");
      return;
    }
    const response = await fetch("/api/queue", { cache: "no-store", headers: { "x-admin-token": adminToken } });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error ?? "Gagal memuat queue");
    setItems(data.items ?? []);
  }

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem("sibermas-yt-admin-token") ?? "";
    setAdminToken(savedToken);

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

  const loadRecentJobs = useCallback(async () => {
    if (!adminToken) return;
    const response = await fetch("/api/pipeline/recent", { cache: "no-store", headers: { "x-admin-token": adminToken } });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error ?? "Gagal memuat riwayat");
    setRecentJobs(data.jobs ?? []);
  }, [adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    window.sessionStorage.setItem("sibermas-yt-admin-token", adminToken);
    fetch("/api/queue", { cache: "no-store", headers: { "x-admin-token": adminToken } })
      .then((response) => response.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error ?? "Gagal memuat queue");
        setItems(data.items ?? []);
      })
      .catch((error) => setMessage(error.message));
    loadRecentJobs().catch((error) => setPipelineMessage(error.message));
  }, [adminToken, loadRecentJobs]);

  // Auto-refresh polling tiap 8 detik kalau ada job running
  useEffect(() => {
    if (!adminToken) return;
    const hasRunning = recentJobs.some((j) => j.status === "running" || j.status === "pending");
    if (!hasRunning) return;
    const t = setInterval(() => {
      loadRecentJobs().catch(() => {});
      if (pipelineJob?.id) refreshPipeline(pipelineJob.id).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, recentJobs, pipelineJob?.id]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    startTransition(async () => {
      try {
        const response = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.error ?? "Gagal menyimpan");
        setMessage(`Masuk queue: ${data.id}`);
        event.currentTarget.reset();
        await loadQueue();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal menyimpan");
      }
    });
  }

  function startPipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPipelineMessage("");
    const formPayload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { ...formPayload, keywords: String(formPayload.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean) };

    startTransition(async () => {
      try {
        const response = await fetch("/api/pipeline/start", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.error ?? "Gagal memulai pipeline");
        setPipelineJob({ id: data.jobId, status: data.status, current_step: data.currentStep, steps_completed: [] });
        setPipelineVideos([]);
        setPipelineMessage(`Job dibuat: ${data.jobId}`);
        await loadRecentJobs();
      } catch (error) {
        setPipelineMessage(error instanceof Error ? error.message : "Gagal memulai pipeline");
      }
    });
  }

  async function refreshPipeline(jobId?: string) {
    const id = jobId || pipelineJob?.id;
    if (!id) {
      setPipelineMessage("Job ID wajib diisi");
      return;
    }
    const response = await fetch(`/api/pipeline/status?id=${encodeURIComponent(id)}`, { headers: { "x-admin-token": adminToken } });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error ?? "Gagal memuat pipeline");
    setPipelineJob(data.job);
    setPipelineVideos(data.videos ?? []);
    await loadRecentJobs();
  }

  const stats = useMemo(() => ({
    total: recentJobs.length,
    done: recentJobs.filter((j) => j.status === "completed").length,
    running: recentJobs.filter((j) => j.status === "running" || j.status === "pending").length,
    uploads: recentJobs.reduce((sum, j) => sum + (j.youtube_videos?.length ?? 0), 0),
  }), [recentJobs]);

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
          <div className="brand-logo">SY</div>
          <div>
            <div>sibermas-YT</div>
            <small>Sibermas UIN SAIZU</small>
          </div>
        </div>
        <div className="nav-actions">
          <span className="badge-online">{stats.running > 0 ? `${stats.running} aktif` : "Online"}</span>
          <a className="btn-secondary" href="https://github.com" target="_blank" rel="noreferrer">Docs</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div className="eyebrow">otomasi konten youtube</div>
        <h1>Dashboard Kreator Sibermas UIN SAIZU</h1>
        <p className="lede">Generate skrip dengan AI, render video di server lokal, dan publish ke YouTube — semua dalam satu pipeline otomatis.</p>
        <div className="hero-cta">
          <a className="btn-primary" href="#pipeline">🚀 Mulai Generate</a>
          <a className="btn-secondary" href="#history">📚 Lihat Riwayat</a>
        </div>
      </section>

      {/* ADMIN TOKEN */}
      <section className="card">
        <div className="card-title-row">
          <div className="card-icon">🔐</div>
          <div>
            <h2>Admin Token</h2>
            <p className="muted">Dibutuhkan untuk akses dashboard data privat</p>
          </div>
        </div>
        <label>
          Token
          <input type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="ADMIN_API_TOKEN dari .env.production" />
        </label>
      </section>

      {/* STATS */}
      <section className="stats">
        <article className="stat s-total">
          <div className="stat-icon">📊</div>
          <span className="stat-label">Total Job</span>
          <strong className="stat-value">{stats.total}</strong>
        </article>
        <article className="stat s-done">
          <div className="stat-icon">✅</div>
          <span className="stat-label">Selesai</span>
          <strong className="stat-value">{stats.done}</strong>
        </article>
        <article className="stat s-run">
          <div className="stat-icon">⚡</div>
          <span className="stat-label">Berjalan</span>
          <strong className="stat-value">{stats.running}</strong>
        </article>
        <article className="stat s-up">
          <div className="stat-icon">▶️</div>
          <span className="stat-label">Diupload</span>
          <strong className="stat-value">{stats.uploads}</strong>
        </article>
      </section>

      {/* QUICK ACTIONS */}
      <section className="actions-grid">
        {QUICK_ACTIONS.map((act) => (
          <a key={act.title} href={act.href} className={`action-tile ${act.featured ? "featured" : ""}`}>
            <div className="action-icon">{act.icon}</div>
            <div className="action-title">
              {act.title} {act.isNew && <span className="new-pill">NEW</span>}
            </div>
            <div className="action-desc">{act.desc}</div>
          </a>
        ))}
      </section>

      {/* PIPELINE GENERATE */}
      <section id="pipeline" className="card">
        <div className="card-title-row">
          <div className="card-icon">🎬</div>
          <div>
            <h2>Generate Video</h2>
            <p className="muted">Pipeline 7-langkah: AI script → render → YouTube</p>
          </div>
        </div>

        <form className="pipelineForm" onSubmit={startPipeline}>
          <input type="hidden" name="channelId" value={DEFAULT_CHANNEL_ID} />
          <input type="hidden" name="templateId" value={DEFAULT_TEMPLATE_ID} />
          <label>
            Topik Video
            <input name="topic" required maxLength={500} placeholder="Contoh: Profil singkat Sibermas UIN SAIZU" />
          </label>
          <label>
            Target Audiens
            <input name="targetAudience" defaultValue="mahasiswa dan masyarakat umum" />
          </label>
          <label>
            Keyword (pisah koma)
            <input name="keywords" defaultValue="sibermas, uin saizu, edukasi" />
          </label>
          <label>
            Catatan / Brief
            <textarea name="notes" rows={4} placeholder="Arahan gaya, poin penting, CTA, durasi…" />
          </label>
          <label>
            Jadwal (opsional)
            <input name="scheduledAt" type="datetime-local" />
          </label>
          <button disabled={isPending}>{isPending ? "Memulai…" : "🚀 Generate Video"}</button>
        </form>

        {pipelineJob && (
          <div className="pipeline-progress">
            <div className="card-head">
              <h3>Progress: {pipelineJob.id.slice(0, 8)}…</h3>
              <span className={`status-chip ${pipelineJob.status}`}>{pipelineJob.status}</span>
            </div>
            <div className="progress-steps">
              {PIPELINE_STEPS.map((step) => {
                const completed = pipelineJob.steps_completed ?? [];
                const isDone = completed.includes(step.key);
                const isActive = pipelineJob.current_step === step.key;
                return (
                  <div key={step.key} className={`step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                    <div className="step-icon">{isDone ? "✓" : step.icon}</div>
                    <div className="step-label">{step.label}</div>
                  </div>
                );
              })}
            </div>
            {pipelineVideos.length > 0 && (
              <div className="items">
                {pipelineVideos.map((v) => (
                  <article className="item" key={v.id}>
                    <div className="item-row">
                      <strong>🎉 Video terupload</strong>
                      <span className="status-chip completed">{v.privacy_status ?? "private"}</span>
                    </div>
                    <a href={v.youtube_url} target="_blank" rel="noreferrer">▶️ Buka di YouTube</a>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card-head" style={{ marginTop: 16 }}>
          <h3>Cek Status Job</h3>
          <button className="ghost" type="button" onClick={() => refreshPipeline().catch((e) => setPipelineMessage(e.message))}>Refresh</button>
        </div>
        <label>
          Job ID
          <input placeholder="Paste job ID untuk lacak progress" onBlur={(e) => e.currentTarget.value && refreshPipeline(e.currentTarget.value).catch((err) => setPipelineMessage(err.message))} />
        </label>
        {pipelineMessage && <p className="notice">{pipelineMessage}</p>}
      </section>

      {/* LEGACY QUEUE */}
      <section id="queue" className="grid">
        <form className="card" onSubmit={submit}>
          <div className="card-title-row">
            <div className="card-icon">📋</div>
            <div>
              <h2>Tambah ke Queue</h2>
              <p className="muted">Upload langsung dari Google Drive (legacy)</p>
            </div>
          </div>
          <label>Google Drive File ID<input name="driveFileId" required placeholder="1AbC…" /></label>
          <label>Judul<input name="title" required maxLength={100} placeholder="Judul video" /></label>
          <label>Deskripsi<textarea name="description" rows={4} placeholder="Deskripsi YouTube" /></label>
          <label>Tags<input name="tags" placeholder="shorts, tutorial, ai" /></label>
          <div className="row">
            <label>Kategori<input name="category" defaultValue="22" /></label>
            <label>Visibilitas<select name="privacy"><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label>
          </div>
          <label>Jadwal<input name="schedule" type="datetime-local" required /></label>
          <button disabled={isPending}>{isPending ? "Menyimpan…" : "➕ Masukkan Queue"}</button>
          {message && <p className="notice">{message}</p>}
        </form>

        <section className="card">
          <div className="card-head">
            <div className="card-title-row">
              <div className="card-icon">🗂️</div>
              <h2>Queue Aktif</h2>
            </div>
            <button className="ghost" onClick={() => loadQueue().catch((e) => setMessage(e.message))}>Refresh</button>
          </div>
          <div className="items">
            {items.length === 0 && <p className="muted">Belum ada data di queue.</p>}
            {items.map((item) => (
              <article className="item" key={item.id}>
                <div className="item-row">
                  <strong>{item.title}</strong>
                  <span className={`status-chip ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <div className="item-meta">📅 {item.schedule}</div>
                {item.youtubeUrl && <a href={item.youtubeUrl} target="_blank" rel="noreferrer">▶️ YouTube</a>}
                {item.error && <small className="muted">{item.error}</small>}
              </article>
            ))}
          </div>
        </section>
      </section>

      {/* HISTORY */}
      <section id="history" className="card">
        <div className="card-head">
          <div className="card-title-row">
            <div className="card-icon">📚</div>
            <h2>Riwayat Produksi</h2>
          </div>
          <button className="ghost" onClick={() => loadRecentJobs().catch((e) => setPipelineMessage(e.message))}>Refresh</button>
        </div>
        <div className="items">
          {recentJobs.length === 0 && <p className="muted">Belum ada riwayat. Mulai generate video pertama!</p>}
          {recentJobs.map((job) => {
            const yt = job.youtube_videos?.[0];
            const thumb = yt?.youtube_video_id ? getYouTubeThumb(yt.youtube_video_id) : null;
            return (
              <article className="history-item" key={job.id}>
                <div className="history-thumb">{thumb ? <img src={thumb} alt="" /> : "🎬"}</div>
                <div className="history-body">
                  <div className="history-title">{job.contents?.selected_title || job.contents?.topic || job.id}</div>
                  <div className="history-meta">
                    <span className={`status-chip ${job.status}`}>{job.status}</span>
                    {job.current_step && <span style={{ marginLeft: 8 }}>· {job.current_step}</span>}
                  </div>
                  <div className="history-steps">{(job.steps_completed ?? []).length}/7 langkah selesai</div>
                </div>
                {yt?.youtube_url && <a href={yt.youtube_url} target="_blank" rel="noreferrer">▶️ Buka</a>}
              </article>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <strong>sibermas-YT</strong> — Otomasi konten YouTube untuk <strong>Sibermas UIN SAIZU</strong>
        <div className="footer-links">
          <a href="/api/health">Health</a>
          <a href="/api/youtube/status">YouTube</a>
          <a href="https://uin-saizu.ac.id" target="_blank" rel="noreferrer">UIN SAIZU</a>
        </div>
        <p style={{ marginTop: 10, fontSize: ".78rem" }}>© 2026 sibermas-YT · Powered by Next.js + Snifox AI + Supabase</p>
      </footer>

      {/* PWA INSTALL BANNER */}
      {showInstall && (
        <div className="install-banner">
          <div className="install-banner-text">
            <h4>📲 Install sibermas-YT</h4>
            <p>Buka lebih cepat seperti aplikasi</p>
          </div>
          <div className="install-actions">
            <button onClick={handleInstall}>Install</button>
            <button className="ghost" onClick={() => setShowInstall(false)}>Nanti</button>
          </div>
        </div>
      )}
    </main>
  );
}
