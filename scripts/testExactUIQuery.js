// Test the EXACT query that CreatorProfile.jsx uses for daily metrics
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

async function testExactUIQuery() {
  console.log('🔍 Testing EXACT query used by CreatorProfile.jsx UI...\n');

  // First, get a real creator ID (MrBeast main channel)
  const { data: creator } = await serviceClient
    .from('creators')
    .select('id, username, display_name, platform_id')
    .eq('platform', 'youtube')
    .eq('platform_id', 'UCX6OQ3DkcsbYNE6H8uQQuVA') // MrBeast main
    .single();

  console.log(`Testing with: ${creator.display_name} (${creator.platform_id})`);
  console.log(`Creator ID: ${creator.id}\n`);

  // Test the EXACT query from getCreatorStats
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  console.log(`Fetching stats from ${startDateStr} onwards...\n`);

  // Test with ANON key (what the frontend uses)
  console.log('1️⃣ Testing with ANON KEY (same as frontend)...');
  const { data: anonData, error: anonError } = await anonClient
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .gte('recorded_at', startDateStr)
    .order('recorded_at', { ascending: true });

  if (anonError) {
    console.log('❌ ANON KEY FAILED:', anonError.message);
    console.log('   Code:', anonError.code);
    console.log('   This is why daily metrics are not showing!');
  } else {
    console.log(`✅ ANON KEY SUCCESS: Got ${anonData.length} stats records`);
    if (anonData.length > 0) {
      console.log(`   First: ${anonData[0].recorded_at.substring(0, 10)}`);
      console.log(`   Last: ${anonData[anonData.length - 1].recorded_at.substring(0, 10)}`);
      console.log(`   Sample data: ${anonData[0].subscribers || anonData[0].total_views || 'N/A'}`);
    }
  }

  // Test with SERVICE KEY to compare
  console.log('\n2️⃣ Testing with SERVICE KEY (what should work)...');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .gte('recorded_at', startDateStr)
    .order('recorded_at', { ascending: true });

  if (serviceError) {
    console.log('❌ SERVICE KEY FAILED:', serviceError.message);
  } else {
    console.log(`✅ SERVICE KEY SUCCESS: Got ${serviceData.length} stats records`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(60));

  if (anonError) {
    console.log('❌ PROBLEM: Frontend (anon key) CANNOT query creator_stats');
    console.log('   RLS policy is blocking the query!');
    console.log('   This is why daily metrics are not showing in the UI.');
  } else if (anonData && anonData.length > 0) {
    console.log('✅ Frontend CAN query creator_stats successfully');
    console.log('✅ Historical data is accessible');
    console.log('✅ Daily metrics should be showing in UI');
    console.log('\nIf UI still not showing data, check browser console for errors.');
  } else if (anonData && anonData.length === 0) {
    console.log('⚠️  Query works but returned 0 records');
    console.log('   Either no data exists for this time range, or RLS is filtering everything');
  }
}

testExactUIQuery().catch(console.error);
