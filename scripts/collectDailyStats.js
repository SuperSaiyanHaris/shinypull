import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.VITE_TWITCH_CLIENT_SECRET;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const LASTFM_API_KEY = process.env.LASTFM_CLIENT_ID;

// Batch sizes
const YOUTUBE_BATCH_SIZE = 50;  // YouTube allows up to 50 channel IDs per request
const TWITCH_BATCH_SIZE = 100;  // Twitch allows up to 100 logins per request
const TWITCH_FOLLOWER_DELAY_MS = 150;  // Sequential delay between follower requests (~6/s, under 800/min Twitch limit)
const KICK_BATCH_SIZE = 50;    // Kick allows up to 50 slugs per request
const BLUESKY_BATCH_SIZE = 25;  // AT Protocol getProfiles allows up to 25 actors per request

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

let twitchAccessToken = null;

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';
const MBID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchLastFmArtistStats(platformId, displayName) {
  const param = MBID_RE.test(platformId)
    ? `mbid=${encodeURIComponent(platformId)}`
    : `artist=${encodeURIComponent(displayName)}&autocorrect=1`;
  const url = `${LASTFM_BASE}?method=artist.getinfo&${param}&api_key=${LASTFM_API_KEY}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Last.fm: ${data.message}`);
  const artist = data.artist;
  return {
    listeners: parseInt(artist?.stats?.listeners || 0),
    playcount: parseInt(artist?.stats?.playcount || 0),
  };
}

async function getTwitchAccessToken() {
  if (twitchAccessToken) return twitchAccessToken;

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  twitchAccessToken = data.access_token;
  return twitchAccessToken;
}

/**
 * Fetch YouTube stats for multiple channels in one request (up to 50)
 */
async function fetchYouTubeBatch(channelIds) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const ids = channelIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(`YouTube API error: ${data.error.message || data.error.code}`);
  }

  // Create a map of channelId -> stats
  const statsMap = new Map();
  (data.items || []).forEach((channel) => {
    statsMap.set(channel.id, {
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      total_views: parseInt(channel.statistics.viewCount) || 0,
      total_posts: parseInt(channel.statistics.videoCount) || 0,
    });
  });

  return statsMap;
}

/**
 * Fetch Twitch user info for multiple users in one request (up to 100)
 */
async function fetchTwitchUsersBatch(usernames) {
  const token = await getTwitchAccessToken();

  const params = usernames.map((u) => `login=${encodeURIComponent(u)}`).join('&');
  const response = await fetch(`https://api.twitch.tv/helix/users?${params}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  // Create a map of username -> user data
  const userMap = new Map();
  (data.data || []).forEach((user) => {
    userMap.set(user.login.toLowerCase(), {
      id: user.id,
      view_count: parseInt(user.view_count) || 0,
    });
  });

  return userMap;
}

/**
 * Fetch follower count for a single Twitch user.
 * Retries up to 3 times on 429, honouring the Ratelimit-Reset header.
 */
async function fetchTwitchFollowers(broadcasterId) {
  const token = await getTwitchAccessToken();

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.status === 429) {
      const resetHeader = response.headers.get('Ratelimit-Reset');
      const waitMs = resetHeader
        ? Math.max(1000, parseInt(resetHeader) * 1000 - Date.now() + 500)
        : (attempt + 1) * 2000;
      console.warn(`   ⏳ Twitch rate limited, waiting ${Math.round(waitMs / 1000)}s...`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Followers API ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (data.total === undefined) {
      throw new Error(`Followers API returned no total field`);
    }
    return data.total;
  }

  throw new Error(`Followers API: rate limited, max retries exceeded`);
}

/**
 * Fetch total view count from VODs for a Twitch user
 * Since Twitch deprecated the view_count field, we sum up views from recent VODs
 */
async function fetchTwitchVODViews(broadcasterId) {
  const token = await getTwitchAccessToken();

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/videos?user_id=${broadcasterId}&first=100&type=archive`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    const totalViews = (data.data || []).reduce((sum, video) => sum + (video.view_count || 0), 0);
    return totalViews;
  } catch (err) {
    console.warn(`Failed to fetch VOD views: ${err.message}`);
    return 0;
  }
}

// ========== BLUESKY API HELPERS ==========

/**
 * Fetch Bluesky stats for multiple handles in one request (up to 25)
 * Uses the fully public AT Protocol API — no auth required
 */
async function fetchBlueskyBatch(handles) {
  const params = handles.map(h => `actors=${encodeURIComponent(h)}`).join('&');
  const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Bluesky API error: HTTP ${response.status}`);
  }

  const data = await response.json();

  // Map handle -> stats
  const statsMap = new Map();
  (data.profiles || []).forEach(profile => {
    statsMap.set(profile.handle.toLowerCase(), {
      followers: profile.followersCount ?? 0,
      totalPosts: profile.postsCount ?? 0,
    });
  });
  return statsMap;
}

// ========== KICK API HELPERS ==========
let kickAccessToken = null;

async function getKickAccessToken() {
  if (kickAccessToken) return kickAccessToken;

  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  kickAccessToken = data.access_token;
  return kickAccessToken;
}

/**
 * Fetch Kick channel info for multiple slugs (up to 50)
 */
async function fetchKickChannelsBatch(slugs) {
  const token = await getKickAccessToken();
  const slugParams = slugs.map(s => `slug=${encodeURIComponent(s)}`).join('&');

  const response = await fetch(`https://api.kick.com/public/v1/channels?${slugParams}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  const channelMap = new Map();
  (data.data || []).forEach(channel => {
    channelMap.set(channel.slug.toLowerCase(), {
      subscribers: channel.active_subscribers_count || 0,
    });
  });
  return channelMap;
}

/**
 * Get today's date in America/New_York timezone (YYYY-MM-DD format)
 * This ensures consistent date handling regardless of UTC offset
 */
function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Process array in chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}


async function collectDailyStats() {
  const today = getTodayLocal();
  console.log('📊 Starting daily stats collection (batch mode)...');
  console.log(`   Date: ${today} (America/New_York)\n`);

  // Check credentials
  console.log('🔑 Checking credentials...');
  console.log(`   YouTube API Key: ${YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twitch Client ID: ${TWITCH_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twitch Client Secret: ${TWITCH_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Kick Client ID: ${KICK_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Kick Client Secret: ${KICK_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Last.fm API Key: ${LASTFM_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  // Get all creators from database (Supabase default limit is 1000, so paginate)
  let creators = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error: fetchError } = await supabase
      .from('creators')
      .select('*')
      .range(from, from + pageSize - 1);
    if (fetchError) {
      console.error('❌ Error fetching creators:', fetchError.message);
      return;
    }
    creators = creators.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const youtubeCreators = creators.filter((c) => c.platform === 'youtube');
  const twitchCreators = creators.filter((c) => c.platform === 'twitch');
  const kickCreators = creators.filter((c) => c.platform === 'kick');
  const blueskyCreators = creators.filter((c) => c.platform === 'bluesky');
  const musicCreators = creators.filter((c) => c.platform === 'music');
  // TikTok is handled by refreshTikTokProfiles.js via separate GitHub Actions workflow

  console.log(`Found ${creators.length} creators to update`);
  console.log(`   YouTube: ${youtubeCreators.length}`);
  console.log(`   Twitch: ${twitchCreators.length}`);
  console.log(`   Kick: ${kickCreators.length}`);
  console.log(`   Bluesky: ${blueskyCreators.length}`);
  console.log(`   Music: ${musicCreators.length}\n`);

  let successCount = 0;
  let errorCount = 0;
  const statsToUpsert = [];

  // ========== YOUTUBE (batch by 50) ==========
  if (youtubeCreators.length > 0 && YOUTUBE_API_KEY) {
    console.log('📺 Processing YouTube creators...');
    const youtubeBatches = chunk(youtubeCreators, YOUTUBE_BATCH_SIZE);
    console.log(`   ${youtubeBatches.length} batch(es) of up to ${YOUTUBE_BATCH_SIZE} channels\n`);

    for (let i = 0; i < youtubeBatches.length; i++) {
      const batch = youtubeBatches[i];
      const channelIds = batch.map((c) => c.platform_id);

      try {
        const statsMap = await fetchYouTubeBatch(channelIds);

        for (const creator of batch) {
          const stats = statsMap.get(creator.platform_id);
          if (stats && stats.subscribers > 0) {
            statsToUpsert.push({
              creator_id: creator.id,
              recorded_at: today,
              subscribers: stats.subscribers,
              followers: stats.subscribers,
              total_views: stats.total_views,
              total_posts: stats.total_posts,
            });
            console.log(`   ✅ ${creator.display_name}: ${(stats.subscribers / 1000000).toFixed(1)}M subs`);
            successCount++;
          } else if (stats && stats.subscribers === 0) {
            // YouTube returned 0 — likely a hidden subscriber count or API anomaly.
            // Never write 0 to the database; skip this creator for today.
            console.log(`   ⚠️  ${creator.display_name}: Skipping — API returned 0 subscribers`);
            errorCount++;
          } else {
            console.log(`   ❌ ${creator.display_name}: Channel not found`);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed: ${error.message}`);
        errorCount += batch.length;
      }

      // Small delay between batches
      if (i < youtubeBatches.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  // ========== TWITCH (batch user lookup, parallel followers) ==========
  if (twitchCreators.length > 0 && TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
    console.log('\n🎮 Processing Twitch creators...');
    const twitchBatches = chunk(twitchCreators, TWITCH_BATCH_SIZE);
    console.log(`   ${twitchBatches.length} batch(es) of up to ${TWITCH_BATCH_SIZE} users\n`);

    for (let i = 0; i < twitchBatches.length; i++) {
      const batch = twitchBatches[i];
      const usernames = batch.map((c) => c.username.toLowerCase());

      try {
        // Get all user info in one request
        const userMap = await fetchTwitchUsersBatch(usernames);

        // Fetch followers sequentially with a delay to stay under Twitch's 800 req/min limit
        const results = [];
        for (const creator of batch) {
          const userData = userMap.get(creator.username.toLowerCase());
          if (!userData) {
            results.push({ creator, error: 'User not found' });
            continue;
          }
          try {
            const [followers, vodViews] = await Promise.all([
              fetchTwitchFollowers(userData.id),
              fetchTwitchVODViews(userData.id),
            ]);
            results.push({ creator, stats: { followers, total_views: vodViews } });
          } catch (err) {
            results.push({ creator, error: err.message });
          }
          await new Promise(r => setTimeout(r, TWITCH_FOLLOWER_DELAY_MS));
        }

        for (const result of results) {
          if (result.error) {
            console.log(`   ❌ ${result.creator.display_name}: ${result.error}`);
            errorCount++;
          } else {
            statsToUpsert.push({
              creator_id: result.creator.id,
              recorded_at: today,
              subscribers: result.stats.followers,
              followers: result.stats.followers,
              total_views: result.stats.total_views,
              total_posts: 0,
            });
            console.log(`   ✅ ${result.creator.display_name}: ${(result.stats.followers / 1000000).toFixed(1)}M followers`);
            successCount++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed: ${error.message}`);
        errorCount += batch.length;
      }

      // Small delay between batches
      if (i < twitchBatches.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  // ========== KICK (batch by 50) ==========
  if (kickCreators.length > 0 && KICK_CLIENT_ID && KICK_CLIENT_SECRET) {
    console.log('\n🟢 Processing Kick creators...');
    const kickBatches = chunk(kickCreators, KICK_BATCH_SIZE);
    console.log(`   ${kickBatches.length} batch(es) of up to ${KICK_BATCH_SIZE} channels\n`);

    for (let i = 0; i < kickBatches.length; i++) {
      const batch = kickBatches[i];
      const slugs = batch.map((c) => c.username.toLowerCase());

      try {
        const channelMap = await fetchKickChannelsBatch(slugs);

        for (const creator of batch) {
          const channelData = channelMap.get(creator.username.toLowerCase());
          if (channelData) {
            statsToUpsert.push({
              creator_id: creator.id,
              recorded_at: today,
              subscribers: channelData.subscribers,
              followers: channelData.subscribers,
              total_views: 0,
              total_posts: 0,
            });
            console.log(`   ✅ ${creator.display_name}: ${channelData.subscribers} paid subs`);
            successCount++;
          } else {
            console.log(`   ❌ ${creator.display_name}: Channel not found`);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed: ${error.message}`);
        errorCount += batch.length;
      }

      if (i < kickBatches.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  // ========== BLUESKY (batch by 25, no auth required) ==========
  if (blueskyCreators.length > 0) {
    console.log('\n🦋 Processing Bluesky creators...');
    const blueskyBatches = chunk(blueskyCreators, BLUESKY_BATCH_SIZE);
    console.log(`   ${blueskyBatches.length} batch(es) of up to ${BLUESKY_BATCH_SIZE} profiles\n`);

    for (let i = 0; i < blueskyBatches.length; i++) {
      const batch = blueskyBatches[i];
      const handles = batch.map((c) => c.username.toLowerCase());

      try {
        const statsMap = await fetchBlueskyBatch(handles);

        for (const creator of batch) {
          const stats = statsMap.get(creator.username.toLowerCase());
          if (stats && stats.followers > 0) {
            statsToUpsert.push({
              creator_id: creator.id,
              recorded_at: today,
              subscribers: stats.followers,
              followers: stats.followers,
              total_views: null,
              total_posts: stats.totalPosts,
            });
            console.log(`   ✅ ${creator.display_name}: ${stats.followers.toLocaleString()} followers`);
            successCount++;
          } else if (stats && stats.followers === 0) {
            // API returned 0 — could be a brand new or private account. Skip to avoid corrupting history.
            console.log(`   ⚠️  ${creator.display_name}: Skipping — API returned 0 followers`);
            errorCount++;
          } else {
            console.log(`   ❌ ${creator.display_name}: Profile not found`);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed: ${error.message}`);
        errorCount += batch.length;
      }

      // Small delay between batches to be polite to the public API
      if (i < blueskyBatches.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  // ========== MUSIC / LAST.FM (individual requests, ~5 req/s) ==========
  if (musicCreators.length > 0 && LASTFM_API_KEY) {
    console.log('\n🎵 Processing Music artists (Last.fm)...');
    console.log(`   ${musicCreators.length} artists\n`);

    for (const creator of musicCreators) {
      try {
        const stats = await fetchLastFmArtistStats(creator.platform_id, creator.display_name);
        if (stats.listeners > 0) {
          statsToUpsert.push({
            creator_id: creator.id,
            recorded_at: today,
            subscribers: stats.listeners,
            followers: stats.listeners,
            total_views: stats.playcount,
            total_posts: null,
          });
          console.log(`   ✅ ${creator.display_name}: ${stats.listeners.toLocaleString()} listeners`);
          successCount++;
        } else {
          console.log(`   ⚠️  ${creator.display_name}: Skipping — API returned 0 listeners`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ ${creator.display_name}: ${error.message}`);
        errorCount++;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // ========== BULK UPSERT TO DATABASE ==========
  if (statsToUpsert.length > 0) {
    console.log(`\n💾 Saving ${statsToUpsert.length} stats entries to database...`);

    // Upsert in chunks of 1000 to avoid request size limits
    const dbBatches = chunk(statsToUpsert, 1000);
    for (const batch of dbBatches) {
      const { error: upsertError } = await supabase
        .from('creator_stats')
        .upsert(batch, { onConflict: 'creator_id,recorded_at' });

      if (upsertError) {
        console.error('   ❌ Database upsert error:', upsertError.message);
      }
    }
    console.log('   ✅ Database updated');
  }

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 Collection complete!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${creators.length}`);

  // Performance stats
  console.log(`\n📡 API calls made:`);
  console.log(`   YouTube: ${Math.ceil(youtubeCreators.length / YOUTUBE_BATCH_SIZE)} (batched ${YOUTUBE_BATCH_SIZE}/request)`);
  console.log(`   Twitch Users: ${Math.ceil(twitchCreators.length / TWITCH_BATCH_SIZE)} (batched ${TWITCH_BATCH_SIZE}/request)`);
  console.log(`   Twitch Followers: ${twitchCreators.length} (parallel ${TWITCH_PARALLEL_FOLLOWERS}x)`);
  console.log(`   Kick: ${Math.ceil(kickCreators.length / KICK_BATCH_SIZE)} (batched ${KICK_BATCH_SIZE}/request)`);
  console.log(`   Bluesky: ${Math.ceil(blueskyCreators.length / BLUESKY_BATCH_SIZE)} (batched ${BLUESKY_BATCH_SIZE}/request, no auth)`);
  console.log(`   Music: ${musicCreators.length} (individual, Last.fm)`);
}

collectDailyStats().catch(console.error);
