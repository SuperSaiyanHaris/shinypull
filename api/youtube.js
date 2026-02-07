// Vercel Serverless Function for YouTube API
// Keeps API key secure on server-side

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search for YouTube channels
 */
async function searchChannels(query, maxResults = 25) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('Missing YouTube API key');
  }

  // Clamp maxResults between 1 and 50 (YouTube API limit)
  const limit = Math.max(1, Math.min(50, maxResults));

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${limit}&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return data.items.map(item => ({
    platform: 'youtube',
    platformId: item.snippet.channelId,
    id: item.snippet.channelId,
    username: item.snippet.channelTitle,
    displayName: item.snippet.channelTitle,
    profileImage: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    description: item.snippet.description,
  }));
}

/**
 * Get channel details by ID
 */
async function getChannel(channelId) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('Missing YouTube API key');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?` +
    `part=snippet,statistics,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }

  const channel = data.items[0];
  const snippet = channel.snippet;
  const statistics = channel.statistics;
  const branding = channel.brandingSettings;

  return {
    platform: 'youtube',
    platformId: channel.id,
    id: channel.id,
    username: snippet.customUrl?.replace('@', '') || snippet.title.toLowerCase().replace(/\s+/g, ''),
    displayName: snippet.title,
    profileImage: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
    bannerImage: branding?.image?.bannerExternalUrl,
    description: snippet.description,
    country: snippet.country,
    category: null,
    subscribers: parseInt(statistics.subscriberCount || 0),
    totalViews: parseInt(statistics.viewCount || 0),
    totalPosts: parseInt(statistics.videoCount || 0),
    hiddenSubscribers: statistics.hiddenSubscriberCount || false,
    createdAt: snippet.publishedAt,
  };
}

/**
 * Get channel by username
 */
async function getChannelByUsername(username) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('Missing YouTube API key');
  }

  // Try with forHandle (new method for @handles)
  const handleUsername = username.startsWith('@') ? username : `@${username}`;
  let response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?` +
    `part=snippet,statistics,brandingSettings&forHandle=${encodeURIComponent(handleUsername.slice(1))}&key=${YOUTUBE_API_KEY}`
  );

  if (response.ok) {
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      const snippet = channel.snippet;
      const statistics = channel.statistics;
      const branding = channel.brandingSettings;

      return {
        platform: 'youtube',
        platformId: channel.id,
        id: channel.id,
        username: snippet.customUrl?.replace('@', '') || snippet.title.toLowerCase().replace(/\s+/g, ''),
        displayName: snippet.title,
        profileImage: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
        bannerImage: branding?.image?.bannerExternalUrl,
        description: snippet.description,
        country: snippet.country,
        category: null,
        subscribers: parseInt(statistics.subscriberCount || 0),
        totalViews: parseInt(statistics.viewCount || 0),
        totalPosts: parseInt(statistics.videoCount || 0),
        hiddenSubscribers: statistics.hiddenSubscriberCount || false,
        createdAt: snippet.publishedAt,
      };
    }
  }

  // Fallback: search for channel
  const searchResults = await searchChannels(username);
  if (searchResults.length === 0) {
    throw new Error('Channel not found');
  }

  // Get full details of the first result
  return await getChannel(searchResults[0].id);
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, id, username, query, maxResults } = req.query;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    let result;

    switch (action) {
      case 'search':
        if (!query) {
          return res.status(400).json({ error: 'Missing query parameter' });
        }
        result = await searchChannels(query, maxResults ? parseInt(maxResults, 10) : 25);
        break;

      case 'getChannel':
        if (!id) {
          return res.status(400).json({ error: 'Missing id parameter' });
        }
        result = await getChannel(id);
        break;

      case 'getChannelByUsername':
        if (!username) {
          return res.status(400).json({ error: 'Missing username parameter' });
        }
        result = await getChannelByUsername(username);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('YouTube API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
