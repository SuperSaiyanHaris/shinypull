import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testProducts() {
  console.log('Testing products integration...\n');

  // Test 1: Check if product exists in database
  console.log('1. Fetching product from Supabase...');
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', 'fifine-k669b')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('❌ Error fetching product:', error);
  } else {
    console.log('✅ Product found:', product.name);
    console.log('   Slug:', product.slug);
    console.log('   Price:', product.price);
    console.log('   Features:', product.features.length, 'items');
  }

  // Test 2: Check blog posts with product embeds
  console.log('\n2. Checking blog posts for product embeds...');
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, content')
    .eq('is_published', true);

  if (posts) {
    posts.forEach(post => {
      const hasProductEmbed = post.content.includes('{{product:');
      if (hasProductEmbed) {
        const matches = post.content.match(/\{\{product:([^}]+)\}\}/g);
        console.log(`✅ "${post.title}" has ${matches.length} product embed(s)`);
        matches.forEach(match => console.log('   -', match));
      }
    });
  }

  console.log('\n✨ Test complete!');
  console.log('\n📝 To test the UI:');
  console.log('   1. Visit http://localhost:3000/blog/admin');
  console.log('   2. Create or edit a post');
  console.log('   3. Add {{product:fifine-k669b}} to the content');
  console.log('   4. Save and view the post to see the product card');
}

testProducts();
