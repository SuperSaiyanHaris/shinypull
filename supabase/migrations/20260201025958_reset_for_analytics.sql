-- =============================================
-- STEP 1: Drop all old Pokemon-related tables
-- =============================================
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS sets CASCADE;

-- =============================================
-- STEP 2: Create new Social Analytics schema
-- =============================================

-- Tracked creators/channels
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL, -- 'youtube', 'twitch', 'tiktok', 'instagram', 'twitter'
    platform_id VARCHAR(100) NOT NULL, -- The ID on that platform
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    profile_image TEXT,
    description TEXT,
    country VARCHAR(3), -- ISO country code
    category VARCHAR(100), -- Gaming, Music, Entertainment, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_id)
);

-- Daily statistics snapshots
CREATE TABLE creator_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Common metrics
    followers BIGINT DEFAULT 0,
    following BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_posts BIGINT DEFAULT 0, -- videos, tweets, posts

    -- Platform-specific (nullable)
    subscribers BIGINT, -- YouTube
    avg_views_per_post BIGINT,
    engagement_rate DECIMAL(5,2), -- percentage
    estimated_earnings_low DECIMAL(12,2),
    estimated_earnings_high DECIMAL(12,2),

    -- Growth metrics (calculated)
    followers_gained_day BIGINT DEFAULT 0,
    followers_gained_week BIGINT DEFAULT 0,
    followers_gained_month BIGINT DEFAULT 0,
    views_gained_day BIGINT DEFAULT 0,
    views_gained_week BIGINT DEFAULT 0,
    views_gained_month BIGINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(creator_id, recorded_at)
);

-- User accounts (for saved creators, comparisons)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users can save/follow creators they want to track
CREATE TABLE user_saved_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, creator_id)
);

-- Platform rankings (top creators per platform)
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    category VARCHAR(100), -- null = overall
    rank_type VARCHAR(20) NOT NULL, -- 'subscribers', 'views', 'growth'
    rank_position INTEGER NOT NULL,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(platform, category, rank_type, rank_position, recorded_at)
);

-- =============================================
-- STEP 3: Create indexes for performance
-- =============================================
CREATE INDEX idx_creators_platform ON creators(platform);
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_creators_platform_username ON creators(platform, username);
CREATE INDEX idx_creator_stats_date ON creator_stats(recorded_at);
CREATE INDEX idx_creator_stats_creator ON creator_stats(creator_id);
CREATE INDEX idx_creator_stats_creator_date ON creator_stats(creator_id, recorded_at DESC);
CREATE INDEX idx_rankings_platform_date ON rankings(platform, recorded_at);
CREATE INDEX idx_rankings_lookup ON rankings(platform, rank_type, recorded_at);

-- =============================================
-- STEP 4: Enable Row Level Security
-- =============================================
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: Create RLS Policies
-- =============================================

-- Public read access for creators and stats (anyone can view)
CREATE POLICY "Public read access" ON creators FOR SELECT USING (true);
CREATE POLICY "Public read access" ON creator_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON rankings FOR SELECT USING (true);

-- Users can manage their own profile
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- User saved creators policies
CREATE POLICY "Users can read own saved" ON user_saved_creators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved" ON user_saved_creators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved" ON user_saved_creators FOR DELETE USING (auth.uid() = user_id);
