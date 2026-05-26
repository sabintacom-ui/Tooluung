import { NextResponse } from "next/server";
import { getJob, getSource, listJobs, listSources } from "@/lib/clipper/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected || !token || token !== expected) return false;
  return true;
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const sourceId = searchParams.get("sourceId");
  const status = searchParams.get("status") || undefined;
  const limit = Number(searchParams.get("limit") || "30");

  try {
    if (jobId) {
      const job = await getJob(jobId);
      if (!job) return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });
      const source = await getSource(job.source_id);
      return NextResponse.json({ ok: true, job, source });
    }
    if (sourceId) {
      const source = await getSource(sourceId);
      if (!source) return NextResponse.json({ ok: false, error: "source_not_found" }, { status: 404 });
      const jobs = await listJobs({ sourceId, limit });
      return NextResponse.json({ ok: true, source, jobs });
    }
    const sources = await listSources({ status, limit });
    const jobs = await listJobs({ status, limit });
    return NextResponse.json({ ok: true, sources, jobs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
