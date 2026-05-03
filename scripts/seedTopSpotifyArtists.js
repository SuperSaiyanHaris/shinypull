import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Genre seeds — wide net to capture 1000+ top artists
const GENRE_SEEDS = [
  'pop', 'hip-hop', 'r-n-b', 'latin', 'rock', 'electronic',
  'country', 'k-pop', 'reggaeton', 'dance', 'soul', 'metal',
  'indie', 'afrobeats', 'classical',
];

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken;
}

async function searchArtists(query, offset = 0) {
  const token = await getToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=50&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  const data = await res.json();
  return data.artists?.items || [];
}

function slugifyArtist(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function seed() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    process.exit(1);
  }

  console.log('🎵 Seeding top Spotify artists...\n');

  const allArtists = new Map(); // Spotify ID → artist object

  // Collect artists from all genre seeds
  for (const genre of GENRE_SEEDS) {
    console.log(`Searching genre: ${genre}`);
    try {
      // Two pages = 100 artists per genre, yields ~1500 total before dedup
      for (const offset of [0, 50]) {
        const artists = await searchArtists(`genre:${genre}`, offset);
        for (const a of artists) {
          if (a && a.id && a.followers?.total > 50000) {
            allArtists.set(a.id, a);
          }
        }
        await sleep(300);
      }
    } catch (err) {
      console.warn(`  ⚠️  ${genre}: ${err.message}`);
    }
  }

  // Sort by followers desc, take top 1000
  const sorted = [...allArtists.values()]
    .sort((a, b) => (b.followers?.total || 0) - (a.followers?.total || 0))
    .slice(0, 1000);

  console.log(`\n📊 Found ${allArtists.size} unique artists, seeding top ${sorted.length}\n`);

  const today = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3');

  // Use proper ISO date
  const todayISO = new Date().toISOString().split('T')[0];

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const artist of sorted) {
    const slug = slugifyArtist(artist.name);
    const followers = artist.followers?.total || 0;
    const popularity = artist.popularity || 0;
    const genres = artist.genres || [];
    const profileImage = artist.images?.[0]?.url || null;
    const externalUrl = artist.external_urls?.spotify || null;

    const creatorRecord = {
      platform: 'spotify',
      platform_id: artist.id,
      username: slug,
      display_name: artist.name,
      profile_image: profileImage,
      description: genres.slice(0, 3).join(', ') || null,
      category: genres[0] || null,
    };

    try {
      // Upsert creator
      const { data: upserted, error: upsertErr } = await supabase
        .from('creators')
        .upsert(creatorRecord, { onConflict: 'platform,platform_id' })
        .select('id')
        .single();

      if (upsertErr) {
        console.error(`  ❌ ${artist.name}: ${upsertErr.message}`);
        errors++;
        continue;
      }

      // Insert today's stats only if followers > 0
      if (followers > 0) {
        const { error: statsErr } = await supabase
          .from('creator_stats')
          .upsert({
            creator_id: upserted.id,
            recorded_at: todayISO,
            subscribers: followers,
            followers: followers,
            total_views: popularity,
            total_posts: null,
          }, { onConflict: 'creator_id,recorded_at' });

        if (statsErr) {
          console.warn(`  ⚠️  Stats for ${artist.name}: ${statsErr.message}`);
        }
      }

      inserted++;
      if (inserted % 50 === 0) {
        console.log(`  Progress: ${inserted}/${sorted.length} (${artist.name} — ${followers.toLocaleString()} followers)`);
      }
    } catch (err) {
      console.error(`  ❌ ${artist.name}: ${err.message}`);
      errors++;
    }

    // Be kind to Supabase
    await sleep(20);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Seeded: ${inserted}`);
  console.log(`   Errors: ${errors}`);
}

seed().catch(console.error);
