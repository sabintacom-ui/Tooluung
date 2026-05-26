import "server-only";
import { snifoxChat } from "../ai/snifox";

export type Highlight = {
  startSec: number;
  endSec: number;
  hookText: string;
  suggestedTitle: string;
  reason: string;
  score: number;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type HeatmapEntry = {
  start_time: number;
  end_time: number;
  value: number;
};

export type SrtCue = { start: number; end: number; text: string };

/** Parse SRT text into structured cues with start/end in seconds. */
export function parseSrt(srt: string): SrtCue[] {
  if (!srt || typeof srt !== "string") return [];
  const blocks = srt.replace(/\r/g, "").split(/\n\n+/);
  const cues: SrtCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => /-->/.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/,
    );
    if (!m) continue;
    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = m;
    const start =
      Number(h1) * 3600 + Number(m1) * 60 + Number(s1) + Number(ms1) / 1000;
    const end =
      Number(h2) * 3600 + Number(m2) * 60 + Number(s2) + Number(ms2) / 1000;
    const text = lines
      .slice(lines.indexOf(timeLine) + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (text) cues.push({ start, end, text });
  }
  return cues;
}

/** Compress transcript into ~5-second windows tagged with start timestamp. */
function compressTranscript(segments: TranscriptSegment[], maxChars = 12000): string {
  const compressed: string[] = [];
  let curStart = 0;
  let curText: string[] = [];
  let lastEnd = 0;
  for (const s of segments) {
    if (curText.length === 0) curStart = s.start;
    curText.push(s.text);
    lastEnd = s.end;
    if (lastEnd - curStart >= 5) {
      compressed.push(`[${Math.floor(curStart)}s] ${curText.join(" ")}`);
      curText = [];
    }
  }
  if (curText.length > 0) {
    compressed.push(`[${Math.floor(curStart)}s] ${curText.join(" ")}`);
  }
  return compressed.join("\n").slice(0, maxChars);
}

/**
 * Use Snifox Opus to pick the best highlight segments from a transcript.
 * Optional heatmap hint helps prioritize most-replayed moments.
 */
export async function pickHighlightsLLM(input: {
  title: string;
  channel: string;
  durationSec: number;
  transcript: TranscriptSegment[];
  heatmap?: HeatmapEntry[];
  numClips?: number;
  minDuration?: number;
  maxDuration?: number;
}): Promise<Highlight[]> {
  const numClips = input.numClips ?? 3;
  const minDur = input.minDuration ?? 30;
  const maxDur = input.maxDuration ?? 60;

  const transcriptText = compressTranscript(input.transcript);

  // Render top heatmap moments as hints (if available)
  const heatmapHint =
    input.heatmap && input.heatmap.length > 0
      ? input.heatmap
          .slice()
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .slice(0, 8)
          .map(
            (h) =>
              `- ${Math.floor(h.start_time)}s-${Math.floor(h.end_time)}s (intensity ${(h.value ?? 0).toFixed(2)})`,
          )
          .join("\n")
      : "(tidak ada heatmap)";

  const systemPrompt = `Anda adalah editor video Shorts profesional untuk channel dakwah/edukasi Sibermas UIN SAIZU.
Tugas: pilih ${numClips} momen TERBAIK dari transcript untuk dijadikan YouTube Shorts.

Durasi setiap clip: ${minDur}-${maxDur} detik.

Kriteria momen viral:
- Quote/punchline kuat dan stand-alone (bisa dimengerti tanpa konteks)
- Insight mengejutkan, bermakna, atau emosional
- Cerita lengkap (hook → twist → resolution)
- Pesan moral/dakwah/motivasi yang clear
- HINDARI: intro panjang, basa-basi, off-topic

Output STRICT JSON saja (no markdown):
{
  "highlights": [
    {
      "startSec": 120,
      "endSec": 165,
      "hookText": "1 kalimat hook untuk overlay teks Shorts (max 80 char)",
      "suggestedTitle": "judul Short max 80 char, catchy, dalam Bahasa Indonesia",
      "reason": "kenapa momen ini bagus (1 kalimat singkat)",
      "score": 0-100
    }
  ]
}

Aturan:
- (endSec - startSec) harus antara ${minDur} dan ${maxDur}
- startSec tepat di awal kalimat utuh
- endSec tepat di akhir kalimat utuh (jangan potong tengah ucapan)
- Sort by score descending
- Wajib JSON saja`;

  const userPrompt = `Judul video: ${input.title}
Channel: ${input.channel}
Durasi total: ${Math.floor(input.durationSec)}s

Heatmap (most-replayed) hints:
${heatmapHint}

Transcript (timestamp dalam detik):
${transcriptText}

Pilih ${numClips} highlight terbaik untuk Shorts.`;

  const result = await snifoxChat({
    model: "anthropic/claude-opus-4.7",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    maxTokens: 2500,
    responseFormat: "json_object",
  });

  const cleaned = result.content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: { highlights?: Array<Partial<Highlight>> };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const list = Array.isArray(parsed.highlights) ? parsed.highlights : [];
  return list
    .map((h) => {
      const startSec = Math.max(0, Number(h.startSec ?? 0));
      const endSec = Math.max(startSec, Number(h.endSec ?? 0));
      const dur = endSec - startSec;
      return {
        startSec,
        endSec,
        hookText: String(h.hookText ?? "").slice(0, 100),
        suggestedTitle: String(h.suggestedTitle ?? "").slice(0, 100),
        reason: String(h.reason ?? "").slice(0, 300),
        score: Math.max(0, Math.min(100, Number(h.score ?? 0))),
        durationSec: dur,
      } as Highlight & { durationSec: number };
    })
    .filter(
      (h) =>
        h.endSec - h.startSec >= minDur - 5 &&
        h.endSec - h.startSec <= maxDur + 5 &&
        h.suggestedTitle.length > 0,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, numClips)
    .map(({ startSec, endSec, hookText, suggestedTitle, reason, score }) => ({
      startSec,
      endSec,
      hookText,
      suggestedTitle,
      reason,
      score,
    }));
}

/**
 * Heatmap-only highlight picker (used when transcript unavailable).
 * Picks the top-intensity windows with non-overlapping spans.
 */
export function pickHighlightsHeatmap(input: {
  heatmap: HeatmapEntry[];
  durationSec: number;
  numClips?: number;
  minDuration?: number;
  maxDuration?: number;
}): Highlight[] {
  const numClips = input.numClips ?? 3;
  const minDur = input.minDuration ?? 30;
  const maxDur = input.maxDuration ?? 60;

  const sorted = [...input.heatmap]
    .filter(
      (h) =>
        typeof h.start_time === "number" &&
        typeof h.end_time === "number" &&
        typeof h.value === "number",
    )
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const picked: Highlight[] = [];
  for (const h of sorted) {
    if (picked.length >= numClips) break;
    const center = ((h.start_time ?? 0) + (h.end_time ?? 0)) / 2;
    const half = Math.min(maxDur, Math.max(minDur, 45)) / 2;
    const startSec = Math.max(0, center - half);
    const endSec = Math.min(input.durationSec, startSec + 2 * half);
    const dur = endSec - startSec;
    if (dur < minDur || dur > maxDur) continue;
    const overlap = picked.some(
      (p) => !(endSec <= p.startSec || startSec >= p.endSec),
    );
    if (overlap) continue;
    picked.push({
      startSec,
      endSec,
      hookText: `Momen Viral #${picked.length + 1}`,
      suggestedTitle: `Momen Viral #${picked.length + 1}`,
      reason: `High replay intensity (${(h.value ?? 0).toFixed(2)})`,
      score: Math.round((h.value ?? 0) * 100),
    });
  }
  return picked;
}
