import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const KICK_API_BASE = 'https://api.kick.com/public/v1';
const KICK_AUTH_URL = 'https://id.kick.com/oauth/token';

let kickAccessToken = null;

async function getKickAccessToken() {
  if (kickAccessToken) return kickAccessToken;

  const response = await fetch(KICK_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Kick auth failed: ${JSON.stringify(data)}`);
  }
  kickAccessToken = data.access_token;
  return kickAccessToken;
}

async function kickFetch(endpoint) {
  const token = await getKickAccessToken();
  const response = await fetch(`${KICK_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kick API error (${response.status}): ${text}`);
  }

  return response.json();
}

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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
      subscribers: stats.subscribers,
      total_views: 0,
      total_posts: 0,
      followers: stats.subscribers,
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

// Top Kick streamers (slugs)
const KICK_SLUGS = [
  // Top Kick streamers
  'xqc', 'adinross', 'amouranth', 'trainwreckstv', 'nickmercs',
  'tfue', 'adin', 'stake', 'roshtein', 'drake',
  'ice-poseidon', 'destiny', 'sneako', 'fanum', 'kai-cenat',
  'brucedropemoff', 'agent00', 'yourrage', 'plaqueboymax', 'duke-dennis',
  // Gambling streamers (big on Kick)
  'trainwrecks', 'xposed', 'classybeef', 'ayezee', 'yassuo',
  // Gaming streamers
  'caseoh', 'jynxzi', 'sketch', 'stabby', 'silky',
  'nadia', 'symfuhny', 'swagg', 'mutex', 'biffle',
  // Variety / IRL
  'fousey', 'mizkif', 'hassan', 'ricegum', 'dontai',
  'flight', 'jidion', 'ishowspeed', 'lacy', 'clix',
  // International
  'elxokas', 'ibai', 'rubius', 'auronplay', 'thegrefg',
  'coscu', 'rivers-gg', 'elspreen', 'westcol', 'juansguarnizo',
  // More variety
  'fedmyster', 'erobb221', 'nmplol', 'emiru', 'knut',
  'ac7ionman', 'n3on', 'mikemajlak', 'vitaly', 'stevewilldoit',
  // eSports / Competitive
  'tarik', 'shroud', 's1mple', 'mongraal', 'bugha',
  'ronaldo', 'benjyfishy', 'mrfreshasian', 'fresh', 'lachlan',
];

async function seedKick() {
  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    console.log('❌ Missing Kick credentials');
    return 0;
  }

  console.log(`\n🟢 Seeding ${KICK_SLUGS.length} Kick streamers...\n`);

  const uniqueSlugs = [...new Set(KICK_SLUGS.map(s => s.toLowerCase()))];
  console.log(`   (${uniqueSlugs.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  // Batch fetch 50 at a time (Kick limit)
  for (let i = 0; i < uniqueSlugs.length; i += 50) {
    const batch = uniqueSlugs.slice(i, i + 50);
    console.log(`   Fetching batch ${Math.floor(i / 50) + 1}/${Math.ceil(uniqueSlugs.length / 50)}...`);

    try {
      const slugParams = batch.map(s => `slug[]=${encodeURIComponent(s)}`).join('&');
      const channelData = await kickFetch(`/channels?${slugParams}`);
      const channels = channelData.data || [];

      // Also fetch user info for profile pictures
      const userIds = channels.map(c => c.broadcaster_user_id);
      let userMap = new Map();
      if (userIds.length > 0) {
        try {
          const userParams = userIds.map(id => `id[]=${id}`).join('&');
          const userData = await kickFetch(`/users?${userParams}`);
          (userData.data || []).forEach(u => {
            userMap.set(u.user_id, u);
          });
        } catch {
          // Continue without profile pics
        }
      }

      for (const channel of channels) {
        try {
          const user = userMap.get(channel.broadcaster_user_id);
          const profileImage = user?.profile_picture || channel.banner_picture || null;

          const creatorData = {
            platform: 'kick',
            platformId: String(channel.broadcaster_user_id),
            username: channel.slug,
            displayName: user?.name || channel.slug,
            profileImage,
            description: channel.channel_description || '',
            category: channel.category?.name || null,
            subscribers: channel.active_subscribers_count || 0,
          };

          const dbCreator = await upsertCreator(creatorData);
          await saveCreatorStats(dbCreator.id, {
            subscribers: creatorData.subscribers,
          });

          success++;
          console.log(`   ✅ ${creatorData.displayName} (${creatorData.subscribers} paid subs)`);
        } catch (err) {
          failed++;
          console.log(`   ❌ ${channel.slug}: ${err.message}`);
        }
      }

      // Log slugs not found
      const foundSlugs = new Set(channels.map(c => c.slug.toLowerCase()));
      for (const slug of batch) {
        if (!foundSlugs.has(slug)) {
          console.log(`   ⚠️  ${slug}: Not found on Kick`);
          failed++;
        }
      }
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n   Kick: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function run() {
  console.log('═'.repeat(60));
  console.log('🚀 SEED: Top Kick Creators');
  console.log('═'.repeat(60));

  const count = await seedKick();

  console.log('═'.repeat(60));
  console.log(`✅ COMPLETE: ${count} Kick creators seeded`);
  console.log('═'.repeat(60));
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
