/**
 * Aggregate Hours Watched
 *
 * This script aggregates stream session data into daily/weekly/monthly
 * hours watched metrics for each Twitch creator.
 *
 * Should run daily after the stats collection job.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function aggregateHoursWatched() {
  console.log('📊 Aggregating hours watched metrics...');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate date ranges
  const dayAgo = new Date(today);
  dayAgo.setDate(dayAgo.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get all Twitch creators
  const { data: creators } = await supabase
    .from('creators')
    .select('id, username, display_name')
    .eq('platform', 'twitch');

  console.log(`Processing ${creators.length} Twitch creators...\n`);

  let updatedCount = 0;

  for (const creator of creators) {
    // Get completed stream sessions for different time periods
    const { data: daySessions } = await supabase
      .from('stream_sessions')
      .select('hours_watched, peak_viewers, avg_viewers')
      .eq('creator_id', creator.id)
      .gte('ended_at', dayAgo.toISOString())
      .not('ended_at', 'is', null);

    const { data: weekSessions } = await supabase
      .from('stream_sessions')
      .select('hours_watched, peak_viewers, avg_viewers')
      .eq('creator_id', creator.id)
      .gte('ended_at', weekAgo.toISOString())
      .not('ended_at', 'is', null);

    const { data: monthSessions } = await supabase
      .from('stream_sessions')
      .select('hours_watched, peak_viewers, avg_viewers')
      .eq('creator_id', creator.id)
      .gte('ended_at', monthAgo.toISOString())
      .not('ended_at', 'is', null);

    // Calculate aggregates
    const dayStats = aggregateSessions(daySessions || []);
    const weekStats = aggregateSessions(weekSessions || []);
    const monthStats = aggregateSessions(monthSessions || []);

    // Update today's stats record
    const { error } = await supabase
      .from('creator_stats')
      .update({
        hours_watched_day: dayStats.hoursWatched,
        hours_watched_week: weekStats.hoursWatched,
        hours_watched_month: monthStats.hoursWatched,
        peak_viewers_day: dayStats.peakViewers,
        avg_viewers_day: dayStats.avgViewers,
        streams_count_day: dayStats.streamCount,
      })
      .eq('creator_id', creator.id)
      .eq('recorded_at', todayStr);

    if (!error && monthStats.hoursWatched > 0) {
      console.log(`   ✅ ${creator.display_name}: ${monthStats.hoursWatched.toFixed(0)} hours watched (30d)`);
      updatedCount++;
    }
  }

  console.log(`\n📊 Updated ${updatedCount} creators with hours watched data`);
}

function aggregateSessions(sessions) {
  if (sessions.length === 0) {
    return {
      hoursWatched: 0,
      peakViewers: 0,
      avgViewers: 0,
      streamCount: 0,
    };
  }

  const hoursWatched = sessions.reduce((sum, s) => sum + (parseFloat(s.hours_watched) || 0), 0);
  const peakViewers = Math.max(...sessions.map(s => s.peak_viewers || 0));
  const totalAvgViewers = sessions.reduce((sum, s) => sum + (s.avg_viewers || 0), 0);
  const avgViewers = Math.round(totalAvgViewers / sessions.length);

  return {
    hoursWatched,
    peakViewers,
    avgViewers,
    streamCount: sessions.length,
  };
}

aggregateHoursWatched().catch(console.error);
