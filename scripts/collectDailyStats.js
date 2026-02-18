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

// Batch sizes
const YOUTUBE_BATCH_SIZE = 50;  // YouTube allows up to 50 channel IDs per request
const TWITCH_BATCH_SIZE = 100;  // Twitch allows up to 100 logins per request
const TWITCH_PARALLEL_FOLLOWERS = 10;  // Parallel follower requests
const KICK_BATCH_SIZE = 50;    // Kick allows up to 50 slugs per request

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

let twitchAccessToken = null;

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
 * Fetch follower count for a single Twitch user
 */
async function fetchTwitchFollowers(broadcasterId) {
  const token = await getTwitchAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data.total || 0;
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

/**
 * Process promises in parallel with concurrency limit
 */
async function parallelLimit(tasks, limit) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);

    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
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
  // TikTok is handled by local automation (refreshTikTokProfiles.js) - not via GitHub Actions

  console.log(`Found ${creators.length} creators to update`);
  console.log(`   YouTube: ${youtubeCreators.length}`);
  console.log(`   Twitch: ${twitchCreators.length}`);
  console.log(`   Kick: ${kickCreators.length}\n`);

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
          if (stats) {
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

        // Prepare follower fetch tasks
        const followerTasks = batch.map((creator) => async () => {
          const userData = userMap.get(creator.username.toLowerCase());
          if (!userData) {
            return { creator, error: 'User not found' };
          }

          try {
            const [followers, vodViews] = await Promise.all([
              fetchTwitchFollowers(userData.id),
              fetchTwitchVODViews(userData.id),
            ]);
            return {
              creator,
              stats: {
                followers,
                total_views: vodViews,
              },
            };
          } catch (err) {
            return { creator, error: err.message };
          }
        });

        // Fetch followers in parallel (with limit)
        const results = await parallelLimit(followerTasks, TWITCH_PARALLEL_FOLLOWERS);

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
  const apiCalls = {
    youtube: Math.ceil(youtubeCreators.length / YOUTUBE_BATCH_SIZE),
    twitchUsers: Math.ceil(twitchCreators.length / TWITCH_BATCH_SIZE),
    twitchFollowers: twitchCreators.length,
    kick: Math.ceil(kickCreators.length / KICK_BATCH_SIZE),
  };
  console.log(`\n📡 API calls made:`);
  console.log(`   YouTube: ${apiCalls.youtube} (batched ${YOUTUBE_BATCH_SIZE}/request)`);
  console.log(`   Twitch Users: ${apiCalls.twitchUsers} (batched ${TWITCH_BATCH_SIZE}/request)`);
  console.log(`   Twitch Followers: ${apiCalls.twitchFollowers} (parallel ${TWITCH_PARALLEL_FOLLOWERS}x)`);
  console.log(`   Kick: ${apiCalls.kick} (batched ${KICK_BATCH_SIZE}/request)`);
}

collectDailyStats().catch(console.error);
