import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🏆 Refreshing rankings cache...');
const start = Date.now();

const { error } = await supabase.rpc('refresh_rankings_cache');

if (error) {
  console.error('❌ Failed to refresh rankings cache:', error.message);
  process.exit(1);
}

console.log(`✅ Rankings cache refreshed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
