// Vercel Serverless Function for Twitch API
// Keeps client secret secure on server-side

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error(`Missing credentials: CLIENT_ID=${!!TWITCH_CLIENT_ID}, SECRET=${!!TWITCH_CLIENT_SECRET}`);
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
  cachedToken = data.access_token;
  // Set expiry 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

async function searchChannels(query) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=10`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Twitch channels');
  }

  const data = await response.json();
  return data.data.map(transformChannel);
}

async function getChannelByUsername(username) {
  const token = await getAccessToken();

  // Get user info
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

  // Get follower count
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

  // Get channel info (for game/category)
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
    broadcasterType: user.broadcaster_type, // '', 'affiliate', 'partner'
  };
}

function transformChannel(channel) {
  return {
    platform: 'twitch',
    platformId: channel.id,
    username: channel.broadcaster_login,
    displayName: channel.display_name,
    profileImage: channel.thumbnail_url,
    isLive: channel.is_live,
    category: channel.game_name,
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, query, username } = req.query;

  try {
    if (action === 'search' && query) {
      const results = await searchChannels(query);
      return res.status(200).json({ data: results });
    }

    if (action === 'channel' && username) {
      const channel = await getChannelByUsername(username);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      return res.status(200).json({ data: channel });
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=search&query=... or ?action=channel&username=...' });
  } catch (error) {
    console.error('Twitch API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
