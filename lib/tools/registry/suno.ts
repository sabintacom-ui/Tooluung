import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";

export const SUNO_TOOLS: Tool[] = [
  {
    slug: "prompt-suno-instrumen",
    emoji: "🎶",
    label: "PROMPT SUNO INSTRUMEN",
    category: "suno",
    description: "Generate prompt instrumental Suno dari mood/genre.",
    fields: [
      {
        name: "mood",
        label: "Mood / Atmosfer",
        kind: "text",
        placeholder: "khusyuk, tenang, hopeful, sad, cinematic",
        required: true,
      },
      {
        name: "genre",
        label: "Genre Musik",
        kind: "select",
        default: "ambient",
        options: [
          { value: "ambient", label: "Ambient / Cinematic" },
          { value: "lofi", label: "Lo-fi" },
          { value: "orchestral", label: "Orchestral" },
          { value: "acoustic", label: "Acoustic Guitar" },
          { value: "piano", label: "Piano Solo" },
          { value: "religious", label: "Religious / Nasheed Background" },
        ],
      },
      {
        name: "duration",
        label: "Durasi Target",
        kind: "select",
        default: "60s",
        options: [
          { value: "30s", label: "30 detik (Shorts)" },
          { value: "60s", label: "60 detik" },
          { value: "120s", label: "2 menit" },
          { value: "180s", label: "3 menit" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.8,
      maxTokens: 2000,
      systemPrompt: `Anda adalah prompt engineer untuk Suno AI (instrumental mode).

Output:
## Style Tags (untuk Suno style box)
[5-8 tag dipisah koma, format Suno: "ambient cinematic, ethereal pad, deep emotional, slow tempo, 60 BPM, no vocals, instrumental"]

## Detail Prompt (lengkap, 80-120 kata English)
[deskripsi struktur lagu: intro 0-10s build → main theme 10-40s → outro 40-60s, instrument list, BPM, key, dynamics]

## Negative Prompt
[apa yang HARUS tidak ada — contoh: vocals, drums, distortion]

## Variation Tags
2-3 alternative tag set kalau hasil pertama tidak match`,
      buildUserPrompt: (input) =>
        `Mood: ${input.mood}\nGenre: ${input.genre}\nDurasi: ${input.duration}\n\nGenerate Suno prompt instrumental.`,
      outputType: "markdown",
    },
  },
  {
    slug: "prompt-instrument",
    emoji: "🎹",
    label: "PROMPT INSTRUMENT",
    category: "suno",
    description: "Detail orchestration: instrument layering per section.",
    fields: [
      {
        name: "song",
        label: "Konsep Lagu",
        kind: "textarea",
        rows: 3,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 2500,
      systemPrompt: `Anda adalah arranger profesional. Pecah konsep lagu jadi 4 section (intro, verse, chorus, outro), per section list:
- Lead instrument
- Pad/atmosphere
- Rhythm section
- BPM + key
- Dynamics (pp/p/mp/mf/f/ff)
- Notable instrument entry/exit

Output markdown table per section + saran Suno style tags untuk reproduce.`,
      buildUserPrompt: (input) => `Konsep: ${input.song}`,
      outputType: "markdown",
    },
  },
  {
    slug: "pembuat-lirik-lagu-suno",
    emoji: "🎤",
    label: "PEMBUAT LIRIK LAGU SUNO",
    category: "suno",
    description: "Lirik lagu Suno-ready dengan struktur [Verse]/[Chorus]/[Bridge].",
    fields: [
      {
        name: "theme",
        label: "Tema Lagu",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: rindu kampung halaman saat ramadhan",
        required: true,
      },
      {
        name: "language",
        label: "Bahasa",
        kind: "select",
        default: "id",
        options: [
          { value: "id", label: "Indonesia" },
          { value: "ar", label: "Arab" },
          { value: "en", label: "English" },
          { value: "mixed", label: "Mix Indonesia + Arab" },
        ],
      },
      {
        name: "style",
        label: "Genre",
        kind: "select",
        default: "pop",
        options: [
          { value: "pop", label: "Pop / Ballad" },
          { value: "nasheed", label: "Nasheed" },
          { value: "religi", label: "Religi" },
          { value: "rock", label: "Rock / Pop Rock" },
          { value: "indie", label: "Indie Folk" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 2500,
      systemPrompt: `Anda adalah lyricist Suno-format. Tulis lirik lengkap dengan struktur tag Suno:

[Intro]
...

[Verse 1]
4 baris

[Pre-Chorus]
2 baris

[Chorus]
4 baris (repetable, hook kuat)

[Verse 2]
4 baris

[Chorus]
(repeat)

[Bridge]
2-4 baris (twist makna)

[Chorus]
(repeat with variation/lift)

[Outro]
1-2 baris

Aturan:
- Lirik harus rhyme alami (jangan dipaksa)
- Hindari clichés over-used
- Hook chorus harus catchy + repeatable
- Sesuai bahasa + genre yang diminta

Setelah lirik, beri rekomendasi style tag Suno (5-8 tag).`,
      buildUserPrompt: (input) =>
        `Tema: ${input.theme}\nBahasa: ${input.language}\nGenre: ${input.style}\n\nTulis lirik lengkap.`,
      outputType: "markdown",
    },
  },
  {
    slug: "pembuat-lirik-reggae",
    emoji: "🎸",
    label: "PEMBUAT LIRIK LAGU REGGAE",
    category: "suno",
    description: "Lirik bergaya reggae/ska Indonesia dengan vibes positif.",
    fields: [
      {
        name: "theme",
        label: "Tema",
        kind: "textarea",
        rows: 3,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.9,
      maxTokens: 2200,
      systemPrompt: `Anda adalah lyricist reggae Indonesia. Tulis lirik dengan vibes Tony Q Rastafara / Steven & Coconut Treez / Ras Muhamad: santai, positif, ada pesan sosial atau spiritual.

Format Suno:
[Intro Skank]
[Verse 1]
[Chorus]
[Verse 2]
[Chorus]
[Bridge / Toasting]
[Outro]

Style tag akhir: "reggae, roots, dub influence, Indonesia, mid-tempo, conscious lyrics".

Sertakan 1-2 baris bahasa Jamaika/patois di toasting (autentik tapi tidak overdo).`,
      buildUserPrompt: (input) => `Tema: ${input.theme}`,
      outputType: "markdown",
    },
  },
  {
    slug: "konten-musik-lengkap",
    emoji: "🌍",
    label: "PEMBUAT KONTEN MUSIK LENGKAP",
    category: "suno",
    description: "Paket all-in-one: judul lagu + lirik + style + cover prompt + video prompt.",
    fields: [
      {
        name: "concept",
        label: "Konsep Lagu",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "language",
        label: "Bahasa",
        kind: "select",
        default: "id",
        options: [
          { value: "id", label: "Indonesia" },
          { value: "en", label: "English" },
          { value: "mixed", label: "Mix" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-opus-4.7",
      temperature: 0.85,
      maxTokens: 4500,
      systemPrompt: `Anda adalah music package generator. Untuk 1 konsep lagu, hasilkan:

## 1. Judul Lagu (5 alternatif)
## 2. Style Tag Suno (5-8 tag)
## 3. Lirik Lengkap (struktur Suno)
## 4. Cover Art Prompt (Midjourney English, 1:1, dramatic)
## 5. Music Video Concept (3-shot storyboard)
## 6. Distribusi
- Caption Instagram + hashtag
- Caption TikTok + sound description
- Spotify pitch (50 kata)

Bahasa lirik mengikuti pilihan user. Bahasa output non-lirik: Indonesia.`,
      buildUserPrompt: (input) =>
        `Konsep: ${input.concept}\nBahasa lirik: ${input.language}\n\nGenerate package lengkap.`,
      outputType: "markdown",
    },
  },
  {
    slug: "style-suno-instrument",
    emoji: "🎵",
    label: "STYLE SUNO INSTRUMENT",
    category: "suno",
    description: "100+ style tag Suno per genre, instant copy-paste.",
    fields: [
      {
        name: "genre",
        label: "Genre / Mood",
        kind: "text",
        placeholder: "Contoh: cinematic worship, lofi study, epic battle",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.8,
      maxTokens: 1500,
      systemPrompt: `Generate 30 alternative style tag combination untuk Suno, dipisah dalam 5 cluster:

## Cluster 1 — Conservative (predictable)
6 tag combos

## Cluster 2 — Slight Variation
6 combos

## Cluster 3 — Hybrid Genre
6 combos

## Cluster 4 — Experimental
6 combos

## Cluster 5 — Cinematic Boost
6 combos

Setiap combo: 1 baris, 4-7 tag dipisah koma, copy-paste ready.`,
      buildUserPrompt: (input) => `Genre/Mood: ${input.genre}`,
      outputType: "markdown",
    },
  },
  {
    slug: "suno-cinematic-pro",
    emoji: "🎬",
    label: "SUNO CINEMATIC PRO",
    category: "suno",
    description: "Cinematic music structure detail untuk scoring video/film.",
    fields: [
      {
        name: "scene",
        label: "Deskripsi Scene/Mood",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "duration",
        label: "Durasi",
        kind: "select",
        default: "120s",
        options: [
          { value: "60s", label: "1 menit" },
          { value: "120s", label: "2 menit" },
          { value: "180s", label: "3 menit" },
          { value: "240s", label: "4 menit" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.8,
      maxTokens: 2800,
      systemPrompt: `Anda adalah film composer untuk produksi indie. Tulis blueprint cinematic music siap di-prompt ke Suno.

## Score Outline
Pecah durasi jadi 4-6 section dengan timecode:
- 0:00-0:15 Opening (subdued)
- 0:15-0:45 Build-up
- 0:45-1:30 Main theme
- 1:30-2:00 Climax
- 2:00-2:30 Resolution

Per section: instrument layering, dynamics, mood transition.

## Suno Style Box
[5-8 tag cinematic-specific]

## Detail Prompt
[Suno detail prompt 100 kata English]

## References (untuk inspirasi mental)
3 contoh score dari film/series yang punya vibe serupa.`,
      buildUserPrompt: (input) => `Scene: ${input.scene}\nDurasi: ${input.duration}`,
      outputType: "markdown",
    },
  },
];
