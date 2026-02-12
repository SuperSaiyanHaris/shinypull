/**
 * Refresh Instagram profile data for N least-recently-updated creators
 *
 * Usage: node scripts/refreshInstagramProfiles.js [count]
 *   count: number of creators to process (default: 3)
 *
 * Designed to run in short GitHub Action runs with a fresh IP each time.
 * Each run processes just a few creators, avoiding Instagram rate limits.
 * Orders by updated_at ascending so stale profiles are refreshed first.
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

const DELAY_BETWEEN_PROFILES = 8000; // 8 seconds

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
  const count = parseInt(process.argv[2]) || 3;

  console.log(`📸 Instagram Refresh — ${count} creators, date: ${today}\n`);

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
  console.log(`\n📊 Done: ${successCount}/${creators.length} succeeded`);
}

refreshInstagramProfiles().catch(err => {
  console.error('Refresh failed:', err);
  closeBrowser().then(() => process.exit(1));
});
