import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const content = readFileSync('temp_blog_updated.txt', 'utf-8');

const { data, error } = await supabase
  .from('blog_posts')
  .update({ content })
  .eq('slug', 'grow-youtube-channel-2026');

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Blog post updated successfully!');
}
