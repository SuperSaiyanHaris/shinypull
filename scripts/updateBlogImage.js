import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// AI/tech themed image - digital brain concept, fits the AI slop crackdown theme
const newImage = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800';

const { data, error } = await supabase
  .from('blog_posts')
  .update({ image: newImage })
  .eq('slug', 'youtube-2026-updates-ai-slop-crackdown-shorts-creators')
  .select('slug, image');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Image updated successfully!');
  console.log(data);
}
