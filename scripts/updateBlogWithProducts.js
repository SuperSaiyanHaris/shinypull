import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const content = readFileSync('temp_blog_with_products.txt', 'utf-8');

const { data, error } = await supabase
  .from('blog_posts')
  .update({ content })
  .eq('slug', 'best-streaming-setup-2026');

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Blog post updated with product embeds!');
  console.log('\n📝 Next steps:');
  console.log('1. Visit http://localhost:3000/blog/admin');
  console.log('2. Go to Products tab');
  console.log('3. Edit each product to add:');
  console.log('   - Amazon product image URL');
  console.log('   - Your Amazon affiliate link');
  console.log('4. View the blog post to see all products!');
}
