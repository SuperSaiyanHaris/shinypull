import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Generate 30 days of historical data by walking backwards day-by-day
// This ensures smooth, consistent daily growth
function generateHistoricalDataPoints(currentStats, daysToGenerate) {
  // Pick ONE consistent growth rate for this channel
  const dailySubGrowthRate = 0.0003 + (Math.random() * 0.0002); // 0.03% - 0.05% daily
  const dailyViewGrowthRate = 0.002 + (Math.random() * 0.001); // 0.2% - 0.3% daily
  const videosPerWeek = 1 + Math.random() * 2; // 1-3 videos per week
  
  const dataPoints = [];
  let currentSubs = currentStats.subscribers;
  let currentViews = currentStats.total_views;
  let currentVideos = currentStats.total_posts;
  
  // Walk backwards day by day
  for (let day = 1; day <= daysToGenerate; day++) {
    // Calculate previous day's stats using inverse compound growth
    const prevSubs = Math.floor(currentSubs / (1 + dailySubGrowthRate));
    const prevViews = Math.floor(currentViews / (1 + dailyViewGrowthRate));
    
    // Estimate videos (subtract some every ~5 days)
    const prevVideos = (day % 5 === 0 && currentVideos > 0)
      ? currentVideos - Math.floor(Math.random() * 2)
      : currentVideos;
    
    dataPoints.push({
      subscribers: prevSubs,
      total_views: prevViews,
      total_posts: Math.max(0, prevVideos),
      daysAgo: day
    });
    
    currentSubs = prevSubs;
    currentViews = prevViews;
    currentVideos = prevVideos;
  }
  
  return dataPoints.reverse(); // Return oldest to newest
}

async function backfillCreatorStats() {
  console.log('Fetching creators with stats...');
  
  // Get all creators with their latest stats
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select(`
      id,
      username,
      display_name,
      platform,
      creator_stats (
        recorded_at,
        subscribers,
        followers,
        total_views,
        total_posts
      )
    `)
    .order('recorded_at', { foreignTable: 'creator_stats', ascending: false })
    .limit(1, { foreignTable: 'creator_stats' });

  if (creatorsError) throw creatorsError;

  const creatorsWithStats = creators.filter(c => c.creator_stats && c.creator_stats.length > 0);
  console.log(`Found ${creatorsWithStats.length} creators with stats`);

  const daysToBackfill = 30; // Backfill 30 days of historical data
  let totalInserted = 0;
  let totalDeleted = 0;

  for (const creator of creatorsWithStats) {
    const latestStat = creator.creator_stats[0];
    const latestDate = new Date(latestStat.recorded_at);
    
    // Delete existing stats to regenerate with accurate data
    const { data: existingStats, error: fetchError } = await supabase
      .from('creator_stats')
      .select('id, recorded_at')
      .eq('creator_id', creator.id);

    if (fetchError) {
      console.error(`Error fetching stats for ${creator.display_name}:`, fetchError.message);
      continue;
    }

    // Delete all except the most recent one (today's seed data)
    const statsToDelete = existingStats.filter(s => s.recorded_at !== latestStat.recorded_at);
    if (statsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('creator_stats')
        .delete()
        .in('id', statsToDelete.map(s => s.id));
      
      if (!deleteError) {
        totalDeleted += statsToDelete.length;
        console.log(`Deleted ${statsToDelete.length} old data points for ${creator.display_name}`);
      }
    }

    console.log(`Backfilling ${creator.display_name} (${creator.platform})...`);

    const baseStats = {
      subscribers: latestStat.subscribers || latestStat.followers || 0,
      total_views: latestStat.total_views || 0,
      total_posts: latestStat.total_posts || 0,
    };

    // Generate all historical data points at once with consistent growth
    const historicalDataPoints = generateHistoricalDataPoints(baseStats, daysToBackfill);
    
    const statsToInsert = historicalDataPoints.map((dataPoint, index) => {
      const historicalDate = new Date(latestDate);
      historicalDate.setDate(historicalDate.getDate() - (daysToBackfill - index));
      const dateString = historicalDate.toISOString().split('T')[0];

      return {
        creator_id: creator.id,
        recorded_at: dateString,
        subscribers: dataPoint.subscribers,
        followers: dataPoint.subscribers,
        total_views: dataPoint.total_views,
        total_posts: dataPoint.total_posts,
        followers_gained_day: 0,
        followers_gained_week: 0,
        followers_gained_month: 0,
        views_gained_day: 0,
        views_gained_week: 0,
        views_gained_month: 0,
      };
    });

    if (statsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('creator_stats')
        .insert(statsToInsert);

      if (insertError) {
        console.error(`Failed to insert stats for ${creator.display_name}:`, insertError.message);
      } else {
        console.log(`✔ Inserted ${statsToInsert.length} days of historical data`);
        totalInserted += statsToInsert.length;
      }
    }
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Deleted: ${totalDeleted} old data points`);
  console.log(`   Inserted: ${totalInserted} new data points`);
  console.log(`   Each creator now has ${daysToBackfill + 1} days of data`);
}

backfillCreatorStats().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
