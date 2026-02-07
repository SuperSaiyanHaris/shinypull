/**
 * Aggregate Hours Watched
 *
 * This script aggregates stream session data into daily/weekly/monthly
 * hours watched metrics for each Twitch creator.
 *
 * Should run daily after the stats collection job.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

/**
 * Get today's date in America/New_York timezone (YYYY-MM-DD format)
 */
function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function aggregateHoursWatched() {
  console.log('📊 Aggregating hours watched metrics...');
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const today = new Date();
  const todayStr = getTodayLocal();
  
  // For daily snapshot: get streams that ended TODAY
  const todayStart = new Date(todayStr + 'T00:00:00');
  const todayEnd = new Date(todayStr + 'T23:59:59');

  // Calculate date ranges for rolling windows
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
    // Get streams that ended TODAY (for daily snapshot)
    const { data: todaySessions } = await supabase
      .from('stream_sessions')
      .select('hours_watched, peak_viewers, avg_viewers')
      .eq('creator_id', creator.id)
      .gte('ended_at', todayStart.toISOString())
      .lte('ended_at', todayEnd.toISOString())
      .not('ended_at', 'is', null);

    // Get completed stream sessions for different time periods (rolling windows)
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
    const todayStats = aggregateSessions(todaySessions || []);
    const dayStats = aggregateSessions(daySessions || []);
    const weekStats = aggregateSessions(weekSessions || []);
    const monthStats = aggregateSessions(monthSessions || []);

    // Upsert hours watched data (update if exists, insert if not)
    const { error } = await supabase
      .from('creator_stats')
      .upsert({
        creator_id: creator.id,
        recorded_at: todayStr,
        hours_watched_day: todayStats.hoursWatched, // Hours from streams that ended TODAY
        hours_watched_week: weekStats.hoursWatched,
        hours_watched_month: monthStats.hoursWatched,
        peak_viewers_day: todayStats.peakViewers,
        avg_viewers_day: todayStats.avgViewers,
        streams_count_day: todayStats.streamCount,
      }, {
        onConflict: 'creator_id,recorded_at',
        ignoreDuplicates: false
      });

    if (error) {
      console.log(`   ❌ ${creator.display_name}: ${error.message}`);
    } else if (monthStats.hoursWatched > 0) {
      console.log(`   ✅ ${creator.display_name}: Today: ${todayStats.hoursWatched.toFixed(0)}h, 30d: ${monthStats.hoursWatched.toFixed(0)}h`);
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
