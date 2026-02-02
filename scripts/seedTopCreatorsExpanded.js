import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Top 200+ YouTube Channel IDs (by subscriber count, as of 2024-2025)
// Using IDs is 100x more efficient than search queries
const YOUTUBE_CHANNEL_IDS = [
  // Top 50 by subscribers
  'UCq-Fj5jknLsUf-MWSy4_brA', // T-Series
  'UCX6OQ3DkcsbYNE6H8uQQuVA', // MrBeast
  'UCbCmjCuTUZos6Inko4u57UQ', // Cocomelon
  'UCpEhnqL0y41EpW2TvWAHD7Q', // SET India
  'UCvlE5gTbOvjiolFlEm-c_Ow', // Sony Music India
  'UC-lHJZR3Gqxm24_Vd_AJ5Yw', // PewDiePie
  'UCk8GzjMOrta8yxDcKfylJYw', // Like Nastya
  'UCjZa4AzD-sJkp-TkuwMaGog', // Kids Diana Show
  'UCi8XQNxQd5_JHXkYHK0ZImA', // Vlad and Niki
  'UCYfdidRxbB8Qhf0Nx7ioOYw', // WWE
  'UCpMlzoUChNOHOuasxkCjq1Q', // BLACKPINK
  'UC295-Dw_tDNtZXFeAPAQKEw', // 5-Minute Crafts
  'UCffDXn7ycAzwL2LDlbyWOTw', // Zee Music Company
  'UCLkAepWjdylmXSltofFvsYQ', // BANGTANTV
  'UCWPV2cWPVNMwpgfOOanFquw', // Justin Bieber
  'UCfM3zsQsOnfWNUppiycmBuw', // EminemMusic
  'UCqECaJ8Gagnn7YCbPEzWH6g', // Taylor Swift
  'UC9CoOnJkIBMdeijd9qYoT_g', // Ariana Grande
  'UC0C-w0YjGpqDXGB8IHb662A', // Ed Sheeran
  'UCJ6td3C9QlPO9O_J5dF4ZzA', // Katy Perry
  'UCEdvpU2pFRCVqU6yIPyTpMQ', // Marshmello
  'UCmyxyR7Kz0k-oiYnYz6lVYw', // LooLoo Kids
  'UCRijo3ddMTht_IHyNSNXpNQ', // Dude Perfect
  'UCFZ75Bg73NJnJgmeUX9l62g', // JuegaGerman
  'UCZJ7m7EnCNodqnu5SAtg8eQ', // HolaSoyGerman
  'UCGwu0nbY2wSkW8N-cghnLpA', // Jaiden Animations
  'UC7_YxT-KID8kRbqZo7MyscQ', // Markiplier
  'UC-9-kyTW8ZkZNDHQJ6FgpwQ', // Music
  'UCEgdi0XIXXZ-qJOFPf4JSKw', // Skrillex
  'UCWMId1kDrjXdUwQc1E3rRvw', // Shakira
  'UCIwFjwMjI0y7PDBVEO9-bkQ', // Super Simple Songs
  'UCbmNph6atAoGfqLoCL_duAg', // Paradise Gamers
  'UCVHFbqXqoYvEWM1Ddxl0QKg', // ChuChu TV
  'UChGJGhZ9SOOHvBB0Y4DOO_w', // Coldplay
  'UC-OhBCpVkiLaD8xRDwIXz9Q', // SSSniperWolf
  'UCXuqSBlHAE6Xw-yeJA0Tunw', // Linus Tech Tips
  'UCsooa4yRKGN_zEE8iknghZA', // TED-Ed
  'UCq5hgY37WAryZCwmehDyCaQ', // Toys and Colors
  'UCWOA1ZGywLbqmigxE4Qlvuw', // Zee TV
  'UCJ0uqCI0Vqr2Rrt1HseGirg', // Pinkfong
  // More top channels
  'UCY30JRSgfhYXA6i6xX1erWg', // Sony SAB
  'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp
  'UCm22FAXZMw1BaWeFszZxUKw', // Movieclips
  'UCsXVk37bltHxD1rDPwtNM8Q', // Kurzgesagt
  'UCO8DQrSp5yEP937qNqTooOw', // Good Mythical Morning
  'UCJQJAI7IjbLcpsjWdSzYz0Q', // TheEllenShow
  'UCOmHUn--16B90oW2L6FRR3A', // BLACKPINK
  'UCZFWPqqPkFlNwIxcpsLOwew', // CKN Toys
  'UCHnyfMqiRRG1u-2MsSQLbXA', // Veritasium
  'UCoxcjq-8xIDTYp3uz647V5A', // numberphile
  // Gaming
  'UC4R8DWoMoI7CAwX8_LjQHig', // Jacksepticeye
  'UCYzPXprvl5Y-Sf0g4vX-m6g', // Dream
  'UCsh4sQV6W7rFmTJRKrhFl5w', // Alan Becker
  'UCj5i58mCkAREDqFWlhaQbOw', // TheOdd1sOut
  'UCam8T03EOFBsNdR0thrFHdQ', // VEGETTA777
  'UCYiGq8XF7YQD00x7wAd62Zg', // Fernanfloo
  'UCq6VFHwMzcMXbuKyG7SQYIg', // A4
  'UCzWQYUVCpZqtN93H8RR44Qw', // SethEverman
  // Music
  'UC2xskkQVFEpLcGFnNSLQY0A', // Bad Bunny
  'UC0WP5P-ufpRfjbNrmOWwLBQ', // Bad Bunny Topic
  'UCRY5dYsbIN5TylSbd7gVnZg', // Daddy Yankee
  'UCByOQJjav0CUDwxCk-jVNRQ', // Drake
  'UCn1XnDWhsLS5URXTi5wtFTA', // The Weeknd
  'UCIjYyZxkFucP_W-tmXg_9Ow', // Travis Scott
  'UCNL1ZadSjHpjm4q9j2sVtOA', // Billie Eilish
  'UCiGm_E4ZwYSHV3bcW1pnSeQ', // Olivia Rodrigo
  'UCvjWuSoxGrEPcfVsCtvMY-A', // Doja Cat
  'UC0RhatS1pyxInC00YKjjBqQ', // Imagine Dragons
  'UCPC0L1d253x-KuMNwa05TpA', // Selena Gomez
  // Education & Entertainment
  'UCHaHD477h-FeBbVh9Sh7syA', // Vsauce2
  'UC6nSFpj9HTCZ5t-N3Rm3-HA', // Vsauce
  'UCZ5C1HBPMEcCA1YGQmqj6Iw', // Blender Guru
  'UCBcRF18a7Qf58cCRy5xuWwQ', // WORLDSTARHIPHOP
  'UCJ5v_MCY6GNUBTO8-D3XoAg', // WWE
  'UCWv7vMbMWH4-V0ZXdmDpPBA', // Jubilee
  'UC-9-kyTW8ZkZNDHQJ6FgpwQ', // Music
  'UCJFp8uSYCjXOMnkUyb3CQ3Q', // Typical Gamer
  'UCam8T03EOFBsNdR0thrFHdQ', // VEGETTA777
  // More entertainment
  'UCBnZ16ahKA2DZ_T5W0FPUXg', // Nas Daily
  'UCNQpffC5jfOVwdJFEfgBTQw', // Ryan Trahan
  'UCWRV5AVOlKJR1Flvgt310Cw', // airrack
  'UCo8bcnLyZH8tBIH9V1mLgqQ', // TheOddOnesOut
  'UC4rlAVgAK0SGk-yTfe48Qpw', // PBG
  'UCLXo7UDZvByw2ixzpQCufnA', // Vox
  'UCsXVk37bltHxD1rDPwtNM8Q', // Kurzgesagt
  'UC3XTzVzaHQEd30rQbuvCtTQ', // LastWeekTonight
  'UCupvZG-5ko_eiXAupbDfxWw', // CNN
  'UCYFd7Qy93YP7gPERnxP545A', // Corridor Crew
  // Tech
  'UCBJycsmduvYEL83R_U4JriQ', // MKBHD
  'UCddiUEpeqJcYeBxX1IVBKvQ', // The Verge
  'UCVYamHliCI9rw1tHR1xbkfw', // Dave2D
  'UCsTcErHg8oDvUnTzoqsYeNw', // Unbox Therapy
  'UCBJycsmduvYEL83R_U4JriQ', // MKBHD
  'UCey_c7U86mJGz1VJWH5CYPA', // iJustine
  'UCXGgrKt94gR6lmN4aN3mYTg', // Austin Evans
  // Sports
  'UCWPV2cWPVNMwpgfOOanFquw', // ESPN
  'UCqZQlzSHbVJrwrn5XvzrzcA', // F1
  'UCkBY1aKPqGS64JaQE3D_f-Q', // UFC
  'UCeo7nzbRXT4mYH9mOFOaP7g', // NBA
  'UCJka5SDh36_N4pjJd69efkg', // NFL
  // More variety
  'UCkxctb0jr8vwa4Do6c6su0Q', // PowerfulJRE
  'UCUK0HBIBWgM2c4vsPhkYY4w', // Sidemen
  'UCgmPnx-EEeOrZSg5Tiw7ZRQ', // Preston
  'UCR1IuLEqb6UEA_zQ81kwXfg', // Real Madrid CF
  'UCGq7ov9-Xk9fkeQjeeXElkQ', // FC Barcelona
  'UCFnQqGbVF1buqGlCEdPkoiA', // Manchester United
  'UCJka5SDh36_N4pjJd69efkg', // NFL
  'UCeo7nzbRXT4mYH9mOFOaP7g', // NBA
  'UCGC0M8pwMf5VbrrzKhGVJdQ', // Brave Wilderness
  'UCkQO3QsgTpNTsOw6ujimT5Q', // Cinema Sins
  'UC9-y-6csu5WGm29I7JiwpnA', // Computerphile
  'UCsooa4yRKGN_zEE8iknghZA', // TED-Ed
  'UCtinbF-Q-fVthA0qrFQTgXQ', // CaseyNeistat
  'UCnmGIkw-KdI0W5siakKPKog', // Magnus Midtbo
  'UCpko_-a4wgz2u_DgDgd9fqA', // Lele Pons
  'UCMiJRAwDNSNzuYeN2uWa0pA', // Mrwhosetheboss
  'UCPDXXXJj9nax0fr0Wfc048g', // Corpse Husband
  'UCsT0YIqwnpJCM-mx7-gSA4Q', // TEDx Talks
  'UC7IcJI8PUf5Z3zKxnZvTBog', // The School of Life
  'UCJ0uqCI0Vqr2Rrt1HseGirg', // Pinkfong
  // Indian creators
  'UCk1SpWNzOs4MYmr0uICEntg', // Carry Minati
  'UCvQECJukTDE2i6aCoMnS-Vg', // BB Ki Vines
  'UCj22tfcQrWG7EMEKS0qLeEg', // Ashish Chanchlani
  'UCqwUrj10mAEsqezcItqvwEw', // Bhuvan Bam
  'UCyoXW-Dse7fURq30EWl_CUA', // Amit Bhadana
  'UCpV1Wl-i4NiVS48AZmKT2wA', // Technical Guruji
  'UCnJjcn5FrgrOEp5_N45ZLEQ', // Round2Hell
  'UCMh4gfNNwIDCdqhgCKn2K7Q', // Harsh Beniwal
  // Spanish/Latin creators
  'UCam8T03EOFBsNdR0thrFHdQ', // VEGETTA777
  'UCYiGq8XF7YQD00x7wAd62Zg', // Fernanfloo
  'UCFZ75Bg73NJnJgmeUX9l62g', // JuegaGerman
  'UCZJ7m7EnCNodqnu5SAtg8eQ', // HolaSoyGerman
  'UCXazgXDIYyWH-yXLAkcrFxw', // elrubiusOMG
  'UCh7wqniVyRBMVOQCRr1hn8w', // Auronplay
  'UC8Yv3sbdhavHE-6vAqjPDMg', // TheGrefg
  'UC6jNDNkoOKQfB5djK2IBDoA', // Windygirk
  'UCSRW7Brvuw8xPjaSZ13bJmQ', // Willyrex
  'UCLkyLP02CLMSz3EtSxWPKrA', // DALAS REVIEW
  // Brazilian/Portuguese
  'UCffDXn7ycAzwL2LDlbyWOTw', // Zee Music
  'UCK8sQmJBp8GCxrOtXWBpyEA', // Google
  'UCiDJtJKMICpb9B1qf7qjEOA', // Cyanide & Happiness
  'UCzQUP1qoWDoEbmsQxvdjxgQ', // VanossGaming
  'UCGwu0nbY2wSkW8N-cghnLpA', // Jaiden Animations
  'UCcdwLMPsaU2ezNSJU1nFoBQ', // MrBeast Gaming
  'UCjgpFI5dU-D1-kh9H1muoxQ', // Shane Dawson
  'UCq-Fj5jknLsUf-MWSy4_brA', // T-Series
  'UCo_IB5145EVNcf8hw1Kku7w', // Nas Daily
  'UC4USoIAL9qcsx5nCZV_QRnA', // Tom Scott
];

// Top 200 Twitch streamers by followers
const TWITCH_USERNAMES = [
  // Top 50
  'ninja', 'tfue', 'rubius', 'auronplay', 'ibai', 'thegrefg', 'shroud',
  'pokimane', 'xqc', 'summit1g', 'timthetatman', 'nickmercs', 'sodapoppin',
  'asmongold', 'myth', 'loltyler1', 'drlupo', 'lirik', 'sykkuno', 'disguisedtoast',
  'hasanabi', 'moistcr1tikal', 'valkyrae', 'ludwig', 'mizkif', 'trainwreckstv',
  'nmplol', 'twitchrivals', 'rocketleague', 'fortnite', 'overwatchleague',
  'rainbow6', 'valorant', 'loltyler1', 'riotgames', 'esl_csgo', 'dota2ti',
  // Spanish streamers
  'elxokas', 'illojuan', 'alexby11', 'willyrex', 'vegetta777', 'staxx',
  'ampeterby7', 'elded', 'quackity', 'karmaland', 'zormanworld', 'wismichu',
  // More variety
  'tarik', 'stewie2k', 's1mple', 'zywoo', 'niko', 'device', 'fallen',
  'coldzera', 'kennys', 'guardian', 'electronic', 'twistzz', 'elige',
  // Just Chatting / Variety
  'amouranth', 'emiru', 'kkatamina', 'qtcinderella', 'botezlive', 'anniefuchsia',
  'hafu', 'itshafu', 'boxbox', 'scarra', 'imaqtpie', 'voyboy', 'nightblue3',
  'trick2g', 'tobiasfate', 'hashinshin', 'thebausffs', 'drututt', 'nemesis',
  // RP streamers
  'cloakzy', 'ronaldo', 'bugha', 'mongraal', 'benjyfishy', 'mrfreshasian',
  'lacy', 'clix', 'zayt', 'saf', 'emad', 'chap', 'vivid', 'poach',
  // More international
  'gaules', 'casimiro', 'loud_coringa', 'bfrfranco', 'cellbit', 'felps',
  'liminha', 'baiano', 'ohnepixel', 'anomaly', 'papaplatte', 'gronkh',
  'trymacs', 'montanablack88', 'elspreen', 'rivers_gg', 'coscu', 'zeein',
  // Esports orgs/events
  'esl_dota2', 'gaborz', 'otplol_', 'lec', 'lcs', 'lck', 'lpl',
  'rocketleague', 'rlcs', 'eslcs', 'blast', 'paborz',
  // More variety streamers
  'clintstevens', 'erobb221', 'jinnytty', 'maya', 'alinity', 'indiefoxx',
  'kiaraakitty', 'jessicablevins', 'chicalive', 'loserfruit', 'muselk',
  'lazarbeam', 'lachlan', 'fresh', 'mrfreshasian', 'crayator', 'kingyoshi',
  // Music
  'thelittleninjas', 'fuslie', 'rae', 'kyedae', 'taytay', 'averagejonas',
  'tenz', 'shahzam', 'zombs', 'sinatraa', 'dicey', 'dazs',
  // More
  'kai_cenat', 'ishowspeed', 'adin', 'brucedropemoff', 'yrgender',
  'fanum', 'duke_dennis', 'agent00', 'plaqueboymax', 'yourrage',
  'flight', 'dontai', 'kaicenat', 'jidion', 'sneako', 'ricegum',
  // Final batch
  'calebhart42', 'simply', 'smallant', 'wirtual', 'pointcrow', 'linkus7',
  'atrioc', 'stanz', 'connoreatspants', 'slimecicle', 'jschlatt', 'quig',
  'smajor', 'philza', 'wilbursoot', 'tommyinnit', 'tubbo', 'ranboo',
  'georgenotfound', 'sapnap', 'punz', 'antfrost', 'badboyhalo', 'skeppy'
];

// Utility functions
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
      country: creatorData.country,
      category: creatorData.category,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,platform_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function saveCreatorStats(creatorId, stats) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('creator_stats')
    .upsert({
      creator_id: creatorId,
      recorded_at: today,
      subscribers: stats.subscribers,
      total_views: stats.totalViews,
      total_posts: stats.totalPosts,
      followers: stats.subscribers,
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

// YouTube batch fetch (50 channels per request = efficient!)
async function fetchYouTubeChannelsBatch(channelIds) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelIds.join(','),
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch YouTube channels');
  }

  const data = await response.json();
  return (data.items || []).map(channel => ({
    platform: 'youtube',
    platformId: channel.id,
    username: channel.snippet.customUrl?.replace('@', '') || channel.id,
    displayName: channel.snippet.title,
    profileImage: channel.snippet.thumbnails?.high?.url,
    description: channel.snippet.description?.slice(0, 500),
    country: channel.brandingSettings?.channel?.country || null,
    category: null,
    subscribers: parseInt(channel.statistics.subscriberCount) || 0,
    totalViews: parseInt(channel.statistics.viewCount) || 0,
    totalPosts: parseInt(channel.statistics.videoCount) || 0,
  }));
}

// Twitch functions
let twitchToken = null;

async function getTwitchToken() {
  if (twitchToken) return twitchToken;

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
  twitchToken = data.access_token;
  return twitchToken;
}

async function fetchTwitchUsersBatch(usernames) {
  const token = await getTwitchToken();
  const params = usernames.map(u => `login=${encodeURIComponent(u)}`).join('&');

  const response = await fetch(`https://api.twitch.tv/helix/users?${params}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
}

async function fetchTwitchFollowers(userId) {
  const token = await getTwitchToken();
  const response = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=1`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return 0;
  const data = await response.json();
  return data.total || 0;
}

// Main seeding functions
async function seedYouTube() {
  console.log(`\n📺 Seeding ${YOUTUBE_CHANNEL_IDS.length} YouTube channels...\n`);

  // Remove duplicates
  const uniqueIds = [...new Set(YOUTUBE_CHANNEL_IDS)];
  console.log(`   (${uniqueIds.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  // Batch fetch 50 at a time
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    console.log(`   Fetching batch ${Math.floor(i/50) + 1}/${Math.ceil(uniqueIds.length/50)}...`);

    try {
      const channels = await fetchYouTubeChannelsBatch(batch);

      for (const channel of channels) {
        try {
          const dbCreator = await upsertCreator(channel);
          await saveCreatorStats(dbCreator.id, {
            subscribers: channel.subscribers,
            totalViews: channel.totalViews,
            totalPosts: channel.totalPosts,
          });
          success++;
          console.log(`   ✅ ${channel.displayName} (${(channel.subscribers/1000000).toFixed(1)}M subs)`);
        } catch (err) {
          failed++;
          console.log(`   ❌ ${channel.displayName}: ${err.message}`);
        }
      }

      // Rate limit: wait 500ms between batches
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\n   YouTube: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function seedTwitch() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.log('\n⚠️  Skipping Twitch: Missing credentials\n');
    return 0;
  }

  console.log(`\n🟣 Seeding ${TWITCH_USERNAMES.length} Twitch streamers...\n`);

  const uniqueUsernames = [...new Set(TWITCH_USERNAMES.map(u => u.toLowerCase()))];
  console.log(`   (${uniqueUsernames.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  // Batch fetch 100 at a time (Twitch limit)
  for (let i = 0; i < uniqueUsernames.length; i += 100) {
    const batch = uniqueUsernames.slice(i, i + 100);
    console.log(`   Fetching batch ${Math.floor(i/100) + 1}/${Math.ceil(uniqueUsernames.length/100)}...`);

    try {
      const users = await fetchTwitchUsersBatch(batch);

      for (const user of users) {
        try {
          const followers = await fetchTwitchFollowers(user.id);

          const channel = {
            platform: 'twitch',
            platformId: user.id,
            username: user.login,
            displayName: user.display_name,
            profileImage: user.profile_image_url,
            description: user.description,
            category: null,
            subscribers: followers,
            totalViews: user.view_count || 0,
            totalPosts: 0,
          };

          const dbCreator = await upsertCreator(channel);
          await saveCreatorStats(dbCreator.id, {
            subscribers: followers,
            totalViews: channel.totalViews,
            totalPosts: 0,
          });

          success++;
          console.log(`   ✅ ${user.display_name} (${(followers/1000000).toFixed(1)}M followers)`);

          // Rate limit for follower calls
          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          failed++;
          console.log(`   ❌ ${user.display_name}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\n   Twitch: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function run() {
  console.log('═'.repeat(60));
  console.log('🚀 EXPANDED SEED: Top YouTube & Twitch Creators');
  console.log('═'.repeat(60));

  const ytCount = await seedYouTube();
  const twitchCount = await seedTwitch();

  console.log('═'.repeat(60));
  console.log(`✅ COMPLETE: ${ytCount} YouTube + ${twitchCount} Twitch creators seeded`);
  console.log('═'.repeat(60));
}

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
