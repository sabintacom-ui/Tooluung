import "server-only";
import { insertRow, selectRows, updateRows } from "../db/supabase";

export type ClipperSource = {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title?: string;
  channel?: string;
  channel_url?: string;
  duration_sec?: number;
  view_count?: number;
  thumbnail_url?: string;
  description?: string;
  heatmap?: unknown;
  transcript?: unknown;
  relevance_score?: number;
  status: string;
  source_mode: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type ClipperJob = {
  id: string;
  source_id: string;
  start_sec: number;
  end_sec: number;
  duration_sec?: number;
  hook_text?: string;
  suggested_title?: string;
  caption_srt?: string;
  output_path?: string;
  output_url?: string;
  status: string;
  current_step?: string;
  steps_completed?: string[];
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  locked_at?: string | null;
  locked_by?: string | null;
  youtube_video_id?: string;
  youtube_url?: string;
  privacy_status?: string;
  metadata?: Record<string, unknown>;
  completed_at?: string | null;
};

export async function upsertSource(row: Partial<ClipperSource>): Promise<ClipperSource> {
  // Try to find existing by youtube_video_id first
  if (row.youtube_video_id) {
    const existing = await selectRows<ClipperSource>(
      "clipper_sources",
      `youtube_video_id=eq.${encodeURIComponent(row.youtube_video_id)}&select=*&limit=1`
    );
    if (existing[0]) {
      const [updated] = await updateRows<ClipperSource>(
        "clipper_sources",
        `id=eq.${encodeURIComponent(existing[0].id)}`,
        { ...row, updated_at: new Date().toISOString() }
      );
      return updated || existing[0];
    }
  }
  const inserted = await insertRow<ClipperSource>("clipper_sources", {
    ...row,
    status: row.status || "discovered",
    source_mode: row.source_mode || "manual",
  });
  return inserted;
}

export async function insertClipJob(row: Partial<ClipperJob>): Promise<ClipperJob> {
  return await insertRow<ClipperJob>("clipper_jobs", {
    ...row,
    status: row.status || "pending",
    retry_count: row.retry_count ?? 0,
    max_retries: row.max_retries ?? 3,
  });
}

export async function updateClipJob(id: string, patch: Partial<ClipperJob>): Promise<ClipperJob | null> {
  const [updated] = await updateRows<ClipperJob>(
    "clipper_jobs",
    `id=eq.${encodeURIComponent(id)}`,
    { ...patch, updated_at: new Date().toISOString() }
  );
  return updated || null;
}

export async function listSources(opts?: { status?: string; limit?: number }): Promise<ClipperSource[]> {
  const limit = opts?.limit ?? 50;
  const filter = opts?.status ? `status=eq.${encodeURIComponent(opts.status)}&` : "";
  return selectRows<ClipperSource>(
    "clipper_sources",
    `${filter}select=*&order=created_at.desc&limit=${limit}`
  );
}

export async function listJobs(opts?: { status?: string; sourceId?: string; limit?: number }): Promise<ClipperJob[]> {
  const limit = opts?.limit ?? 50;
  let filter = "";
  if (opts?.status) filter += `status=eq.${encodeURIComponent(opts.status)}&`;
  if (opts?.sourceId) filter += `source_id=eq.${encodeURIComponent(opts.sourceId)}&`;
  return selectRows<ClipperJob>(
    "clipper_jobs",
    `${filter}select=*&order=created_at.desc&limit=${limit}`
  );
}

export async function getSource(id: string): Promise<ClipperSource | null> {
  const rows = await selectRows<ClipperSource>(
    "clipper_sources",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows[0] || null;
}

export async function getJob(id: string): Promise<ClipperJob | null> {
  const rows = await selectRows<ClipperJob>(
    "clipper_jobs",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows[0] || null;
}

export async function claimNextClipJob(workerId: string): Promise<ClipperJob | null> {
  const now = new Date().toISOString();
  const staleCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const candidates = await selectRows<ClipperJob>(
    "clipper_jobs",
    `status=in.(pending,running)&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})&order=created_at.asc&limit=1`
  );
  const candidate = candidates[0];
  if (!candidate) return null;
  const updateQuery =
    `id=eq.${encodeURIComponent(candidate.id)}` +
    `&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})`;
  const [claimed] = await updateRows<ClipperJob>(
    "clipper_jobs",
    updateQuery,
    { locked_at: now, locked_by: workerId, status: "running", updated_at: now }
  );
  return claimed || null;
}
