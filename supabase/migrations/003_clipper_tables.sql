-- Clipper feature: discover trending YouTube long-form, auto-clip into Shorts.
-- Tables are separate from contents/pipeline_jobs to avoid touching Generator pipeline.

CREATE TABLE IF NOT EXISTS clipper_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url TEXT NOT NULL UNIQUE,
  youtube_video_id TEXT NOT NULL,
  title TEXT,
  channel TEXT,
  channel_url TEXT,
  duration_sec INT,
  view_count BIGINT,
  thumbnail_url TEXT,
  description TEXT,
  heatmap JSONB,
  transcript JSONB,
  relevance_score INT,
  status TEXT NOT NULL DEFAULT 'discovered',
  source_mode TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clipper_sources_status ON clipper_sources(status);
CREATE INDEX IF NOT EXISTS idx_clipper_sources_video_id ON clipper_sources(youtube_video_id);

CREATE TABLE IF NOT EXISTS clipper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES clipper_sources(id) ON DELETE CASCADE,
  start_sec FLOAT NOT NULL,
  end_sec FLOAT NOT NULL,
  duration_sec FLOAT GENERATED ALWAYS AS (end_sec - start_sec) STORED,
  hook_text TEXT,
  suggested_title TEXT,
  caption_srt TEXT,
  output_path TEXT,
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step TEXT,
  steps_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  youtube_video_id TEXT,
  youtube_url TEXT,
  privacy_status TEXT DEFAULT 'private',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clipper_jobs_status ON clipper_jobs(status);
CREATE INDEX IF NOT EXISTS idx_clipper_jobs_source ON clipper_jobs(source_id);
