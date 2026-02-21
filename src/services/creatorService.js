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

/**
 * Get creator by platform and username
 */
export const getCreatorByUsername = withErrorHandling(
  async (platform, username) => {
    // Note: Multiple creators can have the same username (e.g., MrBeast main channel, MrBeast Gaming, etc.)
    // Query all matching creators and return the most recently updated one (likely the main/active channel)
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('platform', platform)
      .eq('username', username.toLowerCase())
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    if (!data || data.length === 0) {
      return null;
    }

    // Return the most recently updated creator
    return data[0];
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

/**
 * Get creator stats history
 */
export const getCreatorStats = withErrorHandling(
  async (creatorId, days = 30) => {
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
 * Search creators in database
 */
export const searchCreators = withErrorHandling(
  async (query, platform = null) => {
    // Build OR conditions: match on raw query + normalized (spaces/special chars stripped)
    // Sanitize query to prevent PostgREST filter injection
    const sanitized = query.replace(/[,%()\\]/g, '');
    const normalized = sanitized.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    const conditions = [`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`];
    if (normalized && normalized !== sanitized.toLowerCase()) {
      conditions[0] += `,username.ilike.%${normalized}%`;
    }

    let dbQuery = supabase
      .from('creators')
      .select('*')
      .or(conditions[0]);

    if (platform) {
      dbQuery = dbQuery.eq('platform', platform);
    }

    const { data, error } = await dbQuery.limit(20);

    if (error) throw error;
    return data;
  },
  'creatorService.searchCreators'
);

/**
 * Get latest stats for a creator
 */
export const getLatestStats = withErrorHandling(
  async (creatorId) => {
    const { data, error } = await supabase
      .from('creator_stats')
      .select('*')
      .eq('creator_id', creatorId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  'creatorService.getLatestStats'
);

/**
 * Get ranked creators with latest stats
 */
export const getRankedCreators = withErrorHandling(
  async (platform, rankType = 'subscribers', limit = 50) => {
    const { data, error } = await supabase.rpc('get_ranked_creators', {
      p_platform: platform,
      p_rank_type: rankType,
      p_limit: limit,
    });

    if (error) throw error;

    // Map DB column names to the format Rankings.jsx expects
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
  },
  'creatorService.getRankedCreators'
);
