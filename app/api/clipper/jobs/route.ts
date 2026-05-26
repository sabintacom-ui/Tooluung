import { NextResponse } from "next/server";
import { listJobs, listSources } from "@/lib/clipper/db";

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
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "all";
  const status = url.searchParams.get("status") || undefined;
  const limit = Number(url.searchParams.get("limit") || "30");
  try {
    if (kind === "sources") {
      const sources = await listSources({ status, limit });
      return NextResponse.json({ ok: true, sources });
    }
    if (kind === "jobs") {
      const jobs = await listJobs({ status, limit });
      return NextResponse.json({ ok: true, jobs });
    }
    const [sources, jobs] = await Promise.all([listSources({ limit }), listJobs({ limit })]);
    return NextResponse.json({ ok: true, sources, jobs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
