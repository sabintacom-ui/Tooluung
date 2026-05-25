# Sibermas-YT — YouTube Automation Pipeline

Dashboard otomasi produksi & upload video YouTube untuk **Sibermas UIN SAIZU**.
Frontend Next.js (Vercel) + Supabase (Postgres) + SSH remote worker (ffmpeg) + Snifox AI (script generation) + YouTube Data API v3.

Backend lama berbasis **Google Apps Script** masih dipertahankan sebagai *dual-mode* untuk kompatibilitas queue legacy.

---

## Arsitektur

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Browser (UI)   │───▶│  Next.js (Vercel)│───▶│  Supabase (PG)   │
│  /app/page.tsx  │    │  /api/pipeline/* │    │  contents, jobs  │
└─────────────────┘    └─────────┬────────┘    └──────────────────┘
                                 │
                  ┌──────────────┼─────────────────┐
                  ▼              ▼                 ▼
         ┌────────────────┐ ┌──────────┐  ┌─────────────────┐
         │ Snifox AI      │ │ SSH/SFTP │  │ YouTube Data v3 │
         │ (Claude Opus)  │ │ Worker   │  │ resumable upload│
         │ script + meta  │ │ ffmpeg   │  │                 │
         └────────────────┘ └──────────┘  └─────────────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ /generated/*.mp4   │
                       │ (SFTP stream)      │
                       └────────────────────┘
```

**Pipeline v2 (7 step)** dijalankan oleh `lib/orchestrator/pipeline.ts`:
`generate_script → generate_voice → generate_visual → generate_music → assemble_video → upload_youtube → finalize`

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Buat `.env.local` dari `.env.example`

Variabel wajib:

```env
# Auth
ADMIN_API_TOKEN=<random-32-chars>
WORKER_SECRET=<random-32-chars>

# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Google OAuth (YouTube upload)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# SSH Worker (ffmpeg remote)
SSH_HOST=192.168.18.210
SSH_PORT=22
SSH_USER=rizqunaid
SSH_PRIVATE_KEY="-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
# atau SSH_PASSWORD=... (kurang disarankan)
WORKER_REMOTE_DIR=~/sibermas-worker/output
WORKER_PUBLIC_BASE_URL=https://<vercel-domain>/generated

# Snifox AI (script generation)
SNIFOX_API_KEY=snfx-...
SNIFOX_BASE_URL=https://core.snifoxai.com/v1
SNIFOX_MODEL=anthropic/claude-opus-4.7

# Security
ALLOWED_VIDEO_HOSTS=googleapis.com,googleusercontent.com,supabase.co
MAX_VIDEO_UPLOAD_BYTES=2147483648
```

### 3. Setup Supabase

Jalankan `supabase/schema.sql` di Supabase SQL Editor.

Seed minimal (channel + template):

```sql
INSERT INTO channels (id, name, youtube_channel_id) VALUES
  ('c419026c-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'Sibermas Main', 'UCxxxx');

INSERT INTO templates (id, channel_id, name, voice_profile, visual_profile, music_profile) VALUES
  ('5f93c244-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'c419026c-...', 'Default', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb);
```

### 4. Setup SSH Worker

Server target perlu:
- Ubuntu/Debian dengan **ffmpeg ≥ 4.x**
- User non-root dengan akses ke `~/sibermas-worker/{jobs,output,logs}`
- SSH key (ed25519/rsa) terdaftar di `~/.ssh/authorized_keys`

```bash
ssh user@host "mkdir -p ~/sibermas-worker/{jobs,output,logs}"
```

### 5. Setup Snifox AI

Dapatkan API key dari Snifox dashboard. Default model: `anthropic/claude-opus-4.7`.
Fallback ke template generator otomatis aktif jika `SNIFOX_API_KEY` kosong atau API gagal.

### 6. Jalankan lokal

```bash
npm run dev
```

Akses `http://localhost:3000` dengan header `x-admin-token`.

---

## Deployment ke Vercel

1. Push ke GitHub.
2. Import project ke Vercel.
3. Set semua env vars di Vercel Project Settings → Environment Variables.
4. `vercel.json` sudah mengatur `maxDuration` per route:
   - `/api/pipeline/trigger` → 300s (jalanin ffmpeg + upload)
   - `/generated/[filename]` → 60s (SFTP stream)
5. Cron job `*/15 * * * *` → `/api/pipeline/trigger` (Vercel Cron).

Cek `DEPLOYMENT.md` untuk checklist lengkap.

---

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/pipeline/start` | `x-admin-token` | Buat content + job baru |
| GET  | `/api/pipeline/status?id=<jobId>` | `x-admin-token` | Status job |
| POST | `/api/pipeline/trigger` | `x-admin-token` atau cron | Eksekusi 1 step pending |
| GET  | `/api/pipeline/recent` | `x-admin-token` | List video terbaru |
| GET  | `/api/health` | public | Env check |
| GET  | `/generated/[filename]` | `?token=` | SFTP stream media |
| GET  | `/api/youtube/status` | `x-admin-token` | OAuth refresh check |
| POST | `/api/queue` | `x-admin-token` | GAS legacy queue (dual-mode) |

---

## Dual-Mode dengan GAS Legacy

Backend GAS lama tetap aktif sebagai fallback queue. Lihat `gas/Code.js`:

- Spreadsheet `Queue` dipakai untuk upload manual via GAS.
- Property `SPREADSHEET_ID` + `GAS_WEBHOOK_SECRET` harus diset di Apps Script.
- `installHourlyTrigger` membuat scheduler upload.
- Frontend bisa POST ke `/api/queue` (memforward ke GAS) sebagai fallback bila pipeline v2 down.

Migrasi penuh ke pipeline v2 disarankan setelah AI providers lengkap (voice, visual, music).

---

## Schema Database

`supabase/schema.sql`:
- `users` — auth.users mirror
- `channels` — YouTube channel + OAuth refresh tokens
- `templates` — preset voice/visual/music
- `contents` — topik, script, metadata video
- `pipeline_jobs` — state machine 7 step
- `pipeline_logs` — audit trail per step
- `youtube_videos` — record video yang sudah ter-upload
- `content_assets` — file output (mp4/mp3/png) di worker

Tipe TypeScript: `lib/db/schema.ts`.

---

## Constraints & Batasan

- **YouTube quota**: 10.000 unit/hari, upload = 1.600 unit → **max ~6 video/hari**.
- **Vercel function timeout**: max 300s (Pro) — sudah diset untuk `/trigger`.
- **Vercel filesystem read-only** — semua file output di SSH worker, di-stream via `/generated/*`.
- **GAS** max runtime 6 menit (untuk dual-mode legacy).
- **Snifox** rate limit: cek dashboard Snifox.

---

## Security Notes

- Semua endpoint admin pakai `timingSafeEqual` untuk komparasi token.
- SSRF guard di `assertSafeVideoUrl` (hostname whitelist).
- SSH command quoting via `shq()` untuk mencegah shell injection.
- Filename validation via `assertSafeFilename()` (no `..`, no `/`).
- HSTS, X-Frame DENY, nosniff, Referrer-Policy di `next.config.ts`.
- `ssh2` di `serverExternalPackages` (tidak ter-bundle untuk client).
- Simpan kredensial hanya sebagai server env, **bukan** `NEXT_PUBLIC_*`.
