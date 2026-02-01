import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function deleteFakeBackfilledData() {
  console.log('🗑️  Deleting all fake backfilled data...');
  console.log('   Keeping only TODAY\'s real API data\n');

  const today = new Date().toISOString().split('T')[0];
  
  // Delete all stats EXCEPT today's date
  const { data: deleted, error } = await supabase
    .from('creator_stats')
    .delete()
    .neq('recorded_at', today);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // Count remaining
  const { count } = await supabase
    .from('creator_stats')
    .select('*', { count: 'exact', head: true })
    .eq('recorded_at', today);

  console.log('✅ Deleted all fake historical data');
  console.log(`✅ Kept ${count} real data points from today (${today})`);
  console.log('\n📊 Starting fresh with REAL data only!');
  console.log('   Historical data will build up naturally as we collect daily.');
}

deleteFakeBackfilledData().catch(console.error);
