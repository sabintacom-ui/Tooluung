import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";

export const MUSIC_TOOLS: Tool[] = [
  {
    slug: "plan-music",
    emoji: "🎵",
    label: "PLAN MUSIC",
    category: "music",
    description: "Rencana rilis musik 1 bulan: tema, jadwal, target platform.",
    badge: "NEW",
    fields: [
      {
        name: "artist",
        label: "Nama Artist / Channel Musik",
        kind: "text",
        required: true,
      },
      {
        name: "genre",
        label: "Genre Utama",
        kind: "text",
        placeholder: "Religi, Nasheed, Pop, Reggae, Lofi, dll",
        default: "Religi",
      },
      {
        name: "releases",
        label: "Jumlah Rilis Bulan Ini",
        kind: "select",
        default: "4",
        options: [
          { value: "2", label: "2 lagu / bulan" },
          { value: "4", label: "4 lagu / bulan" },
          { value: "8", label: "8 lagu / bulan" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 3500,
      systemPrompt: `Anda adalah music marketing strategist Indonesia. Buat rencana rilis 1 bulan dengan struktur:

## Calendar Overview
Tabel: Tanggal | Judul Lagu | Genre Sub | Platform Premier | Status

Untuk setiap rilis, sertakan:
- Tema lagu (1 paragraf)
- Style tag Suno (5-8 tag siap copy)
- Caption Instagram + hashtag (5)
- Caption TikTok + sound hook (10 detik)
- Spotify/YT Music pitch 50 kata
- Saran kolaborasi/duet

Akhiri dengan "## Promo Strategy" 1 paragraf.`,
      buildUserPrompt: (input) =>
        `Artist: ${input.artist}\nGenre: ${input.genre}\nJumlah rilis: ${input.releases}\n\nGenerate kalender rilis 1 bulan.`,
      outputType: "markdown",
    },
  },
  {
    slug: "kampung-lirik",
    emoji: "🎼",
    label: "KAMPUNG LIRIK",
    category: "music",
    description: "Generate lirik nasheed / religi sederhana untuk kampung kreator.",
    fields: [
      {
        name: "theme",
        label: "Tema",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "tone",
        label: "Tone",
        kind: "select",
        default: "ringan",
        options: [
          { value: "ringan", label: "Ringan & santai" },
          { value: "khusyuk", label: "Khusyuk & syahdu" },
          { value: "ceria", label: "Ceria & energik" },
          { value: "sendu", label: "Sendu & merenung" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 2200,
      systemPrompt: `Tulis lirik nasheed/religi sederhana, format 2 verse + chorus + bridge. Hindari teologi rumit; fokus pada emosi rindu Allah, syukur, dan kebaikan sehari-hari. Bahasa Indonesia mudah dimengerti.

Struktur Suno:
[Verse 1]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Outro]

Akhiri dengan style tag rekomendasi: "nasheed, religious, acoustic, soft vocal, no music instruments OR with light backing".`,
      buildUserPrompt: (input) => `Tema: ${input.theme}\nTone: ${input.tone}`,
      outputType: "markdown",
    },
  },
  {
    slug: "kampung-lagu",
    emoji: "🎵",
    label: "KAMPUNG LAGU",
    category: "music",
    description: "Lirik pop Indonesia tema sehari-hari (tidak harus religi).",
    fields: [
      {
        name: "story",
        label: "Cerita / Konsep",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "mood",
        label: "Mood",
        kind: "select",
        default: "balada",
        options: [
          { value: "balada", label: "Balada Sendu" },
          { value: "uplifting", label: "Uplifting & Hopeful" },
          { value: "patah", label: "Patah Hati" },
          { value: "syukur", label: "Syukur & Kebahagiaan" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 2200,
      systemPrompt: `Tulis lirik pop Indonesia ber-rhyme alami, struktur Suno standar. Tone disesuaikan permintaan user. Hindari clichés ("hatiku hancur berkeping-keping" dll). Cari metafora segar.

Akhiri dengan style tag: "indonesian pop, acoustic ballad, gentle vocal, mid tempo, emotional".`,
      buildUserPrompt: (input) => `Cerita: ${input.story}\nMood: ${input.mood}`,
      outputType: "markdown",
    },
  },
  {
    slug: "kampung-music",
    emoji: "🎸",
    label: "KAMPUNG MUSIC",
    category: "music",
    description: "Aransemen ringkas: chord progression + struktur untuk dimainkan gitar/piano.",
    fields: [
      {
        name: "song",
        label: "Konsep Lagu / Tema",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "key",
        label: "Kunci Dasar",
        kind: "select",
        default: "C",
        options: [
          { value: "C", label: "C major (mudah)" },
          { value: "G", label: "G major" },
          { value: "D", label: "D major" },
          { value: "Am", label: "A minor (sendu)" },
          { value: "Em", label: "E minor" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: `Buat aransemen ringkas untuk lagu solo gitar/piano:

## Struktur (4 section minimal)
- Intro [chord progression]
- Verse [chord progression]
- Chorus [chord progression]
- Bridge/Outro [chord progression]

## BPM & Time Signature
Sertakan strumming pattern untuk gitar (e.g. D D U U D U).

## Saran Capo
Jika kunci aslinya sulit, sarankan posisi capo + transpose.

## Suno Equivalent Tag
Tag style untuk reproduce di Suno.`,
      buildUserPrompt: (input) => `Konsep: ${input.song}\nKey: ${input.key}`,
      outputType: "markdown",
    },
  },
  {
    slug: "qolbu-spoken",
    emoji: "💝",
    label: "QOLBU SPOKEN",
    category: "spoken",
    description: "Spoken word religi tone hangat-personal (bukan ceramah).",
    fields: [
      {
        name: "theme",
        label: "Tema Renungan",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "duration",
        label: "Durasi Target",
        kind: "select",
        default: "60s",
        options: [
          { value: "30s", label: "30 detik" },
          { value: "60s", label: "60 detik" },
          { value: "90s", label: "90 detik" },
          { value: "180s", label: "3 menit" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 1800,
      systemPrompt: `Tulis spoken word religi yang HANGAT, PERSONAL, dan REFLEKTIF (bukan ceramah formal). Bayangkan suara teman dekat yang sedang merenung dengan kita di tengah malam.

Struktur 60-detik standar:
- Hook 5 detik (pertanyaan retorik atau pernyataan kontrarian)
- Develop 25 detik (cerita / metafora)
- Twist 15 detik (perspektif baru)
- Closing 15 detik (kalimat resonant yang nyangkut)

Bahasa: Indonesia santai, hindari kata-kata berat (transendental, esensial, dst). Pakai imagery konkret (kopi pagi, jalan pulang, hujan, dll).

Output:
- Skrip spoken word + jeda (...)
- BGM saran (1 paragraf)
- Tone of voice arahan untuk voice actor`,
      buildUserPrompt: (input) => `Tema: ${input.theme}\nDurasi: ${input.duration}`,
      outputType: "markdown",
    },
  },
  {
    slug: "spoken-word-generator",
    emoji: "🗣️",
    label: "SPOKEN WORD GENERATOR",
    category: "spoken",
    description: "Spoken word generic (tidak harus religi) — motivasi, refleksi, kritik sosial.",
    fields: [
      {
        name: "theme",
        label: "Tema",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "style",
        label: "Style",
        kind: "select",
        default: "reflektif",
        options: [
          { value: "reflektif", label: "Reflektif Personal" },
          { value: "motivasi", label: "Motivasi Powerful" },
          { value: "kritik", label: "Kritik Sosial" },
          { value: "humor", label: "Humor Sarkasme" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 1800,
      systemPrompt: `Tulis spoken word ber-rhythm yang punya turn (twist) di tengah. Ada flow alami untuk dibaca cepat.

Output:
- Spoken word skrip dengan jeda eksplisit (...)
- BPM bicara saran (slow/medium/fast)
- BGM mood
- Estimasi durasi`,
      buildUserPrompt: (input) => `Tema: ${input.theme}\nStyle: ${input.style}`,
      outputType: "markdown",
    },
  },
  {
    slug: "relax-music-prompt",
    emoji: "🧘",
    label: "RELAX MUSIC PROMPT",
    category: "spoken",
    description: "Prompt musik relaksasi/sleep/meditasi untuk Suno atau generator lainnya.",
    fields: [
      {
        name: "purpose",
        label: "Tujuan",
        kind: "select",
        default: "sleep",
        options: [
          { value: "sleep", label: "Sleep Aid" },
          { value: "meditation", label: "Meditation" },
          { value: "study", label: "Study Focus" },
          { value: "yoga", label: "Yoga / Stretching" },
          { value: "spa", label: "Spa Background" },
        ],
      },
      {
        name: "duration",
        label: "Durasi",
        kind: "select",
        default: "60min",
        options: [
          { value: "10min", label: "10 menit" },
          { value: "30min", label: "30 menit" },
          { value: "60min", label: "60 menit" },
          { value: "180min", label: "3 jam" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.7,
      maxTokens: 1500,
      systemPrompt: `Generate prompt musik relaksasi sesuai tujuan + durasi.

Output:
## Suno Style Tags
[5-8 tag cocok]

## Suno Detail Prompt
80 kata English: instrumentation, BPM, key, dynamics over time

## Spotify-Style Description
50 kata untuk listing playlist

## Soundscape Layer
3-5 layer suara natural untuk dicampur (rain, fireplace, white noise, etc)`,
      buildUserPrompt: (input) => `Tujuan: ${input.purpose}\nDurasi: ${input.duration}`,
      outputType: "markdown",
    },
  },
];
