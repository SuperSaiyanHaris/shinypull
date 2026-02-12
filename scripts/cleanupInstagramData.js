/**
 * One-time cleanup script for Instagram creator data
 *
 * Fixes:
 * 1. Avatar URLs that have wrong names embedded (copy-paste errors from seed)
 * 2. Removes duplicate/invalid entries (e.g., lebronjames - real account is kingjames)
 *
 * The daily collection job will handle updating follower counts, post counts,
 * display names, and bios going forward (now that we fixed it to always update).
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Known invalid usernames (not real Instagram accounts, or duplicates)
const INVALID_USERNAMES = [
  'lebronjames',    // Real account is 'kingjames' - this is a duplicate
  'addisonraeeee',  // Real account is 'addisonraee' (different spelling) - may not exist
];

async function cleanupInstagramData() {
  console.log('\n🧹 Instagram Data Cleanup\n');
  console.log('═'.repeat(60));

  // Fetch all Instagram creators
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'instagram')
    .order('display_name');

  if (error) {
    console.error('❌ Error fetching creators:', error.message);
    return;
  }

  console.log(`Found ${creators.length} Instagram creators\n`);

  let fixedAvatars = 0;
  let removedInvalid = 0;

  // Step 1: Remove known invalid/duplicate entries
  for (const username of INVALID_USERNAMES) {
    const creator = creators.find(c => c.username === username);
    if (creator) {
      // First delete stats for this creator
      const { error: statsError } = await supabase
        .from('creator_stats')
        .delete()
        .eq('creator_id', creator.id);

      if (statsError) {
        console.error(`   ❌ Failed to delete stats for ${username}: ${statsError.message}`);
        continue;
      }

      // Then delete the creator
      const { error: deleteError } = await supabase
        .from('creators')
        .delete()
        .eq('id', creator.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete ${username}: ${deleteError.message}`);
      } else {
        console.log(`   🗑️  Removed invalid entry: ${username} (${creator.display_name})`);
        removedInvalid++;
      }
    }
  }

  // Step 2: Fix avatar URLs that have wrong display names
  for (const creator of creators) {
    if (INVALID_USERNAMES.includes(creator.username)) continue;

    const currentImage = creator.profile_image || '';

    // Only fix ui-avatars.com URLs (don't touch real profile images if any exist)
    if (!currentImage.includes('ui-avatars.com')) continue;

    // Generate the correct avatar URL from the creator's display_name
    const correctImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.display_name)}&size=200&bold=true&background=e1306c&color=fff`;

    // Check if the current avatar has the wrong name
    if (currentImage !== correctImage) {
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          profile_image: correctImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creator.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${creator.username}: ${updateError.message}`);
      } else {
        // Extract the name from the old URL for logging
        const oldNameMatch = currentImage.match(/name=([^&]+)/);
        const oldName = oldNameMatch ? decodeURIComponent(oldNameMatch[1]).replace(/\+/g, ' ') : 'unknown';
        console.log(`   ✅ ${creator.username.padEnd(25)} avatar: "${oldName}" → "${creator.display_name}"`);
        fixedAvatars++;
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\n🧹 Cleanup complete!`);
  console.log(`   🗑️  Removed invalid entries: ${removedInvalid}`);
  console.log(`   🖼️  Fixed avatar URLs: ${fixedAvatars}`);
  console.log(`\n💡 The daily collection job will now automatically update:`);
  console.log(`   - Follower counts (fresh from Instagram)`);
  console.log(`   - Post counts (fresh from Instagram)`);
  console.log(`   - Display names (from scraped profiles)`);
  console.log(`   - Bios/descriptions (from scraped profiles)`);
  console.log(`   - Avatar URLs (regenerated with correct names)\n`);
}

cleanupInstagramData().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
