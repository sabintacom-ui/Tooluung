import { NextResponse } from "next/server";
import { getTrending, search } from "@/lib/clipper/ytdlp";
import { quickKeywordScore, scoreRelevance } from "@/lib/clipper/relevance";
import { scanYoutubeUrl } from "@/lib/clipper/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(req: Request) {
  const token = req.headers.get("x-admin-token") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected || !token || token !== expected) return false;
  return true;
}

const DEFAULT_KEYWORDS = [
  "ceramah ustadz",
  "kajian islam",
  "tausiyah",
  "khutbah jumat",
  "motivasi islami",
];

export async function POST(req: Request) {
  if (!authorize(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { keywords?: string[]; minDuration?: number; maxItems?: number; autoScan?: boolean; topN?: number };
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const keywords = body.keywords?.length ? body.keywords : DEFAULT_KEYWORDS;
  const minDuration = body.minDuration ?? 600; // 10 menit
  const maxItems = body.maxItems ?? 25;
  const topN = Math.max(1, Math.min(5, body.topN ?? 1));

  try {
    // Collect candidates: trending + per-keyword search
    const candidates: Array<{ id: string; title: string; duration?: number; channel?: string; url: string }> = [];
    try {
      const trending = await getTrending({ region: "ID", maxItems });
      candidates.push(...trending);
    } catch (err) {
      console.warn("Trending fetch failed:", (err as Error).message);
    }
    for (const kw of keywords.slice(0, 5)) {
      try {
        const items = await search(kw, Math.max(10, Math.floor(maxItems / 2)));
        candidates.push(...items);
      } catch (err) {
        console.warn(`search ${kw} failed:`, (err as Error).message);
      }
    }
    // Dedup
    const seen = new Set<string>();
    const unique = candidates.filter((c) => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    // Filter durasi long-form
    const longForm = unique.filter((c) => (c.duration || 0) >= minDuration);

    // Pre-filter quick keyword score (cheap)
    const prefiltered = longForm
      .map((c) => ({ ...c, _quick: quickKeywordScore(`${c.title} ${c.channel || ""}`) }))
      .filter((c) => c._quick > 0)
      .sort((a, b) => b._quick - a._quick)
      .slice(0, 12);

    // LLM relevance scoring on shortlist
    const scored: Array<{ candidate: typeof prefiltered[number]; score: number; category: string; reason: string }> = [];
    for (const candidate of prefiltered) {
      const rel = await scoreRelevance({
        title: candidate.title,
        channel: candidate.channel || "",
        durationSec: candidate.duration,
      });
      if (!rel) continue;
      if (rel.score < 60) continue;
      scored.push({ candidate, score: rel.score, category: rel.category, reason: rel.reason });
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topN);

    // Optionally auto-scan picks (yt-dlp full metadata + subtitle)
    const scanned = [];
    if (body.autoScan && top.length > 0) {
      for (const pick of top) {
        try {
          const source = await scanYoutubeUrl(pick.candidate.url, "trending");
          scanned.push({ ...pick, source_id: source.id, source_status: source.status });
        } catch (err) {
          scanned.push({ ...pick, error: (err as Error).message });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total_candidates: unique.length,
      long_form: longForm.length,
      shortlisted: prefiltered.length,
      scored: scored.length,
      picks: top,
      scanned,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
