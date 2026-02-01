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
