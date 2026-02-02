import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkAllData() {
  console.log('🔍 Checking all data in database...\n');

  // Get all creators
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('*')
    .order('platform', { ascending: true });

  if (creatorsError) {
    console.error('❌ Error fetching creators:', creatorsError);
    return;
  }

  console.log(`📊 Total creators: ${creators.length}\n`);

  // Check stats for each creator
  for (const creator of creators) {
    const { data: stats, error: statsError } = await supabase
      .from('creator_stats')
      .select('*')
      .eq('creator_id', creator.id)
      .order('recorded_at', { ascending: false });

    if (statsError) {
      console.error(`❌ Error fetching stats for ${creator.name}:`, statsError);
      continue;
    }

    if (stats.length > 0) {
      const latest = stats[0];
      const oldest = stats[stats.length - 1];
      const latestDate = new Date(latest.recorded_at).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      const oldestDate = new Date(oldest.recorded_at).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      console.log(`${creator.platform.toUpperCase()} - ${creator.name}`);
      console.log(`  Username: @${creator.username}`);
      console.log(`  Data points: ${stats.length}`);
      console.log(`  Latest: ${latestDate} - ${(latest.subscribers || latest.followers || 0).toLocaleString()} subs, ${latest.total_views.toLocaleString()} views`);
      console.log(`  Oldest: ${oldestDate}`);
      console.log('');
    } else {
      console.log(`${creator.platform.toUpperCase()} - ${creator.name}: NO DATA`);
      console.log('');
    }
  }

  // Group stats by date
  console.log('\n📅 Data points by date:\n');
  const { data: allStats } = await supabase
    .from('creator_stats')
    .select('recorded_at')
    .order('recorded_at', { ascending: false });

  const dateGroups = {};
  allStats.forEach((stat) => {
    const date = new Date(stat.recorded_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });

  Object.entries(dateGroups).forEach(([date, count]) => {
    console.log(`  ${date}: ${count} data points`);
  });

  console.log(`\n✅ Total data points across all creators: ${allStats.length}`);
}

checkAllData().catch(console.error);
