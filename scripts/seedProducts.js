import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { products } from '../src/data/products.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function seedProducts() {
  console.log('🌱 Seeding products from products.js to Supabase...\n');

  try {
    for (const [slug, product] of Object.entries(products)) {
      console.log(`Adding: ${product.name} (${slug})`);

      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`  ⚠️  Product already exists, skipping...`);
        continue;
      }

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert({
          slug,
          name: product.name,
          price: product.price,
          badge: product.badge || null,
          description: product.description,
          features: product.features || [],
          image: product.image,
          affiliate_link: product.affiliateLink,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error adding product:`, error);
      } else {
        console.log(`  ✅ Added successfully`);
      }
    }

    console.log('\n✨ Product seeding complete!');
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seedProducts();
