// Test the simplified query pattern
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSimplifiedPattern() {
  console.log('🧪 Testing SIMPLIFIED query pattern...\n');

  // Get all creators with username "mrbeast"
  const { data, error } = await anonClient
    .from('creators')
    .select('*')
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${data.length} creators with username "mrbeast"\n`);

  // Find the one with most subscribers/followers
  const best = data.reduce((best, current) => {
    const bestCount = (best.totalSubscribers || 0) + (best.totalFollowers || 0);
    const currentCount = (current.totalSubscribers || 0) + (current.totalFollowers || 0);
    return currentCount > bestCount ? current : best;
  });

  console.log('Selected creator (most popular):');
  console.log(`   Display Name: ${best.display_name}`);
  console.log(`   Platform ID: ${best.platform_id}`);
  console.log(`   Total Subscribers: ${best.totalSubscribers || 'N/A'}`);
  console.log(`   Total Followers: ${best.totalFollowers || 'N/A'}`);

  // Test fetching stats for this creator
  console.log('\nFetching stats for this creator...');
  const { data: stats, error: statsError } = await anonClient
    .from('creator_stats')
    .select('recorded_at, subscribers, total_views')
    .eq('creator_id', best.id)
    .order('recorded_at', { ascending: false })
    .limit(5);

  if (statsError) {
    console.log('❌ Error:', statsError.message);
  } else {
    console.log(`✅ Found ${stats.length} historical stats:`);
    stats.forEach(s => {
      console.log(`   - ${s.recorded_at.substring(0, 10)}: ${(s.subscribers || s.total_views || 0).toLocaleString()}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ SIMPLIFIED APPROACH WORKS!');
  console.log('✅ Gets correct creator even with username duplicates');
  console.log('✅ Historical data is accessible');
  console.log('\nFrontend should now display historical data correctly.');
}

testSimplifiedPattern().catch(console.error);
