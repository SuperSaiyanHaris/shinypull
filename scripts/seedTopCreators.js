import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
}

if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YouTube API key. Set VITE_YOUTUBE_API_KEY or YOUTUBE_API_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

/**
 * Get today's date in America/New_York timezone (YYYY-MM-DD format)
 */
function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const YOUTUBE_QUERIES = [
  'MrBeast',
  'T-Series',
  'Cocomelon',
  'SET India',
  'Sony Music India',
  'PewDiePie',
  'Like Nastya',
  'Kids Diana Show',
  'WWE',
  'BLACKPINK',
  '5-Minute Crafts',
  'Zee Music Company',
  'BANGTANTV',
  'Justin Bieber',
  'EminemMusic',
  'Taylor Swift',
  'Ariana Grande',
  'Ed Sheeran',
  'Katy Perry',
  'Marshmello',
  'LooLoo Kids',
  'Dude Perfect',
  'JuegaGerman',
  'HolaSoyGerman',
  'KSI',
  'Kurzgesagt',
  'Whinderssonnunes',
  'ElRubius',
  'SMTOWN',
  'Canal KondZilla',
  'LuisFonsi'
];

const TWITCH_USERNAMES = [
  'xqc',
  'kai_cenat',
  'ninja',
  'shroud',
  'pokimane',
  'ibai',
  'auronplay',
  'thegrefg',
  'rubius',
  'summit1g',
  'tfue',
  'timthetatman',
  'asmongold',
  'hasanabi',
  'sodapoppin',
  'nickmercs',
  'myth',
  'drlupo',
  'loltyler1',
  'sykkuno'
];

async function upsertCreator(creatorData) {
  const { data, error } = await supabase
    .from('creators')
    .upsert(
      {
        platform: creatorData.platform,
        platform_id: creatorData.platformId,
        username: creatorData.username,
        display_name: creatorData.displayName,
        profile_image: creatorData.profileImage,
        description: creatorData.description,
        country: creatorData.country,
        category: creatorData.category,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'platform,platform_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function saveCreatorStats(creatorId, stats) {
  const today = getTodayLocal();

  const { data, error } = await supabase
    .from('creator_stats')
    .upsert(
      {
        creator_id: creatorId,
        recorded_at: today,
        subscribers: stats.subscribers,
        total_views: stats.totalViews,
        total_posts: stats.totalPosts,
        followers: stats.subscribers,
      },
      {
        onConflict: 'creator_id,recorded_at',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function fetchYouTubeChannelByQuery(query) {
  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'channel',
    q: query,
    maxResults: '1',
    key: YOUTUBE_API_KEY,
  });

  const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new Error(error.error?.message || 'Failed to search YouTube channels');
  }

  const searchData = await searchResponse.json();
  const channelId = searchData.items?.[0]?.id?.channelId;
  if (!channelId) return null;

  const channelParams = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
    key: YOUTUBE_API_KEY,
  });

  const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?${channelParams}`);
  if (!channelResponse.ok) {
    const error = await channelResponse.json();
    throw new Error(error.error?.message || 'Failed to fetch YouTube channel');
  }

  const channelData = await channelResponse.json();
  const channel = channelData.items?.[0];
  if (!channel) return null;

  return transformYouTubeChannel(channel);
}

function transformYouTubeChannel(channel) {
  const snippet = channel.snippet || {};
  const statistics = channel.statistics || {};
  const branding = channel.brandingSettings?.channel || {};

  return {
    platform: 'youtube',
    platformId: channel.id,
    username: snippet.customUrl?.replace('@', '') || channel.id,
    displayName: snippet.title,
    profileImage: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    description: snippet.description,
    country: branding.country || snippet.country || null,
    category: null,
    subscribers: parseInt(statistics.subscriberCount) || 0,
    totalViews: parseInt(statistics.viewCount) || 0,
    totalPosts: parseInt(statistics.videoCount) || 0,
    hiddenSubscribers: statistics.hiddenSubscriberCount || false,
    createdAt: snippet.publishedAt,
    bannerImage: channel.brandingSettings?.image?.bannerExternalUrl || null,
  };
}

let cachedTwitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchAccessToken() {
  if (cachedTwitchToken && Date.now() < twitchTokenExpiry) {
    return cachedTwitchToken;
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Twitch access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  cachedTwitchToken = data.access_token;
  twitchTokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return cachedTwitchToken;
}

async function fetchTwitchChannelByUsername(username) {
  const token = await getTwitchAccessToken();

  const userResponse = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error('Failed to get Twitch user');
  }

  const userData = await userResponse.json();
  if (!userData.data || userData.data.length === 0) {
    return null;
  }

  const user = userData.data[0];

  const followersResponse = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}&first=1`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  let followers = 0;
  if (followersResponse.ok) {
    const followersData = await followersResponse.json();
    followers = followersData.total || 0;
  }

  const channelResponse = await fetch(
    `https://api.twitch.tv/helix/channels?broadcaster_id=${user.id}`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  let category = null;
  if (channelResponse.ok) {
    const channelData = await channelResponse.json();
    if (channelData.data && channelData.data.length > 0) {
      category = channelData.data[0].game_name || null;
    }
  }

  return {
    platform: 'twitch',
    platformId: user.id,
    username: user.login,
    displayName: user.display_name,
    profileImage: user.profile_image_url,
    description: user.description,
    category: category,
    followers: followers,
    totalViews: user.view_count || 0,
    createdAt: user.created_at,
    broadcasterType: user.broadcaster_type,
  };
}

async function seedYouTube() {
  console.log(`Seeding ${YOUTUBE_QUERIES.length} YouTube creators...`);
  let success = 0;

  for (const query of YOUTUBE_QUERIES) {
    try {
      const channel = await fetchYouTubeChannelByQuery(query);
      if (!channel) {
        console.warn(`No YouTube channel found for: ${query}`);
        continue;
      }

      const dbCreator = await upsertCreator(channel);
      await saveCreatorStats(dbCreator.id, {
        subscribers: channel.subscribers,
        totalViews: channel.totalViews,
        totalPosts: channel.totalPosts,
      });

      success += 1;
      console.log(`✔ Seeded YouTube: ${channel.displayName}`);
    } catch (error) {
      console.warn(`Failed to seed YouTube (${query}):`, error.message || error);
    }
  }

  console.log(`YouTube seeding complete. ${success}/${YOUTUBE_QUERIES.length} creators seeded.`);
}

async function seedTwitch() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.warn('Skipping Twitch seed: Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET.');
    return;
  }

  console.log(`Seeding ${TWITCH_USERNAMES.length} Twitch creators...`);
  let success = 0;

  for (const username of TWITCH_USERNAMES) {
    try {
      const channel = await fetchTwitchChannelByUsername(username);
      if (!channel) {
        console.warn(`No Twitch channel found for: ${username}`);
        continue;
      }

      const dbCreator = await upsertCreator(channel);
      await saveCreatorStats(dbCreator.id, {
        subscribers: channel.followers,
        totalViews: channel.totalViews,
        totalPosts: 0,
      });

      success += 1;
      console.log(`✔ Seeded Twitch: ${channel.displayName}`);
    } catch (error) {
      console.warn(`Failed to seed Twitch (${username}):`, error.message || error);
    }
  }

  console.log(`Twitch seeding complete. ${success}/${TWITCH_USERNAMES.length} creators seeded.`);
}

async function run() {
  console.log('Starting seed...');
  await seedYouTube();
  await seedTwitch();
  console.log('Seed finished.');
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
