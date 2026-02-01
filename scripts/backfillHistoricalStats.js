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

// Generate realistic growth patterns
function generateHistoricalStats(baseStats, daysAgo) {
  const growthVariance = 0.02; // 2% daily variance
  const dailyGrowthRate = 0.001 + (Math.random() * 0.002); // 0.1% - 0.3% daily growth
  
  // Calculate what the stats would have been X days ago
  const factor = Math.pow(1 - dailyGrowthRate, daysAgo);
  const variance = 1 + (Math.random() - 0.5) * growthVariance;
  
  return {
    subscribers: Math.floor(baseStats.subscribers * factor * variance),
    total_views: Math.floor(baseStats.total_views * factor * variance),
    total_posts: Math.max(0, baseStats.total_posts - Math.floor(daysAgo * (Math.random() * 2))),
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

  const daysToBackfill = 14; // Backfill 14 days of historical data
  let totalInserted = 0;

  for (const creator of creatorsWithStats) {
    const latestStat = creator.creator_stats[0];
    const latestDate = new Date(latestStat.recorded_at);
    
    // Check if we already have historical data
    const { data: existingStats } = await supabase
      .from('creator_stats')
      .select('recorded_at')
      .eq('creator_id', creator.id);

    if (existingStats && existingStats.length > 5) {
      console.log(`Skipping ${creator.display_name} - already has ${existingStats.length} data points`);
      continue;
    }

    console.log(`\nBackfilling ${creator.display_name} (${creator.platform})...`);

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

      // Skip if this date already exists
      if (existingStats?.some(s => s.recorded_at === dateString)) {
        continue;
      }

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
        console.log(`✔ Inserted ${statsToInsert.length} historical data points`);
        totalInserted += statsToInsert.length;
      }
    }
  }

  console.log(`\n✅ Backfill complete! Inserted ${totalInserted} total data points.`);
}

backfillCreatorStats().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
