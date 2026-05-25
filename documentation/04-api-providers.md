# PRD — YouTube Content Automation Platform
## Dokumen 04: Spesifikasi API Providers

---

## 1. Prinsip Provider Layer

Setiap provider dibungkus dalam class yang mengimplementasikan interface yang sama. Ini memungkinkan:
- Swap provider tanpa ubah pipeline logic
- A/B test antar provider
- Fallback otomatis jika satu provider down
- Cost tracking terpusat

```typescript
interface AIProvider<TInput, TOutput> {
  name: string
  type: ProviderType           // 'llm' | 'tts' | 'music' | 'image' | 'video' | 'stock'
  generate(input: TInput): Promise<TOutput>
  estimateCost(input: TInput): number   // return USD
  isAvailable(): Promise<boolean>
}
```

---

## 2. Grok API (xAI) — LLM untuk Script & Metadata

### Fungsi dalam Pipeline
- Generate script video lengkap
- Generate 5 opsi judul
- Generate deskripsi (maks 5000 karakter)
- Generate tags (maks 500 karakter)
- Generate chapter timestamps
- Generate prompt untuk thumbnail
- Generate keyword untuk pencarian stock footage

### Konfigurasi

```typescript
// lib/providers/grok.ts
const GROK_CONFIG = {
  model: 'grok-3',              // atau grok-3-mini untuk hemat biaya
  max_tokens: 4096,
  temperature: 0.7,
  endpoint: 'https://api.x.ai/v1/chat/completions',
}
```

### Prompt Template (Script Generation)

```
System: Kamu adalah scriptwriter profesional YouTube untuk channel [CHANNEL_NAME].
Gaya penulisan: [TONE]
Target audiens: [TARGET_AUDIENCE]
Struktur video yang harus diikuti:
  - Hook pembuka (0–30 detik): langsung ke poin, menarik perhatian
  - Isi utama: informatif, mengalir natural
  - CTA penutup: [CTA_TEMPLATE]

Rules:
  - Gunakan bahasa yang natural untuk diucapkan (bukan dibaca)
  - Sertakan jeda natural "[pause]" setiap 2–3 kalimat
  - Durasi target: [DURATION] menit

User: Buat script untuk topik: [TOPIC]
Keywords tambahan: [KEYWORDS]
Catatan khusus: [NOTES]

Output harus berupa JSON dengan struktur yang sudah ditentukan.
```

### Estimasi Biaya

| Model | Input (per 1M token) | Output (per 1M token) | Est. per video |
|---|---|---|---|
| grok-3 | $3.00 | $15.00 | ~$0.05–0.15 |
| grok-3-mini | $0.30 | $0.50 | ~$0.01–0.03 |

### Fallback
Jika Grok tidak tersedia → fallback ke **Claude claude-sonnet-4-20250514** atau **GPT-4o**

---

## 3. ElevenLabs API — Text-to-Speech (Voiceover)

### Fungsi dalam Pipeline
- Konversi script ke audio MP3/WAV
- Multiple voice character per template
- Generate dengan timestamp per kalimat (untuk subtitle sync)

### Konfigurasi

```typescript
const ELEVENLABS_CONFIG = {
  endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
  model_id: 'eleven_multilingual_v2',    // Support Bahasa Indonesia
  output_format: 'mp3_44100_128',
  voice_settings: {
    stability: 0.5,           // 0–1, makin tinggi makin konsisten
    similarity_boost: 0.75,   // 0–1, kemiripan dengan voice asli
    style: 0.0,
    use_speaker_boost: true,
  }
}
```

### Endpoint yang Digunakan

```
POST /v1/text-to-speech/{voice_id}
POST /v1/text-to-speech/{voice_id}/with-timestamps   ← untuk subtitle sync
GET  /v1/voices                                        ← list voice tersedia
```

### Rekomendasi Voice untuk Konten Indonesia
- `Adam` — narasi maskulin, cocok untuk tutorial
- `Rachel` — narasi feminin, cocok untuk lifestyle
- Atau gunakan **Voice Cloning** untuk suara custom channel

### Estimasi Biaya

| Plan | Karakter/bulan | Harga | Est. video (5 mnt ≈ 4.000 karakter) |
|---|---|---|---|
| Free | 10.000 | $0 | 2 video |
| Starter | 30.000 | $5 | 7 video |
| Creator | 100.000 | $22 | 25 video |
| Pro | 500.000 | $99 | 125 video |

---

## 4. Suno API — AI Music Generation

### Fungsi dalam Pipeline
- Generate background music untuk video
- Generate jingle intro & outro channel
- Mood music disesuaikan konten

### Status API
> ⚠️ Suno belum memiliki public API resmi (per 2025). Akses saat ini melalui:
> - Suno API tidak resmi (reverse engineered) — **tidak disarankan untuk produksi**
> - Waitlist API resmi di suno.com/api
> - **Alternatif saat ini: Udio, Mubert, atau Beatoven.ai**

### Konfigurasi (saat API tersedia)

```typescript
const SUNO_CONFIG = {
  endpoint: 'https://api.suno.com/v1',       // tentative
  default_duration: 30,                       // detik, untuk background
  output_format: 'mp3',
}

// Contoh request
const musicRequest = {
  prompt: `${mood} background music for YouTube video about ${topic}, 
           no vocals, loop-friendly, fade out at end`,
  duration: videoDuration + 10,              // sedikit lebih panjang dari video
  make_instrumental: true,
}
```

### Fallback yang Disarankan (v1.0)

| Provider | Endpoint | Harga | Keterangan |
|---|---|---|---|
| **Mubert** | api.mubert.com | $0.02/track | API publik, stabil |
| **Beatoven.ai** | api.beatoven.ai | $0.05/menit | Mood-based, bagus |
| **Pixabay Music** | Free | Gratis | Lisensi CC0, kualitas terbatas |

**Rekomendasi v1.0:** Gunakan **Mubert API** sebagai default, dengan Suno sebagai opsi premium saat sudah tersedia.

---

## 5. Ideogram API — Image Generation (Thumbnail)

### Fungsi dalam Pipeline
- Generate thumbnail 1280x720px
- Opsi 3 variasi thumbnail per video
- Style konsisten berdasarkan template

### Konfigurasi

```typescript
const IDEOGRAM_CONFIG = {
  endpoint: 'https://api.ideogram.ai/generate',
  model: 'V_2',
  aspect_ratio: 'ASPECT_16_9',
  resolution: 'RESOLUTION_1280_720',
  style_type: 'REALISTIC',    // atau 'DESIGN' untuk thumbnail grafis
  num_images: 3,
}
```

### Contoh Prompt Thumbnail

```
Generate YouTube thumbnail:
"{VIDEO_TITLE}" — bold, readable text
Background: {STYLE_DESCRIPTION from template}
Color scheme: {PRIMARY_COLOR}, {ACCENT_COLOR}
Mood: {MOOD}
High contrast, eye-catching, professional
NO watermarks, NO logos, NO text overlap
```

### Estimasi Biaya

| Tier | Per image | 3 opsi thumbnail |
|---|---|---|
| Ideogram V2 | $0.08 | $0.24 |
| DALL-E 3 (1024x1024) | $0.04 | $0.12 |
| Stability AI | $0.002 | $0.006 |

**Fallback:** DALL-E 3 (OpenAI) → Stability AI

---

## 6. Pexels API — Stock Footage & Images

### Fungsi dalam Pipeline
- Ambil video stock relevan berdasarkan keyword
- Ambil gambar untuk slide/visual pendukung
- Semua konten berlisensi Pexels License (bebas komersial)

### Konfigurasi

```typescript
const PEXELS_CONFIG = {
  endpoint: 'https://api.pexels.com/videos/search',
  per_page: 10,
  size: 'large',           // HD quality
  orientation: 'landscape',
}

// Ekstrak keyword dari script menggunakan AI
async function extractKeywords(script: string): Promise<string[]> {
  // Gunakan Grok untuk ekstrak 3-5 keyword visual dari script
  // Contoh: ["laptop", "coding", "productivity", "office"]
}
```

### Rate Limit
- 200 requests/jam
- 20.000 requests/bulan
- **Gratis sepenuhnya**

---

## 7. YouTube Data API v3

### Fungsi dalam Pipeline
- Upload video
- Set metadata (judul, deskripsi, tags, thumbnail)
- Penjadwalan publish
- Tambah ke playlist
- Fetch analytics

### Endpoint yang Digunakan

```typescript
// Upload video
POST https://www.googleapis.com/upload/youtube/v3/videos
  ?uploadType=resumable
  &part=snippet,status

// Set thumbnail
POST https://www.googleapis.com/upload/youtube/v3/thumbnails/set
  ?videoId={videoId}

// Update metadata
PUT https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,status

// Add to playlist
POST https://www.googleapis.com/youtube/v3/playlistItems
  ?part=snippet

// Get analytics (YouTube Analytics API)
GET https://youtubeanalytics.googleapis.com/v2/reports
```

### Kuota Management

| Operasi | Unit Kuota |
|---|---|
| Upload video | 1600 unit |
| Update metadata | 50 unit |
| Set thumbnail | 50 unit |
| Baca analytics | 1–6 unit |
| **Default harian** | **10.000 unit** |

> **Penting:** Default kuota 10.000 unit = sekitar 6 video upload per hari.
> Untuk lebih dari itu, request peningkatan kuota ke Google.

### Auth Flow

```
User login via Google OAuth
  → Request scope:
    - youtube.upload
    - youtube.readonly
    - youtubepartner (opsional untuk monetisasi)
  → Simpan refresh token di Supabase (encrypted)
  → Auto-refresh access token saat expired
```

---

## 8. Ringkasan Estimasi Biaya per Video

| Provider | Fungsi | Est. Biaya/video |
|---|---|---|
| Grok (grok-3-mini) | Script + metadata | $0.02 |
| ElevenLabs (Creator plan) | Voiceover 5 menit | $0.11 |
| Mubert | Background music | $0.02 |
| Ideogram | 3 opsi thumbnail | $0.24 |
| Pexels | Stock footage | Gratis |
| YouTube Data API | Upload | Gratis (kuota) |
| Vercel (compute) | Pipeline processing | ~$0.01 |
| **Total** | | **~$0.40/video** |

> Untuk 20 video/bulan: **~$8/bulan** biaya API (belum termasuk plan SaaS).
