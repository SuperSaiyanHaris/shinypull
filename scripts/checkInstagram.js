import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { count, error } = await supabase
  .from('creators')
  .select('*', { count: 'exact', head: true })
  .eq('platform', 'instagram');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Instagram creators:', count);
}

// Also check a few
const { data } = await supabase
  .from('creators')
  .select('username, display_name, platform')
  .eq('platform', 'instagram')
  .limit(5);

console.log('Sample:', data);
