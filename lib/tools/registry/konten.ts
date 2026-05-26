import "server-only";
import type { Tool } from "../types";

const COMMON_HAIKU = "anthropic/claude-haiku-4.5";
const COMMON_SONNET = "anthropic/claude-sonnet-4.6";

export const KONTEN_TOOLS: Tool[] = [
  {
    slug: "plan-konten",
    emoji: "📅",
    label: "PLAN KONTEN",
    category: "konten",
    description: "Buat rencana konten 7-30 hari sekaligus dari topik niche.",
    badge: "NEW",
    fields: [
      {
        name: "niche",
        label: "Niche / Topik Channel",
        kind: "text",
        placeholder: "Contoh: dakwah harian, kajian islam mahasiswa, edukasi UIN",
        required: true,
      },
      {
        name: "days",
        label: "Jumlah Hari",
        kind: "select",
        default: "7",
        options: [
          { value: "7", label: "7 hari (1 minggu)" },
          { value: "14", label: "14 hari (2 minggu)" },
          { value: "30", label: "30 hari (1 bulan)" },
        ],
      },
      {
        name: "platform",
        label: "Platform Utama",
        kind: "select",
        default: "youtube",
        options: [
          { value: "youtube", label: "YouTube Long-form" },
          { value: "shorts", label: "YouTube Shorts" },
          { value: "tiktok", label: "TikTok" },
          { value: "mix", label: "Mix (YT + Shorts + TikTok)" },
        ],
      },
      {
        name: "audience",
        label: "Target Audiens",
        kind: "text",
        placeholder: "Contoh: mahasiswa muslim 18-25 tahun, ibu rumah tangga",
        default: "mahasiswa muslim 18-25 tahun",
      },
    ],
    config: {
      kind: "llm",
      model: COMMON_SONNET,
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: `Anda adalah content planner profesional untuk channel kreator dakwah/edukasi Indonesia.
Buat rencana konten harian yang ENGAGING, SEARCHABLE, dan KONSISTEN dengan niche yang diberikan.

Untuk setiap hari, sertakan:
- Hari ke-N (label tema mingguan opsional)
- Judul video (60-80 char, ada hook + benefit + curiosity)
- Hook 3 detik pertama (1 kalimat, untuk overlay teks)
- Outline konten (5-7 bullet point)
- Estimasi durasi
- 5 hashtag relevan
- Catatan SEO singkat (target keyword utama)

Format output: markdown rapi, gunakan H2 per hari (## Hari 1).
Bahasa: Indonesia santai-profesional, hindari clickbait yang tidak ditepati.`,
      buildUserPrompt: (input) =>
        `Niche: ${input.niche}
Hari: ${input.days}
Platform: ${input.platform}
Target Audiens: ${input.audience}

Buat rencana konten ${input.days} hari penuh.`,
      outputType: "markdown",
    },
  },
  {
    slug: "gudang-konten",
    emoji: "📜",
    label: "GUDANG KONTEN",
    category: "konten",
    description: "Brainstorm 30+ ide konten viral dari 1 keyword/topik.",
    fields: [
      {
        name: "topic",
        label: "Topik / Keyword",
        kind: "text",
        placeholder: "Contoh: shalat tahajud, doa pagi, tafsir al-fatihah",
        required: true,
      },
      {
        name: "format",
        label: "Format Konten",
        kind: "select",
        default: "mixed",
        options: [
          { value: "mixed", label: "Campuran (long+short)" },
          { value: "longform", label: "Long-form Only" },
          { value: "shorts", label: "Shorts/TikTok Only" },
        ],
      },
      {
        name: "count",
        label: "Jumlah Ide",
        kind: "select",
        default: "30",
        options: [
          { value: "10", label: "10 ide" },
          { value: "30", label: "30 ide" },
          { value: "50", label: "50 ide" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: COMMON_SONNET,
      temperature: 0.85,
      maxTokens: 4000,
      systemPrompt: `Anda adalah ideation engine untuk konten Islami yang viral.
Bangkitkan ide konten dengan variasi angle: pertanyaan netizen, mitos vs fakta, kisah inspiratif, perbandingan, list/ranking, behind-the-scene, reaksi, dll.

Untuk setiap ide:
- Judul (catchy, 60-80 char)
- Angle (kategori angle: pertanyaan/mitos/list/kisah/etc)
- Hook 1 kalimat
- Format yang disarankan (long/short)

Output: markdown table atau numbered list dengan struktur konsisten.
Hindari clickbait menyesatkan — hook menarik tapi konten tetap delivers.`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topic}
Format: ${input.format}
Jumlah: ${input.count} ide

Generate ${input.count} ide konten variatif dengan angle berbeda-beda.`,
      outputType: "markdown",
    },
  },
  {
    slug: "gudang-ide",
    emoji: "💡",
    label: "GUDANG IDE",
    category: "konten",
    description: "Pancing ide segar dari trending topic + niche Anda.",
    fields: [
      {
        name: "trend",
        label: "Trending / Berita Terkini",
        kind: "textarea",
        rows: 3,
        placeholder: "Tempel berita atau topic trending. Contoh: Ramadhan tinggal 2 bulan",
        required: true,
      },
      {
        name: "niche",
        label: "Niche Channel Anda",
        kind: "text",
        placeholder: "Dakwah / Edukasi Islam / dst",
        default: "dakwah",
      },
    ],
    config: {
      kind: "llm",
      model: COMMON_SONNET,
      temperature: 0.85,
      maxTokens: 2500,
      systemPrompt: `Anda adalah news-jacking expert. Tugas: connect trending topic dengan niche kreator agar dapat ide konten yang RELEVAN dan TIMELY.

Untuk 1 trending topic, generate 10 ide angle:
- 3 angle pertanyaan/keresahan netizen
- 3 angle perspektif islami/dakwah
- 2 angle kisah/anekdot
- 2 angle praktis/tips

Tiap ide: judul + 1 kalimat hook + format saran (long/short).
Output: markdown numbered list.`,
      buildUserPrompt: (input) =>
        `Trending/Berita: ${input.trend}
Niche channel: ${input.niche}

Bangkitkan 10 ide news-jacking yang ngga maksa.`,
      outputType: "markdown",
    },
  },
  {
    slug: "creator-ultima",
    emoji: "🚀",
    label: "CREATOR ULTIMA",
    category: "konten",
    description: "Full creator brief dari topik: judul + skrip + thumbnail + SEO + hashtag.",
    badge: "NEW",
    fields: [
      {
        name: "topic",
        label: "Topik Video",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: Cara shalat tahajud yang benar dan keutamaannya",
        required: true,
      },
      {
        name: "duration",
        label: "Target Durasi",
        kind: "select",
        default: "8min",
        options: [
          { value: "60s", label: "60 detik (Shorts)" },
          { value: "3min", label: "3 menit" },
          { value: "8min", label: "8 menit (mid-form)" },
          { value: "15min", label: "15 menit" },
        ],
      },
      {
        name: "tone",
        label: "Gaya Penyampaian",
        kind: "select",
        default: "santai",
        options: [
          { value: "santai", label: "Santai-Edukatif" },
          { value: "ceramah", label: "Ceramah Formal" },
          { value: "inspiratif", label: "Inspiratif-Motivatif" },
          { value: "santaifun", label: "Santai-Fun" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-opus-4.7",
      temperature: 0.7,
      maxTokens: 5500,
      systemPrompt: `Anda adalah creator suite all-in-one. Untuk SATU topik, hasilkan paket lengkap berikut dalam markdown bab-bab:

## 1. Judul (5 alternatif)
5 judul berbeda angle (curiosity, benefit, list, how-to, mistake)

## 2. Hook 3 Detik
3 alternatif hook untuk overlay teks Shorts/intro

## 3. Outline Skrip
Struktur lengkap (intro → 3-5 main points → outro/CTA) sesuai durasi

## 4. Skrip Penuh
Skrip kata-per-kata lengkap, gaya bicara, jeda, dan instruksi visual

## 5. Thumbnail
3 konsep thumbnail: copy (max 4 kata), elemen visual, palette warna

## 6. SEO
Title final, description (200-300 kata), 15 tag, 5 hashtag

## 7. Distribusi
Jam upload optimal, cross-post strategy (Shorts cut, Reels, TikTok), hashtag platform-specific

Bahasa: Indonesia profesional. Hindari clickbait menyesatkan.`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topic}
Durasi: ${input.duration}
Tone: ${input.tone}

Generate paket creator lengkap.`,
      outputType: "markdown",
    },
  },
  {
    slug: "ceritaku",
    emoji: "📜",
    label: "CERITAKU",
    category: "konten",
    description: "Tulis cerita pendek inspiratif/Islami dari outline kasar.",
    fields: [
      {
        name: "outline",
        label: "Outline / Premis Cerita",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: Pemuda yang putus asa karena hutang, lalu bertemu kakek bijak di masjid...",
        required: true,
      },
      {
        name: "length",
        label: "Panjang Cerita",
        kind: "select",
        default: "medium",
        options: [
          { value: "short", label: "Pendek (300-500 kata)" },
          { value: "medium", label: "Sedang (800-1200 kata)" },
          { value: "long", label: "Panjang (1500-2500 kata)" },
        ],
      },
      {
        name: "moral",
        label: "Pesan Moral / Quote",
        kind: "text",
        placeholder: "Pesan yang ingin disampaikan di akhir cerita",
      },
    ],
    config: {
      kind: "llm",
      model: COMMON_SONNET,
      temperature: 0.85,
      maxTokens: 4500,
      systemPrompt: `Anda adalah penulis cerita inspiratif Islami. Tulis cerita yang menyentuh, alami (tidak menggurui), dengan dialog hidup dan deskripsi setting yang kuat.

Struktur:
- Pembuka yang langsung memikat (jangan banyak narasi setting awal)
- Konflik/tension yang relate dengan kehidupan
- Turning point (sering: pertemuan/peristiwa/dzikir)
- Resolusi yang natural
- Pesan moral implisit (jangan disebut "pesan moral:" — biarkan tersirat)

Hindari: stereotip karakter, dialog kaku, ending dadakan.
Bahasa: Indonesia santai-sastra, gunakan present tense untuk dialog.`,
      buildUserPrompt: (input) =>
        `Outline: ${input.outline}
Panjang: ${input.length}
Pesan moral: ${input.moral || "(biarkan tersirat dari plot)"}

Tulis ceritanya.`,
      outputType: "markdown",
    },
  },
];
