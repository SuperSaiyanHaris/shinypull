import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const BSKY_BASE = 'https://public.api.bsky.app/xrpc';

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function fetchBlueskyProfile(handle) {
  const url = `${BSKY_BASE}/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`;
  const response = await fetch(url);

  if (response.status === 400 || response.status === 404) {
    return null; // Profile not found
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    platform: 'bluesky',
    platformId: data.did,
    username: data.handle,
    displayName: data.displayName || data.handle,
    profileImage: data.avatar || null,
    description: data.description || null,
    category: null,
    followers: data.followersCount ?? 0,
    totalPosts: data.postsCount ?? 0,
  };
}

async function upsertCreator(creatorData) {
  const { data, error } = await supabase
    .from('creators')
    .upsert({
      platform: creatorData.platform,
      platform_id: creatorData.platformId,
      username: creatorData.username,
      display_name: creatorData.displayName,
      profile_image: creatorData.profileImage,
      description: creatorData.description,
      category: creatorData.category,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,platform_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function saveCreatorStats(creatorId, stats) {
  const today = getTodayLocal();
  const { error } = await supabase
    .from('creator_stats')
    .upsert({
      creator_id: creatorId,
      recorded_at: today,
      subscribers: stats.followers,
      followers: stats.followers,
      total_views: null,
      total_posts: stats.totalPosts,
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

// Top Bluesky accounts across categories — handles as of early 2026
const BLUESKY_HANDLES = [
  // Bluesky team & AT Protocol
  'jay.bsky.team',        // Jay Graber - Bluesky CEO
  'pfrazee.com',          // Paul Frazee - co-creator
  'atproto.com',          // AT Protocol official

  // Tech & Developers
  'mosseri.bsky.social',  // Adam Mosseri - Instagram CEO
  'gruber.social',        // John Gruber - Daring Fireball
  'marcoarment.com',      // Marco Arment - Overcast / ATP
  'simonw.com',           // Simon Willison - developer/OSS

  // News & Media
  'nytimes.com',          // New York Times
  'npr.org',              // NPR
  'bbc.com',              // BBC
  'theguardian.com',      // The Guardian
  'techcrunch.com',       // TechCrunch
  'wired.com',            // Wired
  'theatlantic.com',      // The Atlantic
  'washingtonpost.com',   // Washington Post
  'apnews.com',           // AP News
  'reuters.com',          // Reuters

  // Celebrities & Public Figures
  'georgetakei.bsky.social',  // George Takei - actor
  'neilhimself.bsky.social',  // Neil Gaiman - author
  'aoc.bsky.social',          // Alexandria Ocasio-Cortez
  'stephenking.com',           // Stephen King - author
  'billnye.bsky.social',       // Bill Nye - Science Guy
  'pattonoswalt.bsky.social',  // Patton Oswalt - comedian
  'levarburton.bsky.social',   // LeVar Burton - actor

  // Science & Education
  'nasa.gov',             // NASA
  'neiltyson.bsky.social', // Neil deGrasse Tyson

  // Sports
  'nfl.com',              // NFL
  'nba.com',              // NBA
  'mlb.com',              // MLB

  // Culture & Entertainment
  'theroot.com',          // The Root
  'verge.bsky.social',    // The Verge
  'pitchfork.com',        // Pitchfork
  'polygon.com',          // Polygon gaming

  // Comedy & Memes
  'dril.bsky.social',     // Dril - internet icon

  // Politics & Commentary (popular accounts)
  'ericgarland.bsky.social',  // Eric Garland
  'sarahkendzior.bsky.social', // Sarah Kendzior

  // Additional tech/creator accounts
  'cabel.me',             // Cabel Sasser - Panic
  'timbray.org',          // Tim Bray - developer
];

async function seedBluesky() {
  console.log(`\n🦋 Seeding ${BLUESKY_HANDLES.length} Bluesky accounts...\n`);

  const today = getTodayLocal();
  console.log(`   Date: ${today} (America/New_York)\n`);

  const uniqueHandles = [...new Set(BLUESKY_HANDLES.map(h => h.toLowerCase()))];
  console.log(`   (${uniqueHandles.length} unique after dedup)\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const handle of uniqueHandles) {
    try {
      const profile = await fetchBlueskyProfile(handle);

      if (!profile) {
        console.log(`   ⚠️  ${handle}: Not found — skipping`);
        skipCount++;
        continue;
      }

      if (profile.followers === 0) {
        console.log(`   ⚠️  ${handle}: 0 followers — skipping (new or private account)`);
        skipCount++;
        continue;
      }

      const creator = await upsertCreator(profile);
      await saveCreatorStats(creator.id, { followers: profile.followers, totalPosts: profile.totalPosts });

      console.log(
        `   ✅ ${profile.displayName} (@${profile.username}): ` +
        `${profile.followers.toLocaleString()} followers, ${profile.totalPosts.toLocaleString()} posts`
      );
      successCount++;
    } catch (error) {
      console.error(`   ❌ ${handle}: ${error.message}`);
      errorCount++;
    }

    // 1-second delay between requests to be polite to the public API
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🦋 Bluesky seeding complete!');
  console.log(`   ✅ Seeded: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

seedBluesky().catch(console.error);
