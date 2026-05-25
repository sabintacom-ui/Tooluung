import { claimNextPipelineJobFallback, insertRow, rpc, selectRows, updateRows } from "../db/supabase";
import { uploadYouTubeVideo } from "../youtube";
import { assertSafeFilename, shq, sshExec } from "../remote/ssh";
import { generateThumbnailCopy, generateVideoScript } from "../ai/snifox";
import type { PipelineStep } from "../db/schema";

export const PIPELINE_STEPS: PipelineStep[] = [
  "generate_script",
  "generate_voice",
  "generate_music",
  "generate_thumbnail",
  "fetch_footage",
  "render_video",
  "upload_youtube",
];

export type StartPipelineInput = {
  topic: string;
  channelId?: string;
  templateId?: string;
  targetAudience?: string;
  keywords?: string[];
  notes?: string;
  scheduledAt?: string;
};

export type PipelineJobRow = {
  id: string;
  content_id: string;
  status: string;
  current_step: PipelineStep | null;
  steps_completed: PipelineStep[] | null;
  retry_count: number | null;
  max_retries: number | null;
};

type ContentRow = Record<string, unknown> & {
  id: string;
  topic?: string;
  target_audience?: string;
  keywords?: string[];
  notes?: string;
  selected_title?: string;
  description?: string;
  tags?: string[];
};

export function validateStartPipelineInput(payload: unknown): StartPipelineInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload invalid");
  const raw = payload as Record<string, unknown>;
  const input: StartPipelineInput = {
    topic: String(raw.topic ?? "").trim(),
    channelId: optionalString(raw.channelId),
    templateId: optionalString(raw.templateId),
    targetAudience: optionalString(raw.targetAudience),
    keywords: normalizeKeywords(raw.keywords),
    notes: optionalString(raw.notes),
    scheduledAt: optionalString(raw.scheduledAt),
  };
  if (!input.topic) throw new Error("Topik wajib diisi");
  if (input.topic.length > 500) throw new Error("Topik terlalu panjang");
  if (input.notes && input.notes.length > 5000) throw new Error("Catatan terlalu panjang");
  if (input.scheduledAt && Number.isNaN(new Date(input.scheduledAt).getTime())) throw new Error("Jadwal invalid");
  return input;
}

export async function runOnePipelineStep() {
  const workerId = process.env.VERCEL_REGION ? `vercel-${process.env.VERCEL_REGION}` : "worker-local";
  let jobs: PipelineJobRow[] = [];
  try {
    jobs = await rpc<PipelineJobRow[]>("claim_next_pipeline_job", { worker_id: workerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "rpc failed";
    // PGRST202 = function not in schema cache; fall back to PostgREST-based claim
    if (message.includes("claim_next_pipeline_job") || message.includes("PGRST202") || message.includes("schema cache")) {
      console.warn("RPC claim_next_pipeline_job unavailable, using PostgREST fallback:", message);
      jobs = await claimNextPipelineJobFallback<PipelineJobRow>(workerId);
    } else {
      throw error;
    }
  }
  const job = jobs[0];
  if (!job) return { processed: false, message: "No pending jobs" };

  const now = new Date().toISOString();
  const completed = job.steps_completed ?? [];
  const currentStep = job.current_step ?? PIPELINE_STEPS.find((step) => !completed.includes(step)) ?? PIPELINE_STEPS[0];

  try {
    await performStep(job, currentStep);
    const nextCompleted = completed.includes(currentStep) ? completed : [...completed, currentStep];
    const nextStep = PIPELINE_STEPS.find((step) => !nextCompleted.includes(step)) ?? null;
    const finished = nextStep === null;

    await insertRow("pipeline_logs", { job_id: job.id, step: currentStep, level: "info", message: `Completed ${currentStep}`, metadata: { auto: true } });

    const [updated] = await updateRows<PipelineJobRow>("pipeline_jobs", `id=eq.${encodeURIComponent(job.id)}`, {
      status: finished ? "completed" : "running",
      current_step: nextStep,
      steps_completed: nextCompleted,
      error_message: null,
      error_step: null,
      started_at: job.status === "pending" ? now : undefined,
      completed_at: finished ? now : null,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    });

    await updateRows("contents", `id=eq.${encodeURIComponent(job.content_id)}`, { status: finished ? "published" : mapStepToContentStatus(nextStep), updated_at: now });
    return { processed: true, job: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Step failed";
    const retry = (job.retry_count ?? 0) + 1;
    const failed = retry > (job.max_retries ?? 3);
    await insertRow("pipeline_logs", { job_id: job.id, step: currentStep, level: "error", message, metadata: { retry, failed } });
    const [updated] = await updateRows<PipelineJobRow>("pipeline_jobs", `id=eq.${encodeURIComponent(job.id)}`, {
      status: failed ? "failed" : "pending",
      retry_count: retry,
      error_message: message,
      error_step: currentStep,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    });
    if (failed) await updateRows("contents", `id=eq.${encodeURIComponent(job.content_id)}`, { status: "failed", updated_at: now });
    return { processed: true, job: updated, error: message };
  }
}

async function performStep(job: PipelineJobRow, step: PipelineStep) {
  const content = await getContent(job.content_id);
  if (step === "generate_script") return generateScript(content);
  if (step === "generate_voice") return createAsset(job, "voice", "AI voice placeholder generated; connect ElevenLabs for real narration.");
  if (step === "generate_music") return createAsset(job, "music", "Background music placeholder generated; connect Suno for real music.");
  if (step === "generate_thumbnail") return generateThumbnail(job, content);
  if (step === "fetch_footage") return createAsset(job, "footage", "Stock footage keywords prepared; connect Pexels for real clips.");
  if (step === "render_video") return renderVideo(job, content);
  if (step === "upload_youtube") return uploadVideo(job, content);
}

async function getContent(contentId: string) {
  const rows = await selectRows<ContentRow>("contents", `id=eq.${encodeURIComponent(contentId)}&select=*&limit=1`);
  const content = rows[0];
  if (!content) throw new Error("Content not found");
  return content;
}

async function generateScript(content: ContentRow) {
  const topic = String(content.topic || "Video Sibermas");
  const keywords = Array.isArray(content.keywords) ? content.keywords : [];

  // Try Snifox LLM first; fall back to template if it fails or key missing.
  let script: Record<string, unknown>;
  if (process.env.SNIFOX_API_KEY) {
    try {
      const generated = await generateVideoScript({
        topic,
        targetAudience: content.target_audience,
        keywords,
        notes: content.notes,
      });
      script = {
        title: generated.title,
        hook: generated.hook,
        outline: generated.outline,
        narration: generated.narration,
        provider: "snifox",
        generated_at: new Date().toISOString(),
      };
      await updateRows("contents", `id=eq.${encodeURIComponent(content.id)}`, {
        title_options: generated.titleOptions,
        selected_title: generated.title,
        description: generated.description,
        tags: [...new Set([...generated.tags, "sibermas", "uin saizu"])].slice(0, 15),
        script,
      });
      return;
    } catch (error) {
      console.error("Snifox script generation failed, falling back to template:", error);
    }
  }

  // Fallback template (used if Snifox unavailable or fails)
  const title = topic.length > 90 ? topic.slice(0, 87) + "..." : topic;
  script = {
    title,
    hook: `Pernah dengar tentang ${topic}?`,
    outline: ["Pembuka singkat", "Masalah utama", "Solusi/penjelasan", "Contoh praktis", "Penutup dan CTA"],
    narration: [
      `Halo, hari ini kita membahas ${topic}.`,
      `Konten ini ditujukan untuk ${content.target_audience || "mahasiswa dan masyarakat umum"}.`,
      String(content.notes || "Fokus pada penjelasan singkat, jelas, dan mudah dipahami."),
      "Ikuti terus kanal ini untuk konten edukatif berikutnya.",
    ].join("\n\n"),
    provider: "template-fallback",
    generated_at: new Date().toISOString(),
  };
  await updateRows("contents", `id=eq.${encodeURIComponent(content.id)}`, {
    title_options: [title, `${title} - Penjelasan Singkat`, `Mengenal ${title}`],
    selected_title: title,
    description: `${(script as { narration: string }).narration}\n\n#sibermas #uinsaizu`,
    tags: [...new Set(["sibermas", "uin saizu", "edukasi", ...keywords])].slice(0, 15),
    script,
  });
}

async function createAsset(job: PipelineJobRow, assetType: string, note: string) {
  const base = (process.env.WORKER_PUBLIC_BASE_URL ?? "https://sibermas.rizquna.id/generated").replace(/\/$/, "");
  await insertRow("content_assets", {
    content_id: job.content_id,
    asset_type: assetType,
    storage_url: `${base}/${job.content_id}-${assetType}.txt`,
    provider: "placeholder",
    metadata: { note, generated_at: new Date().toISOString() },
  });
}

async function generateThumbnail(job: PipelineJobRow, content: ContentRow) {
  const base = (process.env.WORKER_PUBLIC_BASE_URL ?? "https://sibermas.rizquna.id/generated").replace(/\/$/, "");
  const topic = String(content.topic || "Sibermas UIN SAIZU");
  const title = String(content.selected_title || content.topic || topic);
  const script = (content.script ?? {}) as { hook?: string };

  let copy: Awaited<ReturnType<typeof generateThumbnailCopy>> = null;
  if (process.env.SNIFOX_API_KEY) {
    copy = await generateThumbnailCopy({ topic, title, hook: script.hook });
  }

  await insertRow("content_assets", {
    content_id: job.content_id,
    asset_type: "thumbnail",
    storage_url: `${base}/${job.content_id}-thumbnail.txt`,
    provider: copy ? "snifox" : "placeholder",
    metadata: copy
      ? { ...copy, generated_at: new Date().toISOString() }
      : { note: "Thumbnail prompt generated from title/topic.", generated_at: new Date().toISOString() },
  });
}

async function renderVideo(job: PipelineJobRow, content: ContentRow) {
  const title = String(content.selected_title || content.topic || "Sibermas YT")
    .replace(/[\r\n:]/g, " ")
    .replace(/['"`$\\]/g, "")
    .slice(0, 80);

  const fileName = assertSafeFilename(`${job.content_id}.mp4`);
  // Reject ~ in path because single-quote shell quoting prevents tilde expansion.
  // Use absolute path only (e.g. /home/rizqunaid/sibermas-worker/output).
  let remoteDir = (process.env.WORKER_REMOTE_DIR ?? "/home/rizqunaid/sibermas-worker/output").replace(/\/$/, "");
  if (remoteDir.startsWith("~")) {
    throw new Error("WORKER_REMOTE_DIR must be an absolute path (not ~). Set e.g. /home/<user>/sibermas-worker/output");
  }
  if (!remoteDir.startsWith("/")) {
    throw new Error("WORKER_REMOTE_DIR must be an absolute path starting with /");
  }
  const publicBase = (process.env.WORKER_PUBLIC_BASE_URL ?? "https://yt.rizquna.id").replace(/\/$/, "");
  const remotePath = `${remoteDir}/${fileName}`;
  const drawText = `SIBERMAS-YT\\n${title}`;

  const cmd = [
    `mkdir -p ${shq(remoteDir)}`,
    `ffmpeg -y \
-f lavfi -i color=c=0x0f172a:s=1280x720:d=12 \
-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
-vf ${shq(`drawtext=text='${drawText}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=24`)} \
-shortest -c:v libx264 -pix_fmt yuv420p -c:a aac ${shq(remotePath)} 2>&1 | tail -20`,
  ].join(" && ");

  const result = await sshExec(cmd, { timeoutMs: 180_000 });
  if (result.code !== 0) {
    throw new Error(`Remote ffmpeg render failed (code ${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }

  await insertRow("content_assets", {
    content_id: job.content_id,
    asset_type: "video",
    storage_url: `${publicBase}/${fileName}`,
    provider: "ssh-ffmpeg",
    metadata: {
      remote_path: remotePath,
      host: process.env.SSH_HOST,
      generated_at: new Date().toISOString(),
    },
  });
}

async function uploadVideo(job: PipelineJobRow, content: ContentRow) {
  const rows = await selectRows<Record<string, unknown>>("content_assets", `content_id=eq.${encodeURIComponent(job.content_id)}&asset_type=eq.video&select=*&order=created_at.desc&limit=1`);
  const video = rows[0];
  if (!video?.storage_url) throw new Error("No rendered video asset");
  const result = await uploadYouTubeVideo({
    videoUrl: String(video.storage_url),
    title: String(content.selected_title || content.topic || "Untitled video"),
    description: String(content.description || ""),
    tags: Array.isArray(content.tags) ? content.tags.map(String) : [],
    privacyStatus: "private",
  });
  await insertRow("youtube_videos", {
    content_id: job.content_id,
    youtube_video_id: result.id,
    youtube_url: `https://www.youtube.com/watch?v=${result.id}`,
    privacy_status: "private",
  });
}

function mapStepToContentStatus(step: PipelineStep | null) {
  if (!step) return "awaiting_review";
  if (step.startsWith("generate_")) return "generating";
  if (step === "upload_youtube") return "uploading";
  return "generating";
}

function normalizeKeywords(value: unknown) {
  const arr = Array.isArray(value) ? value : String(value ?? "").split(",");
  return arr.map((keyword) => String(keyword).trim()).filter(Boolean).slice(0, 20);
}

function optionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
