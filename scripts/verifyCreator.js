import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCreator() {
  // Check creator
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'instagram')
    .eq('username', 'joshlujan')
    .single();

  if (creator) {
    console.log('✓ Creator found in database:');
    console.log(`  - ID: ${creator.id}`);
    console.log(`  - Username: ${creator.username}`);
    console.log(`  - Display Name: ${creator.display_name}`);
    console.log(`  - Profile: https://shinypull.com/instagram/${creator.username}`);
    console.log('');
  }

  // Check stats
  const { data: stats } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (stats) {
    console.log('✓ Stats found:');
    console.log(`  - Followers: ${stats.followers.toLocaleString()}`);
    console.log(`  - Posts: ${stats.total_posts}`);
    console.log(`  - Recorded: ${stats.recorded_at}`);
    console.log('');
  }

  // Check request status
  const { data: request } = await supabase
    .from('creator_requests')
    .select('*')
    .eq('platform', 'instagram')
    .eq('username', 'joshlujan')
    .single();

  if (request) {
    console.log('✓ Request status:');
    console.log(`  - Status: ${request.status}`);
    console.log(`  - Processed: ${request.processed_at}`);
    console.log('');
  }
}

verifyCreator();
