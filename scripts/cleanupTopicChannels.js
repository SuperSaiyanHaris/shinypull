/**
 * One-time cleanup: Remove YouTube topic/system channels from the database.
 * These channels don't have public YouTube pages (no customUrl/handle).
 *
 * Identifies them by checking the YouTube API for each YouTube creator.
 * If the channel has no customUrl, it gets deleted along with its stats.
 *
 * Usage: node scripts/cleanupTopicChannels.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}
if (!YOUTUBE_API_KEY) {
  throw new Error('Missing YouTube API key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function getYouTubeChannels(channelIds) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?` +
    `part=snippet&id=${channelIds.join(',')}&key=${YOUTUBE_API_KEY}`
  );
  if (!response.ok) throw new Error('YouTube API error');
  const data = await response.json();
  return data.items || [];
}

async function main() {
  console.log('Fetching all YouTube creators from database...');

  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, platform_id, username, display_name')
    .eq('platform', 'youtube');

  if (error) throw error;

  console.log(`Found ${creators.length} YouTube creators.`);
  console.log('Checking which ones have public pages...\n');

  const toDelete = [];

  // Check in batches of 50 (YouTube API limit)
  for (let i = 0; i < creators.length; i += 50) {
    const batch = creators.slice(i, i + 50);
    const channelIds = batch.map(c => c.platform_id);
    const ytChannels = await getYouTubeChannels(channelIds);

    // Map by ID for quick lookup
    const ytMap = new Map(ytChannels.map(ch => [ch.id, ch]));

    for (const creator of batch) {
      const ytChannel = ytMap.get(creator.platform_id);
      if (!ytChannel || !ytChannel.snippet.customUrl) {
        toDelete.push(creator);
        console.log(`  ❌ ${creator.display_name} (@${creator.username}) - no public page`);
      }
    }
  }

  if (toDelete.length === 0) {
    console.log('\n✅ All YouTube creators have public pages. Nothing to clean up.');
    return;
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} topic/system channel(s)...`);

  for (const creator of toDelete) {
    // Delete stats first (foreign key)
    await supabase.from('creator_stats').delete().eq('creator_id', creator.id);
    // Delete the creator
    const { error: delError } = await supabase.from('creators').delete().eq('id', creator.id);
    if (delError) {
      console.error(`  Failed to delete ${creator.display_name}:`, delError.message);
    } else {
      console.log(`  ✅ Deleted ${creator.display_name}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
