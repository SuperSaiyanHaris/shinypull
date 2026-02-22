/**
 * Bluesky AT Protocol integration
 * Uses the fully public API — no authentication required
 * Base: https://public.api.bsky.app/xrpc/
 */

const BASE_URL = 'https://public.api.bsky.app/xrpc';

/**
 * Fetch a single Bluesky profile by handle or DID
 * @param {string} handle - e.g. "mosseri.bsky.social" or "did:plc:..."
 */
export async function getBlueskyProfile(handle) {
  const url = `${BASE_URL}/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`;
  const response = await fetch(url);

  if (response.status === 400 || response.status === 404) {
    return null; // Profile not found
  }

  if (!response.ok) {
    throw new Error(`Bluesky API error: HTTP ${response.status} for ${handle}`);
  }

  const data = await response.json();
  return normalizeProfile(data);
}

/**
 * Search Bluesky creators by query string
 * @param {string} query
 * @param {number} limit
 */
export async function searchBluesky(query, limit = 25) {
  const url = `${BASE_URL}/app.bsky.actor.searchActors?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Bluesky search error: HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.actors || []).map(normalizeProfile);
}

/**
 * Batch fetch up to 25 Bluesky profiles by handles
 * Used by scripts/collectDailyStats.js
 * @param {string[]} handles - array of handles or DIDs
 */
export async function getBlueskyProfiles(handles) {
  if (!handles || handles.length === 0) return [];

  const params = handles.map(h => `actors=${encodeURIComponent(h)}`).join('&');
  const url = `${BASE_URL}/app.bsky.actor.getProfiles?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Bluesky batch fetch error: HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data.profiles || []).map(normalizeProfile);
}

/**
 * Normalize a raw AT Protocol actor/profile object to our standard shape
 */
function normalizeProfile(actor) {
  return {
    platform: 'bluesky',
    platformId: actor.did,
    username: actor.handle,
    displayName: actor.displayName || actor.handle,
    profileImage: actor.avatar || null,
    description: actor.description || null,
    followers: actor.followersCount ?? 0,
    following: actor.followsCount ?? 0,
    totalPosts: actor.postsCount ?? 0,
    isVerified: false, // Bluesky doesn't have verification
    category: null,
  };
}
