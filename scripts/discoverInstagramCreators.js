/**
 * Discover and add new Instagram creators from curated list
 *
 * Uses the bot user-agent scraper (instagramScraper.js) to fetch profile data.
 * Smart progression: tracks how many creators exist and adds the NEXT batch from the list.
 * Guarantees no duplicates - each run adds fresh creators until the list is exhausted.
 *
 * Usage: node scripts/discoverInstagramCreators.js [count]
 *   count: number of creators to discover (default: 10)
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramScraper.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DELAY_BETWEEN_PROFILES = 8000; // 8 seconds

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Curated list of top Instagram creators
 * As the database grows, the script automatically progresses through this list.
 * Add more usernames to the end as needed - duplicates are prevented by the database.
 */
const TOP_INSTAGRAM_USERNAMES = [
  // Mega accounts (400M+ followers)
  'instagram', 'cristiano', 'leomessi', 'selenagomez', 'kyliejenner',
  'therock', 'arianagrande', 'kimkardashian', 'beyonce', 'justinbieber',

  // Top celebrities (100M+)
  'kendalljenner', 'taylorswift', 'jenniferaniston', 'nickiminaj', 'khloekardashian',
  'natgeo', 'neymarjr', 'mileycyrus', 'katyperry', 'kourtneykardash',

  // Athletes
  'virat.kohli', 'davidbeckham', 'lebronjames', 'ronaldinho', 'k.mbappe',
  'paulpogba', 'sergioramos', 'kingjames', 'stephencurry30', 'tombrady',

  // Content Creators & Influencers
  'charlidamelio', 'addisonraeeee', 'brentrivera', 'lorengray', 'zachking',
  'camerondallas', 'nashgrier', 'jamescharles', 'emmachamberlain', 'daviddobrik',

  // Fitness & Lifestyle
  'kayla_itsines', 'alexisren', 'sommer_ray', 'jen_selter', 'michelle_lewin',
  'simeonpanda', 'stevecook', 'danalinnbailey', 'whitneyysimmons', 'nikki_blackketter',

  // Beauty & Fashion
  'hudabeauty', 'chiaraferragni', 'gigihadid', 'bellahadid', 'caradelevingne',
  'victoriabeckham', 'zendaya', 'badgalriri', 'jlo', 'priyankachopra',

  // Gaming & Tech
  'ninja', 'pokimanelol', 'valkyrae', 'pewdiepie', 'loserfruit',
  'rubius', 'willyrex', 'elrubiusomg', 'auronplay', 'ibai',

  // Musicians & Artists
  'billieeilish', 'dualipa', 'shawnmendes', 'camilacabello', 'edsheeran',
  'ddlovato', 'lizzo', 'postmalone', 'travisscott', 'cardib',

  // Comedy & Entertainment
  'kevinhart4real', 'theellenshow', 'jimmyfallon', 'snoopdogg', 'trevornoah',
  'henrycavill', 'vindiesel', 'johnnydepp', 'robertdowneyjr', 'prattprattpratt',

  // Brands & Media
  'nike', 'natgeotravel', 'nasa', 'fcbarcelona', 'realmadrid',
  'nba', 'nfl', 'fifa', 'espn', 'premierleague',

  // Food & Travel
  'gordonramsayofficial', 'jamieoliver', 'buzzfeedtasty', 'foodnetwork', 'tastemade',
  'beautifuldestinations', 'earthpix', 'tourtheplanet', 'wonderful_places', 'travelandleisure',

  // More creators - add more here
  'mrbeast', 'ksi', 'loganpaul', 'jakepaul', 'ricegum',
  'faze', 'tsm', 'optic', 'sommer', 'hannahstocking',
];

/**
 * Get existing Instagram creators from database
 */
async function getExistingCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('username')
    .eq('platform', 'instagram');

  if (error) throw error;
  return data?.map(c => c.username.toLowerCase()) || [];
}

/**
 * Main discovery function
 */
async function discoverInstagramCreators() {
  const today = getTodayLocal();
  const count = parseInt(process.argv[2]) || 10;

  console.log('🟣 Instagram Creator Discovery\n');
  console.log('═══════════════════════════════════════════════════');

  // Get existing creators
  const existingUsernames = await getExistingCreators();
  const existingCount = existingUsernames.length;

  console.log(`📊 Current Instagram creators in database: ${existingCount}`);
  console.log(`📋 Total usernames in curated list: ${TOP_INSTAGRAM_USERNAMES.length}`);

  // Find usernames NOT yet in database
  const newUsernames = TOP_INSTAGRAM_USERNAMES.filter(
    username => !existingUsernames.includes(username.toLowerCase())
  );

  if (newUsernames.length === 0) {
    console.log('\n✅ All usernames from the curated list are already in the database!');
    console.log('💡 Tip: Add more usernames to TOP_INSTAGRAM_USERNAMES array to continue discovery.\n');
    return;
  }

  console.log(`🎯 Fresh usernames available: ${newUsernames.length}`);
  console.log(`📥 Discovering ${Math.min(count, newUsernames.length)} new creator(s)\n`);
  console.log('═══════════════════════════════════════════════════\n');

  // Take the first N fresh usernames
  const usernamesToAdd = newUsernames.slice(0, count);

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < usernamesToAdd.length; i++) {
    const username = usernamesToAdd[i];

    try {
      console.log(`[${i + 1}/${usernamesToAdd.length}] Fetching ${username}...`);

      const profileData = await scrapeInstagramProfile(username);

      // Insert creator
      const { data: creator } = await supabase
        .from('creators')
        .upsert({
          platform: 'instagram',
          platform_id: profileData.platformId || username,
          username: profileData.username,
          display_name: profileData.displayName,
          profile_image: profileData.profileImage,
          description: profileData.description,
          category: profileData.category,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'platform,platform_id' })
        .select()
        .single();

      // Insert today's stats
      await supabase
        .from('creator_stats')
        .upsert({
          creator_id: creator.id,
          recorded_at: today,
          subscribers: profileData.followers,
          followers: profileData.followers,
          total_views: 0,
          total_posts: profileData.totalPosts,
        }, { onConflict: 'creator_id,recorded_at' });

      const followers = (profileData.followers / 1000000).toFixed(1);
      console.log(`   ✅ ${profileData.displayName}: ${followers}M followers\n`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ ${username}: ${err.message}\n`);
      failedCount++;

      // If rate limited, stop immediately
      if (err.message.includes('429')) {
        console.log('   ⚠️  Rate limited — stopping early (will resume next run)\n');
        break;
      }
    }

    // Delay between profiles
    if (i < usernamesToAdd.length - 1) {
      const delaySeconds = (DELAY_BETWEEN_PROFILES / 1000).toFixed(0);
      process.stdout.write(`   ⏳ Waiting ${delaySeconds}s before next request...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_PROFILES));
      process.stdout.write('\r' + ' '.repeat(60) + '\r'); // Clear line
    }
  }

  await closeBrowser();

  console.log('═══════════════════════════════════════════════════');
  console.log(`\n📈 Discovery Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📊 Total in database now: ${existingCount + successCount}`);
  console.log(`   🎯 Fresh usernames remaining: ${newUsernames.length - usernamesToAdd.length}\n`);
}

discoverInstagramCreators().catch(err => {
  console.error('Discovery failed:', err);
  closeBrowser().then(() => process.exit(1));
});
