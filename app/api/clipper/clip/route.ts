import { NextResponse } from "next/server";
import { insertClipJob } from "@/lib/clipper/db";
import { planClipsForSource } from "@/lib/clipper/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

function authorize(req: Request) {
  const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected || !token || token !== expected) return false;
  return true;
}

export async function POST(req: Request) {
  if (!authorize(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: {
    sourceId?: string;
    mode?: "auto" | "manual";
    startSec?: number;
    endSec?: number;
    hookText?: string;
    suggestedTitle?: string;
    numClips?: number;
    minDuration?: number;
    maxDuration?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.sourceId) return NextResponse.json({ ok: false, error: "sourceId_required" }, { status: 400 });
  const mode = body.mode || "auto";

  try {
    if (mode === "auto") {
      const jobs = await planClipsForSource(body.sourceId, {
        numClips: body.numClips,
        minDuration: body.minDuration,
        maxDuration: body.maxDuration,
      });
      return NextResponse.json({ ok: true, mode: "auto", jobs });
    }
    // Manual
    if (typeof body.startSec !== "number" || typeof body.endSec !== "number") {
      return NextResponse.json({ ok: false, error: "startSec_endSec_required" }, { status: 400 });
    }
    if (body.endSec <= body.startSec) {
      return NextResponse.json({ ok: false, error: "endSec_must_be_greater" }, { status: 400 });
    }
    const job = await insertClipJob({
      source_id: body.sourceId,
      start_sec: body.startSec,
      end_sec: body.endSec,
      hook_text: body.hookText,
      suggested_title: body.suggestedTitle,
      status: "pending",
    });
    return NextResponse.json({ ok: true, mode: "manual", job });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
