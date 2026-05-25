"use client";

import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";

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

export default function Home() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [pipelineJob, setPipelineJob] = useState<PipelineJob | null>(null);
  const [pipelineVideos, setPipelineVideos] = useState<YouTubeVideo[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [pipelineMessage, setPipelineMessage] = useState("");
  const [isPending, startTransition] = useTransition();

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
    const payload = { ...formPayload, keywords: String(formPayload.keywords ?? "").split(",").map((keyword) => keyword.trim()).filter(Boolean) };

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
        setPipelineMessage(`Video sibermas-YT masuk antrian: ${data.jobId}`);
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

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">sibermas-YT</p>
        <h1>sibermas-YT: otomasi konten YouTube untuk Sibermas UIN SAIZU.</h1>
        <p className="lede">Dashboard produksi, antrean, pipeline AI, dan publikasi YouTube dalam satu sistem sibermas-YT.</p>
      </section>

      <section className="card auth">
        <label>Admin Token<input type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Token dashboard" /></label>
      </section>

      <section className="stats">
        <article className="stat"><span>Total Job</span><strong>{recentJobs.length}</strong></article>
        <article className="stat"><span>Selesai</span><strong>{recentJobs.filter((job) => job.status === "completed").length}</strong></article>
        <article className="stat"><span>Running</span><strong>{recentJobs.filter((job) => job.status === "running" || job.status === "pending").length}</strong></article>
        <article className="stat"><span>Upload</span><strong>{recentJobs.reduce((sum, job) => sum + (job.youtube_videos?.length ?? 0), 0)}</strong></article>
      </section>

      <section className="grid">
        <form className="card form" onSubmit={submit}>
          <h2>Tambah Video</h2>
          <label>Google Drive File ID<input name="driveFileId" required placeholder="1AbC..." /></label>
          <label>Judul<input name="title" required maxLength={100} placeholder="Judul video" /></label>
          <label>Deskripsi<textarea name="description" rows={5} placeholder="Deskripsi YouTube" /></label>
          <label>Tags<input name="tags" placeholder="shorts, tutorial, ai" /></label>
          <div className="row">
            <label>Kategori<input name="category" defaultValue="22" /></label>
            <label>Visibilitas<select name="privacy"><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label>
          </div>
          <label>Jadwal<input name="schedule" type="datetime-local" required /></label>
          <button disabled={isPending}>{isPending ? "Menyimpan..." : "Masukkan Queue"}</button>
          {message && <p className="notice">{message}</p>}
        </form>

        <section className="card queue">
          <div className="queueHead"><h2>Queue</h2><button className="ghost" onClick={() => loadQueue().catch((error) => setMessage(error.message))}>Refresh</button></div>
          <div className="items">
            {items.length === 0 && <p className="muted">Belum ada data.</p>}
            {items.map((item) => (
              <article className="item" key={item.id}>
                <div><strong>{item.title}</strong><span>{item.schedule}</span></div>
                <b className={item.status.toLowerCase()}>{item.status}</b>
                {item.youtubeUrl && <a href={item.youtubeUrl} target="_blank" rel="noreferrer">YouTube</a>}
                {item.error && <small>{item.error}</small>}
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="card pipeline">
        <h2>Generate Video sibermas-YT</h2>
        <form className="pipelineForm" onSubmit={startPipeline}>
          <input type="hidden" name="channelId" value={DEFAULT_CHANNEL_ID} />
          <input type="hidden" name="templateId" value={DEFAULT_TEMPLATE_ID} />
          <label>Topik Video<input name="topic" required maxLength={500} placeholder="Contoh: Profil singkat Sibermas UIN SAIZU" /></label>
          <label>Target Audiens<input name="targetAudience" defaultValue="mahasiswa dan masyarakat umum" placeholder="mahasiswa, dosen, masyarakat" /></label>
          <label>Keyword<input name="keywords" defaultValue="sibermas, uin saizu, edukasi" placeholder="sibermas, uin saizu, edukasi" /></label>
          <label>Catatan / Brief<textarea name="notes" rows={4} placeholder="Arahan gaya video, poin penting, CTA, durasi, dll." /></label>
          <label>Jadwal<input name="scheduledAt" type="datetime-local" /></label>
          <button disabled={isPending}>{isPending ? "Membuat video..." : "Generate Video"}</button>
        </form>

        <div className="pipelineStatus">
          <div className="queueHead"><h3>Status</h3><button className="ghost" onClick={() => refreshPipeline().catch((error) => setPipelineMessage(error.message))}>Refresh</button></div>
          <div className="row"><input placeholder="Job ID" onBlur={(event) => event.currentTarget.value && refreshPipeline(event.currentTarget.value).catch((error) => setPipelineMessage(error.message))} /><span className="muted">Worker berjalan via cron / x-worker-secret</span></div>
          {pipelineJob ? <article className="item"><strong>{pipelineJob.id}</strong><span>{pipelineJob.status}</span><small>Current: {pipelineJob.current_step ?? "done"}</small><small>Done: {(pipelineJob.steps_completed ?? []).join(", ") || "-"}</small></article> : <p className="muted">Belum ada video dibuat.</p>}
          {pipelineVideos.length > 0 && <div className="items">{pipelineVideos.map((video) => <article className="item" key={video.id}><strong>Video YouTube</strong><span>{video.privacy_status ?? "private"}</span><a href={video.youtube_url} target="_blank" rel="noreferrer">Buka Video</a></article>)}</div>}
          {pipelineMessage && <p className="notice">{pipelineMessage}</p>}
        </div>
      </section>

      <section className="card history">
        <div className="queueHead"><h2>Riwayat Video</h2><button className="ghost" onClick={() => loadRecentJobs().catch((error) => setPipelineMessage(error.message))}>Refresh</button></div>
        <div className="items">
          {recentJobs.length === 0 && <p className="muted">Belum ada riwayat.</p>}
          {recentJobs.map((job) => (
            <article className="item historyItem" key={job.id}>
              <div><strong>{job.contents?.selected_title || job.contents?.topic || job.id}</strong><span>{job.status} · {job.current_step ?? "done"}</span></div>
              <small>{(job.steps_completed ?? []).join(" → ") || "menunggu worker"}</small>
              {job.youtube_videos?.[0]?.youtube_url && <a href={job.youtube_videos[0].youtube_url} target="_blank" rel="noreferrer">Buka YouTube</a>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

