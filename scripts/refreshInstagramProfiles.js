/**
 * Refresh Instagram profile data in small batches to avoid rate limiting
 *
 * Scrapes profiles in batches of 3 with longer delays between batches
 * to avoid Instagram's rate limiting. Updates both creator profile data
 * and stats entries.
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramPuppeteer.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 3;
const DELAY_BETWEEN_PROFILES = 8000; // 8 seconds between profiles
const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds between batches

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function refreshInstagramProfiles() {
  const today = getTodayLocal();
  const limit = parseInt(process.argv[2]) || 50;

  console.log(`\n📸 Instagram Profile Refresh`);
  console.log(`   Date: ${today}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Delay between profiles: ${DELAY_BETWEEN_PROFILES / 1000}s`);
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`);
  console.log('');

  // Fetch Instagram creators, ordered by most followers (top creators first)
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*, creator_stats!inner(followers)')
    .eq('platform', 'instagram')
    .order('updated_at', { ascending: true }) // Least recently updated first
    .limit(limit);

  if (error) {
    // Fallback query without join if the inner join fails
    const { data: fallbackCreators, error: fallbackError } = await supabase
      .from('creators')
      .select('*')
      .eq('platform', 'instagram')
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (fallbackError) {
      console.error('❌ Error fetching creators:', fallbackError.message);
      return;
    }
    creators?.splice(0, creators.length, ...(fallbackCreators || []));
    if (!creators || creators.length === 0) {
      var creatorsToProcess = fallbackCreators;
    }
  }

  const creatorsToProcess2 = creators || creatorsToProcess;
  if (!creatorsToProcess2 || creatorsToProcess2.length === 0) {
    console.log('No Instagram creators found');
    return;
  }

  console.log(`Found ${creatorsToProcess2.length} Instagram creators to refresh\n`);
  console.log('═'.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  const batches = [];

  // Split into batches
  for (let i = 0; i < creatorsToProcess2.length; i += BATCH_SIZE) {
    batches.push(creatorsToProcess2.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${batches.length} batch(es) of ${BATCH_SIZE}\n`);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`\n--- Batch ${batchIdx + 1}/${batches.length} ---`);

    for (let i = 0; i < batch.length; i++) {
      const creator = batch[i];
      const globalIdx = batchIdx * BATCH_SIZE + i + 1;

      try {
        const profileData = await scrapeInstagramProfile(creator.username);

        // Update creator profile
        const profileUpdate = {
          updated_at: new Date().toISOString(),
        };
        if (profileData.displayName && profileData.displayName !== creator.username) {
          profileUpdate.display_name = profileData.displayName;
        }
        if (profileData.profileImage) {
          profileUpdate.profile_image = profileData.profileImage;
        }
        if (profileData.description) {
          profileUpdate.description = profileData.description;
        }

        await supabase
          .from('creators')
          .update(profileUpdate)
          .eq('id', creator.id);

        // Upsert stats
        await supabase
          .from('creator_stats')
          .upsert({
            creator_id: creator.id,
            recorded_at: today,
            subscribers: profileData.followers,
            followers: profileData.followers,
            total_views: 0,
            total_posts: profileData.totalPosts,
          }, { onConflict: 'creator_id,recorded_at' });

        const oldFollowers = creator.creator_stats?.[0]?.followers;
        const changeStr = oldFollowers ? ` (was ${(oldFollowers / 1000000).toFixed(1)}M)` : '';
        console.log(`   ✅ [${globalIdx}/${creatorsToProcess2.length}] ${creator.display_name}: ${(profileData.followers / 1000000).toFixed(1)}M followers${changeStr}`);
        successCount++;

        // Delay between profiles within a batch
        if (i < batch.length - 1) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
        }
      } catch (err) {
        console.error(`   ❌ [${globalIdx}/${creatorsToProcess2.length}] ${creator.display_name}: ${err.message}`);
        errorCount++;

        // Still delay after errors to avoid hammering Instagram
        if (i < batch.length - 1) {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
        }
      }
    }

    // Longer delay between batches
    if (batchIdx < batches.length - 1) {
      console.log(`\n   ⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  await closeBrowser();

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📸 Refresh complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${creatorsToProcess2.length}`);
  console.log(`   📊 Success rate: ${((successCount / creatorsToProcess2.length) * 100).toFixed(0)}%\n`);
}

refreshInstagramProfiles().catch(err => {
  console.error('Refresh failed:', err);
  closeBrowser().then(() => process.exit(1));
});
