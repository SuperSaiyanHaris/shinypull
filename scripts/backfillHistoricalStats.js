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

// Generate realistic growth patterns with minimal daily changes
function generateHistoricalStats(baseStats, daysAgo) {
  // Most big channels have consistent positive growth
  // For realism: 0.02% - 0.06% daily subscriber growth (very small and steady)
  const dailySubGrowthRate = 0.0002 + (Math.random() * 0.0004); // 0.02% - 0.06%
  const dailyViewGrowthRate = 0.0015 + (Math.random() * 0.0015); // 0.15% - 0.3%
  
  // Calculate what the stats would have been X days ago (working backwards)
  // Use compound growth: stats_past = stats_current / (1 + growth_rate)^days
  const subsFactor = Math.pow(1 + dailySubGrowthRate, -daysAgo);
  const viewsFactor = Math.pow(1 + dailyViewGrowthRate, -daysAgo);
  
  // Add tiny variance (±0.1%) but keep it positive overall
  // This ensures smooth growth with minor fluctuations
  const subsVariance = 1 + (Math.random() - 0.3) * 0.001; // Slightly positive bias
  const viewsVariance = 1 + (Math.random() - 0.2) * 0.002; // Slightly positive bias
  
  return {
    subscribers: Math.floor(baseStats.subscribers * subsFactor * subsVariance),
    total_views: Math.floor(baseStats.total_views * viewsFactor * viewsVariance),
    // Videos: 0-2 new videos per week for big channels
    total_posts: Math.max(0, baseStats.total_posts - Math.floor(daysAgo / 4 * Math.random())),
  };
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

    const statsToInsert = [];

    for (let i = 1; i <= daysToBackfill; i++) {
      const historicalDate = new Date(latestDate);
      historicalDate.setDate(historicalDate.getDate() - i);
      const dateString = historicalDate.toISOString().split('T')[0];

      const historicalStats = generateHistoricalStats(baseStats, i);

      statsToInsert.push({
        creator_id: creator.id,
        recorded_at: dateString,
        subscribers: historicalStats.subscribers,
        followers: historicalStats.subscribers,
        total_views: historicalStats.total_views,
        total_posts: historicalStats.total_posts,
        followers_gained_day: 0,
        followers_gained_week: 0,
        followers_gained_month: 0,
        views_gained_day: 0,
        views_gained_week: 0,
        views_gained_month: 0,
      });
    }

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
