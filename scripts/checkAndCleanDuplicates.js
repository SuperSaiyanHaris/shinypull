import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env file
try {
  const envContent = readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex);
        let value = trimmed.slice(eqIndex + 1);
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
} catch (e) {
  // .env file not found, use existing env vars
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkAndCleanDuplicates() {
  console.log('🔍 Checking database for issues...\n');

  // 1. Get all creators
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('*');

  if (creatorsError) {
    console.error('❌ Error fetching creators:', creatorsError.message);
    return;
  }

  console.log(`📊 Found ${creators.length} creators in database\n`);

  // Count by platform
  const platformCounts = {};
  creators.forEach((c) => {
    platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
  });
  console.log('Platform breakdown:');
  Object.entries(platformCounts).forEach(([platform, count]) => {
    console.log(`   ${platform}: ${count} creators`);
  });

  // 2. Check for duplicate stats entries
  console.log('\n🔍 Checking for duplicate stats entries...');

  const { data: allStats, error: statsError } = await supabase
    .from('creator_stats')
    .select('id, creator_id, recorded_at')
    .order('creator_id')
    .order('recorded_at');

  if (statsError) {
    console.error('❌ Error fetching stats:', statsError.message);
    return;
  }

  console.log(`   Total stats entries: ${allStats.length}`);

  // Find duplicates (same creator_id + recorded_at)
  const seen = new Map();
  const duplicates = [];

  allStats.forEach((stat) => {
    const key = `${stat.creator_id}-${stat.recorded_at}`;
    if (seen.has(key)) {
      duplicates.push(stat);
    } else {
      seen.set(key, stat);
    }
  });

  if (duplicates.length > 0) {
    console.log(`   ⚠️  Found ${duplicates.length} duplicate entries!`);

    // Delete duplicates
    console.log('   🧹 Cleaning up duplicates...');
    const duplicateIds = duplicates.map((d) => d.id);

    const { error: deleteError } = await supabase
      .from('creator_stats')
      .delete()
      .in('id', duplicateIds);

    if (deleteError) {
      console.error('   ❌ Error deleting duplicates:', deleteError.message);
    } else {
      console.log(`   ✅ Deleted ${duplicates.length} duplicate entries`);
    }
  } else {
    console.log('   ✅ No duplicate entries found');
  }

  // 3. Check for creators without stats
  console.log('\n🔍 Checking for creators without stats...');

  const creatorIdsWithStats = new Set(allStats.map((s) => s.creator_id));
  const creatorsWithoutStats = creators.filter((c) => !creatorIdsWithStats.has(c.id));

  if (creatorsWithoutStats.length > 0) {
    console.log(`   ⚠️  ${creatorsWithoutStats.length} creators have no stats:`);
    creatorsWithoutStats.slice(0, 10).forEach((c) => {
      console.log(`      - ${c.display_name} (${c.platform})`);
    });
    if (creatorsWithoutStats.length > 10) {
      console.log(`      ... and ${creatorsWithoutStats.length - 10} more`);
    }
  } else {
    console.log('   ✅ All creators have stats');
  }

  // 4. Check for invalid YouTube platform_ids
  console.log('\n🔍 Checking YouTube creator platform_ids...');

  const youtubeCreators = creators.filter((c) => c.platform === 'youtube');
  const invalidYoutubeIds = youtubeCreators.filter((c) => {
    // Valid YouTube channel IDs start with UC and are 24 characters
    return !c.platform_id || !c.platform_id.startsWith('UC') || c.platform_id.length !== 24;
  });

  if (invalidYoutubeIds.length > 0) {
    console.log(`   ⚠️  ${invalidYoutubeIds.length} YouTube creators have invalid platform_ids:`);
    invalidYoutubeIds.slice(0, 10).forEach((c) => {
      console.log(`      - ${c.display_name}: "${c.platform_id}"`);
    });
    if (invalidYoutubeIds.length > 10) {
      console.log(`      ... and ${invalidYoutubeIds.length - 10} more`);
    }
  } else {
    console.log('   ✅ All YouTube creators have valid channel IDs');
  }

  // 5. Check stats data quality
  console.log('\n🔍 Checking stats data quality...');

  const { data: recentStats } = await supabase
    .from('creator_stats')
    .select('*, creators(display_name, platform)')
    .order('recorded_at', { ascending: false })
    .limit(500);

  let zeroSubscribers = 0;
  let nullValues = 0;

  recentStats?.forEach((stat) => {
    if (stat.subscribers === 0 && stat.followers === 0) zeroSubscribers++;
    if (stat.subscribers === null && stat.followers === null) nullValues++;
  });

  console.log(`   Stats with zero subscribers/followers: ${zeroSubscribers}`);
  console.log(`   Stats with null values: ${nullValues}`);

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total creators: ${creators.length}`);
  console.log(`   Total stats entries: ${allStats.length - duplicates.length}`);
  console.log(`   Duplicates removed: ${duplicates.length}`);
  console.log(`   Creators without stats: ${creatorsWithoutStats.length}`);
  console.log(`   Invalid YouTube IDs: ${invalidYoutubeIds.length}`);

  if (duplicates.length === 0 && creatorsWithoutStats.length === 0 && invalidYoutubeIds.length === 0) {
    console.log('\n✅ Database looks healthy!');
  } else {
    console.log('\n⚠️  Some issues were found. Review the output above.');
  }
}

checkAndCleanDuplicates().catch(console.error);
