import { NextResponse } from "next/server";
import { runOneClipStep } from "@/lib/clipper/orchestrator";
import { safeCompare } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

function authorize(req: Request) {
  const secret = req.headers.get("x-worker-secret");
  const expected = process.env.WORKER_SECRET;
  if (!expected || !secret) return false;
  return safeCompare(secret, expected);
}

export async function POST(req: Request) {
  if (!authorize(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const result = await runOneClipStep();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
