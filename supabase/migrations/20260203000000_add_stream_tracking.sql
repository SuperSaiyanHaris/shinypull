-- =============================================
-- Stream Tracking for Hours Watched Calculation
-- =============================================

-- Track individual stream sessions
CREATE TABLE stream_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    stream_id VARCHAR(100) NOT NULL, -- Twitch stream ID
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    peak_viewers INTEGER DEFAULT 0,
    avg_viewers INTEGER DEFAULT 0,
    hours_watched DECIMAL(12,2) DEFAULT 0, -- Calculated when stream ends
    game_name VARCHAR(200),
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, stream_id)
);

-- Periodic viewer count samples during streams
CREATE TABLE viewer_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES stream_sessions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    viewer_count INTEGER NOT NULL,
    game_name VARCHAR(200)
);

-- Add hours_watched tracking to creator_stats
ALTER TABLE creator_stats
ADD COLUMN IF NOT EXISTS hours_watched_day DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours_watched_week DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours_watched_month DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_viewers_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_viewers_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streams_count_day INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX idx_stream_sessions_creator ON stream_sessions(creator_id);
CREATE INDEX idx_stream_sessions_dates ON stream_sessions(started_at, ended_at);
CREATE INDEX idx_stream_sessions_active ON stream_sessions(creator_id, ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_viewer_samples_session ON viewer_samples(session_id);
CREATE INDEX idx_viewer_samples_time ON viewer_samples(recorded_at);

-- Enable RLS
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_samples ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON stream_sessions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON viewer_samples FOR SELECT USING (true);

-- Service role write access (for background jobs)
CREATE POLICY "Service write access" ON stream_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write access" ON viewer_samples FOR ALL USING (true) WITH CHECK (true);
