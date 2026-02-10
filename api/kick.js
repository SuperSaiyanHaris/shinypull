// Vercel Serverless Function for Kick API
// Keeps client secret secure on server-side

const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const KICK_API_BASE = 'https://api.kick.com/public/v1';
const KICK_AUTH_URL = 'https://id.kick.com/oauth/token';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    throw new Error(`Missing Kick credentials: CLIENT_ID=${!!KICK_CLIENT_ID}, SECRET=${!!KICK_CLIENT_SECRET}`);
  }

  const response = await fetch(KICK_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Kick access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Set expiry 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken;
}

async function kickFetch(endpoint) {
  const token = await getAccessToken();
  const response = await fetch(`${KICK_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kick API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function getChannelBySlug(slug) {
  // Get channel info by slug
  const channelData = await kickFetch(`/channels?slug=${encodeURIComponent(slug)}`);
  const channels = channelData.data || [];

  if (channels.length === 0) {
    return null;
  }

  const channel = channels[0];

  // Get user info for profile picture
  let profileImage = channel.banner_picture || null;
  try {
    const userData = await kickFetch(`/users?id=${channel.broadcaster_user_id}`);
    const users = userData.data || [];
    if (users.length > 0) {
      profileImage = users[0].profile_picture || profileImage;
    }
  } catch {
    // Use banner as fallback
  }

  return {
    platform: 'kick',
    platformId: String(channel.broadcaster_user_id),
    username: channel.slug,
    displayName: channel.slug,
    profileImage,
    description: channel.channel_description || '',
    category: channel.category?.name || null,
    subscribers: channel.active_subscribers_count || 0,
    isLive: channel.stream?.is_live || false,
    viewerCount: channel.stream?.viewer_count || 0,
    streamTitle: channel.stream?.stream_title || null,
  };
}

async function searchChannels(query, maxResults = 25) {
  // Kick API doesn't have a search endpoint, so we try to find by slug
  // For search, we attempt a direct slug lookup
  const slug = query.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const channel = await getChannelBySlug(slug);
  if (channel) {
    return [channel];
  }
  return [];
}

async function getLiveStreams(slugs) {
  if (!slugs || slugs.length === 0) return [];

  const token = await getAccessToken();

  // Kick livestreams endpoint uses broadcaster_user_id, but we can also check channels by slug
  // Batch up to 50 slugs per request
  const batchSize = 50;
  const allLive = [];

  for (let i = 0; i < slugs.length; i += batchSize) {
    const batch = slugs.slice(i, i + batchSize);
    const slugParams = batch.map(s => `slug=${encodeURIComponent(s)}`).join('&');

    try {
      const channelData = await kickFetch(`/channels?${slugParams}`);
      const channels = channelData.data || [];

      for (const channel of channels) {
        if (channel.stream?.is_live) {
          allLive.push({
            username: channel.slug,
            displayName: channel.slug,
            title: channel.stream.stream_title || '',
            gameName: channel.category?.name || '',
            viewerCount: channel.stream.viewer_count || 0,
            thumbnailUrl: channel.stream.thumbnail || '',
            startedAt: channel.stream.start_time || '',
          });
        }
      }
    } catch {
      // Continue with next batch
    }
  }

  return allLive;
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

  const { action, query, username, maxResults } = req.query;

  try {
    if (action === 'search' && query) {
      const results = await searchChannels(query, maxResults ? parseInt(maxResults, 10) : 25);
      return res.status(200).json({ data: results });
    }

    if (action === 'channel' && username) {
      const channel = await getChannelBySlug(username);
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      return res.status(200).json({ data: channel });
    }

    if (action === 'streams') {
      const { usernames } = req.query;
      if (!usernames) {
        return res.status(400).json({ error: 'Missing usernames parameter' });
      }
      const usernameList = usernames.split(',').map(u => u.trim()).filter(Boolean);
      const streams = await getLiveStreams(usernameList);
      return res.status(200).json({ data: streams });
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=search&query=..., ?action=channel&username=..., or ?action=streams&usernames=...' });
  } catch (error) {
    console.error('Kick API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
