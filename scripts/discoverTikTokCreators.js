/**
 * Discover TikTok creators using our existing DB as the source
 *
 * Strategy: Pull YouTube/Twitch/Kick creators from our DB, try their username
 * on TikTok, and validate the result actually matches them.
 * Most creators use the same handle across platforms, so this organically
 * grows TikTok without any hardcoded lists or hallucinated usernames.
 *
 * Validation: TikTok result must have 10K+ followers AND display name must
 * share at least one significant word with the known YouTube/Twitch display name.
 *
 * Usage: node scripts/discoverTikTokCreators.js [count]
 *   count: number of candidates to try per run (default: 30)
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeTikTokProfile, closeBrowser } from '../src/services/tiktokScraper.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DELAY_BETWEEN_PROFILES = 3000;
const MIN_FOLLOWERS = 10000;

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Check if two display names are likely the same person.
 * Matches if any significant word (4+ chars) from one name appears in the other,
 * or if the normalized names are highly similar.
 */
function namesMatch(knownName, tiktokName) {
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const n1 = normalize(knownName);
  const n2 = normalize(tiktokName);

  // Exact match after normalization
  if (n1 === n2) return true;

  // Check if either name contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check if any significant word (4+ chars) from either name appears in the other
  const words1 = n1.split(/\s+/).filter(w => w.length >= 4);
  const words2 = n2.split(/\s+/).filter(w => w.length >= 4);
  for (const word of words1) {
    if (n2.includes(word)) return true;
  }
  for (const word of words2) {
    if (n1.includes(word)) return true;
  }

  return false;
}

/**
 * Get all existing TikTok usernames from DB
 */
async function getExistingTikTokUsernames() {
  const allUsernames = new Set();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('creators')
      .select('username')
      .eq('platform', 'tiktok')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    data.forEach(c => allUsernames.add(c.username.toLowerCase()));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allUsernames;
}

/**
 * Get YouTube/Twitch/Kick creators from DB as TikTok discovery candidates.
 * Returns { username, display_name } sorted by follower count desc
 * so we try the biggest creators first.
 */
async function getCandidates(existingTikTokUsernames) {
  const seen = new Set(); // dedupe by username
  const candidates = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    // Join with creator_stats to get follower count for sorting
    const { data, error } = await supabase
      .from('creators')
      .select('username, display_name, creator_stats(subscribers)')
      .in('platform', ['youtube', 'twitch', 'kick'])
      .order('username')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    for (const c of data) {
      const username = c.username.toLowerCase();
      // Skip if already a TikTok creator or already seen this username
      if (existingTikTokUsernames.has(username)) continue;
      if (seen.has(username)) continue;
      seen.add(username);

      // Get max subscriber count from their stats (may be array)
      const stats = Array.isArray(c.creator_stats) ? c.creator_stats : [c.creator_stats];
      const maxSubs = Math.max(...stats.map(s => s?.subscribers || 0));

      candidates.push({ username: c.username, display_name: c.display_name, subs: maxSubs });
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Sort by subscriber count desc — try the biggest names first
  candidates.sort((a, b) => b.subs - a.subs);
  return candidates;
}

async function discoverTikTokCreators() {
  const today = getTodayLocal();
  const count = parseInt(process.argv[2]) || 30;

  console.log('🎵 TikTok Creator Discovery (DB-driven)\n');
  console.log('═══════════════════════════════════════════════════');

  const existingTikTokUsernames = await getExistingTikTokUsernames();
  console.log(`📊 Current TikTok creators in database: ${existingTikTokUsernames.size}`);

  const candidates = await getCandidates(existingTikTokUsernames);
  console.log(`🔍 Candidates from YouTube/Twitch/Kick DB: ${candidates.length}`);
  console.log(`📥 Trying ${Math.min(count, candidates.length)} this run (sorted by follower count)\n`);
  console.log('═══════════════════════════════════════════════════\n');

  const toTry = candidates.slice(0, count);
  let added = 0;
  let skippedWrongAccount = 0;
  let skippedNotFound = 0;

  for (let i = 0; i < toTry.length; i++) {
    const { username, display_name } = toTry[i];

    try {
      process.stdout.write(`[${i + 1}/${toTry.length}] @${username} (known as "${display_name}")... `);

      const profileData = await scrapeTikTokProfile(username);

      // Reject if followers too low — likely a fan/impersonator account
      if (profileData.followers < MIN_FOLLOWERS) {
        console.log(`⏭️  wrong account (${profileData.followers.toLocaleString()} followers)`);
        skippedWrongAccount++;
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
        continue;
      }

      // Reject if display name doesn't match — different person with same handle
      if (!namesMatch(display_name, profileData.displayName)) {
        console.log(`⏭️  name mismatch ("${profileData.displayName}")`);
        skippedWrongAccount++;
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
        continue;
      }

      // Looks like a match — insert creator
      const { data: creator } = await supabase
        .from('creators')
        .upsert({
          platform: 'tiktok',
          platform_id: profileData.platformId || username,
          username: profileData.username,
          display_name: profileData.displayName,
          profile_image: profileData.profileImage,
          description: profileData.description,
          category: profileData.category,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'platform,platform_id' })
        .select()
        .single();

      // Insert today's stats
      if (profileData.followers) {
        await supabase
          .from('creator_stats')
          .upsert({
            creator_id: creator.id,
            recorded_at: today,
            subscribers: profileData.followers,
            followers: profileData.followers,
            total_views: profileData.totalLikes || 0,
            total_posts: profileData.totalPosts,
          }, { onConflict: 'creator_id,recorded_at' });
      }

      const fStr = profileData.followers >= 1000000
        ? `${(profileData.followers / 1000000).toFixed(1)}M`
        : `${(profileData.followers / 1000).toFixed(0)}K`;
      console.log(`✅ ${profileData.displayName} — ${fStr} followers`);
      added++;

    } catch (err) {
      if (err.message.includes('No user info') || err.message.includes('No rehydration')) {
        console.log(`❌ not on TikTok`);
        skippedNotFound++;
      } else if (err.message.includes('429') || err.message.includes('403')) {
        console.log(`⚠️  rate limited — stopping early`);
        break;
      } else {
        console.log(`❌ ${err.message}`);
        skippedNotFound++;
      }
    }

    if (i < toTry.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
    }
  }

  await closeBrowser();

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`📈 Discovery Summary:`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   ⏭️  Wrong account / name mismatch: ${skippedWrongAccount}`);
  console.log(`   ❌ Not on TikTok: ${skippedNotFound}`);
  console.log(`   📊 Total TikTok creators now: ${existingTikTokUsernames.size + added}`);
  console.log(`   🔍 Candidates remaining: ${candidates.length - toTry.length}\n`);
}

discoverTikTokCreators().catch(err => {
  console.error('Discovery failed:', err);
  closeBrowser().then(() => process.exit(1));
});
