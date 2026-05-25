import "server-only";

/**
 * Simple in-memory rate limiter (sliding window).
 * NOTE: This is per-instance only. For multi-region Vercel, use Upstash/Redis
 * for global rate limiting. Good enough for low-volume MVP behind admin auth.
 */

type Bucket = { hits: number[]; };
const buckets = new Map<string, Bucket>();

function clientKey(headers: Headers, route: string): string {
  // Prefer x-forwarded-for (Vercel sets this)
  const xff = headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || headers.get("x-real-ip") || "anon";
  return `${route}:${ip}`;
}

export function rateLimit(
  request: { headers: Headers },
  route: string,
  options: { windowMs?: number; max?: number } = {}
): { ok: boolean; remaining: number; resetMs: number } {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 60;
  const now = Date.now();
  const cutoff = now - windowMs;
  const key = clientKey(request.headers, route);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  // Prune old hits
  bucket.hits = bucket.hits.filter((ts) => ts > cutoff);

  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, remaining: 0, resetMs: oldest + windowMs - now };
  }

  bucket.hits.push(now);

  // Periodic cleanup to avoid memory leak (1% chance)
  if (Math.random() < 0.01) {
    for (const [k, b] of buckets.entries()) {
      b.hits = b.hits.filter((ts) => ts > cutoff);
      if (b.hits.length === 0) buckets.delete(k);
    }
  }

  return { ok: true, remaining: max - bucket.hits.length, resetMs: windowMs };
}
