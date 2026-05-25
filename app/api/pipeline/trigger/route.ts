import { NextRequest, NextResponse } from "next/server";
import { assertTrigger } from "@/lib/auth";
import { runOnePipelineStep } from "@/lib/orchestrator/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(request: NextRequest) {
  try {
    const unauthorized = assertTrigger(request);
    if (unauthorized) return unauthorized;
    const result = await runOnePipelineStep();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Pipeline trigger failed:", message, stack);
    // Expose detail when DEBUG_ERRORS=1 (set in .env.local for dev), otherwise generic.
    const expose = process.env.DEBUG_ERRORS === "1" || process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { ok: false, error: expose ? message : "Pipeline trigger failed" },
      { status: 500 },
    );
  }
}

// POST for manual triggers (x-worker-secret) and GAS webhooks.
export const POST = handle;
// GET for Vercel Cron (Authorization: Bearer ${CRON_SECRET}).
export const GET = handle;
