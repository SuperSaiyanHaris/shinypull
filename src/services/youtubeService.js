const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for YouTube channels by query
 */
export async function searchChannels(query, maxResults = 10) {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'channel',
    q: query,
    maxResults: maxResults.toString(),
    key: API_KEY,
  });

  const response = await fetch(`${BASE_URL}/search?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to search channels');
  }

  const data = await response.json();

  // Get channel IDs to fetch full statistics
  const channelIds = data.items.map(item => item.id.channelId);

  if (channelIds.length === 0) {
    return [];
  }

  // Fetch full channel details with statistics
  return getChannelsByIds(channelIds);
}

/**
 * Get channel details by channel IDs
 */
export async function getChannelsByIds(channelIds) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelIds.join(','),
    key: API_KEY,
  });

  const response = await fetch(`${BASE_URL}/channels?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch channels');
  }

  const data = await response.json();

  return data.items.map(transformChannel);
}

/**
 * Get a single channel by username (handle)
 */
export async function getChannelByUsername(username) {
  // Remove @ if present
  const handle = username.startsWith('@') ? username.slice(1) : username;

  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    forHandle: handle,
    key: API_KEY,
  });

  const response = await fetch(`${BASE_URL}/channels?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch channel');
  }

  const data = await response.json();

  if (data.items?.length === 0) {
    return null;
  }

  return transformChannel(data.items[0]);
}

/**
 * Get a single channel by ID
 */
export async function getChannelById(channelId) {
  const channels = await getChannelsByIds([channelId]);
  return channels[0] || null;
}

/**
 * Transform YouTube API response to our format
 */
function transformChannel(channel) {
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
    category: null, // YouTube doesn't expose this easily

    // Statistics
    subscribers: parseInt(statistics.subscriberCount) || 0,
    totalViews: parseInt(statistics.viewCount) || 0,
    totalPosts: parseInt(statistics.videoCount) || 0,
    hiddenSubscribers: statistics.hiddenSubscriberCount || false,

    // Metadata
    createdAt: snippet.publishedAt,
    bannerImage: channel.brandingSettings?.image?.bannerExternalUrl || null,
  };
}

/**
 * Format subscriber count for display (handles YouTube's rounding)
 */
export function formatCount(count) {
  if (!count) return '0';
  if (count >= 1000000000) return (count / 1000000000).toFixed(2) + 'B';
  if (count >= 1000000) return (count / 1000000).toFixed(2) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toLocaleString();
}
