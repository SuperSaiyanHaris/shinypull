import { supabase } from '../lib/supabase';
import { withErrorHandling } from '../lib/errorHandler';

/**
 * Save or update a creator and stats via server-side API
 * This calls /api/update-creator which uses service role key
 */
export const upsertCreator = withErrorHandling(
  async (creatorData) => {
    // Call server-side API endpoint instead of direct database write
    const response = await fetch('/api/update-creator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorData: {
          platform: creatorData.platform,
          platformId: creatorData.platformId,
          username: creatorData.username,
          displayName: creatorData.displayName,
          profileImage: creatorData.profileImage,
          description: creatorData.description,
          country: creatorData.country,
          category: creatorData.category,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save creator' }));
      throw new Error(error.error || 'Failed to save creator');
    }

    const result = await response.json();
    return result.creator;
  },
  'creatorService.upsertCreator'
);

/**
 * Get today's date in America/New_York timezone (YYYY-MM-DD format)
 * This ensures consistent date handling regardless of UTC offset
 */
function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Save creator stats snapshot via server-side API
 * This should ONLY save stats, not touch the creator record
 */
export const saveCreatorStats = withErrorHandling(
  async (creatorId, stats) => {
    // Call server-side API with ONLY stats data
    // Send creatorId so API knows which creator these stats belong to
    const response = await fetch('/api/update-creator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorId: creatorId, // Just send the ID
        statsData: {
          subscribers: stats.subscribers,
          totalViews: stats.totalViews,
          totalPosts: stats.totalPosts,
        },
        // NO creatorData - we don't want to update the creator record
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save stats' }));
      throw new Error(error.error || 'Failed to save stats');
    }

    const result = await response.json();
    return result;
  },
  'creatorService.saveCreatorStats'
);

// Creator profile metadata changes rarely (avatar, description updates).
// Cache per (platform, username) with stale-while-revalidate.
const _creatorByUsernameCache = new Map();
const CREATOR_PROFILE_TTL = 5 * 60 * 1000; // 5 minutes

async function _fetchCreatorByUsername(platform, username) {
  // Multiple creators can share a username (e.g. MrBeast / MrBeast Gaming).
  // Return the most recently updated one (likely the main/active channel).
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', platform)
    .eq('username', username.toLowerCase())
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error && error.code !== 'PGRST116') throw error;
  return (data && data.length > 0) ? data[0] : null;
}

/**
 * Get creator by platform and username
 */
export const getCreatorByUsername = withErrorHandling(
  async (platform, username) => {
    const key = `${platform}:${username.toLowerCase()}`;
    const hit = _creatorByUsernameCache.get(key);
    const now = Date.now();
    if (hit) {
      if (now - hit.ts > CREATOR_PROFILE_TTL) {
        _fetchCreatorByUsername(platform, username)
          .then(data => _creatorByUsernameCache.set(key, { data, ts: Date.now() }))
          .catch(() => {});
      }
      return hit.data;
    }
    const data = await _fetchCreatorByUsername(platform, username);
    _creatorByUsernameCache.set(key, { data, ts: now });
    return data;
  },
  'creatorService.getCreatorByUsername'
);

/**
 * Get creator by platform and platform ID
 */
export const getCreatorByPlatformId = withErrorHandling(
  async (platform, platformId) => {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('platform', platform)
      .eq('platform_id', platformId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  'creatorService.getCreatorByPlatformId'
);

// Stats history changes 2x/day — 10-min TTL balances freshness vs round-trips.
// Key includes `days` so switching chart ranges fetches correctly.
const _creatorStatsCache = new Map();
const CREATOR_STATS_TTL = 10 * 60 * 1000; // 10 minutes

async function _fetchCreatorStats(creatorId, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creatorId)
    .gte('recorded_at', startDate.toISOString().split('T')[0])
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Get creator stats history
 */
export const getCreatorStats = withErrorHandling(
  async (creatorId, days = 30) => {
    const key = `${creatorId}:${days}`;
    const hit = _creatorStatsCache.get(key);
    const now = Date.now();
    if (hit) {
      if (now - hit.ts > CREATOR_STATS_TTL) {
        _fetchCreatorStats(creatorId, days)
          .then(data => _creatorStatsCache.set(key, { data, ts: Date.now() }))
          .catch(() => {});
      }
      return hit.data;
    }
    const data = await _fetchCreatorStats(creatorId, days);
    _creatorStatsCache.set(key, { data, ts: now });
    return data;
  },
  'creatorService.getCreatorStats'
);

/**
 * Get hours watched stats for a Twitch creator
 */
export const getHoursWatched = withErrorHandling(
  async (creatorId) => {
    const { data, error } = await supabase
      .from('creator_stats')
      .select('hours_watched_day, hours_watched_week, hours_watched_month, peak_viewers_day, avg_viewers_day, streams_count_day')
      .eq('creator_id', creatorId)
      .gt('hours_watched_month', 0)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
  },
  'creatorService.getHoursWatched'
);

/**
 * Search creators in database (fuzzy: dots, underscores, dashes are ignored)
 */
export const searchCreators = withErrorHandling(
  async (query, platform = null) => {
    // Sanitize query to prevent injection via RPC params
    const sanitized = query.replace(/[,%()\\]/g, '').trim();
    if (!sanitized) return [];

    // If stripping all separators leaves fewer than 2 chars, the RPC would
    // match everything or nothing useful — skip the round-trip.
    const stripped = sanitized.replace(/[._\-\s]/g, '');
    if (stripped.length < 2) return [];

    const { data, error } = await supabase.rpc('search_creators_fuzzy', {
      p_query: sanitized,
      p_platform: platform,
      p_limit: 20,
    });

    if (error) throw error;
    return data || [];
  },
  'creatorService.searchCreators'
);

// Latest stat row — used for the odometer display, same TTL as stats history.
const _latestStatsCache = new Map();
const LATEST_STATS_TTL = 5 * 60 * 1000; // 5 minutes

async function _fetchLatestStats(creatorId) {
  const { data, error } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creatorId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get latest stats for a creator
 */
export const getLatestStats = withErrorHandling(
  async (creatorId) => {
    const hit = _latestStatsCache.get(creatorId);
    const now = Date.now();
    if (hit) {
      if (now - hit.ts > LATEST_STATS_TTL) {
        _fetchLatestStats(creatorId)
          .then(data => _latestStatsCache.set(creatorId, { data, ts: Date.now() }))
          .catch(() => {});
      }
      return hit.data;
    }
    const data = await _fetchLatestStats(creatorId);
    _latestStatsCache.set(creatorId, { data, ts: now });
    return data;
  },
  'creatorService.getLatestStats'
);

// Module-level rankings cache — survives component unmounts and SPA navigation.
// Data changes at most 2x/day, so 10-minute TTL is conservative and safe.
// Pattern: stale-while-revalidate — serve cached data instantly, refresh in background.
const _rankingsCache = new Map(); // key → { data, ts }
const RANKINGS_TTL = 10 * 60 * 1000; // 10 minutes

async function _fetchRankings(platform, rankType, limit) {
  const { data, error } = await supabase.rpc('get_ranked_creators', {
    p_platform: platform,
    p_rank_type: rankType,
    p_limit: limit,
  });
  if (error) throw error;
  return (data || []).map((creator) => ({
    ...creator,
    latestStats: {
      subscribers: creator.subscribers,
      followers: creator.subscribers,
      total_views: creator.total_views,
      total_posts: creator.total_posts,
      hours_watched_day: creator.hours_watched_day,
      hours_watched_week: creator.hours_watched_week,
      hours_watched_month: creator.hours_watched_month,
    },
    subscribers: creator.subscribers,
    totalViews: creator.total_views,
    totalPosts: creator.total_posts,
    growth30d: creator.growth_30d,
    sortValue: rankType === 'views' ? creator.total_views
      : rankType === 'growth' ? creator.growth_30d
      : creator.subscribers,
  }));
}

/**
 * Get active featured listings for a platform.
 * Returns listings ordered by created_at ascending — first come, first served.
 * Earliest listing gets the best slot (position 11), later ones fill every 5th row after.
 */
export async function getFeaturedListings(platform) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('featured_listings')
    .select('id, platform, placement_tier, is_mod_free, active_until, creators(id, username, display_name, profile_image, platform)')
    .eq('platform', platform)
    .eq('status', 'active')
    .gt('active_until', now)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Validate a ShinyPull profile URL and return the creator record.
 * Accepts: https://shinypull.com/youtube/mrbeast OR youtube/mrbeast
 */
export async function validateFeaturedCreatorUrl(urlOrPath) {
  const path = urlOrPath
    .replace(/^https?:\/\/shinypull\.com\//, '')
    .replace(/^\//, '')
    .trim();
  const parts = path.split('/');
  if (parts.length < 2) return null;
  const [platform, username] = parts;
  const { data } = await supabase
    .from('creators')
    .select('id, platform, username, display_name, profile_image')
    .eq('platform', platform.toLowerCase())
    .eq('username', username.toLowerCase())
    .maybeSingle();
  return data || null;
}

/**
 * Get ranked creators with latest stats.
 * Cached per (platform, rankType, limit) with stale-while-revalidate.
 */
export const getRankedCreators = withErrorHandling(
  async (platform, rankType = 'subscribers', limit = 50) => {
    const key = `${platform}:${rankType}:${limit}`;
    const hit = _rankingsCache.get(key);
    const now = Date.now();

    if (hit) {
      // Serve stale data immediately; refresh in background if TTL expired
      if (now - hit.ts > RANKINGS_TTL) {
        _fetchRankings(platform, rankType, limit)
          .then(data => _rankingsCache.set(key, { data, ts: Date.now() }))
          .catch(() => {}); // keep serving stale on background failure
      }
      return hit.data;
    }

    // Cold cache — must fetch synchronously
    const data = await _fetchRankings(platform, rankType, limit);
    _rankingsCache.set(key, { data, ts: now });
    return data;
  },
  'creatorService.getRankedCreators'
);
