/**
 * Refresh Instagram profile data
 *
 * Usage: node scripts/refreshInstagramProfiles.js [count|all]
 *   count: number of creators to process (default: all)
 *   all:   process ALL creators (same as omitting count)
 *
 * Designed to run locally from a residential IP.
 * Processes ALL creators by default to ensure daily stats coverage.
 * Orders by updated_at ascending so stale profiles are refreshed first.
 * Rate limited to 5 seconds between requests (~12 min for 140 creators).
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramScraper.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DELAY_BETWEEN_PROFILES = 5000; // 5 seconds — safe for residential IPs

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
  const arg = process.argv[2];
  const processAll = !arg || arg.toLowerCase() === 'all';
  const count = processAll ? 10000 : parseInt(arg);

  // Count total Instagram creators
  const { count: totalCreators } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram');

  const target = processAll ? totalCreators : Math.min(count, totalCreators);
  const estimatedMinutes = Math.round((target * DELAY_BETWEEN_PROFILES / 1000) / 60);
  console.log(`📸 Instagram Refresh — ${target} of ${totalCreators} creators, date: ${today}`);
  console.log(`   Estimated time: ~${estimatedMinutes} minutes\n`);

  // Fetch the N least-recently-updated Instagram creators
  const { data: creators, error } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'instagram')
    .order('updated_at', { ascending: true })
    .limit(count);

  if (error) {
    console.error('❌ Error fetching creators:', error.message);
    return;
  }

  if (!creators || creators.length === 0) {
    console.log('No Instagram creators found');
    return;
  }

  console.log(`Processing ${creators.length} creator(s):\n`);

  let successCount = 0;

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];

    try {
      const profileData = await scrapeInstagramProfile(creator.username);

      // Update creator profile
      const profileUpdate = { updated_at: new Date().toISOString() };
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

      // Upsert today's stats
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

      console.log(`   ✅ [${i + 1}/${creators.length}] ${creator.display_name}: ${(profileData.followers / 1000000).toFixed(1)}M followers`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ [${i + 1}/${creators.length}] ${creator.display_name}: ${err.message}`);

      // If rate limited, stop — same IP will keep getting blocked
      if (err.message.includes('429')) {
        console.log(`\n   ⚠️  Rate limited — stopping early (will resume next run)`);
        break;
      }
    }

    // Delay between profiles
    if (i < creators.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
    }
  }

  await closeBrowser();
  const failCount = creators.length - successCount;
  console.log(`\n📊 Done: ${successCount}/${creators.length} succeeded` + (failCount > 0 ? `, ${failCount} failed` : ''));
  if (successCount === creators.length) {
    console.log(`✅ All ${totalCreators} Instagram creators have fresh daily stats!`);
  }
}

refreshInstagramProfiles().catch(err => {
  console.error('Refresh failed:', err);
  closeBrowser().then(() => process.exit(1));
});
