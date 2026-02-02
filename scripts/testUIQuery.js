import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function testQuery() {
  console.log('Testing the exact query used by the UI...\n');

  // Get MrBeast
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast')
    .single();

  if (!creator) {
    console.error('❌ MrBeast not found');
    return;
  }

  console.log(`Found: ${creator.display_name}`);
  console.log(`ID: ${creator.id}\n`);

  // Simulate the UI query with 90 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const startDateStr = startDate.toISOString().split('T')[0];

  console.log(`Querying stats from: ${startDateStr}`);
  console.log(`Today's date: ${new Date().toISOString().split('T')[0]}\n`);

  const { data: stats, error } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .gte('recorded_at', startDateStr)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${stats.length} data points\n`);
  console.log('Latest 5 entries:');
  console.log('='.repeat(60));

  stats.slice(-5).forEach((stat) => {
    console.log(`Date: ${stat.recorded_at}`);
    console.log(`  Subs: ${(stat.subscribers / 1000000).toFixed(1)}M`);
    console.log(`  Views: ${(stat.total_views / 1000000000).toFixed(2)}B`);
    console.log(`  Videos: ${stat.total_posts}`);
    console.log('');
  });
}

testQuery().catch(console.error);
