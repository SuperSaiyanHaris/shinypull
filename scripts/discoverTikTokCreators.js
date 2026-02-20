/**
 * Discover and add new TikTok creators from curated list
 *
 * Uses the TikTok scraper (tiktokScraper.js) to fetch profile data
 * from TikTok's embedded __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON.
 * Smart progression: tracks how many creators exist and adds the NEXT batch from the list.
 * Guarantees no duplicates - each run adds fresh creators until the list is exhausted.
 *
 * Usage: node scripts/discoverTikTokCreators.js [count]
 *   count: number of creators to discover (default: 10)
 */
import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeTikTokProfile, closeBrowser } from '../src/services/tiktokScraper.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const DELAY_BETWEEN_PROFILES = 3000; // 3 seconds (TikTok is less aggressive with rate limits)

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Curated list of top TikTok creators
 * As the database grows, the script automatically progresses through this list.
 * Add more usernames to the end as needed - duplicates are prevented by the database.
 */
const TOP_TIKTOK_USERNAMES = [
  // Mega accounts (100M+ followers)
  'khaby.lame', 'charlidamelio', 'mrbeast', 'bellapoarch', 'addisonre',
  'zachking', 'kimberly.loaiza', 'tiktok', 'selenagomez', 'therock',

  // Top creators (50M+)
  'willsmith', 'justinbieber', 'lorengray', 'dixiedamelio', 'brentrivera',
  'jasonderulo', 'spencerx', 'rosalia', 'babyariel', 'arianagrande',

  // Popular creators (20M+)
  'khloekardashian', 'caseyneistat', 'noahbeck', 'avanigregg',
  'ondreazlopez', 'masonramsey', 'gilmhercroes', 'itsjojosiwa', 'lizzo',

  // Content creators & influencers
  'dobretwins', 'hfranco_', 'kallmekris', 'youneszarou',
  'therealkingbach', 'bayashi.tiktok',

  // Gaming & entertainment
  'pewdiepie', 'ninja', 'dream', 'georgenotfound',
  'jesser', 'markiplier', 'tsm',

  // Comedy & skits
  'brodiethedog', 'itscaitlinhello', 'brittany.broski',
  'drewafualo', 'chrisklemens', 'mikaela.testa',

  // Dance & music
  'nfrealmusic', 'billieeilish', 'travisscott', 'postmalone',
  'shawnmendes', 'sabrinacarpenter', 'oliviarodrigo', 'dojacat', 'lilyachty',

  // Beauty & lifestyle
  'jamescharles', 'nikkietutorials', 'patricstarrr', 'mannymua', 'bretmanrock',
  'skincarebyhyram', 'mikirai',

  // Athletes
  'cristianoronaldo', 'neymarjr', 'leomessi', 'stephencurry', 'lebronjames',
  'tombrady', 'usainbolt', 'patrickmahomes',

  // Food & cooking
  'gordonramsayofficial', 'feelgoodfoodie', 'chloeting',
  'cookingwithlynja', 'tabithabrown', 'chefclub',

  // Education & Science
  'billnye', 'mrsdowjones', 'underthedesknews', 'finance.unfolded', 'mndiaye97',

  // Massive followings (50M+)
  'wifreo', 'kingjafi_rock', 'cznburak', 'bts_official_bighit',
  'thalia', 'xobrooklynne',

  // Major creators (20M-50M)
  'landonbarker', 'ameliezilber', 'michaelle.wandji', 'benoftheweek',
  'tryguys', 'emilymariko', 'theellenshow', 'daviddobrik', 'hannahstocking',
  'tatemcrae', 'lilnasx', 'icespice', 'enkyboys', 'demibagby', 'noen.eubanks',

  // Popular influencers (10M-20M)
  'rickygervais', 'jessicaalba', 'katyperry', 'djkhaled',
  'kevinhart4real', 'snoopdogg', 'mileycyrus',
  'thereallukecombs', 'timothechalamet', 'demilovato', 'niallhoran', 'shakira',
  'charlieputh', 'meghantrainor', 'maluma', 'ozuna', 'anuel',

  // Top gaming/content creators
  'valkyrae', 'sykkuno', 'typical_gamer', 'sssniperwolf',
  'jakewebber', 'the.nba', 'domelipa', 'sofiawylie', 'madisonbeer',

  // Top comedy/skit creators
  'iamtabithabrown', 'blogilates', 'whoisjimmy', 'zhcyt', 'jongraz',
  'alixearle', 'summermckeen',

  // Fashion & lifestyle
  'madelyncline', 'emmachamberlain', 'codyko', 'noellemiller',
  'kelseaballerini', 'trevorwallace',

  // Music artists on TikTok
  'edsheeran', 'taylorswift', 'cardib', 'nickiminaj',
  'brunomars', 'samsmith', 'harrystyles', 'sza', 'kendricklamar',

  // Sports personalities
  'alexmorgan', 'tonyhawk', 'simonebilesowens', 'lewishamilton', 'maxverstappen1',

  // Fitness & health
  'whitneyysimmons', 'pamela_rf', 'natacha.oceane', 'blogilates',
  'kelsey.wells', 'kayla.itsines',

  // Art & creative
  'vexx', 'moriah.elizabeth',

  // Viral/trending creators
  'younggravy', 'ryantrahan', 'austinmcbroom',
  'joshrichards', 'bryce.hall', 'anthonypadilla', 'laurdiy',

  // Musicians & artists
  'dojacatofficial', 'normaniofficial', 'tyga', 'nle_choppa', 'jackharlow',
  'iann.dior', 'conan.gray', 'gracie.abrams', 'finneas',

  // Reality TV & media personalities
  'jeffreestar', 'nikita.dragun', 'kyliejenner', 'kendalljenner',
  'kimkardashian', 'krisjenner', 'scottdisick',

  // YouTube crossovers
  'airrack', 'sidemenofficial', 'ricegum', 'theodd1sout',

  // Comedy / viral
  'dannyduncan', 'nelkboys', 'juanpa.zurita', 'fazerug', 'fazeadapt',

  // Cooking / food
  'saltbae', 'moribyan', 'joshuaweissman', 'bingingwithbabish',
  'maangchi', 'emmymade', 'ethan.chlebowski',

  // Fitness & wellness
  'chrisheria', 'laurendrainfit', 'gracefituk', 'krissy.cela',
  'growingannanas', 'brittne.babe', 'ashleykfit',

  // Travel & adventure
  'kara.and.nate', 'lost.leblancs', 'chrisburkard', 'jackmorris',

  // Sports & athletes
  'bronny', 'overtime', 'dude.perfect',
  'house_of_highlights', 'bleacherreport', 'espn', 'nfl', 'ufc',

  // News & commentary
  'hasanabi', 'thedailyshow', 'trevornoah', 'johnoliver',
  'kurzgesagt', 'vox', 'businessinsider',

  // Pets & animals
  'jiffpom', 'itsdougthepug', 'juniperfoxx',
];

/**
 * Get existing TikTok creators from database
 */
async function getExistingCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('username')
    .eq('platform', 'tiktok');

  if (error) throw error;
  return data?.map(c => c.username.toLowerCase()) || [];
}

/**
 * Main discovery function
 */
async function discoverTikTokCreators() {
  const today = getTodayLocal();
  const count = parseInt(process.argv[2]) || 50;

  console.log('🎵 TikTok Creator Discovery\n');
  console.log('═══════════════════════════════════════════════════');

  // Get existing creators
  const existingUsernames = await getExistingCreators();
  const existingCount = existingUsernames.length;

  console.log(`📊 Current TikTok creators in database: ${existingCount}`);
  console.log(`📋 Total usernames in curated list: ${TOP_TIKTOK_USERNAMES.length}`);

  // Find usernames NOT yet in database
  const newUsernames = TOP_TIKTOK_USERNAMES.filter(
    username => !existingUsernames.includes(username.toLowerCase())
  );

  if (newUsernames.length === 0) {
    console.log('\n✅ All usernames from the curated list are already in the database!');
    console.log('💡 Tip: Add more usernames to TOP_TIKTOK_USERNAMES array to continue discovery.\n');
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

      const profileData = await scrapeTikTokProfile(username);

      // If followers is too low, it's the wrong account (impersonator or stale username)
      // Real creators in this list should have at least 10K followers
      if (profileData.followers < 10000) {
        console.log(`   ⏭️  ${profileData.displayName} (@${profileData.username}): Only ${profileData.followers.toLocaleString()} followers — likely wrong account, skipping\n`);
        continue;
      }

      // Insert creator
      const { data: creator } = await supabase
        .from('creators')
        .upsert({
          platform: 'tiktok',
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

      // Insert today's stats — skip if followers is 0 (scraper returned bad data)
      if (!profileData.followers) {
        console.log(`   ⚠️  ${profileData.displayName}: Skipping stats — scraper returned 0 followers\n`);
      } else {
        await supabase
          .from('creator_stats')
          .upsert({
            creator_id: creator.id,
            recorded_at: today,
            subscribers: profileData.followers,
            followers: profileData.followers,
            total_views: profileData.totalLikes || 0,
            total_posts: profileData.totalPosts,
          }, { onConflict: 'creator_id,recorded_at' });
      }

      const followers = profileData.followers >= 1000000
        ? `${(profileData.followers / 1000000).toFixed(1)}M`
        : profileData.followers >= 1000
          ? `${(profileData.followers / 1000).toFixed(0)}K`
          : profileData.followers.toLocaleString();
      const likes = profileData.totalLikes >= 1000000
        ? `${(profileData.totalLikes / 1000000).toFixed(1)}M`
        : profileData.totalLikes >= 1000
          ? `${(profileData.totalLikes / 1000).toFixed(0)}K`
          : (profileData.totalLikes || 0).toLocaleString();
      console.log(`   ✅ ${profileData.displayName}: ${followers} followers, ${likes} likes\n`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ ${username}: ${err.message}\n`);
      failedCount++;

      // If rate limited, stop immediately
      if (err.message.includes('429') || err.message.includes('403')) {
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

discoverTikTokCreators().catch(err => {
  console.error('Discovery failed:', err);
  closeBrowser().then(() => process.exit(1));
});
