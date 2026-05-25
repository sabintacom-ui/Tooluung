import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { selectOne, selectRows } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;
    const jobId = request.nextUrl.searchParams.get("id");
    if (!jobId) return NextResponse.json({ ok: false, error: "id wajib diisi" }, { status: 400 });
    if (!UUID_RE.test(jobId)) return NextResponse.json({ ok: false, error: "id invalid" }, { status: 400 });

    const job = await selectOne("pipeline_jobs", `id=eq.${encodeURIComponent(jobId)}&select=*`);
    if (!job) return NextResponse.json({ ok: false, error: "Job tidak ditemukan" }, { status: 404 });
    const contentId = String(job.content_id);
    if (!UUID_RE.test(contentId)) return NextResponse.json({ ok: false, error: "content_id invalid" }, { status: 500 });
    const logs = await selectRows("pipeline_logs", `job_id=eq.${encodeURIComponent(jobId)}&select=*&order=created_at.asc&limit=100`);
    const videos = await selectRows("youtube_videos", `content_id=eq.${encodeURIComponent(contentId)}&select=*&order=uploaded_at.desc&limit=5`);

    return NextResponse.json({ ok: true, job, logs, videos });
  } catch (error) {
    console.error("Pipeline status failed", error);
    return NextResponse.json({ ok: false, error: "Pipeline status failed" }, { status: 500 });
  }
}
