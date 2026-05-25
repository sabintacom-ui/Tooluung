# Production Deployment Guide — sibermas-YT (Self-Hosted)

Status: **Production ✅** — Deployed di `https://sibermas.rizquna.id`

## Arsitektur Produksi (Self-Hosted)

```
                      ┌──────────────────────────────────────┐
   User (Browser) ───▶│  Cloudflare Edge (CDN + WAF)         │
                      │  DNS: sibermas.rizquna.id (proxied)  │
                      └──────────────┬───────────────────────┘
                                     │ Cloudflare Tunnel "9router"
                                     │ (c46b4521-...cfargotunnel.com)
                                     ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Server 192.168.18.210 (Ubuntu 24.04, Node 24, PM2 6)       │
   │                                                              │
   │  ┌─────────────────────┐    ┌─────────────────────────────┐│
   │  │ nginx :8080         │───▶│ Next.js :3100 (PM2)         ││
   │  │                     │    │ /home/rizqunaid/sibermas-yt ││
   │  │ /generated/* ──────▶│    │                              ││
   │  │   alias filesystem  │    │ /api/*  /  /generated/[id]   ││
   │  └─────────┬───────────┘    └──────────┬──────────────────┘│
   │            ▼                            ▼                    │
   │  /home/rizqunaid/sibermas-worker/output/*.mp4                │
   │  (ffmpeg render via local SSH wrapper)                       │
   └────────────────────────────────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
        ┌──────────┐         ┌──────────────┐      ┌────────────────┐
        │ Supabase │         │ YouTube API  │      │ Snifox AI      │
        │ Postgres │         │ (OAuth)      │      │ Claude Opus    │
        └──────────┘         └──────────────┘      └────────────────┘
```

## Stack

| Komponen | Detail |
|---|---|
| Runtime | Node.js 24.14.0 |
| Process manager | PM2 6.0.14 (`ecosystem.config.js`) |
| Web server | nginx 1.24 (port 8080, reverse proxy ke :3100) |
| Public tunnel | Cloudflared 2026.5.0 (tunnel `9router`, systemd) |
| Framework | Next.js 16.2.6 (Turbopack, production build) |
| Database | Supabase PostgreSQL (managed) |
| AI script | Snifox `anthropic/claude-opus-4.7` |
| Render | ffmpeg 6.1.1 via local SSH wrapper |

## Server Layout

```
/home/rizqunaid/
├── git-repos/sibermas-yt.git/        # Bare repo + post-receive hook
├── sibermas-yt/                       # Deployed code (working tree)
│   ├── .env.production                # Server secrets (mode 600)
│   ├── ecosystem.config.js
│   ├── .next/                         # Build output
│   └── ...
└── sibermas-worker/
    ├── output/                        # ffmpeg renders + smoke-test.mp4
    └── logs/
        ├── sibermas-out.log
        └── sibermas-err.log
```

## Deploy Workflow

### Initial Setup (sudah dilakukan)
```bash
# Server side: bare repo + hook
ssh rizqunaid@192.168.18.210
mkdir -p ~/git-repos/sibermas-yt.git
cd ~/git-repos/sibermas-yt.git && git init --bare
# (hook ada di hooks/post-receive — auto npm ci + build + pm2 reload)

# Mac side: git init + remote
cd /Users/macm4/Documents/YT
git init -b main
git remote add server ssh://rizqunaid@192.168.18.210/home/rizqunaid/git-repos/sibermas-yt.git
```

### Deploy Update
```bash
# Dari Mac: code change → push → auto deploy
git add -A
git commit -m "feat: <change>"
git push server main
# post-receive hook akan:
#   1. git checkout -f main → /home/rizqunaid/sibermas-yt
#   2. npm ci
#   3. npm run build
#   4. pm2 reload sibermas-yt (atau start ecosystem.config.js)
```

### Manual Restart
```bash
ssh rizqunaid@192.168.18.210 'pm2 restart sibermas --update-env'
ssh rizqunaid@192.168.18.210 'pm2 logs sibermas --lines 50 --nostream'
```

### Auto-start on Reboot
```bash
# Sudah configured: pm2 save + pm2 startup systemd
sudo systemctl status pm2-rizqunaid
sudo systemctl status cloudflared-rizquna
sudo systemctl status nginx
```

## nginx Config

File: `/etc/nginx/sites-available/sibermas.rizquna.id`

```nginx
server {
    listen 8080;
    listen [::]:8080;
    server_name sibermas.rizquna.id;

    # Serve generated assets (mp4/mp3/png/jpg/txt)
    location /generated/ {
        alias /home/rizqunaid/sibermas-worker/output/;
        autoindex off;
        add_header Cache-Control "public, max-age=3600";
        add_header X-Content-Type-Options "nosniff";
        types {
            video/mp4 mp4;
            audio/mpeg mp3;
            image/png png;
            image/jpeg jpg jpeg;
            text/plain txt;
        }
        location ~ \.(mp4|mp3|png|jpe?g|txt|webm|webp|wav)$ {
            try_files $uri =404;
        }
        location ~ / { return 403; }
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    client_max_body_size 50M;
}
```

## Cloudflare Tunnel Config

File: `/home/rizqunaid/.cloudflared/config.yml`

```yaml
tunnel: c46b4521-4f6d-4258-a958-2c66c1ebdf1b
credentials-file: /home/rizqunaid/.cloudflared/c46b4521-4f6d-4258-a958-2c66c1ebdf1b.json

ingress:
  - hostname: rizquna.id
    service: http://localhost:80
  - hostname: invoice.rizquna.id
    service: http://localhost:8000
  - hostname: router.rizquna.id
    service: http://localhost:20128
  - hostname: wa.rizquna.id
    service: http://localhost:8088
  - hostname: sibermas.rizquna.id
    service: http://localhost:8080
  - service: http_status:404
```

Systemd: `/etc/systemd/system/cloudflared-rizquna.service`

```bash
sudo systemctl restart cloudflared-rizquna
sudo journalctl -u cloudflared-rizquna -f
```

## Env Vars (`.env.production` di server)

⚠️ File ini **TIDAK** di-commit ke git. Lokasi: `/home/rizqunaid/sibermas-yt/.env.production` (mode 600)

```env
# Auth
ADMIN_API_TOKEN=imam-admin-2026-yt-automator
WORKER_SECRET=<random-32+>
NEXTAUTH_SECRET=<random-32+>

# Supabase
SUPABASE_URL=https://uylhsgcatreonlpmguio.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://uylhsgcatreonlpmguio.supabase.co
SUPABASE_ANON_KEY=<anon>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service>

# Google YouTube
GOOGLE_CLIENT_ID=<oauth-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>
GOOGLE_REFRESH_TOKEN=<refresh-with-youtube.upload>

# Snifox AI
SNIFOX_API_KEY=snfx-...
SNIFOX_BASE_URL=https://core.snifoxai.com/v1
SNIFOX_MODEL=anthropic/claude-opus-4.7

# SSH (loop ke localhost untuk ffmpeg)
SSH_HOST=127.0.0.1
SSH_PORT=22
SSH_USER=rizqunaid
SSH_PRIVATE_KEY_B64=<base64-of-id_ed25519>
WORKER_REMOTE_DIR=/home/rizqunaid/sibermas-worker/output
WORKER_PUBLIC_BASE_URL=https://sibermas.rizquna.id/generated

# YouTube guards
ALLOWED_VIDEO_HOSTS=sibermas.rizquna.id,supabase.co
MAX_VIDEO_UPLOAD_BYTES=536870912

NODE_ENV=production
PORT=3100
```

## Cron (systemd Timer — Installed)

Vercel cron tidak dipakai lagi. Auto-trigger ditangani oleh **systemd timer** di server, fires every 15 minutes.

### Components

**Wrapper script:** `scripts/trigger-cron.sh` (dideploy lewat git push)
- Baca `WORKER_SECRET` dari `.env.production`
- POST `https://sibermas.rizquna.id/api/pipeline/trigger` dengan `x-worker-secret`
- Timeout 290s, log ke `~/sibermas-worker/logs/trigger-cron.log` (auto-rotate 500 lines)

**Service unit:** `/etc/systemd/system/sibermas-trigger.service`
```ini
[Unit]
Description=Sibermas YT pipeline auto-trigger (oneshot)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=rizqunaid
Group=rizqunaid
WorkingDirectory=/home/rizqunaid/sibermas-yt
ExecStart=/bin/bash /home/rizqunaid/sibermas-yt/scripts/trigger-cron.sh
TimeoutSec=300
Nice=10
```

**Timer unit:** `/etc/systemd/system/sibermas-trigger.timer`
```ini
[Unit]
Description=Run Sibermas YT pipeline trigger every 15 minutes
Requires=sibermas-trigger.service

[Timer]
OnBootSec=3min
OnUnitActiveSec=15min
AccuracySec=30s
Unit=sibermas-trigger.service
Persistent=true

[Install]
WantedBy=timers.target
```

### Management

```bash
# Status timer + next fire time
systemctl list-timers sibermas-trigger.timer

# Manual fire (test)
sudo systemctl start sibermas-trigger.service

# Disable / re-enable
sudo systemctl disable sibermas-trigger.timer
sudo systemctl enable --now sibermas-trigger.timer

# Live logs
sudo journalctl -u sibermas-trigger.service -f

# Cron log (curl output)
tail -f ~/sibermas-worker/logs/trigger-cron.log
```

### Tuning Interval

Pipeline orchestrator memproses **1 step per request**. Total 7 step → ~1.75 jam untuk job selesai dari trigger pertama dengan interval 15 min.

**Untuk faster throughput:**

- Ubah `OnUnitActiveSec=5min` → 7 step × 5 min = 35 min per job
- Atau modifikasi `trigger-cron.sh` untuk loop 7× per firing:
```bash
for i in {1..7}; do
  curl -sS -X POST "$BASE_URL/api/pipeline/trigger" \
    -H "x-worker-secret: $WORKER_SECRET" --max-time 60
  sleep 3
done
```

## Post-Deploy Verification

```bash
# Health
curl https://sibermas.rizquna.id/api/health | jq

# Admin
curl -H "x-admin-token: imam-admin-2026-yt-automator" \
  https://sibermas.rizquna.id/api/pipeline/recent | jq

# YouTube OAuth status
curl -H "x-admin-token: $ADMIN_API_TOKEN" \
  https://sibermas.rizquna.id/api/youtube/status | jq

# Manual trigger
curl -X POST -H "x-worker-secret: $WORKER_SECRET" \
  https://sibermas.rizquna.id/api/pipeline/trigger | jq

# Run full E2E
BASE_URL=https://sibermas.rizquna.id \
ADMIN_TOKEN=imam-admin-2026-yt-automator \
bash scripts/e2e-test.sh
```

## Known Limitations

- **Single-server**: tidak HA. Backup strategi: snapshot disk + Supabase managed.
- **YouTube quota**: 10.000 unit/hari, upload = 1.600 unit → max ~6 video/hari/project.
- **No SSE/WebSocket** untuk live status (polling via `/api/pipeline/status`).
- **ffmpeg = placeholder**: 12-detik blank video dengan drawtext. Production butuh integrasi TTS (ElevenLabs/Suno) + footage (Pexels) + image gen (Ideogram).

## Troubleshooting

| Symptom | Check |
|---|---|
| HTTP 502 dari Cloudflare | `pm2 status sibermas`, `curl http://127.0.0.1:3100/api/health` |
| HTTP 404 di `/generated/*.mp4` | `ls /home/rizqunaid/sibermas-worker/output/`, `sudo nginx -t` |
| Pipeline stuck `pending` | `curl POST /api/pipeline/trigger`, cek `pipeline_logs` di Supabase |
| Build fail di hook | `pm2 logs sibermas`, `ssh server 'cd ~/sibermas-yt && npm run build'` |
| Tunnel 502 | `sudo systemctl restart cloudflared-rizquna`, cek `journalctl -u cloudflared-rizquna -f` |

## UI Pro Dashboard + PWA

UI di-upgrade ke level produksi dengan branding **Sibermas UIN SAIZU** (commit `bda17d4` + revisi PWA `1027b86`).

### Komponen Utama (`app/page.tsx`, 480 lines)
- **Hero + Bismillah** Arabic (Amiri font) — branding teal+gold dengan logo SY
- **Top nav** dengan brand-logo + breadcrumb
- **Stats grid** 4 kartu (Total / Done / Running / Uploads) dengan accent bar gradient
- **Quick actions** 6-tile grid (Pipeline Start, Trigger Worker, Health, Recent Jobs, YouTube Status, Help)
- **Pipeline progress visualizer** — 7-step horizontal dengan shimmer animation step aktif
- **History timeline** + YouTube thumbnail embed (`img.youtube.com/vi/<id>/hqdefault.jpg`)
- **Auto-refresh** polling 8 detik tanpa flicker
- **PWA install banner** + Service Worker manifest
- **Footer** Sibermas UIN SAIZU

### Design System (`app/styles.css`)
```css
:root {
  --teal: #14b8a6;
  --teal-deep: #0d9488;
  --green: #064e3b;
  --gold: #fbbf24;
  --bg: #04140f;
}
/* Fonts: Plus Jakarta Sans (UI), Inter (body), Amiri (Arabic bismillah) */
```

### PWA Assets
| File | Size | Purpose |
|---|---|---|
| `public/manifest.webmanifest` | 0.5KB | Theme `#0d9488`, bg `#04140f`, standalone display |
| `public/icon.svg` | 1.3KB | Gradient "SY" logo, scalable |
| `public/icon-192.png` | 44KB | Android home screen icon |
| `public/icon-512.png` | 259KB | Splash screen + Play Store icon |

Layout (`app/layout.tsx`) inject metadata, OpenGraph, viewport `themeColor: #0d9488`, manifest link.

### Test PWA
1. Chrome Android → buka `https://sibermas.rizquna.id`
2. Banner "Install Sibermas-YT" muncul di footer
3. Tap → tambah ke home screen
4. Buka dari home → splash teal+green + icon → standalone window tanpa URL bar

## Worker Mode (Local Loopback)

`lib/remote/ssh.ts` punya auto-detection:
- `SSH_HOST=127.0.0.1` atau `localhost` → **local mode** (pakai `child_process.spawn`, bypass SSH overhead)
- Otherwise → **SSH mode** (pakai `ssh2.Client` connect)

Di production server, set `SSH_HOST=127.0.0.1` di `.env.production` → pipeline jalan **64 detik untuk 7 step** (vs ~3 menit lewat SSH loopback). Render ffmpeg masuk ke `/home/rizqunaid/sibermas-worker/output/`.

## Verified E2E

### Run 1: May 25, 2026 (initial deploy)
✅ Job `56675b6a-9bc7-426a-8e17-0343c4d99afb` — completed 7/7 steps  
✅ YouTube video: https://www.youtube.com/watch?v=wrvep-tsPHs (private)  
✅ Rendered MP4: `https://sibermas.rizquna.id/generated/a0c56815-71a9-4c61-afa5-9f320110a352.mp4` (53KB)  
✅ Snifox AI generated Indonesian script + 14 tags + chapters  
✅ Public HTTPS health check: `{"ok":true, ...12 checks pass}`

### Run 2: May 25, 2026 (post UI upgrade + PWA + systemd timer)
✅ Job `36ed0135-26ec-4bf6-8067-f215b9b00622` — completed 7/7 steps (64 detik wallclock)  
✅ YouTube video: https://www.youtube.com/watch?v=DFrLHVMTUvI (private)  
✅ Topic: "Hikmah Sabar dalam Al-Quran"  
✅ Cost: $0.00 (Snifox credits)  
✅ Step durations (Supabase pipeline_logs):

| Step | Completed at | Δ |
|---|---|---|
| generate_script | 20:56:19 | start |
| generate_voice | 20:56:29 | +10s |
| generate_music | 20:56:38 | +9s |
| generate_thumbnail | 20:56:48 | +10s |
| fetch_footage | 20:56:58 | +10s |
| render_video | 20:57:09 | +11s |
| upload_youtube | 20:57:23 | +14s |

## Recovery Playbook

### Symptom: HTTP 502 setelah git push
Penyebab umum: build hook gagal (TypeScript error) → `.next/BUILD_ID` tidak ter-update → PM2 restart loop dengan `Could not find a production build`.

**Fix:**
```bash
ssh rizqunaid@192.168.18.210
cd /home/rizqunaid/sibermas-yt
pm2 stop sibermas
rm -rf .next/cache .next/types
npm run build              # cek error TypeScript secara explicit
pm2 reset sibermas         # clear restart counter
pm2 start sibermas
sleep 5
pm2 list | grep sibermas   # status: online, 0 restart
curl http://127.0.0.1:3100/api/health
```

### Symptom: systemd timer fail dengan exit-code 2
Penyebab: quoting error di `trigger-cron.sh` atau env var tidak ter-load.

**Fix:** Gunakan service unit pure-curl (no bash wrapper):
```ini
[Service]
Type=oneshot
User=rizqunaid
EnvironmentFile=/home/rizqunaid/sibermas-yt/.env.production
ExecStart=/usr/bin/curl -fsS -X POST \
  -H "x-worker-secret: ${WORKER_SECRET}" \
  --max-time 290 \
  https://sibermas.rizquna.id/api/pipeline/trigger \
  -o /tmp/sibermas-trigger.log
```

### Symptom: PM2 in-memory version mismatch warning
```
>>>> In-memory PM2 is out-of-date, do:
>>>> $ pm2 update
```
Kosmetik saja, tidak block fungsi. Jalankan `pm2 update` saat maintenance window (brief restart semua proses).
