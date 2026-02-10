// Check what RLS policies currently exist on creators table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin access
);

async function checkPolicies() {
  console.log('🔍 Checking RLS policies on creators table...\n');

  // Try to query system catalog via RPC or direct query
  // Since we can't access pg_policies directly via Supabase client,
  // let's test the actual behavior

  console.log('Test A: Testing UPDATE with ANON key');
  const anonClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // First get a creator ID to test with
  const { data: creators } = await anonClient
    .from('creators')
    .select('id, username')
    .limit(1);

  if (!creators || creators.length === 0) {
    console.log('❌ No creators found');
    return;
  }

  const testCreator = creators[0];
  console.log(`Testing with creator: ${testCreator.username} (ID: ${testCreator.id})`);

  // Try to update
  const { data: updateData, error: updateError } = await anonClient
    .from('creators')
    .update({ username: 'test-update-attempt' })
    .eq('id', testCreator.id)
    .select();

  if (updateError) {
    console.log('✅ UPDATE blocked:', updateError.message);
    console.log('   Error code:', updateError.code);
  } else {
    console.log('❌ UPDATE succeeded (BAD - should be blocked!)');
    console.log('   Data:', updateData);

    // Restore the original username
    await supabase
      .from('creators')
      .update({ username: testCreator.username })
      .eq('id', testCreator.id);
    console.log('   (Restored original username)');
  }

  console.log('\nTest B: Testing DELETE with ANON key');
  const { data: deleteData, error: deleteError } = await anonClient
    .from('creators')
    .delete()
    .eq('username', 'nonexistent-test-user-xyz');

  if (deleteError) {
    console.log('✅ DELETE blocked:', deleteError.message);
    console.log('   Error code:', deleteError.code);
  } else {
    console.log('❌ DELETE succeeded (BAD - should be blocked!)');
  }

  console.log('\n=====================================');
  console.log('If UPDATE or DELETE succeeded, RLS is NOT properly configured');
  console.log('If both are blocked, RLS is working correctly');
}

checkPolicies().catch(console.error);
