import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { insertRow } from "@/lib/db/supabase";
import { PIPELINE_STEPS, validateStartPipelineInput } from "@/lib/orchestrator/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;
    const input = validateStartPipelineInput(await request.json());
    if (!input.channelId) return NextResponse.json({ ok: false, error: "channelId wajib diisi" }, { status: 400 });

    const content = await insertRow<{ id: string }>("contents", {
      channel_id: input.channelId,
      template_id: input.templateId ?? null,
      topic: input.topic,
      target_audience: input.targetAudience ?? null,
      keywords: input.keywords ?? [],
      notes: input.notes ?? null,
      scheduled_at: input.scheduledAt ?? null,
      status: "pending",
      source: "manual",
    });

    const job = await insertRow<{ id: string; status: string; current_step: string }>("pipeline_jobs", {
      content_id: content.id,
      status: "pending",
      current_step: PIPELINE_STEPS[0],
      steps_completed: [],
      retry_count: 0,
      max_retries: Number(process.env.DEFAULT_RETRY_LIMIT ?? "3"),
      cost_breakdown: {},
      total_cost_usd: 0,
    });

    return NextResponse.json({
      ok: true,
      contentId: content.id,
      jobId: job.id,
      status: job.status,
      currentStep: job.current_step,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline start failed";
    const badRequest = message.includes("invalid") || message.includes("wajib") || message.includes("panjang");
    if (badRequest) return NextResponse.json({ ok: false, error: message }, { status: 400 });
    console.error("Pipeline start failed", error);
    return NextResponse.json({ ok: false, error: "Pipeline start failed" }, { status: 500 });
  }
}
