import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const content = readFileSync('temp_blog_content.txt', 'utf-8');

const { data, error } = await supabase
  .from('blog_posts')
  .insert({
    slug: 'youtube-2026-updates-ai-slop-crackdown-shorts-creators',
    title: "YouTube's Major 2026 Updates: AI Slop Crackdown, Shorts Overhaul, and What Creators Need to Know",
    description: "YouTube CEO Neal Mohan's 2026 roadmap includes a historic crackdown on AI-generated slop content, major Shorts upgrades, YouTube TV redesign, and new creator tools. Here's everything that's changing.",
    category: 'YouTube News',
    author: 'ShinyPull Team',
    published_at: '2026-02-07',
    read_time: '7 min read',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800',
    is_published: true,
    content,
  })
  .select();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Blog post published successfully!');
  console.log('Slug:', data[0]?.slug);
}
