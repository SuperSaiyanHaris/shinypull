import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function updateInstagramProfileImages() {
  console.log('🔄 Updating Instagram profile images to use UI Avatars...\n');

  // Get all Instagram creators
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'instagram');

  if (error) {
    console.error('❌ Error fetching creators:', error.message);
    return;
  }

  console.log(`Found ${creators.length} Instagram creators to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const creator of creators) {
    // Generate UI Avatar URL
    const displayName = creator.display_name || creator.username;
    const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200&bold=true&background=e1306c&color=fff`;

    // Check if profile image is from Instagram CDN (blocked)
    const isInstagramCdn = creator.profile_image?.includes('cdninstagram.com');

    if (isInstagramCdn || !creator.profile_image) {
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          profile_image: uiAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creator.id);

      if (updateError) {
        console.error(`   ❌ ${creator.display_name}: ${updateError.message}`);
      } else {
        console.log(`   ✅ ${creator.display_name} (@${creator.username})`);
        updated++;
      }
    } else {
      console.log(`   ⏭️  ${creator.display_name} - already has non-Instagram CDN image`);
      skipped++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${creators.length}`);
}

updateInstagramProfileImages();
