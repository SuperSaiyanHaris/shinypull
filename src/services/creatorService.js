import { supabase } from '../lib/supabase';

/**
 * Save or update a creator in the database
 */
export async function upsertCreator(creatorData) {
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
}

/**
 * Save creator stats snapshot
 */
export async function saveCreatorStats(creatorId, stats) {
  const today = new Date().toISOString().split('T')[0];

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
}

/**
 * Get creator by platform and username
 */
export async function getCreatorByUsername(platform, username) {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', platform)
    .eq('username', username.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

/**
 * Get creator by platform and platform ID
 */
export async function getCreatorByPlatformId(platform, platformId) {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', platform)
    .eq('platform_id', platformId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get creator stats history
 */
export async function getCreatorStats(creatorId, days = 30) {
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
 * Get hours watched stats for a Twitch creator
 */
export async function getHoursWatched(creatorId) {
  const { data, error } = await supabase
    .from('creator_stats')
    .select('hours_watched_day, hours_watched_week, hours_watched_month, peak_viewers_day, avg_viewers_day, streams_count_day')
    .eq('creator_id', creatorId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Search creators in database
 */
export async function searchCreators(query, platform = null) {
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
}

/**
 * Get latest stats for a creator
 */
export async function getLatestStats(creatorId) {
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
 * Get ranked creators with latest stats
 */
export async function getRankedCreators(platform, rankType = 'subscribers', limit = 50) {
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
        views_gained_month
      )
    `)
    .eq('platform', platform)
    .order('recorded_at', { foreignTable: 'creator_stats', ascending: false })
    .limit(1, { foreignTable: 'creator_stats' });

  if (error) throw error;

  const creators = (data || []).map((creator) => ({
    ...creator,
    latestStats: creator.creator_stats?.[0] || null,
  }));

  const withStats = creators.filter((creator) => creator.latestStats);

  let growthByCreatorId = new Map();

  if (rankType === 'growth' && withStats.length > 0) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateString = startDate.toISOString().split('T')[0];

    const creatorIds = withStats.map((creator) => creator.id);

    const { data: history, error: historyError } = await supabase
      .from('creator_stats')
      .select('creator_id, recorded_at, subscribers, followers')
      .in('creator_id', creatorIds)
      .gte('recorded_at', startDateString)
      .order('recorded_at', { ascending: true });

    if (historyError) throw historyError;

    const historyByCreatorId = new Map();
    (history || []).forEach((row) => {
      if (!historyByCreatorId.has(row.creator_id)) {
        historyByCreatorId.set(row.creator_id, []);
      }
      historyByCreatorId.get(row.creator_id).push(row);
    });

    growthByCreatorId = new Map(
      Array.from(historyByCreatorId.entries()).map(([creatorId, rows]) => {
        const first = rows[0];
        const last = rows[rows.length - 1];
        const firstCount = first?.subscribers ?? first?.followers ?? 0;
        const lastCount = last?.subscribers ?? last?.followers ?? 0;
        return [creatorId, lastCount - firstCount];
      })
    );
  }

  const ranked = withStats
    .map((creator) => {
      const stats = creator.latestStats;
      const subscribers = stats?.subscribers ?? stats?.followers ?? 0;
      const views = stats?.total_views ?? 0;
      const growth =
        rankType === 'growth'
          ? growthByCreatorId.get(creator.id) ?? stats?.followers_gained_month ?? 0
          : stats?.followers_gained_month ?? 0;

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
}
