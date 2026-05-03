import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function stripEmDashes(text) {
  if (!text) return text;
  return text
    .replace(/\s*—\s*/g, (match) => match.trim() === '—' ? '-' : ', ')
    .replace(/&mdash;/gi, ', ')
    .replace(/&#8212;/g, ', ')
    .replace(/&#x2014;/gi, ', ');
}

// Fix a specific post by slug
const SLUG = process.argv[2];

if (!SLUG) {
  // No slug given — scan ALL published posts for em dashes and fix them
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, description, content');

  if (error) { console.error(error); process.exit(1); }

  let fixed = 0;
  for (const post of posts) {
    const hasEmDash = [post.title, post.description, post.content].some(f => f?.includes('—'));
    if (!hasEmDash) continue;

    const updates = {
      title: stripEmDashes(post.title),
      description: stripEmDashes(post.description),
      content: stripEmDashes(post.content),
    };

    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', post.id);

    if (updateErr) {
      console.error(`❌ Failed to fix ${post.slug}:`, updateErr.message);
    } else {
      console.log(`✅ Fixed em dashes in: ${post.slug}`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${posts.length} posts.`);
} else {
  // Fix one specific post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, description, content')
    .eq('slug', SLUG)
    .single();

  if (error || !post) { console.error('Post not found:', SLUG); process.exit(1); }

  const { error: updateErr } = await supabase
    .from('blog_posts')
    .update({
      title: stripEmDashes(post.title),
      description: stripEmDashes(post.description),
      content: stripEmDashes(post.content),
    })
    .eq('id', post.id);

  if (updateErr) { console.error('❌', updateErr.message); process.exit(1); }
  console.log(`✅ Fixed em dashes in: ${SLUG}`);
}
