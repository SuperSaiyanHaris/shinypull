// Test if frontend can see historical data with current RLS policies
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  // Frontend key
);

async function testHistoricalData() {
  console.log('🔍 Testing if frontend can see historical data...\n');

  // Test 1: Can frontend read creator_stats?
  console.log('Test 1: Can frontend read creator_stats?');
  const { data: stats, error: statsError } = await anonClient
    .from('creator_stats')
    .select('recorded_at, subscribers, total_views')
    .order('recorded_at', { ascending: false })
    .limit(10);

  if (statsError) {
    console.log('❌ ERROR:', statsError.message);
    console.log('   This would prevent historical data from showing!');
  } else if (!stats || stats.length === 0) {
    console.log('⚠️  No data returned (but no error)');
  } else {
    console.log(`✅ Can read creator_stats (${stats.length} records)`);
    console.log('   Latest entries:');
    stats.slice(0, 3).forEach(s => {
      console.log(`   - ${s.recorded_at}: ${s.subscribers || s.total_views || 'N/A'}`);
    });
  }

  // Test 2: Can frontend join creators with creator_stats?
  console.log('\nTest 2: Can frontend join creators with creator_stats?');
  const { data: joinedData, error: joinError } = await anonClient
    .from('creators')
    .select(`
      id,
      username,
      platform,
      creator_stats (
        recorded_at,
        subscribers,
        total_views
      )
    `)
    .eq('platform', 'youtube')
    .limit(2);

  if (joinError) {
    console.log('❌ ERROR:', joinError.message);
    console.log('   This would break profile pages!');
  } else if (!joinedData || joinedData.length === 0) {
    console.log('⚠️  No creators returned');
  } else {
    console.log(`✅ Can join creators with stats (${joinedData.length} creators)`);
    joinedData.forEach(creator => {
      const statsCount = creator.creator_stats?.length || 0;
      console.log(`   - ${creator.username}: ${statsCount} historical records`);
    });
  }

  // Test 3: Can frontend fetch profile like CreatorProfile.jsx does?
  console.log('\nTest 3: Can frontend fetch profile like the updated service does?');

  // First try with stats join (mimicking the new getCreatorByUsername)
  const { data: withStatsJoin, error: statsJoinError } = await anonClient
    .from('creators')
    .select(`
      *,
      creator_stats!inner(recorded_at, subscribers, followers)
    `)
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast')
    .order('creator_stats.subscribers', { ascending: false, nullsFirst: false })
    .limit(1);

  if (statsJoinError) {
    console.log('❌ ERROR with stats join:', statsJoinError.message);

    // Try fallback without stats requirement
    console.log('   Trying fallback without stats...');
    const { data: fallbackData, error: fallbackError } = await anonClient
      .from('creators')
      .select('*')
      .eq('platform', 'youtube')
      .eq('username', 'mrbeast')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (fallbackError) {
      console.log('❌ Fallback also failed:', fallbackError.message);
      console.log('   Profile pages would fail!');
    } else if (!fallbackData || fallbackData.length === 0) {
      console.log('⚠️  No creator found');
    } else {
      console.log(`✅ Fallback works (returned ${fallbackData.length} creator)`);
      console.log('   Creator:', fallbackData[0].username);
    }
  } else if (!withStatsJoin || withStatsJoin.length === 0) {
    console.log('⚠️  No creator found with stats');
  } else {
    const creator = withStatsJoin[0];
    const statsCount = creator.creator_stats?.length || 0;
    console.log(`✅ Can fetch profile with stats (${statsCount} historical stats)`);
    console.log('   Creator:', creator.username, '|', creator.platform_id);
    if (statsCount > 0) {
      const latest = creator.creator_stats[0];
      console.log(`   Latest: ${latest.recorded_at.substring(0, 10)}`);
      console.log(`   Subscribers: ${latest.subscribers || 'N/A'}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('If all tests pass, historical data should be visible');
  console.log('If any test fails, we need to adjust RLS policies');
}

testHistoricalData().catch(console.error);
