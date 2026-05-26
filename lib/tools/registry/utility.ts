import "server-only";
import type { Tool } from "../types";

export const UTILITY_TOOLS: Tool[] = [
  {
    slug: "text-arab-alquran",
    emoji: "📖",
    label: "TEXT ARAB ALQURAN",
    category: "utility",
    description: "Cari & tampilkan ayat Al-Quran lengkap (Arab + transliterasi + terjemahan ID).",
    fields: [
      {
        name: "query",
        label: "Surah & Ayat (atau pencarian)",
        kind: "text",
        placeholder: "Contoh: Al-Fatihah 1-7  atau  ayat tentang sabar",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-opus-4.7",
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt: `Anda adalah Al-Quran reader yang akurat. Untuk query user:

1. Identifikasi surah & ayat (atau ayat-ayat relevan jika query tematik)
2. Untuk SETIAP ayat tampilkan blok:

\`\`\`
## QS. [Nama Surah] [no surah]:[no ayat]

**Arab:**
[teks Arab dengan harakat]

**Transliterasi:**
[transliterasi Indonesia standar]

**Terjemahan (Kemenag):**
[terjemahan resmi]

**Tafsir Singkat:**
[1-2 kalimat konteks/maksud]
\`\`\`

PENTING: Pastikan akurat. Jika ragu dengan ayat tertentu, sebutkan disclaimer "verifikasi dengan mushaf resmi".`,
      buildUserPrompt: (input) => `Query: ${input.query}`,
      outputType: "markdown",
    },
  },
  {
    slug: "cara-banding-dismonet",
    emoji: "📋",
    label: "CARA BANDING DISMONET",
    category: "utility",
    description: "Template surat banding monetisasi YouTube (dengan AI customization).",
    fields: [
      {
        name: "channel",
        label: "Nama Channel",
        kind: "text",
        required: true,
      },
      {
        name: "reason",
        label: "Alasan Dismonet (sebagaimana diberitahu YouTube)",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: reused content, low effort, repetitive content",
        required: true,
      },
      {
        name: "channel_desc",
        label: "Deskripsi Singkat Konten Channel",
        kind: "textarea",
        rows: 4,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-sonnet-4.6",
      temperature: 0.6,
      maxTokens: 2500,
      systemPrompt: `Anda adalah YouTube monetization appeal specialist. Tulis surat banding monetisasi yang:
- Bahasa English profesional (YouTube prefer English)
- Address spesifik alasan dismonet
- Tunjukkan transformatif element
- Sebut quality control & policy compliance

Format:
1. Salam pembuka
2. Konteks channel (1 paragraf)
3. Address spesifik alasan dismonet (3 paragraf evidence)
4. Komitmen kepatuhan policy (1 paragraf)
5. Closing + request review

Setelah surat English, beri RINGKASAN bahasa Indonesia 1 paragraf untuk user.

PENTING: jangan janji garansi banding pasti diterima. Tulis honest tapi optimis.`,
      buildUserPrompt: (input) =>
        `Channel: ${input.channel}\nAlasan dismonet: ${input.reason}\nDeskripsi konten: ${input.channel_desc}`,
      outputType: "markdown",
    },
  },
  {
    slug: "kontak-wa",
    emoji: "✉️",
    label: "KONTAK ADMIN WA",
    category: "utility",
    description: "Hubungi admin Sibermas via WhatsApp.",
    fields: [],
    config: {
      kind: "redirect",
      url: "https://wa.me/6287884242420",
      description:
        "Klik link di atas untuk membuka WhatsApp dan menghubungi admin Sibermas UIN SAIZU.",
    },
  },
  {
    slug: "download-mp3",
    emoji: "📥",
    label: "DOWNLOAD MP3 APP",
    category: "utility",
    description: "Aplikasi downloader MP3 (link external).",
    fields: [],
    config: {
      kind: "redirect",
      url: "https://bit.ly/kampungmp3",
      description: "Aplikasi pihak ketiga untuk download MP3. Kompatibel Windows.",
    },
  },
  {
    slug: "video-combiner",
    emoji: "🎬",
    label: "VIDEO COMBINER",
    category: "utility",
    description: "Aplikasi gabung beberapa video jadi 1 (link external).",
    fields: [],
    config: {
      kind: "redirect",
      url: "https://bit.ly/VideoCombinerWin",
      description: "Aplikasi Windows untuk gabung video. Cocok untuk batch upload.",
    },
  },
  {
    slug: "combiner-v3",
    emoji: "🎞️",
    label: "COMBINER V3",
    category: "utility",
    description: "Versi 3 aplikasi combiner dengan fitur lebih lengkap.",
    fields: [],
    config: {
      kind: "redirect",
      url: "https://bit.ly/combinerv3",
      description: "Versi terbaru combiner: support batch processing, watermark, dll.",
    },
  },
  {
    slug: "sewa-live",
    emoji: "📺",
    label: "SEWA LIVE",
    category: "utility",
    description: "Layanan sewa live streaming (link external).",
    fields: [],
    config: {
      kind: "redirect",
      url: "https://sewalive.com",
      description: "Layanan profesional untuk live streaming event/acara.",
    },
  },
];
