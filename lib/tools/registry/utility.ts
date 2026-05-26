import "server-only";
import type { Tool } from "../types";

const SIBERMAS_WA = "https://wa.me/6287884242420";

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
    description: "Hubungi admin Sibermas via WhatsApp resmi.",
    fields: [],
    config: {
      kind: "info",
      content: `## 📞 Hubungi Sibermas UIN SAIZU

Halo! Anda bisa menghubungi admin Sibermas untuk:

- 💼 Konsultasi konten dakwah & edukasi
- 🤝 Kerjasama channel/produksi
- 🐛 Laporan bug atau saran fitur
- 💡 Request fitur baru
- 📚 Pelatihan offline kreator pemula

### 📱 Admin Sibermas
**WhatsApp**: 087884242420
**Email**: sibermas@uinsaizu.ac.id
**Lokasi**: Purwokerto, Jawa Tengah

### ⏰ Jam Operasional
Senin–Jumat, 08:00–16:00 WIB

### 🌐 Lainnya
- Website kampus: https://uinsaizu.ac.id
- Channel YouTube: cek dashboard Generator
- Sosmed: @sibermas_uinsaizu`,
      ctaLabel: "💬 Buka WhatsApp Sekarang",
      ctaUrl: SIBERMAS_WA,
    },
  },
  {
    slug: "sibermas-downloader",
    emoji: "📥",
    label: "SIBERMAS DOWNLOADER",
    category: "utility",
    description: "Download MP3/MP4 dari URL YouTube — service Sibermas internal.",
    badge: "BETA",
    fields: [],
    config: {
      kind: "info",
      content: `## 📥 Sibermas Downloader

Layanan download MP3/MP4 dari YouTube **internal Sibermas** untuk konten dakwah/edukasi.

### ⚙️ Status Layanan
🟡 **Beta** — sedang dalam tahap pengembangan UI publik.

### 🎯 Fitur (Roadmap)
- ✅ Download MP3 (audio only) dari URL YouTube
- ✅ Download MP4 (video) dengan pilihan resolusi
- 🔜 Trim by timestamp (clip section saja)
- 🔜 Batch download dari playlist
- 🔜 Auto-tag metadata (judul, artist, thumbnail)

### 🔧 Untuk Sementara
Layanan available via Clipper Shorts pipeline — kalau Anda butuh download manual, hubungi admin.

### 🧰 Tech Stack
- yt-dlp 2026.03.17 (server Sibermas)
- FFmpeg untuk konversi audio
- Self-hosted di sibermas.rizquna.id

### ⚠️ Etika & Hak Cipta
- Hanya untuk konten public/Creative Commons
- Tidak untuk distribusi ulang komersial
- Hormati hak cipta kreator asli`,
      ctaLabel: "💬 Request Akses ke Admin",
      ctaUrl: SIBERMAS_WA,
    },
  },
  {
    slug: "sibermas-video-tools",
    emoji: "🎬",
    label: "SIBERMAS VIDEO TOOLS",
    category: "utility",
    description: "Suite video editor Sibermas: combiner, cropper, transcoder.",
    badge: "BETA",
    fields: [],
    config: {
      kind: "info",
      content: `## 🎬 Sibermas Video Tools

Kumpulan utilitas video processing **internal Sibermas** untuk kreator dakwah.

### 🛠️ Tools yang Tersedia (via API/Pipeline)

#### 1. Video Combiner
Gabungkan beberapa MP4 jadi satu video continuous.
- Auto-resize ke resolusi target
- Transition cross-fade opsional
- Output H.264 + AAC

#### 2. Video Cropper / Aspect Converter
Convert horizontal 16:9 ke vertical 9:16 (Shorts) atau square 1:1.
- Smart center crop
- Blur-pad background (style Reels)
- Auto-letterbox

#### 3. Video Transcoder
Convert format (MP4/MOV/WebM/GIF).
- Compress untuk web (CRF 23)
- Bitrate target untuk YouTube/IG/TikTok
- Frame rate normalization

### 📺 Sudah Tersedia
**Clipper Shorts** (lihat menu Featured) — sudah live dan otomatis convert kajian panjang ke Shorts 9:16.

### 🔜 Coming Soon
UI publik untuk video tools standalone (tanpa harus pakai Clipper pipeline).

### 🧰 Tech Stack
- FFmpeg 6.0 (server Sibermas)
- Self-hosted di sibermas.rizquna.id
- Auto-cleanup output setelah 7 hari`,
      ctaLabel: "💬 Request Custom Edit",
      ctaUrl: SIBERMAS_WA,
    },
  },
  {
    slug: "sibermas-sewa-live",
    emoji: "📺",
    label: "SIBERMAS SEWA LIVE",
    category: "utility",
    description: "Layanan sewa peralatan live streaming Sibermas UIN SAIZU.",
    fields: [],
    config: {
      kind: "info",
      content: `## 📺 Sibermas Sewa Live Streaming

Layanan **sewa peralatan + tim live streaming** untuk acara dakwah, kajian, seminar, dan event mahasiswa di area Purwokerto & sekitarnya.

### 🎬 Paket Layanan

#### Paket Basic (Rp 500K/event, max 3 jam)
- 1 kamera HD + tripod
- 1 mic clip-on
- 1 operator
- Stream ke 1 platform (YouTube/FB/IG)

#### Paket Standard (Rp 1.2jt/event, max 6 jam)
- 2 kamera multi-angle
- 2 mic (clip-on + handheld)
- 1 operator + 1 teknisi
- Stream ke 3 platform simultan
- Lighting kit basic

#### Paket Premium (Rp 2.5jt/event, max full-day)
- 3 kamera + drone view
- Audio mixer profesional
- Tim 3 orang
- Multi-platform streaming
- Full lighting + softbox
- Recording cadangan

### 🎯 Cocok Untuk
- Kajian rutin masjid
- Wisuda & acara kampus
- Kajian online RT/RW
- Kuliah online dosen
- Khutbah Jumat
- Webinar & workshop

### 📍 Area Layanan
- Purwokerto Kota
- Banyumas
- Cilacap (extra biaya transport)
- Wilayah eks-Karesidenan Banyumas

### ✨ Yang Bikin Kami Berbeda
- Tim mahasiswa UIN SAIZU yang berpengalaman
- Harga support kreator pemula
- Konsultasi konten gratis sebelum event
- Backup recording disertakan
- Multi-platform streaming default

### 📞 Booking
Booking minimal H-7 sebelum acara. Hubungi admin di WhatsApp untuk:
- Konsultasi paket
- Survey lokasi
- Kontrak & invoice resmi`,
      ctaLabel: "💬 Booking via WhatsApp",
      ctaUrl: SIBERMAS_WA,
    },
  },
  {
    slug: "sibermas-konsultasi",
    emoji: "🎓",
    label: "SIBERMAS KONSULTASI",
    category: "utility",
    description: "Konsultasi gratis seputar konten dakwah, channel YouTube, dan AI tools.",
    fields: [],
    config: {
      kind: "info",
      content: `## 🎓 Konsultasi Gratis Sibermas

Bagi kreator pemula yang ingin mulai channel dakwah/edukasi tapi bingung mulai dari mana, Sibermas menyediakan konsultasi gratis.

### 📚 Topik Konsultasi
- Niche selection untuk channel dakwah
- Setup peralatan recording (budget terbatas)
- Strategi konten konsisten 6 bulan pertama
- Monetisasi YouTube + ad approval
- AI workflow untuk produksi cepat
- Branding channel & visual identity
- Cross-platform distribution (YT + IG + TikTok)

### 🎯 Untuk Siapa?
- Mahasiswa UIN SAIZU (prioritas)
- Mahasiswa kampus lain
- Pesantren/madrasah yang mau punya channel
- Kreator dakwah pemula umum

### ⏰ Format
- 1 sesi = 30 menit
- Via Zoom atau WhatsApp call
- Maksimal 2 sesi/bulan per orang
- Gratis untuk konsultasi awal

### 📋 Yang Anda Dapat
- Channel audit (kalau sudah ada)
- 90-day content roadmap
- Tools rekomendasi (dari 80+ Sibermas tools)
- Network ke kreator lain di komunitas Sibermas
- Akses prioritas ke fitur Sibermas baru

### 📅 Booking Slot
Slot terbatas, daftar via WhatsApp dengan format:
\`\`\`
Nama: [nama Anda]
Asal: [kampus/kota]
Channel: [link kalau ada, atau "belum"]
Topik: [topik utama yg mau dibahas]
\`\`\``,
      ctaLabel: "💬 Daftar Konsultasi",
      ctaUrl: SIBERMAS_WA,
    },
  },
];
