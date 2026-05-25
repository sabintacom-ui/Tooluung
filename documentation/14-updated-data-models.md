# PRD — YouTube Content Automation Platform
## Dokumen 14: Update Data Models untuk v2.0

---

## 1. Tabel Baru & Perubahan dari v1.x

Dokumen ini mencatat perubahan schema yang diperlukan untuk mendukung full AI video generation.

---

## 2. Update Tabel `contents`

Tambah kolom baru:

```sql
ALTER TABLE contents ADD COLUMN IF NOT EXISTS
  budget_mode VARCHAR(20) DEFAULT 'standard',
  -- 'economy' | 'standard' | 'premium' | 'ultra' | 'presenter'

  shot_list       JSONB,         -- Array Shot dari AI Director
  research_brief  JSONB,         -- Output riset topik
  director_review JSONB,         -- Review AI Director per klip

  total_cost_usd  DECIMAL(10,4), -- Akumulasi biaya semua provider
  cost_breakdown  JSONB;         -- { grok: 0.05, kling: 4.00, ... }
```

---

## 3. Tabel Baru: `video_shots`

Menyimpan setiap shot yang di-generate secara individual.

```sql
CREATE TABLE video_shots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id        UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,

  -- Shot metadata
  segment_index     INTEGER NOT NULL,     -- Urutan shot ke-N
  shot_type         VARCHAR(50) NOT NULL,
  -- 'establishing_shot' | 'broll_action' | 'broll_abstract'
  -- | 'close_up' | 'presenter'

  narrative_text    TEXT,                 -- Narasi yang diucapkan di shot ini
  video_prompt      TEXT NOT NULL,        -- Prompt yang dikirim ke provider
  negative_prompt   TEXT,
  camera_movement   VARCHAR(50),
  mood              VARCHAR(50),

  -- Generation result
  provider          VARCHAR(50),          -- 'kling' | 'veo3' | 'runway' | 'hailuo' | 'heygen' | 'luma'
  duration_seconds  DECIMAL(5,2),
  resolution        VARCHAR(20),
  video_url         TEXT,                 -- Vercel Blob URL
  file_size_mb      DECIMAL(8,2),

  -- Status
  status            VARCHAR(30) DEFAULT 'pending',
  -- 'pending' | 'generating' | 'completed' | 'failed' | 'rejected_by_director'

  -- AI Director review
  director_score    INTEGER,              -- 0–100
  director_decision VARCHAR(20),         -- 'approve' | 'regenerate' | 'skip'
  director_reason   TEXT,

  -- Cost
  cost_usd          DECIMAL(8,4),

  -- Timing
  generation_started_at   TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  retry_count             INTEGER DEFAULT 0,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_shots_content ON video_shots(content_id, segment_index);
CREATE INDEX idx_video_shots_status ON video_shots(status);
```

---

## 4. Tabel Baru: `trend_signals`

Menyimpan data tren yang dikumpulkan oleh Trend Intelligence Engine.

```sql
CREATE TABLE trend_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID REFERENCES channels(id) ON DELETE CASCADE,

  keyword         VARCHAR(255) NOT NULL,
  platform        VARCHAR(50) NOT NULL,   -- 'google_trends' | 'youtube' | 'reddit' | 'twitter'
  niche           VARCHAR(100),

  trend_score     INTEGER,                -- 0–100, seberapa trending
  velocity_score  INTEGER,               -- Seberapa cepat naik
  competition_score INTEGER,             -- Makin rendah makin bagus (0–100)
  estimated_cpm   DECIMAL(6,2),          -- USD

  recommended_angle TEXT,
  urgency          VARCHAR(20),          -- 'now' | '3days' | 'week'

  is_actioned      BOOLEAN DEFAULT false, -- Sudah dibuat videonya?
  actioned_content_id UUID REFERENCES contents(id),

  expires_at       TIMESTAMPTZ,          -- Sinyal kadaluarsa
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trend_signals_channel ON trend_signals(channel_id, urgency, created_at DESC);
```

---

## 5. Tabel Baru: `avatar_profiles`

Menyimpan konfigurasi avatar AI presenter per channel.

```sql
CREATE TABLE avatar_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  name            VARCHAR(100),          -- Nama avatar (misal: "Host Channel")
  provider        VARCHAR(50) NOT NULL,  -- 'heygen' | 'did' | 'synthesia'

  -- Provider-specific IDs
  provider_avatar_id  VARCHAR(255),      -- ID dari provider
  provider_voice_id   VARCHAR(255),

  -- Sample assets (untuk clone)
  video_sample_url    TEXT,
  audio_sample_url    TEXT,
  consent_verified    BOOLEAN DEFAULT false,

  -- Style
  default_background  VARCHAR(255),
  clothing_style      VARCHAR(100),

  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Tabel Baru: `platform_publishes`

Tracking publikasi ke platform selain YouTube.

```sql
CREATE TABLE platform_publishes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,

  platform        VARCHAR(50) NOT NULL,
  -- 'youtube' | 'youtube_shorts' | 'tiktok' | 'instagram_reels'
  -- | 'instagram_feed' | 'linkedin'

  format_variant  VARCHAR(50),           -- '16:9' | '9:16' | '1:1'
  video_url       TEXT,                  -- Vercel Blob URL versi reformat
  external_id     VARCHAR(255),          -- ID post di platform tujuan
  external_url    TEXT,                  -- URL post yang sudah publish

  status          VARCHAR(30) DEFAULT 'pending',
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,

  -- Analytics (diupdate berkala)
  views           INTEGER DEFAULT 0,
  likes           INTEGER DEFAULT 0,
  shares          INTEGER DEFAULT 0,
  comments        INTEGER DEFAULT 0,

  analytics_updated_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Tabel Baru: `ab_tests`

Menyimpan A/B test untuk thumbnail dan judul.

```sql
CREATE TABLE ab_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES contents(id),
  youtube_video_id VARCHAR(20),

  test_type       VARCHAR(20) NOT NULL,  -- 'thumbnail' | 'title'

  variants        JSONB NOT NULL,
  -- [{ id, value (url atau string), impressions, ctr }]

  winner_id       VARCHAR(100),          -- ID variant pemenang
  confidence      DECIMAL(5,2),          -- Confidence level (%)

  status          VARCHAR(20) DEFAULT 'running',  -- 'running' | 'completed'
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Update Tabel `pipeline_jobs` — Tambah Steps Baru

```sql
-- Steps baru yang perlu ditambahkan ke validasi
-- 'research' | 'generate_shot_list' | 'generate_shots_parallel'
-- | 'ai_director_review' | 'reformat_multiplatform'

ALTER TABLE pipeline_jobs ADD COLUMN IF NOT EXISTS
  parallel_jobs JSONB;   -- Track status per shot yang digenerate paralel
  -- { "shot_001": "completed", "shot_002": "generating", ... }
```

---

## 9. Update ENV Variables — Tambahan v2.0

```bash
# AI Video Providers
KLING_API_KEY=...
RUNWAY_API_KEY=...
HAILUO_API_KEY=...
LUMA_API_KEY=...
HEYGEN_API_KEY=...
GOOGLE_CLOUD_PROJECT=...        # Untuk VEO 3 via Vertex AI
GOOGLE_APPLICATION_CREDENTIALS=... # Path ke service account JSON

# Multi-platform
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
INSTAGRAM_APP_ID=...            # Meta Developer App
INSTAGRAM_APP_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Trend Intelligence
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
TWITTER_BEARER_TOKEN=...
SEMRUSH_API_KEY=...             # Opsional

# Cost Management
MAX_COST_PER_VIDEO_USD=20
MAX_COST_PER_DAY_USD=100
MAX_COST_PER_MONTH_USD=1000
COST_ALERT_EMAIL=...
```
