import { withErrorHandling } from '../lib/errorHandler';

const API_BASE = '/api/kick';

/**
 * Search for Kick channels
 */
export const searchChannels = withErrorHandling(
  async (query, maxResults = 25) => {
    const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&maxResults=${maxResults}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search Kick channels');
    }

    const { data } = await response.json();
    return data;
  },
  'kickService.searchChannels'
);

/**
 * Get Kick channel by username/slug
 */
export const getChannelByUsername = withErrorHandling(
  async (username) => {
    const response = await fetch(`${API_BASE}?action=channel&username=${encodeURIComponent(username)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Kick channel');
    }

    const { data } = await response.json();
    return data;
  },
  'kickService.getChannelByUsername'
);

/**
 * Check which Kick streamers are live
 * @param {string[]} usernames - Array of Kick usernames/slugs
 * @returns {Promise<Object[]>} - Array of live stream info
 */
export const getLiveStreams = withErrorHandling(
  async (usernames) => {
    if (!usernames || usernames.length === 0) return [];

    const response = await fetch(`${API_BASE}?action=streams&usernames=${encodeURIComponent(usernames.join(','))}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get live streams');
    }

    const { data } = await response.json();
    return data;
  },
  'kickService.getLiveStreams'
);
