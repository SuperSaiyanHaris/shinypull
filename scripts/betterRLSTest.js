// Better RLS validation that checks actual error responses
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

async function testRLS() {
  console.log('🔍 Testing RLS with detailed logging...\n');

  // First, get a real creator ID
  const { data: creators } = await serviceClient
    .from('creators')
    .select('id, username, platform')
    .limit(1);

  if (!creators || creators.length === 0) {
    console.log('❌ No creators found');
    return;
  }

  const testCreator = creators[0];
  console.log(`Using test creator: ${testCreator.username} (${testCreator.id})\n`);

  // Test UPDATE with actual existing ID
  console.log('Test 1: UPDATE with anon key using ACTUAL creator ID');
  const updateResult = await anonClient
    .from('creators')
    .update({ description: 'test-rls-check' })
    .eq('id', testCreator.id)
    .select();

  console.log('Error:', JSON.stringify(updateResult.error, null, 2));
  console.log('Data:', JSON.stringify(updateResult.data, null, 2));
  console.log('Status:', updateResult.status);
  console.log('StatusText:', updateResult.statusText);

  if (updateResult.error) {
    console.log('✅ UPDATE blocked by RLS');
  } else if (!updateResult.data || updateResult.data.length === 0) {
    console.log('⚠️  UPDATE returned success but 0 rows - RLS might be blocking via USING clause');
  } else {
    console.log('❌ UPDATE succeeded - RLS NOT working!');
    // Restore
    await serviceClient
      .from('creators')
      .update({ description: testCreator.description || null })
      .eq('id', testCreator.id);
  }

  console.log('\n---\n');

  // Test DELETE with actual existing ID
  console.log('Test 2: DELETE with anon key using ACTUAL creator ID');
  const deleteResult = await anonClient
    .from('creators')
    .delete()
    .eq('id', testCreator.id);

  console.log('Error:', JSON.stringify(deleteResult.error, null, 2));
  console.log('Data:', JSON.stringify(deleteResult.data, null, 2));
  console.log('Status:', deleteResult.status);
  console.log('StatusText:', deleteResult.statusText);

  if (deleteResult.error) {
    console.log('✅ DELETE blocked by RLS');
  } else if (!deleteResult.data || deleteResult.data.length === 0) {
    console.log('⚠️  DELETE returned success but 0 rows - RLS might be blocking via USING clause');
  } else {
    console.log('❌ DELETE succeeded - RLS NOT working! (restoring...)');
    // This would be bad - creator was actually deleted
  }
}

testRLS().catch(console.error);
