// Use backend proxy for YouTube API to keep API key secure
import { withErrorHandling, NotFoundError } from '../lib/errorHandler';

const API_URL = '/api/youtube';

/**
 * Search for YouTube channels by query
 */
export const searchChannels = withErrorHandling(
  async (query, maxResults = 25) => {
    const response = await fetch(
      `${API_URL}?action=search&query=${encodeURIComponent(query)}&maxResults=${maxResults}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search channels');
    }

    return await response.json();
  },
  'youtubeService.searchChannels'
);

/**
 * Get a single channel by username (handle)
 */
export const getChannelByUsername = withErrorHandling(
  async (username) => {
    const response = await fetch(
      `${API_URL}?action=getChannelByUsername&username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('YouTube channel', username);
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch channel');
    }

    return await response.json();
  },
  'youtubeService.getChannelByUsername'
);

/**
 * Get a single channel by ID
 */
export const getChannelById = withErrorHandling(
  async (channelId) => {
    const response = await fetch(
      `${API_URL}?action=getChannel&id=${encodeURIComponent(channelId)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('YouTube channel', channelId);
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch channel');
    }

    return await response.json();
  },
  'youtubeService.getChannelById'
);

/**
 * Get the latest video for a channel
 */
export const getLatestVideo = async (channelId) => {
  try {
    const response = await fetch(
      `${API_URL}?action=getLatestVideo&channelId=${encodeURIComponent(channelId)}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

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
