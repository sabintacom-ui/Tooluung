import { NextResponse } from "next/server";
import { scanYoutubeUrl } from "@/lib/clipper/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected || !token || token !== expected) return false;
  return true;
}

export async function POST(req: Request) {
  if (!authorize(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { url?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.url) return NextResponse.json({ ok: false, error: "url_required" }, { status: 400 });
  try {
    const source = await scanYoutubeUrl(String(body.url), (body.mode as "manual" | "trending" | "auto") || "manual");
    return NextResponse.json({ ok: true, source });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
