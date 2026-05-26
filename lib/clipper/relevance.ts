import "server-only";
import { snifoxChat } from "../ai/snifox";

export type RelevanceResult = {
  score: number; // 0-100
  category: string;
  reason: string;
};

/**
 * Score a video's relevance for Sibermas UIN SAIZU (dakwah + edukasi Islam).
 * Uses Haiku 4.5 for speed/cost. Returns null on failure.
 */
export async function scoreRelevance(input: {
  title: string;
  channel: string;
  description?: string;
  durationSec?: number;
}): Promise<RelevanceResult | null> {
  const systemPrompt = `Anda adalah content curator untuk channel Shorts YouTube Sibermas UIN SAIZU (kampus dakwah dan edukasi Islam).
Tugas: nilai relevance video untuk dijadikan source clip Shorts dakwah/edukasi.

Output STRICT JSON:
{
  "score": 0-100,
  "category": "dakwah" | "edukasi_islam" | "edukasi_umum" | "motivasi" | "kuliah" | "lain",
  "reason": "alasan singkat 1-2 kalimat"
}

Skoring:
- 90-100: ceramah/kajian/khutbah ustadz/habib langsung relevan
- 70-89: edukasi Islam (fiqh, tafsir, sejarah Islam, akidah)
- 50-69: motivasi positif, self-improvement, pendidikan umum bernilai
- 30-49: konten netral edukatif tapi tidak ada nilai dakwah/keislaman
- 0-29: tidak cocok (hiburan murni, gosip, kontroversial, judi, prank, dll)

Hindari:
- Politik partisan
- Kontroversi keagamaan / sektarian
- Konten 18+
- Klikbait kosong

JSON only.`;

  const userPrompt = `Judul: ${input.title}
Channel: ${input.channel}
${input.durationSec ? `Durasi: ${Math.floor(input.durationSec / 60)} menit` : ""}
${input.description ? `Deskripsi: ${input.description.slice(0, 500)}` : ""}

Nilai relevance.`;

  try {
    const result = await snifoxChat({
      model: "anthropic/claude-haiku-4.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 300,
      responseFormat: "json_object",
    });

    const cleaned = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<RelevanceResult>;
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      category: String(parsed.category || "lain").slice(0, 30),
      reason: String(parsed.reason || "").slice(0, 240),
    };
  } catch (error) {
    console.error("scoreRelevance failed:", (error as Error).message);
    return null;
  }
}

const KEYWORD_HINTS = [
  // Dakwah keywords
  "ceramah", "kajian", "khutbah", "tausiyah", "ustadz", "habib", "ust ", "ust.",
  "kyai", "kiai", "dakwah", "muhasabah", "tafsir", "fiqh", "fiqih", "hadits",
  "sirah", "akidah", "aqidah", "muslim", "muslimah", "syariah", "akhlak",
  // Edukasi keywords
  "ilmu", "pendidikan", "motivasi", "inspirasi", "belajar", "pengetahuan",
  "sejarah islam", "islam", "ramadhan", "puasa", "shalat", "sholat",
];

/** Heuristic pre-filter (cheap) before invoking Snifox. */
export function quickKeywordScore(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of KEYWORD_HINTS) {
    if (lower.includes(kw)) hits++;
  }
  if (hits === 0) return 0;
  return Math.min(100, hits * 20);
}
