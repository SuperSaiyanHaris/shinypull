// Vercel Serverless Function for Spotify Web API
// Keeps client credentials secure on server-side

import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error(`Missing Spotify credentials: ID=${!!SPOTIFY_CLIENT_ID}, SECRET=${!!SPOTIFY_CLIENT_SECRET}`);
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Spotify token: ${response.status} - ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken;
}

async function searchArtists(query, limit = 25) {
  const token = await getAccessToken();
  const clampedLimit = Math.max(1, Math.min(50, limit));
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${clampedLimit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Spotify search failed: ${res.status}`);
  const data = await res.json();
  return data.artists?.items || [];
}

async function getArtist(id) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify artist fetch failed: ${res.status}`);
  return res.json();
}

async function getArtistsBatch(ids) {
  if (!ids || ids.length === 0) return [];
  const token = await getAccessToken();
  // Spotify supports up to 50 IDs per request
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50));
  }
  const results = [];
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Spotify batch fetch failed: ${res.status}`);
    const data = await res.json();
    results.push(...(data.artists || []));
  }
  return results.filter(Boolean);
}

export default async function handler(req, res) {
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`spotify:${clientId}`, 60, 60000);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { action, query, id, ids, limit } = req.query;

  try {
    if (action === 'search' && query) {
      const results = await searchArtists(query, limit ? parseInt(limit, 10) : 25);
      return res.status(200).json({ data: results });
    }

    if (action === 'artist' && id) {
      const artist = await getArtist(id);
      if (!artist) return res.status(404).json({ error: 'Artist not found' });
      return res.status(200).json({ data: artist });
    }

    if (action === 'batch' && ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
      const artists = await getArtistsBatch(idList);
      return res.status(200).json({ data: artists });
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=search&query=..., ?action=artist&id=..., or ?action=batch&ids=...' });
  } catch (error) {
    console.error('Spotify API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
