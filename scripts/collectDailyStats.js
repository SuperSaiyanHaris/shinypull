import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.VITE_TWITCH_CLIENT_SECRET;

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

async function fetchYouTubeStats(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`YouTube channel not found: ${channelId}`);
  }

  const channel = data.items[0];
  return {
    subscribers: parseInt(channel.statistics.subscriberCount) || 0,
    total_views: parseInt(channel.statistics.viewCount) || 0,
    total_posts: parseInt(channel.statistics.videoCount) || 0,
  };
}

async function fetchTwitchStats(username) {
  const token = await getTwitchAccessToken();
  
  // Get user info
  const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  const userData = await userResponse.json();
  
  if (!userData.data || userData.data.length === 0) {
    throw new Error(`Twitch user not found: ${username}`);
  }

  const userId = userData.data[0].id;
  
  // Get follower count
  const followersResponse = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  const followersData = await followersResponse.json();
  
  // Get total views from channel info
  const channelResponse = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  const channelData = await channelResponse.json();

  return {
    followers: followersData.total || 0,
    total_views: parseInt(userData.data[0].view_count) || 0,
    total_posts: 0, // Twitch doesn't track total videos in API
  };
}

async function collectDailyStats() {
  console.log('📊 Starting daily stats collection...');
  console.log(`   Date: ${new Date().toISOString().split('T')[0]}\n`);

  // Get all creators from database
  const { data: creators, error: fetchError } = await supabase
    .from('creators')
    .select('*');

  if (fetchError) {
    console.error('❌ Error fetching creators:', fetchError.message);
    return;
  }

  console.log(`Found ${creators.length} creators to update\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const creator of creators) {
    try {
      let stats;
      
      if (creator.platform === 'youtube') {
        stats = await fetchYouTubeStats(creator.platform_id);
        
        // Save to database
        await supabase.from('creator_stats').insert({
          creator_id: creator.id,
          recorded_at: new Date().toISOString().split('T')[0],
          subscribers: stats.subscribers,
          followers: stats.subscribers,
          total_views: stats.total_views,
          total_posts: stats.total_posts,
        });
        
        console.log(`✅ ${creator.display_name}: ${(stats.subscribers / 1000000).toFixed(1)}M subs, ${(stats.total_views / 1000000000).toFixed(2)}B views`);
      } else if (creator.platform === 'twitch') {
        stats = await fetchTwitchStats(creator.username);
        
        await supabase.from('creator_stats').insert({
          creator_id: creator.id,
          recorded_at: new Date().toISOString().split('T')[0],
          subscribers: stats.followers,
          followers: stats.followers,
          total_views: stats.total_views,
          total_posts: stats.total_posts,
        });
        
        console.log(`✅ ${creator.display_name}: ${(stats.followers / 1000000).toFixed(1)}M followers, ${(stats.total_views / 1000000).toFixed(1)}M views`);
      }
      
      successCount++;
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ ${creator.display_name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Collection complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${creators.length}`);
}

collectDailyStats().catch(console.error);
