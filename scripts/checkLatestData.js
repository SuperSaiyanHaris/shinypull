import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkLatestData() {
  console.log('🔍 Checking latest data from 2/2/2026...\n');

  // Get stats from today (2026-02-02)
  const { data: todayStats, error } = await supabase
    .from('creator_stats')
    .select(`
      *,
      creators!inner(username, display_name, platform)
    `)
    .eq('recorded_at', '2026-02-02')
    .order('subscribers', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${todayStats?.length || 0} entries for 2/2/2026\n`);

  if (!todayStats || todayStats.length === 0) {
    console.log('❌ No data found for today (2/2/2026)');
    console.log('\nLet me check what dates we have...\n');
    
    const { data: allDates } = await supabase
      .from('creator_stats')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(100);
    
    const dateGroups = {};
    allDates.forEach((stat) => {
      dateGroups[stat.recorded_at] = (dateGroups[stat.recorded_at] || 0) + 1;
    });
    
    console.log('Available dates:');
    Object.entries(dateGroups).slice(0, 5).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} data points`);
    });
    
    return;
  }

  console.log('Top 10 creators (2/2/2026):');
  console.log('='.repeat(80));
  
  todayStats.forEach((stat, i) => {
    const creator = stat.creators;
    console.log(`${i + 1}. ${creator.display_name || creator.username} (@${creator.username})`);
    console.log(`   Platform: ${creator.platform.toUpperCase()}`);
    console.log(`   Subs/Followers: ${(stat.subscribers / 1000000).toFixed(1)}M`);
    console.log(`   Total Views: ${stat.total_views ? (stat.total_views / 1000000000).toFixed(2) + 'B' : 'N/A'}`);
    console.log(`   Total Videos: ${stat.total_posts || 'N/A'}`);
    console.log('');
  });

  // Check if views are being stored
  const statsWithoutViews = todayStats.filter(s => !s.total_views || s.total_views === 0);
  if (statsWithoutViews.length > 0) {
    console.log(`⚠️  Warning: ${statsWithoutViews.length} entries have 0 or null views`);
  } else {
    console.log(`✅ All entries have view data!`);
  }
}

checkLatestData().catch(console.error);
