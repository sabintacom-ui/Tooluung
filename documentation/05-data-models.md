# PRD — YouTube Content Automation Platform
## Dokumen 05: Data Models & Database Schema

---

## 1. Overview Database

- **Database:** PostgreSQL via Supabase
- **ORM:** Drizzle ORM
- **Naming convention:** snake_case untuk tabel & kolom

---

## 2. Entity Relationship Diagram (Teks)

```
users
  └── 1:N ──→ channels
                └── 1:N ──→ templates
                └── 1:N ──→ contents
                              └── 1:1 ──→ pipeline_jobs
                              └── 1:N ──→ pipeline_logs
                              └── 1:1 ──→ youtube_videos
                              └── 1:N ──→ content_assets

users
  └── 1:N ──→ api_keys
```

---

## 3. Schema Detail

### Tabel: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  plan          VARCHAR(50) DEFAULT 'free',   -- 'free' | 'pro' | 'agency'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `channels`

```sql
CREATE TABLE channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  youtube_id      VARCHAR(100),              -- Channel ID YouTube
  youtube_token   TEXT,                      -- Encrypted refresh token
  description     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `templates`

```sql
CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,

  -- Script config
  script_system_prompt  TEXT,           -- System prompt untuk Grok
  script_tone           VARCHAR(100),   -- 'formal' | 'casual' | 'inspirational'
  script_cta            TEXT,           -- Template CTA standar
  target_duration_min   INTEGER DEFAULT 5,   -- Durasi target (menit)

  -- Voice config (ElevenLabs)
  voice_id              VARCHAR(100),
  voice_stability       DECIMAL(3,2) DEFAULT 0.5,
  voice_similarity      DECIMAL(3,2) DEFAULT 0.75,
  voice_speed           DECIMAL(3,2) DEFAULT 1.0,

  -- Music config (Suno/Mubert)
  music_genre           VARCHAR(100),
  music_mood            VARCHAR(100),
  music_intensity       VARCHAR(50) DEFAULT 'low',  -- 'low' | 'medium' | 'high'

  -- Thumbnail config
  thumbnail_style_prompt TEXT,
  thumbnail_primary_color VARCHAR(7),    -- Hex color
  thumbnail_accent_color  VARCHAR(7),
  thumbnail_layout        VARCHAR(50),   -- 'text-left' | 'text-right' | 'text-center'

  -- Video config
  video_resolution       VARCHAR(20) DEFAULT '1080p',
  video_aspect_ratio     VARCHAR(10) DEFAULT '16:9',
  video_transition       VARCHAR(50) DEFAULT 'fade',

  is_default             BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `contents`

```sql
CREATE TABLE contents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- Input dari user
  topic             TEXT NOT NULL,
  target_audience   TEXT,
  keywords          TEXT[],
  notes             TEXT,

  -- Output dari AI (setelah pipeline selesai)
  selected_title    VARCHAR(500),
  title_options     JSONB,              -- Array 5 opsi judul
  description       TEXT,
  tags              TEXT[],
  chapters          JSONB,              -- Array {time, title}
  script            JSONB,             -- Array script segments
  thumbnail_prompt  TEXT,
  footage_keywords  TEXT[],            -- Keywords untuk Pexels

  -- Status & workflow
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'generating' | 'awaiting_review' | 'approved' | 'rejected'
  -- | 'scheduled' | 'uploading' | 'published' | 'failed'

  review_notes      TEXT,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,

  -- Jadwal
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,

  -- Sumber input
  source            VARCHAR(50) DEFAULT 'manual',  -- 'manual' | 'sheets' | 'api' | 'cron'
  batch_id          UUID,              -- Untuk batch input dari Sheets

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query umum
CREATE INDEX idx_contents_channel_status ON contents(channel_id, status);
CREATE INDEX idx_contents_scheduled_at ON contents(scheduled_at) WHERE status = 'scheduled';
```

---

### Tabel: `pipeline_jobs`

```sql
CREATE TABLE pipeline_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,

  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

  current_step    VARCHAR(100),
  -- 'generate_script' | 'generate_voice' | 'generate_music'
  -- | 'generate_thumbnail' | 'fetch_footage' | 'render_video'
  -- | 'upload_youtube'

  steps_completed TEXT[],              -- Log step yang sudah selesai
  retry_count     INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 3,

  -- Cost tracking
  cost_breakdown  JSONB,
  -- { "grok": 0.02, "elevenlabs": 0.11, "ideogram": 0.24, "total": 0.37 }
  total_cost_usd  DECIMAL(10,4),

  error_message   TEXT,
  error_step      VARCHAR(100),

  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `pipeline_logs`

```sql
CREATE TABLE pipeline_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES pipeline_jobs(id) ON DELETE CASCADE,
  step        VARCHAR(100) NOT NULL,
  level       VARCHAR(20) NOT NULL,    -- 'info' | 'warn' | 'error'
  message     TEXT NOT NULL,
  metadata    JSONB,                   -- Data tambahan (request, response summary)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `content_assets`

```sql
CREATE TABLE content_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,

  type          VARCHAR(50) NOT NULL,
  -- 'audio_voiceover' | 'audio_music' | 'image_thumbnail' | 'image_thumbnail_2'
  -- | 'image_thumbnail_3' | 'video_footage' | 'video_final' | 'subtitle'

  provider      VARCHAR(50),           -- 'elevenlabs' | 'suno' | 'ideogram' | 'pexels'
  storage_url   TEXT NOT NULL,         -- Vercel Blob URL
  file_size_kb  INTEGER,
  duration_sec  INTEGER,               -- Untuk audio/video
  metadata      JSONB,                 -- Info tambahan dari provider

  is_selected   BOOLEAN DEFAULT false, -- Untuk aset dengan multiple opsi (thumbnail)
  expires_at    TIMESTAMPTZ,           -- Aset temp dihapus setelah upload ke YT

  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `youtube_videos`

```sql
CREATE TABLE youtube_videos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id        UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  channel_id        UUID NOT NULL REFERENCES channels(id),

  youtube_video_id  VARCHAR(20) UNIQUE,    -- ID video di YouTube
  youtube_url       TEXT,
  status            VARCHAR(50),            -- Status dari YouTube API
  -- 'uploaded' | 'processing' | 'public' | 'private' | 'unlisted'

  -- Metadata yang diupload
  uploaded_title    VARCHAR(500),
  uploaded_description TEXT,
  uploaded_tags     TEXT[],

  -- Analytics (diupdate berkala)
  views             INTEGER DEFAULT 0,
  likes             INTEGER DEFAULT 0,
  comments          INTEGER DEFAULT 0,
  watch_time_hours  DECIMAL(10,2) DEFAULT 0,
  ctr_percent       DECIMAL(5,2),
  avg_view_duration INTEGER,              -- Detik

  analytics_updated_at TIMESTAMPTZ,
  uploaded_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Tabel: `api_keys`

```sql
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  provider      VARCHAR(50) NOT NULL,
  -- 'grok' | 'elevenlabs' | 'suno' | 'ideogram' | 'openai' | 'pexels' | 'mubert'

  key_value     TEXT NOT NULL,            -- Encrypted
  is_active     BOOLEAN DEFAULT true,
  label         VARCHAR(100),             -- Nama deskriptif

  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);
```

---

## 4. Enums & Status Flow

### Status Alur `contents.status`

```
pending
  ↓ (mulai pipeline)
generating
  ↓ (pipeline selesai)
awaiting_review
  ↓ (user approve)       ↓ (user reject)
approved                rejected
  ↓ (set jadwal)           ↓ (edit & resubmit)
scheduled              pending (kembali ke awal)
  ↓ (upload otomatis)
uploading
  ↓ (berhasil)
published
```

---

## 5. Indeks & Performa

```sql
-- Query paling sering: dashboard & calendar
CREATE INDEX idx_contents_channel_scheduled ON contents(channel_id, scheduled_at DESC);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_pipeline_jobs_content ON pipeline_jobs(content_id);
CREATE INDEX idx_pipeline_logs_job ON pipeline_logs(job_id, created_at DESC);
CREATE INDEX idx_content_assets_content ON content_assets(content_id, type);
CREATE INDEX idx_youtube_videos_channel ON youtube_videos(channel_id);
```

---

## 6. Row Level Security (Supabase RLS)

```sql
-- Users hanya bisa akses data milik mereka sendiri
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own channel's contents"
  ON contents FOR ALL
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE user_id = auth.uid()
    )
  );

-- Policy serupa untuk semua tabel lainnya
```
