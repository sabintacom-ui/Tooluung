CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  youtube_id VARCHAR(100),
  youtube_token TEXT,
  youtube_refresh_token TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  script_system_prompt TEXT,
  script_tone VARCHAR(100),
  script_cta TEXT,
  target_duration_min INTEGER DEFAULT 5,
  voice_id VARCHAR(100),
  music_genre VARCHAR(100),
  music_mood VARCHAR(100),
  thumbnail_style_prompt TEXT,
  video_resolution VARCHAR(20) DEFAULT '1080p',
  video_aspect_ratio VARCHAR(10) DEFAULT '16:9',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  target_audience TEXT,
  keywords TEXT[] DEFAULT '{}',
  notes TEXT,
  selected_title VARCHAR(500),
  title_options JSONB DEFAULT '[]',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  chapters JSONB DEFAULT '[]',
  script JSONB,
  thumbnail_prompt TEXT,
  footage_keywords TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  source VARCHAR(50) DEFAULT 'manual',
  batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_step VARCHAR(100),
  steps_completed TEXT[] DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  cost_breakdown JSONB DEFAULT '{}',
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  error_message TEXT,
  error_step VARCHAR(100),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES pipeline_jobs(id) ON DELETE CASCADE,
  step VARCHAR(100),
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(100) NOT NULL,
  youtube_url TEXT NOT NULL,
  privacy_status VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  storage_url TEXT NOT NULL,
  provider VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON templates(channel_id);
CREATE INDEX IF NOT EXISTS idx_contents_channel_status ON contents(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_contents_scheduled_at ON contents(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status_created ON pipeline_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_job_created ON pipeline_logs(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_assets_content ON content_assets(content_id);

CREATE OR REPLACE FUNCTION claim_next_pipeline_job(worker_id TEXT)
RETURNS SETOF pipeline_jobs AS $$
DECLARE
  claimed_id UUID;
BEGIN
  SELECT id INTO claimed_id
  FROM pipeline_jobs
  WHERE status IN ('pending', 'running')
    AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '15 minutes')
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF claimed_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE pipeline_jobs
  SET status = 'running', locked_at = NOW(), locked_by = worker_id, updated_at = NOW()
  WHERE id = claimed_id;

  RETURN QUERY SELECT * FROM pipeline_jobs WHERE id = claimed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_channels_updated_at ON channels;
CREATE TRIGGER trg_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_templates_updated_at ON templates;
CREATE TRIGGER trg_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_contents_updated_at ON contents;
CREATE TRIGGER trg_contents_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_pipeline_jobs_updated_at ON pipeline_jobs;
CREATE TRIGGER trg_pipeline_jobs_updated_at BEFORE UPDATE ON pipeline_jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

-- Server uses service role key; RLS blocks anonymous/client access by default.
