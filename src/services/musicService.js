// Last.fm music artist service
// Platform identifier: 'music'

function slugifyArtist(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function getBestImage(images) {
  if (!images || !images.length) return null;
  const priority = ['extralarge', 'mega', 'large', 'medium', 'small'];
  for (const size of priority) {
    const img = images.find(i => i.size === size);
    if (img?.['#text']) return img['#text'];
  }
  return null;
}

function normalizeArtist(raw) {
  const name = raw.name || '';
  const listeners = parseInt(raw.stats?.listeners || raw.listeners || 0);
  const playcount = parseInt(raw.stats?.playcount || raw.playcount || 0);
  const tags = raw.tags?.tag || [];
  const tagNames = Array.isArray(tags) ? tags.slice(0, 3).map(t => t.name) : (tags.name ? [tags.name] : []);

  return {
    platform: 'music',
    platformId: raw.mbid || slugifyArtist(name),
    username: slugifyArtist(name),
    displayName: name,
    profileImage: getBestImage(raw.image),
    description: tagNames.join(', ') || null,
    category: tagNames[0] || null,
    listeners,
    subscribers: listeners,
    followers: listeners,
    totalViews: playcount,
    totalPosts: null,
    genres: tagNames,
    externalUrl: raw.url || `https://www.last.fm/music/${encodeURIComponent(name)}`,
  };
}

const BASE = '/api/lastfm';

export async function searchArtists(query, limit = 10) {
  const res = await fetch(`${BASE}?action=search&query=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error('Music search failed');
  const json = await res.json();
  return (json.data || []).map(normalizeArtist);
}

export async function getArtistByName(name) {
  const res = await fetch(`${BASE}?action=artist&artist=${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ? normalizeArtist(json.data) : null;
}

export async function getArtistByMbid(mbid) {
  const res = await fetch(`${BASE}?action=artist&mbid=${encodeURIComponent(mbid)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ? normalizeArtist(json.data) : null;
}
