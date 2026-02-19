/**
 * One-time cleanup: backfill NULL/0 subscriber rows for Twitch creators.
 *
 * Root cause: fetchTwitchFollowers used to return 0 on API errors (missing
 * response.ok check), and aggregateHoursWatched used upsert which could
 * insert rows with NULL subscribers. This script carries forward the nearest
 * known good subscriber count for each bad row.
 *
 * Run once: node scripts/fixTwitchSubscriberData.js
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function fixTwitchData() {
  console.log('🔧 Fixing Twitch subscriber data...\n');

  // Get all Twitch creators
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('id, username, display_name')
    .eq('platform', 'twitch');

  if (creatorsError) {
    console.error('❌ Failed to fetch creators:', creatorsError.message);
    return;
  }

  console.log(`Found ${creators.length} Twitch creators\n`);

  let totalFixed = 0;
  let totalBadRows = 0;

  for (const creator of creators) {
    // Fetch all stats for this creator ordered by date
    const { data: allStats, error: statsError } = await supabase
      .from('creator_stats')
      .select('id, recorded_at, subscribers, followers')
      .eq('creator_id', creator.id)
      .order('recorded_at', { ascending: true });

    if (statsError || !allStats || allStats.length === 0) continue;

    // Find rows where subscribers is NULL or 0 (bad data)
    const badRows = allStats.filter(s => !s.subscribers || s.subscribers === 0);
    if (badRows.length === 0) continue;

    totalBadRows += badRows.length;
    console.log(`📊 ${creator.display_name}: ${badRows.length} bad row(s) out of ${allStats.length}`);

    // Build a lookup of the best known subscriber count for each date.
    // For each bad row, find the nearest preceding row with a non-zero count,
    // or the nearest following row if none precede it.
    const goodStats = allStats.filter(s => s.subscribers && s.subscribers > 0);
    if (goodStats.length === 0) {
      console.log(`   ⚠️  No good data to backfill from — skipping`);
      continue;
    }

    for (const badRow of badRows) {
      // Find the most recent good row before or on this date
      const preceding = goodStats
        .filter(s => s.recorded_at <= badRow.recorded_at)
        .at(-1); // last element = most recent

      // Fall back to earliest good row after this date
      const following = goodStats.find(s => s.recorded_at > badRow.recorded_at);

      const bestStats = preceding || following;
      if (!bestStats) continue;

      const { error: updateError } = await supabase
        .from('creator_stats')
        .update({
          subscribers: bestStats.subscribers,
          followers: bestStats.subscribers,
        })
        .eq('id', badRow.id);

      if (updateError) {
        console.log(`   ❌ Failed to fix row ${badRow.recorded_at}: ${updateError.message}`);
      } else {
        console.log(`   ✅ ${badRow.recorded_at}: 0 → ${bestStats.subscribers.toLocaleString()}`);
        totalFixed++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Fixed ${totalFixed} / ${totalBadRows} bad rows`);
}

fixTwitchData().catch(console.error);
