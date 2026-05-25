# Production Deployment Guide — sibermas-YT

Status pengerjaan: **In Progress**. File ini diperbarui seiring eksekusi.

## Arsitektur Produksi

```
                       ┌────────────────────────────┐
   User (Browser) ───▶ │  Vercel: Next.js Frontend  │
                       │  + API Routes (nodejs)     │
                       └─────────────┬──────────────┘
                                     │
                  ┌──────────────────┼──────────────────────────┐
                  ▼                  ▼                          ▼
       ┌──────────────────┐  ┌──────────────┐    ┌──────────────────────┐
       │  Supabase        │  │  Google      │    │  Remote SSH Worker   │
       │  (PostgreSQL +   │  │  YouTube API │    │  192.168.18.210      │
       │   Storage opt.)  │  │  (OAuth)     │    │  + ffmpeg + nginx    │
       └──────────────────┘  └──────────────┘    └──────────────────────┘
```

## Checklist Production-Ready

### Code (✅ Selesai)
- [x] Build pass (`npm run build`)
- [x] Lint clean (`npm run lint`)
- [x] Timing-safe token comparison
- [x] SSRF guard di YouTube upload
- [x] UUID validation pada query params
- [x] Shell quoting pada ffmpeg args
- [x] Security headers di next.config.ts
- [x] Node.js runtime ditetapkan eksplisit
- [x] SSH ffmpeg smoke test pass

### Infrastructure (Pending)
- [ ] `npm audit fix` — resolve 2 moderate vulnerabilities
- [ ] nginx di server remote untuk static serve `~/sibermas-worker/output/`
- [ ] SSL certificate untuk `sibermas.rizquna.id`
- [ ] Reachability dari Vercel ke server (public IP / Cloudflare Tunnel / Tailscale)
- [ ] DNS A record `sibermas.rizquna.id`

### Env Vars di Vercel (Pending)
Wajib diisi di Vercel Project Settings → Environment Variables (Production):

```
ADMIN_API_TOKEN=<random 32+ chars>
WORKER_SECRET=<random 32+ chars>

SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

GOOGLE_CLIENT_ID=<oauth client id>
GOOGLE_CLIENT_SECRET=<oauth client secret>
GOOGLE_REFRESH_TOKEN=<refresh token with youtube.upload scope>

SSH_HOST=<public hostname atau tunnel hostname>
SSH_PORT=22
SSH_USER=rizqunaid
SSH_PRIVATE_KEY=<isi id_ed25519, multiline. ganti \n dengan \\n di Vercel UI>
WORKER_REMOTE_DIR=~/sibermas-worker/output
WORKER_PUBLIC_BASE_URL=https://sibermas.rizquna.id/generated

ALLOWED_VIDEO_HOSTS=supabase.co,public.blob.vercel-storage.com,sibermas.rizquna.id
MAX_VIDEO_UPLOAD_BYTES=262144000

# Optional (Legacy GAS)
GAS_WEB_APP_URL=<gas web app url>
GAS_WEBHOOK_SECRET=<shared secret>

# Optional (AI providers)
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
PEXELS_API_KEY=
SUNO_API_KEY=
IDEOGRAM_API_KEY=
```

### Vercel Cron (Pending)
Tambahkan `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/pipeline/trigger", "schedule": "*/2 * * * *" }
  ]
}
```
Catatan: cron Vercel tidak bisa kirim custom header. Solusi:
- Pakai Vercel Cron + token via query param (kurang aman), atau
- External cron (cron-job.org / GitHub Actions) → POST dengan `x-worker-secret`.

### Database (Pending)
- [ ] Jalankan `supabase/schema.sql` di Supabase SQL Editor
- [ ] Seed minimal: 1 user, 1 channel, 1 template
- [ ] Verifikasi RLS policies (semua tabel sudah `ENABLE ROW LEVEL SECURITY`, akses via service role)

### Monitoring (Pending)
- [ ] `/api/health` endpoint
- [ ] Sentry / Logflare untuk error tracking (opsional)
- [ ] Vercel Analytics enabled

## Post-Deploy Verification

```bash
# Health check
curl https://<your-vercel-app>.vercel.app/api/health

# Test admin auth
curl -H "x-admin-token: $ADMIN_API_TOKEN" \
  https://<app>.vercel.app/api/pipeline/recent

# Test YouTube OAuth
curl -H "x-admin-token: $ADMIN_API_TOKEN" \
  https://<app>.vercel.app/api/youtube/status

# Trigger pipeline manual
curl -X POST -H "x-worker-secret: $WORKER_SECRET" \
  https://<app>.vercel.app/api/pipeline/trigger
```

## Known Limitations

- Vercel serverless timeout: 300s (Pro) untuk `/api/pipeline/trigger`. Render ffmpeg via SSH harus selesai dalam window itu.
- YouTube API quota: 10.000 unit/hari, upload = 1.600 unit → max ~6 video/hari/project.
- Worker remote single point of failure. Backup: integrasi Supabase Storage + Cloud Run worker.
