// Query pg_policies directly using service role key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function queryPolicies() {
  console.log('🔍 Querying policies directly from pg_policies...\n');

  // Use Supabase's PostgREST to query system catalog
  // Note: This requires the pg_catalog schema to be exposed, which it might not be

  // Alternative: Use a raw SQL query if we can
  try {
    // Try using .rpc() if there's a function to execute SQL
    const { data, error } = await supabase.rpc('query_policies', {
      table_name: 'creators'
    });

    if (error) {
      console.log('RPC error:', error.message);
      console.log('This is expected if query_policies function does not exist\n');
    } else {
      console.log('Policies:', data);
    }
  } catch (e) {
    console.log('RPC not available:', e.message, '\n');
  }

  // Alternative approach: Check actual behavior
  console.log('Checking actual RLS behavior...\n');

  const anonClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Test if there's a bypass happening
  console.log('Test 1: Can we SELECT? (should work)');
  const { data: selectData, error: selectError } = await anonClient
    .from('creators')
    .select('id')
    .limit(1);
  console.log(selectError ? `❌ ${selectError.message}` : `✅ SELECT works`);

  console.log('\nTest 2: Can we INSERT? (should be blocked)');
  const { data: insertData, error: insertError } = await anonClient
    .from('creators')
    .insert({ platform: 'test', platform_id: 'test123', username: 'test', display_name: 'Test' })
    .select();
  console.log(insertError ? `✅ INSERT blocked: ${insertError.message}` : `❌ INSERT works (BAD!)`);

  console.log('\nTest 3: Can we UPDATE? (should be blocked)');
  const { data: updateData, error: updateError } = await anonClient
    .from('creators')
    .update({ description: 'test' })
    .eq('platform', 'nonexistent');
  console.log(updateError ? `✅ UPDATE blocked: ${updateError.message}` : `❌ UPDATE works (BAD!)`);

  console.log('\nTest 4: Can we DELETE? (should be blocked)');
  const { data: deleteData, error: deleteError } = await anonClient
    .from('creators')
    .delete()
    .eq('platform', 'nonexistent');
  console.log(deleteError ? `✅ DELETE blocked: ${deleteError.message}` : `❌ DELETE works (BAD!)`);

  // Now check using service role (should always work)
  console.log('\n\n🔓 Checking with SERVICE ROLE key (should all work)...\n');

  console.log('Service role SELECT:');
  const { error: srSelect } = await supabase.from('creators').select('id').limit(1);
  console.log(srSelect ? `❌ ${srSelect.message}` : `✅ Works`);

  console.log('\nService role UPDATE:');
  const { error: srUpdate } = await supabase
    .from('creators')
    .update({ description: 'test' })
    .eq('platform', 'nonexistent');
  console.log(srUpdate ? `❌ ${srUpdate.message}` : `✅ Works (returned 0 rows - normal for nonexistent match)`);

  console.log('\nService role DELETE:');
  const { error: srDelete } = await supabase
    .from('creators')
    .delete()
    .eq('platform', 'nonexistent');
  console.log(srDelete ? `❌ ${srDelete.message}` : `✅ Works (deleted 0 rows - normal for nonexistent match)`);
}

queryPolicies().catch(console.error);
