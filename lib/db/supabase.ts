import "server-only";

type SupabaseRow = Record<string, unknown>;

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return { url: url.replace(/\/$/, ""), key };
}

async function request<T>(table: string, query = "", init: RequestInit = {}) {
  const { url, key } = config();
  const sep = query ? `?${query}` : "";
  const response = await fetch(`${url}/rest/v1/${table}${sep}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase ${response.status}: ${table}`);
  return data as T;
}

export async function insertRow<T extends SupabaseRow>(table: string, row: SupabaseRow) {
  const data = await request<T[]>(table, "", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
  return data[0] as T;
}

export async function selectOne<T extends SupabaseRow>(table: string, query: string) {
  const data = await request<T[]>(table, `${query}&limit=1`);
  return (data[0] ?? null) as T | null;
}

export async function selectRows<T extends SupabaseRow>(table: string, query: string) {
  return request<T[]>(table, query);
}

export async function updateRows<T extends SupabaseRow>(table: string, query: string, patch: SupabaseRow) {
  return request<T[]>(table, query, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
}

export async function rpc<T>(fn: string, body: SupabaseRow = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `RPC failed: ${fn}`);
    (err as Error & { code?: string }).code = data?.code;
    throw err;
  }
  return data as T;
}

/**
 * Atomic-ish claim fallback when RPC `claim_next_pipeline_job` is unavailable
 * (e.g. schema cache stale or function missing). Uses PostgREST SELECT+conditional
 * UPDATE — safe for single-worker (Vercel cron) but not for multi-worker high-concurrency.
 */
export async function claimNextPipelineJobFallback<T extends SupabaseRow>(workerId: string): Promise<T[]> {
  const staleCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const query =
    `status=in.(pending,running)` +
    `&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})` +
    `&order=created_at.asc&limit=1&select=id`;
  const candidates = await selectRows<{ id: string }>("pipeline_jobs", query);
  const candidate = candidates[0];
  if (!candidate) return [];

  // Conditional UPDATE — only claim if still unlocked / stale
  const now = new Date().toISOString();
  const updateQuery =
    `id=eq.${encodeURIComponent(candidate.id)}` +
    `&or=(locked_at.is.null,locked_at.lt.${encodeURIComponent(staleCutoff)})`;
  const updated = await updateRows<T>("pipeline_jobs", updateQuery, {
    status: "running",
    locked_at: now,
    locked_by: workerId,
    updated_at: now,
  });
  return updated;
}
