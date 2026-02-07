import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const fixes = [
  {
    slug: 'budget-streaming-setup',
    removeH1: '# Best Budget Streaming Setup Under $500\n\n',
  },
  {
    slug: 'intermediate-streaming-setup',
    removeH1: '# Intermediate Streaming Setup Guide\n\n',
  },
  {
    slug: 'professional-streaming-setup',
    removeH1: '# Professional Streaming Equipment Guide\n\n',
  },
];

async function fixBlogPosts() {
  console.log('🔧 Fixing remaining blog posts...\n');

  for (const fix of fixes) {
    // Get current content
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('content')
      .eq('slug', fix.slug)
      .single();

    if (fetchError) {
      console.log(`   ❌ ${fix.slug}: ${fetchError.message}`);
      continue;
    }

    // Remove duplicate H1
    const newContent = post.content.replace(fix.removeH1, '');

    // Update post
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ content: newContent })
      .eq('slug', fix.slug);

    if (updateError) {
      console.log(`   ❌ ${fix.slug}: ${updateError.message}`);
    } else {
      console.log(`   ✅ ${fix.slug}`);
    }
  }

  console.log('\n✨ Blog posts fixed successfully!');
}

fixBlogPosts().catch(console.error);
