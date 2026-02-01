const API_BASE = '/api/twitch';

/**
 * Search for Twitch channels
 */
export async function searchChannels(query) {
  const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search Twitch channels');
  }

  const { data } = await response.json();
  return data;
}

/**
 * Get Twitch channel by username
 */
export async function getChannelByUsername(username) {
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
}
