import { supabase } from '../lib/supabase';
import { withErrorHandling } from '../lib/errorHandler';

/**
 * Save or update a creator in the database
 */
export const upsertCreator = withErrorHandling(
  async (creatorData) => {
    const { data, error } = await supabase
      .from('creators')
      .upsert({
        platform: creatorData.platform,
        platform_id: creatorData.platformId,
        username: creatorData.username,
        display_name: creatorData.displayName,
        profile_image: creatorData.profileImage,
        description: creatorData.description,
        country: creatorData.country,
        category: creatorData.category,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'platform,platform_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
 * Save creator stats snapshot
 */
export const saveCreatorStats = withErrorHandling(
  async (creatorId, stats) => {
    const today = getTodayLocal();

    const { data, error } = await supabase
      .from('creator_stats')
      .upsert({
        creator_id: creatorId,
        recorded_at: today,
        subscribers: stats.subscribers,
        total_views: stats.totalViews,
        total_posts: stats.totalPosts,
        followers: stats.subscribers, // For YouTube, subscribers = followers
      }, {
        onConflict: 'creator_id,recorded_at',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  'creatorService.saveCreatorStats'
);

/**
 * Get creator by platform and username
 */
export const getCreatorByUsername = withErrorHandling(
  async (platform, username) => {
    // Note: Multiple creators can have the same username (e.g., MrBeast main channel, MrBeast Gaming, etc.)
    // Query all matching creators and return the one with most subscribers/followers
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('platform', platform)
      .eq('username', username.toLowerCase());

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    if (!data || data.length === 0) {
      return null;
    }

    // If only one match, return it
    if (data.length === 1) {
      return data[0];
    }

    // Multiple matches - return the one with most subscribers/followers
    // (This handles cases where username restoration created duplicates)
    return data.reduce((best, current) => {
      const bestCount = (best.totalSubscribers || 0) + (best.totalFollowers || 0);
      const currentCount = (current.totalSubscribers || 0) + (current.totalFollowers || 0);
      return currentCount > bestCount ? current : best;
    });
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
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  'creatorService.getHoursWatched'
);

/**
 * Search creators in database
 */
export const searchCreators = withErrorHandling(
  async (query, platform = null) => {
    let dbQuery = supabase
      .from('creators')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);

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
    // Fetch all creators with pagination to bypass Supabase's 1000 row limit
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          id,
          platform,
          platform_id,
          username,
          display_name,
          profile_image,
          creator_stats (
            recorded_at,
            subscribers,
            followers,
            total_views,
            total_posts,
            followers_gained_month,
            views_gained_month,
            hours_watched_day,
            hours_watched_week,
            hours_watched_month
          )
        `)
        .eq('platform', platform)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = allData.concat(data);
        page++;
        hasMore = data.length === pageSize; // Continue if we got a full page
      } else {
        hasMore = false;
      }
    }

    const data = allData;

    // Map creators and calculate growth from their stats history
    const creators = (data || []).map((creator) => {
      const allStats = (creator.creator_stats || []).sort(
        (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
      );
      
      const latestStats = allStats[0] || null;
      
      // Calculate 30-day growth from historical data
      // YouTube: require at least 7 days of data for accurate growth
      // Twitch/Kick: require at least 2 days (counts are exact)
      let calculatedGrowth = 0;
      const minDataPoints = platform === 'youtube' ? 7 : 2;
      
      if (allStats.length >= minDataPoints) {
        const oldestStat = allStats[allStats.length - 1];
        const newestStat = allStats[0];
        
        // Check if data spans at least the minimum required days
        const oldestDate = new Date(oldestStat.recorded_at).toDateString();
        const newestDate = new Date(newestStat.recorded_at).toDateString();
        
        if (oldestDate !== newestDate) {
          if (platform === 'youtube') {
            // For YouTube, use view growth
            calculatedGrowth = (newestStat?.total_views || 0) - (oldestStat?.total_views || 0);
          } else if (platform === 'kick') {
            // For Kick, use paid subscriber growth (followers field stores paid subs for Kick)
            calculatedGrowth = (newestStat?.subscribers || newestStat?.followers || 0) - (oldestStat?.subscribers || oldestStat?.followers || 0);
          } else {
            // For Twitch, use watch hours growth
            calculatedGrowth = (newestStat?.hours_watched_month || 0) - (oldestStat?.hours_watched_month || 0);
          }
        }
      }
      
      return {
        ...creator,
        latestStats,
        calculatedGrowth,
      };
    });

    const withStats = creators.filter((creator) => creator.latestStats);

    const ranked = withStats
      .map((creator) => {
        const stats = creator.latestStats;
        const subscribers = stats?.subscribers ?? stats?.followers ?? 0;
        const views = stats?.total_views ?? 0;
        
        // Use calculated growth, or fall back to pre-calculated field
        const growth = creator.calculatedGrowth > 0 
          ? creator.calculatedGrowth 
          : (platform === 'youtube' ? (stats?.views_gained_month ?? 0) : (stats?.followers_gained_month ?? 0));

        let sortValue = subscribers;
        if (rankType === 'views') sortValue = views;
        if (rankType === 'growth') sortValue = growth;

        return {
          ...creator,
          latestStats: stats,
          subscribers,
          totalViews: views,
          growth30d: growth,
          sortValue,
        };
      })
      .sort((a, b) => b.sortValue - a.sortValue)
      .slice(0, limit);

    return ranked;
  },
  'creatorService.getRankedCreators'
);
