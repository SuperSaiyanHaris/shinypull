/**
 * Twitch Stream Monitor
 *
 * This script monitors live Twitch streams and records viewer samples
 * to calculate accurate "hours watched" metrics.
 *
 * Should run every 5 minutes via GitHub Actions or cron job.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TWITCH_CLIENT_ID = process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET;

const BATCH_SIZE = 100; // Twitch allows up to 100 user IDs per request

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

let twitchAccessToken = null;

async function getTwitchAccessToken() {
  if (twitchAccessToken) return twitchAccessToken;

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  twitchAccessToken = data.access_token;
  return twitchAccessToken;
}

/**
 * Fetch live streams for multiple user IDs
 */
async function fetchLiveStreams(userIds) {
  const token = await getTwitchAccessToken();

  const params = userIds.map(id => `user_id=${id}`).join('&');
  const response = await fetch(`https://api.twitch.tv/helix/streams?${params}&first=100`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data || [];
}

/**
 * Process array in chunks
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Calculate hours watched and finalize a stream session
 */
async function finalizeStreamSession(sessionId) {
  // Get all viewer samples for this session
  const { data: samples } = await supabase
    .from('viewer_samples')
    .select('viewer_count, recorded_at')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: true });

  if (!samples || samples.length < 2) {
    return;
  }

  // Calculate average viewers
  const totalViewers = samples.reduce((sum, s) => sum + s.viewer_count, 0);
  const avgViewers = Math.round(totalViewers / samples.length);
  const peakViewers = Math.max(...samples.map(s => s.viewer_count));

  // Calculate duration in hours
  const startTime = new Date(samples[0].recorded_at);
  const endTime = new Date(samples[samples.length - 1].recorded_at);
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  // Hours watched = avg viewers × duration
  const hoursWatched = avgViewers * durationHours;

  // Update session with final stats
  await supabase
    .from('stream_sessions')
    .update({
      ended_at: endTime.toISOString(),
      avg_viewers: avgViewers,
      peak_viewers: peakViewers,
      hours_watched: hoursWatched,
    })
    .eq('id', sessionId);

  return { avgViewers, peakViewers, hoursWatched, durationHours };
}

async function monitorStreams() {
  console.log('🎮 Starting Twitch stream monitoring...');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  // Check credentials
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.error('❌ Twitch credentials not configured');
    return;
  }

  // Get all Twitch creators from database
  const { data: creators, error: fetchError } = await supabase
    .from('creators')
    .select('id, platform_id, username, display_name')
    .eq('platform', 'twitch');

  if (fetchError) {
    console.error('❌ Error fetching creators:', fetchError.message);
    return;
  }

  console.log(`📊 Monitoring ${creators.length} Twitch creators\n`);

  // Get currently active sessions (streams we're tracking that haven't ended)
  const { data: activeSessions } = await supabase
    .from('stream_sessions')
    .select('id, creator_id, stream_id')
    .is('ended_at', null);

  const activeSessionMap = new Map();
  (activeSessions || []).forEach(s => {
    activeSessionMap.set(s.creator_id, s);
  });

  // Fetch live streams in batches
  const creatorBatches = chunk(creators, BATCH_SIZE);
  const liveStreamMap = new Map();

  for (const batch of creatorBatches) {
    const platformIds = batch.map(c => c.platform_id);
    const liveStreams = await fetchLiveStreams(platformIds);

    liveStreams.forEach(stream => {
      liveStreamMap.set(stream.user_id, stream);
    });

    // Small delay between batches
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`🔴 Found ${liveStreamMap.size} live streams\n`);

  let samplesRecorded = 0;
  let sessionsStarted = 0;
  let sessionsEnded = 0;

  for (const creator of creators) {
    const liveStream = liveStreamMap.get(creator.platform_id);
    const activeSession = activeSessionMap.get(creator.id);

    if (liveStream) {
      // Creator is live
      let sessionId = activeSession?.id;

      // Check if this is a new stream (different stream_id)
      if (activeSession && activeSession.stream_id !== liveStream.id) {
        // Previous stream ended, finalize it
        console.log(`   ⏹️  ${creator.display_name}: Previous stream ended`);
        await finalizeStreamSession(activeSession.id);
        sessionsEnded++;
        sessionId = null;
      }

      // Start new session if needed
      if (!sessionId) {
        const { data: newSession } = await supabase
          .from('stream_sessions')
          .insert({
            creator_id: creator.id,
            stream_id: liveStream.id,
            started_at: liveStream.started_at,
            game_name: liveStream.game_name,
            title: liveStream.title,
            peak_viewers: liveStream.viewer_count,
          })
          .select()
          .single();

        sessionId = newSession?.id;
        sessionsStarted++;
        console.log(`   🟢 ${creator.display_name}: Stream started (${liveStream.viewer_count.toLocaleString()} viewers)`);
      }

      // Record viewer sample
      if (sessionId) {
        await supabase.from('viewer_samples').insert({
          session_id: sessionId,
          viewer_count: liveStream.viewer_count,
          game_name: liveStream.game_name,
        });

        // Update peak viewers if higher
        if (activeSession && liveStream.viewer_count > (activeSession.peak_viewers || 0)) {
          await supabase
            .from('stream_sessions')
            .update({ peak_viewers: liveStream.viewer_count })
            .eq('id', sessionId);
        }

        samplesRecorded++;
        console.log(`   📊 ${creator.display_name}: ${liveStream.viewer_count.toLocaleString()} viewers`);
      }
    } else if (activeSession) {
      // Creator is not live but has active session - stream ended
      console.log(`   ⏹️  ${creator.display_name}: Stream ended`);
      const stats = await finalizeStreamSession(activeSession.id);
      if (stats) {
        console.log(`      └─ ${stats.durationHours.toFixed(1)}h, ${stats.avgViewers.toLocaleString()} avg, ${stats.hoursWatched.toFixed(0)} hours watched`);
      }
      sessionsEnded++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Monitoring complete!');
  console.log(`   🟢 Sessions started: ${sessionsStarted}`);
  console.log(`   ⏹️  Sessions ended: ${sessionsEnded}`);
  console.log(`   📊 Samples recorded: ${samplesRecorded}`);
}

monitorStreams().catch(console.error);
