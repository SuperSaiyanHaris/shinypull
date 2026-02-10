// Check what RLS policies actually exist in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to query system tables
);

async function checkPolicies() {
  console.log('🔍 Checking current RLS policies...\n');

  // Query pg_policies system table
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT schemaname, tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.error('Error querying policies:', error);
    console.log('\nTrying alternative method...\n');

    // Alternative: Check if RLS is enabled
    const tables = ['creators', 'creator_stats', 'blog_posts', 'products', 'stream_sessions', 'viewer_samples'];

    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      console.log(`Table: ${table} - ${tableError ? 'RLS might be enabled' : 'RLS might be disabled or has SELECT policy'}`);
    }
  } else {
    console.log('Current policies:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkPolicies().catch(console.error);
