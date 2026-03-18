import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const slugs = [
  'apple-music-inside-tiktok-what-creators-need-to-know',
  'youtube-deepfake-shield-what-creators-need-to-know',
  'kick-streamer-madonna-into-the-groove-charts',
  'theodd1sout-layoffs-warning-creators-building-teams',
  'red-bull-youtube-views-sponsorship-playbook',
];

const { data: posts, error } = await supabase
  .from('blog_posts')
  .select('*')
  .in('slug', slugs);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(JSON.stringify(posts, null, 2));
