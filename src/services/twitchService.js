import { withErrorHandling, NotFoundError } from '../lib/errorHandler';

const API_BASE = '/api/twitch';

/**
 * Search for Twitch channels
 */
export const searchChannels = withErrorHandling(
  async (query, maxResults = 25) => {
    const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&maxResults=${maxResults}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search Twitch channels');
    }

    const { data } = await response.json();
    return data;
  },
  'twitchService.searchChannels'
);

/**
 * Get Twitch channel by username
 */
export const getChannelByUsername = withErrorHandling(
  async (username) => {
    const response = await fetch(`${API_BASE}?action=channel&username=${encodeURIComponent(username)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Twitch channel');
    }

    const { data } = await response.json();
    return data;
  },
  'twitchService.getChannelByUsername'
);
