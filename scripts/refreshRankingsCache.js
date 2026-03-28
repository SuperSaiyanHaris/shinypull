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
  // Log the error but don't fail the job — data collection already succeeded
  console.warn('⚠️ Rankings cache refresh failed (will retry next run):', error.message);
  process.exit(0);
}

console.log(`✅ Rankings cache refreshed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
