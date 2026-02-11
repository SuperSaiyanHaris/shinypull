import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

function getTodayLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Curated list of top Instagram creators to seed the database
 * Focus: mix of celebrities, influencers, brands, creators across niches
 */
const TOP_INSTAGRAM_USERNAMES = [
  // Top accounts (500M+ followers)
  'instagram', 'cristiano', 'leomessi', 'selenagomez', 'kyliejenner',
  'therock', 'arianagrande', 'kimkardashian', 'beyonce', 'khloekardashian',

  // Celebrities (100M+)
  'kendalljenner', 'justinbieber', 'taylorswift', 'jenniferaniston', 'nickiminaj',
  'natgeo', 'neymarjr', 'mileycyrus', 'katyperry', 'kourtneykardash',

  // Athletes
  'virat.kohli', 'davidbeckham', 'lebronjames', 'ronaldinho', 'k.mbappe',
  'paulpogba', 'sergioramos', 'marcosalonsooficial', 'kingjames', 'stephencurry30',

  // Content Creators & Influencers
  'charlidamelio', 'addisonraeeee', 'brentrivera', 'lorengray', 'zachking',
  'camerondallas', 'nashgrier', 'jamescharles', 'emmachamberlain', 'daviddobrik',

  // Fitness & Lifestyle
  'kayla_itsines', 'alexisren', 'sommer_ray', 'jen_selter', 'michelle_lewin',
  'lazar_angelov_official', 'stevecook', 'danalinnbailey', 'whitneyysimmons', 'nikki_blackketter',

  // Beauty & Fashion
  'hudabeauty', 'chiaraferragni', 'gigihadid', 'bellahadid', 'caradelevingne',
  'victoriabeckham', 'zendaya', 'badgalriri', 'jlo', 'priyankachopra',

  // Gaming & Tech
  'ninja', 'pokimanelol', 'valkyrae', 'pewdiepie', 'loserfruit',
  '典哒', 'rubius', 'willyrex', 'elrubiusomg', 'aveeplayer',

  // Musicians & Artists
  'billieeilish', 'dualipa', 'shawnmendes', 'camilacabello', 'edsheeran',
  'ddlovato', 'lizzo', 'postmalone', 'travisscott', 'cardib',

  // Comedy & Entertainment
  'kevinhart4real', 'theellenshow', 'jimmyfallon', 'snoopdogg', '9gag',
  'trevornoah', 'henrycavill', 'vindiesel', 'johnnydepp', 'robertdowneyjr',

  // Brands & Media
  'nike', 'natgeotravel', 'nasa', 'champions league', 'fcbarcelona',
  'realmadrid', 'nba', 'nfl', 'fifa', 'espn',

  // Food & Travel
  'gordonramsayofficial', 'jamieoliver', 'ghanteluigi', 'buzzfeedtasty', 'foodnetwork',
  'beautifuldestinations', 'discoverearth', 'earthpix', 'tourtheplanet', 'wonderful_places',
];

/**
 * Fetch Instagram profile using public API
 */
async function fetchInstagramProfile(username) {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.data?.user;

    if (!user) {
      return null;
    }

    return {
      platform: 'instagram',
      platformId: user.id,
      username: user.username,
      displayName: user.full_name || user.username,
      profileImage: user.profile_pic_url_hd || user.profile_pic_url,
      description: user.biography || '',
      isVerified: user.is_verified || false,
      isPrivate: user.is_private || false,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      totalPosts: user.edge_owner_to_timeline_media?.count || 0,
      category: user.category_name || null,
    };
  } catch (error) {
    console.error(`   ✗ ${username}: ${error.message}`);
    return null;
  }
}

/**
 * Upsert creator to database
 */
async function upsertCreator(creatorData) {
  const { data, error } = await supabase
    .from('creators')
    .upsert({
      platform: creatorData.platform,
      platform_id: creatorData.platformId,
      username: creatorData.username,
      display_name: creatorData.displayName,
      profile_image: creatorData.profileImage,
      description: creatorData.description,
      category: creatorData.category,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,platform_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Save creator stats
 */
async function saveCreatorStats(creatorId, stats) {
  const today = getTodayLocal();
  const { error } = await supabase
    .from('creator_stats')
    .upsert({
      creator_id: creatorId,
      recorded_at: today,
      followers: stats.followers,
      total_posts: stats.totalPosts,
      subscribers: stats.followers, // Instagram calls them followers
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

/**
 * Get creators that need updating (oldest first)
 */
async function getCreatorsNeedingUpdate(limit = 20) {
  const { data, error } = await supabase
    .from('creators')
    .select('username, updated_at')
    .eq('platform', 'instagram')
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data?.map(c => c.username) || [];
}

/**
 * Main discovery function
 */
async function discoverInstagramCreators() {
  console.log('🟣 Instagram Creator Discovery\n');
  console.log('═'.repeat(60));

  // Check how many Instagram creators we have
  const { count: existingCount } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram');

  console.log(`Current Instagram creators: ${existingCount || 0}`);

  // Decide strategy: new discoveries or updates
  let usernamesToFetch = [];

  if (existingCount < 50) {
    // Still building initial database - prioritize new discoveries
    const newUsernames = TOP_INSTAGRAM_USERNAMES.slice(0, 20);
    console.log(`Strategy: Discovery mode (adding ${newUsernames.length} new creators)\n`);
    usernamesToFetch = newUsernames;
  } else {
    // Update existing creators (oldest data first)
    const updateUsernames = await getCreatorsNeedingUpdate(15);
    // Plus some new discoveries
    const newUsernames = TOP_INSTAGRAM_USERNAMES.slice(existingCount, existingCount + 5);
    usernamesToFetch = [...updateUsernames, ...newUsernames];
    console.log(`Strategy: Mixed mode (${updateUsernames.length} updates + ${newUsernames.length} new)\n`);
  }

  let success = 0;
  let failed = 0;

  for (const username of usernamesToFetch) {
    try {
      const profile = await fetchInstagramProfile(username);

      if (!profile) {
        console.log(`   ⊘ ${username}: Not found or private`);
        failed++;
        continue;
      }

      const dbCreator = await upsertCreator(profile);
      await saveCreatorStats(dbCreator.id, {
        followers: profile.followers,
        totalPosts: profile.totalPosts,
      });

      success++;
      const followers = (profile.followers / 1000000).toFixed(1);
      console.log(`   ✓ ${username}: ${followers}M followers`);

      // Rate limiting: 3 seconds between requests
      if (usernamesToFetch.indexOf(username) < usernamesToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ✗ ${username}: ${error.message}`);
      failed++;
    }
  }

  console.log('═'.repeat(60));
  console.log(`✅ Complete: ${success} succeeded, ${failed} failed\n`);
}

// Run discovery
discoverInstagramCreators().catch(err => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
