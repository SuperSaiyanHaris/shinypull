import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkShroud() {
  console.log('🔍 Checking shroud data...\n');

  // Get shroud
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'twitch')
    .eq('username', 'shroud')
    .single();

  if (!creator) {
    console.error('❌ shroud not found');
    return;
  }

  console.log(`Found: ${creator.display_name || creator.username}`);
  console.log(`ID: ${creator.id}`);
  console.log(`Platform: ${creator.platform}\n`);

  // Get all stats
  const { data: stats } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false });

  console.log(`📊 Total data points: ${stats.length}\n`);
  console.log('All entries:');
  console.log('='.repeat(60));

  stats.forEach((stat) => {
    const date = new Date(stat.recorded_at + 'T12:00:00').toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
    console.log(`${date}`);
    console.log(`  Followers: ${(stat.followers / 1000000).toFixed(1)}M`);
    console.log(`  Total Views: ${stat.total_views}`);
    console.log(`  Raw data:`, stat);
    console.log('');
  });
}

checkShroud().catch(console.error);
