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
  // Default 45s — short enough for pipeline trigger curl (290s) to handle 7 steps
  const timeoutMs = Number(process.env.SNIFOX_TIMEOUT_MS ?? "45000");
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

// ────────────────────────────────────────────────────────────────────────────
// Thumbnail copy generator (fast, cheap, Haiku model)
// ────────────────────────────────────────────────────────────────────────────
export type ThumbnailCopy = {
  headline: string;       // big text overlay, max 6 words (~30 chars)
  subhead: string;        // small text overlay, max 8 words (~40 chars)
  accentColor: string;    // hex like "#fbbf24"
  bgColor: string;        // hex like "#0d9488"
  emoji: string;          // 1-2 char emoji or empty
};

function safeParseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function generateThumbnailCopy(input: {
  title: string;
  hook?: string;
  topic: string;
}): Promise<ThumbnailCopy> {
  const sys = `Anda adalah designer thumbnail YouTube untuk Sibermas UIN SAIZU. Buat copy thumbnail yang eye-catching.

Output JSON valid:
{
  "headline": "teks utama BESAR, MAX 6 KATA, huruf kapital recommended",
  "subhead": "teks pendukung kecil, max 8 kata",
  "accentColor": "hex warna aksen (default #fbbf24 emas)",
  "bgColor": "hex warna background (default #0d9488 teal)",
  "emoji": "1 emoji relevan atau empty string"
}

Jangan tambahkan markdown. Hanya JSON.`;
  const usr = `Topik: ${input.topic}
Judul video: ${input.title}
Hook: ${input.hook || "-"}

Buat copy thumbnail.`;

  const result = await snifoxChat({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
    model: "anthropic/claude-haiku-4.5",
    temperature: 0.6,
    maxTokens: 400,
    responseFormat: "json_object",
  });

  const parsed = safeParseJson<Partial<ThumbnailCopy>>(result.content);
  return {
    headline: String(parsed.headline || input.title).toUpperCase().slice(0, 40),
    subhead: String(parsed.subhead || "").slice(0, 60),
    accentColor: /^#[0-9a-f]{6}$/i.test(String(parsed.accentColor)) ? String(parsed.accentColor) : "#fbbf24",
    bgColor: /^#[0-9a-f]{6}$/i.test(String(parsed.bgColor)) ? String(parsed.bgColor) : "#0d9488",
    emoji: String(parsed.emoji || "").slice(0, 4),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Footage keyword generator (search query for Pexels/Pixabay)
// ────────────────────────────────────────────────────────────────────────────
export type FootagePlan = {
  keywords: string[];                                           // 5-8 single/double-word English keywords
  scenes: Array<{ timeSec: number; description: string; query: string }>; // 4-6 scenes
};

export async function generateFootageKeywords(input: {
  topic: string;
  narration: string;
}): Promise<FootagePlan> {
  const sys = `Anda adalah video editor. Dari naskah video, sarankan keyword stock footage (Bahasa Inggris) yang cocok di Pexels/Pixabay.

Output JSON valid:
{
  "keywords": ["5-8 keyword English, 1-2 kata each, lowercase, generic visual concepts"],
  "scenes": [
    {"timeSec": 0, "description": "deskripsi visual scene Bahasa Indonesia", "query": "search query Bahasa Inggris 2-3 kata"}
  ]
}

Buat 4-6 scenes, distribusikan rata di duration ~120 detik (0s, 25s, 50s, 75s, 100s).`;
  const usr = `Topik: ${input.topic}

Naskah:
${input.narration.slice(0, 2000)}

Sarankan keyword + scenes.`;

  const result = await snifoxChat({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
    model: "anthropic/claude-haiku-4.5",
    temperature: 0.5,
    maxTokens: 800,
    responseFormat: "json_object",
  });

  const parsed = safeParseJson<Partial<FootagePlan>>(result.content);
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((k) => String(k).toLowerCase().trim()).filter(Boolean).slice(0, 8)
    : ["mosque", "students", "indonesia", "education"];
  const scenes = Array.isArray(parsed.scenes)
    ? parsed.scenes.slice(0, 8).map((s, i) => ({
        timeSec: Number(s.timeSec ?? i * 25) || i * 25,
        description: String(s.description || "").slice(0, 200),
        query: String(s.query || keywords[i] || "education").slice(0, 60),
      }))
    : [];
  return { keywords, scenes };
}

// ────────────────────────────────────────────────────────────────────────────
// YouTube SEO metadata optimizer
// ────────────────────────────────────────────────────────────────────────────
export type YouTubeSeo = {
  title: string;              // max 100 char, frontloaded keyword
  titleVariants: string[];    // 3 A/B variants
  description: string;        // 300-500 words, hashtag, links, timestamps
  tags: string[];             // 12-15 tags
  chapters: Array<{ timeSec: number; label: string }>;
  categoryId: string;         // YouTube category ID (27=Education, 22=People&Blogs, 24=Entertainment)
  defaultLanguage: string;    // "id"
  defaultAudioLanguage: string; // "id"
};

export async function generateYouTubeSeo(input: {
  topic: string;
  title: string;
  narration: string;
  channelName: string;
  baseTags?: string[];
}): Promise<YouTubeSeo> {
  const sys = `Anda adalah YouTube SEO specialist untuk channel edukasi Islami Sibermas UIN SAIZU. Optimize metadata untuk maksimal CTR + watch time + discoverability.

Output JSON valid:
{
  "title": "judul SEO optimized, max 100 char, frontload keyword utama",
  "titleVariants": ["3 alternative title untuk A/B test, max 100 char each"],
  "description": "deskripsi 300-500 kata: paragraf pembuka catchy + ringkasan poin + timestamps (00:00 - 02:00 format) + hashtag #sibermas #uinsaizu #edukasi + CTA subscribe + disclaimer ringkas",
  "tags": ["12-15 tag relevan, mix kata kunci spesifik + general, lowercase"],
  "chapters": [{"timeSec": 0, "label": "Pembuka"}, {"timeSec": 20, "label": "..."}],
  "categoryId": "27 untuk Education, 22 untuk People & Blogs (default Islamic = 22)",
  "defaultLanguage": "id",
  "defaultAudioLanguage": "id"
}

Buat 4-6 chapters proporsional dengan durasi video ~2-3 menit.
Tags HARUS include: sibermas, uin saizu, edukasi.`;

  const usr = `Channel: ${input.channelName}
Topik: ${input.topic}
Judul awal: ${input.title}
Base tags: ${(input.baseTags || []).join(", ")}

Naskah video:
${input.narration.slice(0, 2500)}

Generate metadata SEO YouTube.`;

  const result = await snifoxChat({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
    model: "anthropic/claude-opus-4.7",
    temperature: 0.6,
    maxTokens: 2500,
    responseFormat: "json_object",
  });

  const parsed = safeParseJson<Partial<YouTubeSeo>>(result.content);
  const title = String(parsed.title || input.title).slice(0, 100);
  const titleVariants = Array.isArray(parsed.titleVariants)
    ? parsed.titleVariants.map((t) => String(t).slice(0, 100)).slice(0, 5)
    : [title];
  const description = String(parsed.description || "").slice(0, 5000);
  const baseRequiredTags = ["sibermas", "uin saizu", "edukasi"];
  const tags = Array.isArray(parsed.tags)
    ? [...new Set([...parsed.tags.map((t) => String(t).toLowerCase().trim()), ...baseRequiredTags])].filter(Boolean).slice(0, 15)
    : baseRequiredTags;
  const chapters = Array.isArray(parsed.chapters)
    ? parsed.chapters.slice(0, 10).map((c, i) => ({
        timeSec: Number(c.timeSec ?? i * 20) || 0,
        label: String(c.label || `Bagian ${i + 1}`).slice(0, 100),
      }))
    : [];
  return {
    title,
    titleVariants,
    description,
    tags,
    chapters,
    categoryId: String(parsed.categoryId || "22"),
    defaultLanguage: String(parsed.defaultLanguage || "id"),
    defaultAudioLanguage: String(parsed.defaultAudioLanguage || "id"),
  };
}
