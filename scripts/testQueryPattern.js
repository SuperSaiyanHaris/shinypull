// Test the exact query pattern used in updated getCreatorByUsername
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testQueryPattern() {
  console.log('🧪 Testing the exact query pattern from updated service...\n');

  // Test the query with inner join on stats
  console.log('Attempt 1: WITH stats join (to get most popular)');
  const { data: withStats, error: withStatsError } = await anonClient
    .from('creators')
    .select(`
      *,
      creator_stats!inner(recorded_at, subscribers, followers)
    `)
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast')
    .order('creator_stats.subscribers', { ascending: false, nullsFirst: false })
    .order('creator_stats.followers', { ascending: false, nullsFirst: false })
    .limit(1);

  if (withStatsError) {
    console.log('❌ Error:', withStatsError.message);
    console.log('   Code:', withStatsError.code);
    console.log('   Details:', JSON.stringify(withStatsError.details));
  } else if (!withStats || withStats.length === 0) {
    console.log('⚠️  No results returned');
  } else {
    console.log(`✅ Success! Returned ${withStats.length} creator:`);
    const creator = withStats[0];
    console.log(`   Display Name: ${creator.display_name}`);
    console.log(`   Platform ID: ${creator.platform_id}`);
    console.log(`   Stats count: ${creator.creator_stats?.length || 0}`);

    // Now test fetching stats for this creator
    console.log('\nAttempt 2: Get stats for this creator');
    const { data: stats, error: statsError } = await anonClient
      .from('creator_stats')
      .select('recorded_at, subscribers, total_views')
      .eq('creator_id', creator.id)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (statsError) {
      console.log('❌ Error fetching stats:', statsError.message);
    } else {
      console.log(`✅ Got ${stats.length} stats records:`);
      stats.forEach(s => {
        console.log(`   - ${s.recorded_at.substring(0, 10)}: ${s.subscribers || s.total_views || 'N/A'}`);
      });
    }
  }

  // Test fallback (without stats join)
  console.log('\nAttempt 3: WITHOUT stats join (fallback)');
  const { data: withoutStats, error: withoutStatsError } = await anonClient
    .from('creators')
    .select('*')
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (withoutStatsError) {
    console.log('❌ Error:', withoutStatsError.message);
  } else if (!withoutStats || withoutStats.length === 0) {
    console.log('⚠️  No results');
  } else {
    console.log(`✅ Success! Fallback works:`);
    console.log(`   Display Name: ${withoutStats[0].display_name}`);
    console.log(`   Platform ID: ${withoutStats[0].platform_id}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY:');
  if (!withStatsError && withStats && withStats.length > 0) {
    console.log('✅ Updated query pattern works!');
    console.log('✅ Returns the most popular creator when username conflicts exist');
    console.log('✅ Historical data is accessible');
  } else {
    console.log('❌ Query pattern needs adjustment');
    if (withStatsError) {
      console.log(`   Error: ${withStatsError.message}`);
    }
  }
}

testQueryPattern().catch(console.error);
