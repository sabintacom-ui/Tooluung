import "server-only";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type SnifoxChatResult = {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
};

function config() {
  const apiKey = process.env.SNIFOX_API_KEY;
  const baseUrl = (process.env.SNIFOX_BASE_URL ?? "https://core.snifoxai.com/v1").replace(/\/$/, "");
  const model = process.env.SNIFOX_MODEL ?? "anthropic/claude-opus-4.7";
  if (!apiKey) throw new Error("Missing SNIFOX_API_KEY");
  return { apiKey, baseUrl, model };
}

export async function snifoxChat(input: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
}): Promise<SnifoxChatResult> {
  const { apiKey, baseUrl, model } = config();

  const body: Record<string, unknown> = {
    model: input.model ?? model,
    messages: input.messages,
    temperature: input.temperature ?? 0.7,
  };
  if (input.maxTokens) body.max_tokens = input.maxTokens;
  if (input.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.SNIFOX_TIMEOUT_MS ?? "120000");
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let data: ChatCompletionResponse;
    try {
      data = JSON.parse(text) as ChatCompletionResponse;
    } catch {
      throw new Error(`Snifox returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      const err = (data as unknown as { error?: { message?: string } }).error?.message || text;
      throw new Error(`Snifox ${response.status}: ${err}`);
    }

    const choice = data.choices?.[0];
    if (!choice?.message?.content) throw new Error("Snifox returned empty response");

    return {
      content: choice.message.content,
      model: data.model,
      tokens: {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export type GeneratedScript = {
  title: string;
  titleOptions: string[];
  description: string;
  hook: string;
  outline: string[];
  narration: string;
  tags: string[];
};

/**
 * Generate a structured video script for sibermas-YT using Snifox LLM.
 * Falls back gracefully if Snifox is unavailable.
 */
export async function generateVideoScript(input: {
  topic: string;
  targetAudience?: string;
  keywords?: string[];
  notes?: string;
}): Promise<GeneratedScript> {
  const systemPrompt = `Anda adalah scriptwriter video edukasi YouTube untuk Sibermas UIN SAIZU (kampus dakwah dan keagamaan). Tugas: buat script video singkat (2-4 menit) dalam Bahasa Indonesia yang informatif, ramah, dan SEO-friendly.

Output WAJIB berupa JSON valid dengan struktur:
{
  "title": "judul utama, max 90 karakter",
  "titleOptions": ["3 alternatif judul, masing-masing max 90 karakter"],
  "description": "deskripsi YouTube 200-400 kata, sertakan hashtag #sibermas #uinsaizu di akhir",
  "hook": "kalimat pembuka 1-2 kalimat yang catchy",
  "outline": ["5 poin outline naratif"],
  "narration": "naskah lengkap untuk voice-over, 250-400 kata, dipisah dengan \\n\\n antar paragraf",
  "tags": ["8-12 tag YouTube relevan, lowercase"]
}

Jangan tambahkan teks lain di luar JSON. Jangan gunakan markdown code fence.`;

  const userPrompt = `Topik: ${input.topic}
Target audiens: ${input.targetAudience || "mahasiswa dan masyarakat umum"}
Keyword: ${(input.keywords ?? []).join(", ") || "sibermas, uin saizu, edukasi"}
Catatan/brief: ${input.notes || "Fokus pada penjelasan singkat, jelas, dan mudah dipahami."}

Buat script video sesuai struktur JSON yang diminta.`;

  const result = await snifoxChat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: "json_object",
  });

  let parsed: Partial<GeneratedScript>;
  try {
    // Strip code fence if present
    const cleaned = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Snifox returned invalid JSON: ${(error as Error).message}; raw: ${result.content.slice(0, 200)}`);
  }

  // Validate & normalize
  const title = String(parsed.title || input.topic).slice(0, 100);
  const titleOptions = Array.isArray(parsed.titleOptions)
    ? parsed.titleOptions.map((t) => String(t).slice(0, 100)).slice(0, 5)
    : [title];
  const description = String(parsed.description || "").slice(0, 5000);
  const hook = String(parsed.hook || "").slice(0, 500);
  const outline = Array.isArray(parsed.outline)
    ? parsed.outline.map((o) => String(o).slice(0, 200)).slice(0, 10)
    : [];
  const narration = String(parsed.narration || "").slice(0, 10000);
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 15)
    : ["sibermas", "uin saizu", "edukasi"];

  return { title, titleOptions, description, hook, outline, narration, tags };
}

export type ThumbnailCopy = {
  headline: string;
  subhead: string;
  accentColor: string;
  bgColor: string;
  emoji: string;
};

/**
 * Generate thumbnail copy (headline/subhead/colors) using Snifox Haiku.
 * Fast call (~3-5s). Returns null on failure so caller can use placeholder.
 */
export async function generateThumbnailCopy(input: {
  topic: string;
  title: string;
  hook?: string;
}): Promise<ThumbnailCopy | null> {
  const systemPrompt = `Anda adalah designer thumbnail YouTube untuk Sibermas UIN SAIZU (kampus dakwah/keagamaan).
Buat copy thumbnail singkat, dramatis, mudah dibaca dari preview kecil.

Output WAJIB JSON valid:
{
  "headline": "2-5 kata, HURUF BESAR, max 30 karakter",
  "subhead": "1 baris penjelas, max 50 karakter",
  "accentColor": "hex color untuk teks aksen (warna terang)",
  "bgColor": "hex color untuk background (warna gelap/kontras)",
  "emoji": "1 emoji yang relevan"
}

Palet brand: teal (#0D9488), gold (#FBBF24), dark navy (#0F172A), green (#10B981).
Jangan tambahkan teks lain di luar JSON.`;

  const userPrompt = `Topik: ${input.topic}
Judul video: ${input.title}
${input.hook ? `Hook: ${input.hook}` : ""}

Buat thumbnail copy.`;

  try {
    const result = await snifoxChat({
      model: "anthropic/claude-haiku-4.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens: 400,
      responseFormat: "json_object",
    });

    const cleaned = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<ThumbnailCopy>;

    return {
      headline: String(parsed.headline || input.title).slice(0, 40).toUpperCase(),
      subhead: String(parsed.subhead || "Sibermas UIN SAIZU").slice(0, 60),
      accentColor: normalizeHex(parsed.accentColor) || "#FBBF24",
      bgColor: normalizeHex(parsed.bgColor) || "#0F172A",
      emoji: String(parsed.emoji || "✨").slice(0, 4),
    };
  } catch (error) {
    console.error("generateThumbnailCopy failed:", (error as Error).message);
    return null;
  }
}

function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const hex = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/i.test(hex)) return hex;
  return null;
}

export type FootagePlan = {
  keywords: string[];
  scenes: Array<{ timeSec: number; query: string }>;
};

/**
 * Generate English footage keywords + scene plan using Snifox Haiku.
 * Fast call (~3-6s). Returns null on failure so caller can use placeholder.
 */
export async function generateFootageKeywords(input: {
  topic: string;
  title: string;
  narration?: string;
}): Promise<FootagePlan | null> {
  const systemPrompt = `You are a footage planner for educational YouTube videos.
Given a topic in Indonesian, produce ENGLISH stock-footage search keywords
(for Pexels/Pixabay) and a scene plan timeline.

Output STRICT JSON only:
{
  "keywords": ["5-8 short English keyword phrases, lowercase, no punctuation"],
  "scenes": [
    {"timeSec": 0, "query": "english search query"},
    {"timeSec": 15, "query": "english search query"}
  ]
}

Rules:
- 5-8 keywords (2-3 words each, lowercase, English only)
- 4-6 scenes with timeSec increasing (0, ~15, ~30, ~45, ~60, ~90)
- Queries must be safe-for-work, abstract or generic visuals
- No personal names, no religious imagery requiring sensitivity
- No markdown, no code fences, JSON only`;

  const userPrompt = `Topic (Indonesian): ${input.topic}
Title: ${input.title}
${input.narration ? `Narration excerpt: ${input.narration.slice(0, 600)}` : ""}

Generate footage plan.`;

  try {
    const result = await snifoxChat({
      model: "anthropic/claude-haiku-4.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      maxTokens: 600,
      responseFormat: "json_object",
    });

    const cleaned = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<FootagePlan>;

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .map((k) => String(k).toLowerCase().trim().replace(/[^a-z0-9 ]/g, ""))
          .filter((k) => k.length > 0 && k.length < 60)
          .slice(0, 8)
      : [];

    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes
          .map((s) => ({
            timeSec: Number((s as { timeSec?: unknown }).timeSec ?? 0) || 0,
            query: String((s as { query?: unknown }).query ?? "").trim().slice(0, 80),
          }))
          .filter((s) => s.query.length > 0)
          .slice(0, 8)
      : [];

    if (keywords.length === 0 && scenes.length === 0) return null;

    return { keywords, scenes };
  } catch (error) {
    console.error("generateFootageKeywords failed:", (error as Error).message);
    return null;
  }
}
