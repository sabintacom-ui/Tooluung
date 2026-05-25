import "server-only";
import { uploadYouTubeVideo } from "../youtube";
import { sshExec } from "../remote/ssh";
import {
  ClipperJob,
  ClipperSource,
  claimNextClipJob,
  getJob,
  getSource,
  updateClipJob,
} from "./db";
import {
  downloadSegment,
  downloadSubtitle,
  getVideoInfo,
} from "./ytdlp";
import { parseSrt, pickHighlightsLLM, pickHighlightsHeatmap } from "./highlights";
import { readSrt, transcribeToSrt } from "./whisper";
import { renderVerticalShort } from "./render";
import { insertClipJob, upsertSource } from "./db";

const CLIPPER_PRIVACY = (process.env.CLIPPER_PRIVACY_STATUS as "private" | "unlisted" | "public") || "private";

export const CLIP_STEPS = [
  "download_segment",
  "transcribe",
  "render_vertical",
  "upload_youtube",
] as const;
export type ClipStep = (typeof CLIP_STEPS)[number];

/**
 * Scan a YouTube URL: yt-dlp metadata + (try) subtitle download.
 * Persist to clipper_sources and return.
 */
export async function scanYoutubeUrl(url: string, mode: "manual" | "trending" | "auto" = "manual"): Promise<ClipperSource> {
  const info = await getVideoInfo(url);
  let transcriptSrt: string | null = null;
  try {
    const sub = await downloadSubtitle({ videoId: info.id, url: info.webpage_url || url });
    if (sub?.remotePath) {
      transcriptSrt = await readSrt(sub.remotePath);
    }
  } catch {
    // ignore — caller can transcribe later
  }
  const source = await upsertSource({
    youtube_url: info.webpage_url || url,
    youtube_video_id: info.id,
    title: info.title,
    channel: info.channel,
    channel_url: info.channel_url,
    duration_sec: Math.floor(info.duration || 0),
    view_count: info.view_count || 0,
    thumbnail_url: info.thumbnail,
    description: info.description?.slice(0, 4000),
    heatmap: info.heatmap || null,
    transcript: transcriptSrt ? { srt: transcriptSrt, parsed: parseSrt(transcriptSrt) } : null,
    status: "scanned",
    source_mode: mode,
    metadata: {
      chapters: info.chapters || [],
      has_native_caption: Boolean(transcriptSrt),
    },
  });
  return source;
}

/**
 * Auto-plan clips for a source: pick highlights via Snifox (if transcript exists)
 * or heatmap fallback. Insert clipper_jobs rows but do not start processing.
 */
export async function planClipsForSource(sourceId: string, opts?: {
  numClips?: number;
  minDuration?: number;
  maxDuration?: number;
}): Promise<ClipperJob[]> {
  const source = await getSource(sourceId);
  if (!source) throw new Error("Source not found");

  const numClips = opts?.numClips ?? 3;
  const minDuration = opts?.minDuration ?? 30;
  const maxDuration = opts?.maxDuration ?? 60;
  const durationSec = Number(source.duration_sec) || 0;
  if (durationSec < 60) throw new Error("Source too short to clip");

  const transcript = source.transcript as { parsed?: Array<{ start: number; end: number; text: string }> } | null;
  const heatmap = source.heatmap as Array<{ start_time: number; end_time: number; value: number }> | null;

  let highlights = transcript?.parsed?.length
    ? await pickHighlightsLLM({
        title: source.title || "",
        channel: source.channel || "",
        durationSec,
        transcript: transcript.parsed,
        heatmap: heatmap || undefined,
        numClips,
        minDuration,
        maxDuration,
      })
    : null;

  if (!highlights || highlights.length === 0) {
    if (heatmap && heatmap.length > 0) {
      highlights = pickHighlightsHeatmap({
        heatmap,
        numClips,
        minDuration,
        maxDuration,
        durationSec,
      });
    }
  }

  if (!highlights || highlights.length === 0) {
    throw new Error("No highlights could be derived (transcript empty + no heatmap)");
  }

  const jobs: ClipperJob[] = [];
  for (const h of highlights) {
    const job = await insertClipJob({
      source_id: source.id,
      start_sec: h.startSec,
      end_sec: h.endSec,
      hook_text: h.hookText,
      suggested_title: h.suggestedTitle,
      status: "pending",
      metadata: { reason: h.reason, score: h.score },
    });
    jobs.push(job);
  }
  return jobs;
}

/** Process one pending clip job step-by-step. Idempotent claim+release. */
export async function runOneClipStep(): Promise<{ processed: boolean; job?: ClipperJob; error?: string; message?: string }> {
  const workerId = process.env.VERCEL_REGION ? `vercel-${process.env.VERCEL_REGION}` : "clipper-local";
  const job = await claimNextClipJob(workerId);
  if (!job) return { processed: false, message: "No pending clip jobs" };

  const source = await getSource(job.source_id);
  if (!source) {
    await updateClipJob(job.id, {
      status: "failed",
      error_message: "Source missing",
      locked_at: null,
      locked_by: null,
    });
    return { processed: true, job, error: "Source missing" };
  }

  const completed = job.steps_completed || [];
  const nextStep =
    (CLIP_STEPS.find((s) => !completed.includes(s)) as ClipStep | undefined) || null;
  if (!nextStep) {
    const finished = await updateClipJob(job.id, {
      status: "completed",
      current_step: undefined,
      locked_at: null,
      locked_by: null,
      completed_at: new Date().toISOString(),
    });
    return { processed: true, job: finished || job };
  }

  try {
    await updateClipJob(job.id, { current_step: nextStep });
    await performClipStep(job, source, nextStep);
    const newCompleted = completed.includes(nextStep) ? completed : [...completed, nextStep];
    const next = CLIP_STEPS.find((s) => !newCompleted.includes(s));
    const finished = !next;
    const updated = await updateClipJob(job.id, {
      status: finished ? "completed" : "running",
      current_step: finished ? undefined : (next as string | undefined),
      steps_completed: newCompleted,
      error_message: undefined,
      locked_at: null,
      locked_by: null,
      completed_at: finished ? new Date().toISOString() : null,
    });
    return { processed: true, job: updated || job };
  } catch (error) {
    const message = error instanceof Error ? error.message : "step failed";
    const retry = (job.retry_count ?? 0) + 1;
    const failed = retry > (job.max_retries ?? 3);
    const updated = await updateClipJob(job.id, {
      status: failed ? "failed" : "pending",
      retry_count: retry,
      error_message: message,
      locked_at: null,
      locked_by: null,
    });
    return { processed: true, job: updated || job, error: message };
  }
}

async function performClipStep(job: ClipperJob, source: ClipperSource, step: ClipStep) {
  if (step === "download_segment") return stepDownloadSegment(job, source);
  if (step === "transcribe") return stepTranscribe(job, source);
  if (step === "render_vertical") return stepRenderVertical(job, source);
  if (step === "upload_youtube") return stepUploadYouTube(job, source);
}

async function stepDownloadSegment(job: ClipperJob, source: ClipperSource) {
  const { remotePath } = await downloadSegment({
    videoId: source.youtube_video_id,
    url: source.youtube_url,
    startSec: job.start_sec,
    endSec: job.end_sec,
  });
  await updateClipJob(job.id, {
    metadata: { ...(job.metadata || {}), raw_clip_path: remotePath },
  });
}

async function stepTranscribe(job: ClipperJob, source: ClipperSource) {
  const meta = (job.metadata || {}) as { raw_clip_path?: string };
  if (!meta.raw_clip_path) throw new Error("raw_clip_path missing — download step incomplete");
  const baseName = `${source.youtube_video_id}_${Math.floor(job.start_sec)}_${Math.floor(job.end_sec)}`;
  const { remoteSrtPath } = await transcribeToSrt({
    remoteInputPath: meta.raw_clip_path,
    outBaseName: baseName,
  });
  const srt = await readSrt(remoteSrtPath);
  await updateClipJob(job.id, {
    caption_srt: srt.slice(0, 60_000),
    metadata: { ...(job.metadata || {}), srt_path: remoteSrtPath },
  });
}

async function stepRenderVertical(job: ClipperJob, source: ClipperSource) {
  const meta = (job.metadata || {}) as { raw_clip_path?: string; srt_path?: string };
  if (!meta.raw_clip_path) throw new Error("raw_clip_path missing");
  const outFileName = `${source.youtube_video_id}_${job.id.slice(0, 8)}.mp4`;
  const { remotePath, publicUrl } = await renderVerticalShort({
    rawClipPath: meta.raw_clip_path,
    srtPath: meta.srt_path,
    outFileName,
    hookText: job.hook_text || undefined,
    sourceChannel: source.channel,
  });
  await updateClipJob(job.id, {
    output_path: remotePath,
    output_url: publicUrl,
  });
}

async function stepUploadYouTube(job: ClipperJob, source: ClipperSource) {
  const url = job.output_url;
  if (!url) throw new Error("output_url missing — render step incomplete");
  const title = (job.suggested_title || source.title || "Sibermas Short").slice(0, 100);
  const description = buildClipDescription(job, source);
  const tags = ["shorts", "sibermas", "uin saizu", "dakwah", "edukasi"];
  const result = await uploadYouTubeVideo({
    videoUrl: url,
    title,
    description,
    tags,
    privacyStatus: CLIPPER_PRIVACY,
    categoryId: "27",
    defaultLanguage: "id",
  });
  await updateClipJob(job.id, {
    youtube_video_id: result.id,
    youtube_url: `https://www.youtube.com/watch?v=${result.id}`,
    privacy_status: CLIPPER_PRIVACY,
  });
}

function buildClipDescription(job: ClipperJob, source: ClipperSource): string {
  const lines: string[] = [];
  if (job.hook_text) lines.push(job.hook_text);
  lines.push("");
  lines.push(`📺 Source: ${source.channel || "Unknown"}`);
  lines.push(`🔗 Original: ${source.youtube_url}`);
  lines.push("");
  lines.push("Channel ini adalah re-clip otomatis untuk tujuan edukasi dakwah.");
  lines.push("Subscribe channel original di atas untuk konten lengkap.");
  lines.push("");
  lines.push("#shorts #sibermas #uinsaizu #dakwah #kajian");
  return lines.join("\n").slice(0, 5000);
}
