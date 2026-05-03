/**
 * Spotify Web API integration (proxied through /api/spotify)
 * Artist data: followers, popularity (0-100), genres
 */

const API_BASE = '/api/spotify';

export async function getArtistById(artistId) {
  const res = await fetch(`${API_BASE}?action=artist&id=${encodeURIComponent(artistId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const { data } = await res.json();
  return data ? normalizeArtist(data) : null;
}

export async function searchArtists(query, limit = 25) {
  const res = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error(`Spotify search error: ${res.status}`);
  const { data } = await res.json();
  return (data || []).map(normalizeArtist);
}

// Used by collectDailyStats — calls backend which handles batching up to 50
export async function getArtistsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const res = await fetch(`${API_BASE}?action=batch&ids=${ids.join(',')}`);
  if (!res.ok) throw new Error(`Spotify batch error: ${res.status}`);
  const { data } = await res.json();
  return (data || []).filter(Boolean).map(normalizeArtist);
}

// Alias used by Search page (matches pattern of other platform services)
export async function getChannelByUsername(artistId) {
  return getArtistById(artistId);
}

export function slugifyArtist(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function normalizeArtist(raw) {
  const followers = raw.followers?.total ?? 0;
  const popularity = raw.popularity ?? 0;
  return {
    platform: 'spotify',
    platformId: raw.id,
    username: slugifyArtist(raw.name),
    displayName: raw.name,
    profileImage: raw.images?.[0]?.url || null,
    description: raw.genres?.slice(0, 3).join(', ') || null,
    followers,
    subscribers: followers,
    popularity,
    totalViews: popularity,
    totalPosts: null,
    genres: raw.genres || [],
    externalUrl: raw.external_urls?.spotify || null,
  };
}
