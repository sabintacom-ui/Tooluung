# PRD — YouTube Content Automation Platform
## Dokumen 03: Arsitektur Teknis

---

## 1. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR, file-based routing, API routes built-in |
| **Styling** | Tailwind CSS + shadcn/ui | Cepat, konsisten, komponen siap pakai |
| **Backend API** | Next.js API Routes + Route Handlers | Satu codebase, deploy mudah di Vercel |
| **Background Jobs** | Vercel Cron Jobs + pg-boss (PostgreSQL queue) | Async pipeline tanpa timeout |
| **Database** | Supabase (PostgreSQL) | Gratis tier cukup, realtime built-in, auth bawaan |
| **File Storage** | Vercel Blob / Supabase Storage | Simpan aset sementara (video, audio, gambar) |
| **Scheduler (GAS)** | Google Apps Script Web App | Trigger dari Google Sheets, gratis, familiar |
| **Deploy** | Vercel | Zero-config, CDN global, preview deployment |
| **Auth** | NextAuth.js + Google OAuth | SSO dengan Google, akses YouTube API |

---

## 2. Diagram Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│              Next.js App (Vercel CDN)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  VERCEL PLATFORM                         │
│                                                          │
│  ┌────────────────┐    ┌──────────────────────────────┐  │
│  │  Next.js Pages │    │    API Routes (/api/*)        │  │
│  │  - Dashboard   │    │    - /api/pipeline/start      │  │
│  │  - Calendar    │    │    - /api/pipeline/status     │  │
│  │  - Review      │    │    - /api/youtube/upload      │  │
│  │  - Settings    │    │    - /api/content/generate    │  │
│  └────────────────┘    └──────────────┬───────────────┘  │
│                                       │                   │
│  ┌────────────────────────────────────▼───────────────┐  │
│  │           Content Orchestrator Service              │  │
│  │    Koordinasi urutan pipeline & error handling      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Vercel  │  │  Vercel  │  │ Supabase │  │Vercel  │  │
│  │   Cron   │  │   Blob   │  │    DB    │  │  KV    │  │
│  │ Scheduler│  │ Storage  │  │ (State)  │  │(Cache) │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
                       │ HTTP calls
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐    ┌────────▼────┐    ┌────────▼────┐
│  Grok  │    │ ElevenLabs  │    │    Suno     │
│  API   │    │     API     │    │    API      │
└────────┘    └─────────────┘    └─────────────┘
    │                  │                  │
┌───▼────┐    ┌────────▼────┐    ┌────────▼────┐
│Ideogram│    │  Pexels API │    │  YouTube    │
│  API   │    │             │    │  Data API   │
└────────┘    └─────────────┘    └─────────────┘

  ┌─────────────────────────────┐
  │    Google Apps Script       │
  │  (Scheduler / Sheets Bridge)│
  │   Deployed as Web App       │
  └──────────────┬──────────────┘
                 │ POST ke Vercel API
                 ▼
         /api/pipeline/trigger
```

---

## 3. Arsitektur Content Orchestrator

Orchestrator adalah inti pipeline. Setiap job dijalankan secara berurutan dengan state tersimpan di database sehingga bisa dilanjutkan jika gagal di tengah jalan.

```typescript
// Tipe status pipeline
type PipelineStatus =
  | 'pending'
  | 'generating_script'
  | 'generating_voice'
  | 'generating_music'
  | 'generating_thumbnail'
  | 'fetching_footage'
  | 'rendering_video'
  | 'awaiting_review'
  | 'approved'
  | 'uploading'
  | 'published'
  | 'failed'

// Interface setiap provider
interface AIProvider<TInput, TOutput> {
  name: string
  generate(input: TInput): Promise<TOutput>
  estimateCost(input: TInput): number
}

// Job queue entry
interface PipelineJob {
  id: string
  contentId: string
  status: PipelineStatus
  currentStep: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
  errorLog: string | null
}
```

---

## 4. Struktur Folder Project

```
yt-automation/
├── app/                          # Next.js App Router
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard utama
│   │   ├── calendar/page.tsx     # Content calendar
│   │   ├── content/
│   │   │   ├── new/page.tsx      # Form input topik baru
│   │   │   ├── [id]/page.tsx     # Detail & review konten
│   │   │   └── [id]/edit/page.tsx
│   │   ├── templates/page.tsx    # Manajemen template
│   │   ├── analytics/page.tsx    # Analytics & cost tracker
│   │   └── settings/page.tsx     # Konfigurasi API keys
│   ├── api/
│   │   ├── pipeline/
│   │   │   ├── start/route.ts    # Mulai pipeline
│   │   │   ├── trigger/route.ts  # Dipanggil GAS / cron
│   │   │   └── status/route.ts   # Cek status job
│   │   ├── content/
│   │   │   ├── generate/route.ts
│   │   │   └── [id]/route.ts
│   │   └── youtube/
│   │       ├── upload/route.ts
│   │       └── schedule/route.ts
│   └── layout.tsx
│
├── lib/
│   ├── orchestrator/
│   │   ├── index.ts              # ContentOrchestrator class
│   │   ├── pipeline.ts           # Step definitions
│   │   └── queue.ts              # Job queue manager
│   ├── providers/
│   │   ├── base.ts               # AIProvider interface
│   │   ├── grok.ts               # Grok provider
│   │   ├── elevenlabs.ts         # ElevenLabs provider
│   │   ├── suno.ts               # Suno provider
│   │   ├── ideogram.ts           # Ideogram provider
│   │   └── pexels.ts             # Pexels provider
│   ├── youtube/
│   │   ├── auth.ts               # OAuth YouTube
│   │   ├── upload.ts             # Upload logic
│   │   └── metadata.ts           # Metadata management
│   ├── video/
│   │   ├── assembler.ts          # FFmpeg wrapper
│   │   └── subtitle.ts           # Subtitle generator
│   └── db/
│       ├── schema.ts             # Database schema (Drizzle ORM)
│       └── queries.ts            # Query helpers
│
├── components/
│   ├── ui/                       # shadcn components
│   ├── pipeline/
│   │   ├── StatusTracker.tsx     # Realtime pipeline status
│   │   └── ProgressSteps.tsx
│   ├── content/
│   │   ├── ContentCard.tsx
│   │   ├── ReviewPanel.tsx
│   │   └── ScriptEditor.tsx
│   └── calendar/
│       └── ContentCalendar.tsx
│
├── gas/                          # Google Apps Script
│   ├── Scheduler.gs              # Time-based trigger
│   ├── SheetsSync.gs             # Baca topik dari Sheets
│   └── appsscript.json           # GAS config
│
├── scripts/
│   └── setup-db.ts               # Database migration
│
├── .env.local                    # API keys (tidak di-commit)
├── .env.example                  # Template env vars
└── vercel.json                   # Cron job config
```

---

## 5. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI Providers
GROK_API_KEY=...
ELEVENLABS_API_KEY=...
SUNO_API_KEY=...
IDEOGRAM_API_KEY=...
OPENAI_API_KEY=...              # Fallback untuk DALL-E

# Media APIs
PEXELS_API_KEY=...

# YouTube
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...

# Storage
BLOB_READ_WRITE_TOKEN=...       # Vercel Blob

# Google Apps Script
GAS_WEBHOOK_SECRET=...          # Validasi request dari GAS

# Pipeline Config
MAX_CONCURRENT_JOBS=3
DEFAULT_RETRY_LIMIT=3
COST_ALERT_THRESHOLD_USD=10     # Alert jika biaya/hari > $10
```

---

## 6. Strategi Background Jobs

Karena pipeline bisa berjalan 10–15 menit, tidak bisa dijalankan dalam satu API request (Vercel timeout 5 menit untuk Hobby, 5–15 menit untuk Pro).

**Solusi:**

```
Request masuk → simpan job ke DB → return job ID ke client
                      ↓
              Vercel Cron (tiap menit) polling job queue
                      ↓
              Jalankan step pipeline satu per satu
              Update status di DB setiap step selesai
                      ↓
              Client polling /api/pipeline/status?id=xxx
              ATAU subscribe ke Supabase Realtime
```

**Alternatif untuk pipeline panjang:** Gunakan Vercel Pro dengan `maxDuration: 300` (5 menit) dan jalankan step secara sequential dalam satu function.

---

## 7. Error Handling & Retry Strategy

```
Tiap step pipeline:
  - Maksimum 3x retry dengan exponential backoff
  - Jika gagal 3x → status = 'failed', simpan error log
  - Notifikasi ke user via email / in-app
  - Step yang sudah berhasil TIDAK diulang (idempotent)

Contoh:
  Step 3 (voiceover) gagal setelah step 1 & 2 berhasil
  → Retry hanya dari step 3
  → Script & thumbnail tidak digenerate ulang
```

---

## 8. Keputusan Teknis Penting

| Keputusan | Pilihan | Alasan |
|---|---|---|
| ORM | Drizzle ORM | Type-safe, ringan, bagus untuk Vercel Edge |
| State management frontend | Zustand + React Query | Sederhana, caching otomatis |
| Realtime status | Supabase Realtime | Tidak perlu WebSocket server sendiri |
| Video rendering | FFmpeg via child_process | Gratis, powerful; untuk skala besar pakai Shotstack API |
| File temp storage | Vercel Blob | Mudah, terintegrasi; hapus file setelah upload ke YouTube |
