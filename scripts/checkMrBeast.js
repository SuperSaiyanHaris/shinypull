import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkMrBeastData() {
  console.log('🔍 Checking MrBeast data specifically...\n');

  // Get MrBeast
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('username', 'mrbeast')
    .single();

  if (!creator) {
    console.error('❌ MrBeast not found');
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
  console.log('Recent entries:');
  console.log('===============================');
  
  stats.slice(0, 5).forEach((stat) => {
    const date = new Date(stat.recorded_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
    console.log(`${date}`);
    console.log(`  Subs: ${(stat.subscribers / 1000000).toFixed(1)}M`);
    console.log(`  Views: ${(stat.total_views / 1000000000).toFixed(2)}B`);
    console.log(`  Videos: ${stat.total_posts}`);
    console.log('');
  });
}

checkMrBeastData().catch(console.error);
