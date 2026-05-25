import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import "server-only";

function safeCompare(provided: string | null | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // still run a constant-time compare against expected to avoid early-exit timing leak
    const pad = Buffer.alloc(b.length);
    try {
      timingSafeEqual(pad, b);
    } catch {
      // ignore
    }
    return false;
  }
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function assertAdmin(request: NextRequest) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) throw new Error("Missing ADMIN_API_TOKEN");
  const token = request.headers.get("x-admin-token");
  if (!safeCompare(token, expected)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function assertTrigger(request: NextRequest) {
  const expected = process.env.WORKER_SECRET;
  if (!expected) throw new Error("Missing WORKER_SECRET");
  // Accept x-worker-secret OR Vercel Cron's Authorization: Bearer <CRON_SECRET>
  const headerToken = request.headers.get("x-worker-secret");
  if (headerToken && safeCompare(headerToken, expected)) return null;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // Use timing-safe compare on the token portion only
    const token = authHeader.slice("Bearer ".length);
    if (safeCompare(token, cronSecret)) return null;
  }

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
