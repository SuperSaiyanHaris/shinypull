// Comprehensive test of the entire data flow for historical data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const serviceClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveTest() {
  console.log('🔍 COMPREHENSIVE HISTORICAL DATA TEST\n');
  console.log('='.repeat(60));

  // Step 1: Check if historical data exists at all
  console.log('\n1️⃣ Does historical data exist in the database?');
  const { data: allStats, error: allStatsError } = await serviceClient
    .from('creator_stats')
    .select('id, creator_id, recorded_at, subscribers, total_views')
    .order('recorded_at', { ascending: false })
    .limit(10);

  if (allStatsError) {
    console.log('❌ Error fetching with service key:', allStatsError.message);
    return;
  }
  console.log(`✅ Yes! Found ${allStats.length} recent stats entries (using service key)`);
  allStats.slice(0, 3).forEach(s => {
    console.log(`   - ${s.recorded_at.substring(0, 10)} | Creator ${s.creator_id.substring(0, 8)}... | ${s.subscribers || s.total_views || 'N/A'}`);
  });

  // Step 2: Can frontend (anon key) read creator_stats directly?
  console.log('\n2️⃣ Can frontend (anon key) read creator_stats?');
  const { data: anonStats, error: anonStatsError } = await anonClient
    .from('creator_stats')
    .select('id, creator_id, recorded_at, subscribers, total_views')
    .order('recorded_at', { ascending: false })
    .limit(5);

  if (anonStatsError) {
    console.log('❌ Frontend CANNOT read creator_stats:', anonStatsError.message);
    console.log('   ⚠️  RLS policy may be blocking reads!');
  } else {
    console.log(`✅ Yes! Frontend can read ${anonStats.length} stats entries`);
  }

  // Step 3: Check MrBeast specifically
  console.log('\n3️⃣ MrBeast data check:');

  // Get all MrBeast creators with service key
  const { data: allMrBeasts } = await serviceClient
    .from('creators')
    .select('id, username, display_name, platform_id')
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast');

  console.log(`   Found ${allMrBeasts.length} creators with username "mrbeast"`);

  // Check stats for each
  for (const creator of allMrBeasts) {
    const { data: stats, count } = await serviceClient
      .from('creator_stats')
      .select('recorded_at', { count: 'exact' })
      .eq('creator_id', creator.id)
      .order('recorded_at', { ascending: false })
      .limit(5);

    console.log(`   - ${creator.display_name} (${creator.platform_id})`);
    console.log(`     Stats records: ${count || 0}`);
    if (stats && stats.length > 0) {
      console.log(`     Latest: ${stats[0].recorded_at.substring(0, 10)}`);
    }
  }

  // Step 4: Can frontend read stats for a specific creator by ID?
  console.log('\n4️⃣ Can frontend read stats for a specific creator ID?');
  const mainMrBeast = allMrBeasts[0]; // Use first one

  const { data: creatorStats, error: creatorStatsError } = await anonClient
    .from('creator_stats')
    .select('recorded_at, subscribers, total_views')
    .eq('creator_id', mainMrBeast.id)
    .order('recorded_at', { ascending: false })
    .limit(5);

  if (creatorStatsError) {
    console.log(`❌ Frontend CANNOT read stats for creator ${mainMrBeast.id.substring(0, 8)}...`);
    console.log(`   Error: ${creatorStatsError.message}`);
  } else {
    console.log(`✅ Yes! Frontend can read ${creatorStats.length} stats for this creator`);
    if (creatorStats.length > 0) {
      console.log(`   Latest: ${creatorStats[0].recorded_at.substring(0, 10)}`);
    }
  }

  // Step 5: Can frontend do the JOIN that CreatorProfile.jsx does?
  console.log('\n5️⃣ Can frontend JOIN creators with creator_stats?');
  const { data: joinResult, error: joinError } = await anonClient
    .from('creators')
    .select(`
      id,
      username,
      display_name,
      platform_id,
      creator_stats (
        recorded_at,
        subscribers,
        total_views
      )
    `)
    .eq('platform', 'youtube')
    .eq('platform_id', mainMrBeast.platform_id)
    .single();

  if (joinError) {
    console.log('❌ Frontend CANNOT do JOIN:', joinError.message);
  } else {
    const statsCount = joinResult.creator_stats?.length || 0;
    console.log(`✅ Yes! JOIN works. Found ${statsCount} stats for ${joinResult.display_name}`);
    if (statsCount > 0) {
      console.log(`   Latest: ${joinResult.creator_stats[0].recorded_at.substring(0, 10)}`);
      console.log(`   Subscribers: ${joinResult.creator_stats[0].subscribers || 'N/A'}`);
    }
  }

  // Step 6: What happens with the old .single() query approach?
  console.log('\n6️⃣ Testing the OLD getCreatorByUsername approach (with .single()):');
  const { data: singleResult, error: singleError } = await anonClient
    .from('creators')
    .select('id, username, display_name')
    .eq('platform', 'youtube')
    .eq('username', 'mrbeast')
    .single();

  if (singleError) {
    console.log(`❌ OLD approach fails: ${singleError.message}`);
    console.log('   This is expected when multiple creators have same username');
  } else {
    console.log('✅ OLD approach works (only 1 mrbeast?)');
  }

  // Step 7: Summary
  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(60));

  if (!anonStatsError && !creatorStatsError && !joinError) {
    console.log('✅ RLS is configured correctly - frontend CAN read all data');
    console.log('✅ Historical data exists in database');
    console.log('✅ JOINs work correctly');
    if (singleError) {
      console.log('⚠️  Issue: Multiple creators with same username');
      console.log('   Solution: Use platform_id for lookups, or return most popular');
    } else {
      console.log('✅ Single creator per username - no conflicts');
    }
  } else {
    console.log('❌ PROBLEM FOUND:');
    if (anonStatsError) {
      console.log('   - Frontend cannot read creator_stats table');
      console.log('   - RLS policy may be too restrictive');
    }
    if (creatorStatsError) {
      console.log('   - Frontend cannot read stats for specific creator');
    }
    if (joinError) {
      console.log('   - Frontend cannot JOIN creators with stats');
    }
  }

  console.log('\n' + '='.repeat(60));
}

comprehensiveTest().catch(console.error);
