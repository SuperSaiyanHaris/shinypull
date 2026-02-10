/**
 * Discover Kick Creators
 *
 * Automatically discovers and adds new Kick streamers to the database.
 * Pulls from currently live streams on Kick.
 *
 * Usage: npm run discover:kick
 *
 * Runs daily via GitHub Action to gradually build up the creator database.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const MIN_VIEWERS = 100; // Only add streamers with 100+ concurrent viewers
const MAX_STREAMERS_PER_RUN = 50; // Limit per run

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const KICK_API_BASE = 'https://api.kick.com/public/v1';
const KICK_AUTH_URL = 'https://id.kick.com/oauth/token';

let kickAccessToken = null;

/**
 * Get today's date for logging
 */
function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Get Kick OAuth token
 */
async function getKickAccessToken() {
  if (kickAccessToken) return kickAccessToken;

  const response = await fetch(KICK_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Kick auth failed: ${JSON.stringify(data)}`);
  }
  kickAccessToken = data.access_token;
  return kickAccessToken;
}

/**
 * Make authenticated Kick API request
 */
async function kickFetch(endpoint) {
  const token = await getKickAccessToken();
  const response = await fetch(`${KICK_API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kick API error (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Get currently live streams on Kick
 */
async function getLiveStreams(limit = 100) {
  const data = await kickFetch(`/livestreams?limit=${limit}`);
  return data.data || [];
}

/**
 * Get channel details for multiple slugs
 */
async function getChannelDetails(slugs) {
  if (slugs.length === 0) return [];
  
  const slugParams = slugs.map(s => `slug=${encodeURIComponent(s)}`).join('&');
  const data = await kickFetch(`/channels?${slugParams}`);
  return data.data || [];
}

/**
 * Get existing Kick user IDs from database
 */
async function getExistingUserIds() {
  const { data, error } = await supabase
    .from('creators')
    .select('platform_id')
    .eq('platform', 'kick');

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return new Set(data.map(c => c.platform_id));
}

/**
 * Add a creator to the database
 */
async function addCreator(creator) {
  const { data, error } = await supabase
    .from('creators')
    .insert(creator)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return null; // Duplicate
    throw error;
  }

  return data;
}

/**
 * Add initial stats for a creator
 */
async function addInitialStats(creatorId, paidSubs) {
  const { error } = await supabase
    .from('creator_stats')
    .insert({
      creator_id: creatorId,
      recorded_at: getTodayLocal(),
      subscribers: paidSubs,
      followers: paidSubs, // Store paid subs in both fields for Kick
      total_views: 0,
      total_posts: 0,
    });

  if (error && error.code !== '23505') {
    console.error(`   Failed to add stats: ${error.message}`);
  }
}

/**
 * Main discovery function
 */
async function discoverCreators() {
  console.log(`\n🟢 Kick Creator Discovery - ${getTodayLocal()}\n`);

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    throw new Error('Kick credentials not configured');
  }

  // Get existing streamers to avoid duplicates
  console.log('📊 Loading existing creators...');
  const existingIds = await getExistingUserIds();
  console.log(`   Found ${existingIds.size} existing Kick creators\n`);

  // Get currently live streams
  console.log('📺 Fetching live streams...');
  const liveStreams = await getLiveStreams(100);
  console.log(`   Found ${liveStreams.length} live streams\n`);

  // Filter by viewer count and new streamers only
  const qualifiedStreams = liveStreams
    .filter(stream => stream.viewer_count >= MIN_VIEWERS)
    .filter(stream => !existingIds.has(String(stream.broadcaster_user_id)))
    .sort((a, b) => b.viewer_count - a.viewer_count);

  console.log(`🎯 ${qualifiedStreams.length} streams meet minimum ${MIN_VIEWERS} viewer threshold\n`);

  if (qualifiedStreams.length === 0) {
    console.log('✅ No new streamers to add today!\n');
    return { discovered: liveStreams.length, added: 0 };
  }

  // Limit to max per run
  const streamsToAdd = qualifiedStreams.slice(0, MAX_STREAMERS_PER_RUN);
  
  // Get channel details for these streams
  console.log(`📥 Fetching channel details for ${streamsToAdd.length} streamers...\n`);
  const slugs = streamsToAdd.map(s => s.slug);
  const channels = await getChannelDetails(slugs);
  
  // Create a map for easy lookup
  const channelMap = new Map(channels.map(ch => [ch.slug, ch]));

  // Add streamers to database
  let added = 0;
  console.log('➕ Adding creators to database...\n');

  for (const stream of streamsToAdd) {
    try {
      const channel = channelMap.get(stream.slug);
      
      if (!channel) {
        console.log(`   ⏭️  ${stream.slug}: Channel data not found`);
        continue;
      }

      const creatorData = {
        platform: 'kick',
        platform_id: String(channel.broadcaster_user_id),
        username: channel.slug,
        display_name: stream.slug, // Use slug as display name
        profile_image: stream.profile_picture || null,
        description: channel.channel_description?.substring(0, 500) || null,
        country: null,
        category: channel.category?.name || null,
      };

      const creator = await addCreator(creatorData);

      if (creator) {
        const paidSubs = channel.active_subscribers_count || 0;
        await addInitialStats(creator.id, paidSubs);
        added++;
        console.log(`   ✅ ${stream.slug} (${stream.viewer_count.toLocaleString()} viewers, ${paidSubs} paid subs)`);
      } else {
        console.log(`   ⏭️  ${stream.slug} (already exists)`);
      }
    } catch (error) {
      console.error(`   ❌ ${stream.slug}: ${error.message}`);
    }

    // Small delay between inserts
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✨ Discovery complete! Added ${added} new creators.\n`);

  return { discovered: liveStreams.length, added };
}

// Run discovery
discoverCreators()
  .then(({ discovered, added }) => {
    console.log(`📊 Summary: Discovered ${discovered} live streams, Added ${added} new creators`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Discovery failed:', error.message);
    process.exit(1);
  });
