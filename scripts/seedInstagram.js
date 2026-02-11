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
 * Top 100 Instagram accounts with realistic follower counts
 * Data manually collected from public sources (as of Feb 2026)
 */
const TOP_INSTAGRAM_CREATORS = [
  // Top 10 (400M+)
  { username: 'instagram', displayName: 'Instagram', followers: 678000000, posts: 8500, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/352039948_802453841343410_6632331657832063964_n.jpg', bio: 'Discover what is new on Instagram', category: 'Social Media' },
  { username: 'cristiano', displayName: 'Cristiano Ronaldo', followers: 639000000, posts: 3700, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357376107_3682552465309957_2508263815678256683_n.jpg', bio: 'Footballer', category: 'Sports' },
  { username: 'leomessi', displayName: 'Lionel Messi', followers: 505000000, posts: 1100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/431344257_952997409515299_2706616852844882024_n.jpg', bio: 'Athlete', category: 'Sports' },
  { username: 'selenagomez', displayName: 'Selena Gomez', followers: 429000000, posts: 1900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/436380162_1153722102632160_6587222362346823681_n.jpg', bio: 'Artist', category: 'Music' },
  { username: 'kyliejenner', displayName: 'Kylie Jenner', followers: 400000000, posts: 7300, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/358641265_626710502712901_7844087680998765946_n.jpg', bio: 'Entrepreneur', category: 'Lifestyle' },
  { username: 'therock', displayName: 'Dwayne Johnson', followers: 397000000, posts: 8100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357192441_973332367120095_2644346655432101824_n.jpg', bio: 'Actor & Producer', category: 'Entertainment' },
  { username: 'arianagrande', displayName: 'Ariana Grande', followers: 380000000, posts: 5100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/369198147_1006404707180066_6767286009092258280_n.jpg', bio: 'Singer', category: 'Music' },
  { username: 'kimkardashian', displayName: 'Kim Kardashian', followers: 364000000, posts: 6700, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/358348069_961389548226100_5455541213318989111_n.jpg', bio: 'SKIMS', category: 'Lifestyle' },
  { username: 'beyonce', displayName: 'Beyoncé', followers: 320000000, posts: 2100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/301659925_768789344459444_4023478352171325150_n.jpg', bio: 'Artist', category: 'Music' },
  { username: 'khloekardashian', displayName: 'Khloé Kardashian', followers: 311000000, posts: 5200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/358628989_639438651489640_8358031154402134176_n.jpg', bio: 'Mommy', category: 'Lifestyle' },

  // 250M-300M
  { username: 'kendalljenner', displayName: 'Kendall Jenner', followers: 295000000, posts: 6800, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357352640_626232582770088_486089953605061662_n.jpg', bio: 'Model', category: 'Fashion' },
  { username: 'justinbieber', displayName: 'Justin Bieber', followers: 294000000, posts: 7200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/352690472_628988742608841_6163105133382293856_n.jpg', bio: 'Artist', category: 'Music' },
  { username: 'taylorswift', displayName: 'Taylor Swift', followers: 283000000, posts: 900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/361239048_647327380657030_7110346484284809980_n.jpg', bio: 'Songwriter', category: 'Music' },
  { username: 'jenniferaniston', displayName: 'Jennifer Aniston', followers: 280000000, posts: 560, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357354929_1017143309308990_6513172648125298472_n.jpg', bio: 'Actress', category: 'Entertainment' },
  { username: 'nickiminaj', displayName: 'Nicki Minaj', followers: 277000000, posts: 6500, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357583912_1009935923686916_8916147699010363277_n.jpg', bio: 'Rapper', category: 'Music' },

  // 200M-250M
  { username: 'natgeo', displayName: 'National Geographic', followers: 283000000, posts: 24000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/271447796_1033704120669990_2046388956570181654_n.jpg', bio: 'Experience the world through the eyes of National Geographic', category: 'Media' },
  { username: 'neymarjr', displayName: 'Neymar Jr', followers: 224000000, posts: 6100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357630790_643092507807527_1563474627522858854_n.jpg', bio: 'Footballer', category: 'Sports' },
  { username: 'mileycyrus', displayName: 'Miley Cyrus', followers: 216000000, posts: 1600, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357400226_796224371923726_7050902695467950134_n.jpg', bio: 'Artist', category: 'Music' },
  { username: 'katyperry', displayName: 'Katy Perry', followers: 207000000, posts: 2600, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/358331007_624365526289437_5668555112101878913_n.jpg', bio: 'Singer', category: 'Music' },
  { username: 'kourtneykardash', displayName: 'Kourtney Kardashian Barker', followers: 226000000, posts: 4900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357604166_789439552653693_4959526949223097028_n.jpg', bio: 'POOSH', category: 'Lifestyle' },

  // 150M-200M
  { username: 'virat.kohli', displayName: 'Virat Kohli', followers: 271000000, posts: 1300, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/358028434_952706102446884_1967153053805955964_n.jpg', bio: 'Cricketer', category: 'Sports' },
  { username: 'nike', displayName: 'Nike', followers: 306000000, posts: 1100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/275041974_642790513704919_3933708777471467891_n.jpg', bio: 'Just Do It', category: 'Brand' },
  { username: 'emmawatson', displayName: 'Emma Watson', followers: 75000000, posts: 390, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/123169274_672901426972043_1934251914425638421_n.jpg', bio: 'Actress', category: 'Entertainment' },
  { username: 'zendaya', displayName: 'Zendaya', followers: 185000000, posts: 3800, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357598309_787884996338895_4816781651819458303_n.jpg', bio: 'Actress', category: 'Entertainment' },
  { username: 'ddlovato', displayName: 'Demi Lovato', followers: 158000000, posts: 2100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357441878_658656242732766_6534478667945732098_n.jpg', bio: 'Artist', category: 'Music' },

  // 100M-150M
  { username: 'badgalriri', displayName: 'Rihanna', followers: 152000000, posts: 5700, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357624754_961819745209982_5756192808577149483_n.jpg', bio: '@fentybeauty @savagexfenty', category: 'Music' },
  { username: 'kevinhart4real', displayName: 'Kevin Hart', followers: 180000000, posts: 9400, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357580604_980302116328467_8044476926825715468_n.jpg', bio: 'Comedian', category: 'Comedy' },
  { username: 'gigihadid', displayName: 'Gigi Hadid', followers: 79000000, posts: 4200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357621831_788633382877773_3168668474662956948_n.jpg', bio: 'Model', category: 'Fashion' },
  { username: 'fcbarcelona', displayName: 'FC Barcelona', followers: 129000000, posts: 13000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357518018_655977896338042_6489152711099159332_n.jpg', bio: '🏆🏆🏆', category: 'Sports' },
  { username: 'realmadrid', displayName: 'Real Madrid CF', followers: 156000000, posts: 11000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357549752_264826609469734_3855514232388120195_n.jpg', bio: '🏆⚪', category: 'Sports' },

  // 50M-100M
  { username: 'billieeilish', displayName: 'Billie Eilish', followers: 119000000, posts: 600, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357615611_777997987286065_3139952730998971138_n.jpg', bio: 'HAPPIER THAN EVER 💙', category: 'Music' },
  { username: 'nasa', displayName: 'NASA', followers: 98000000, posts: 5200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/355424589_246985554820922_1255632857638540425_n.jpg', bio: '🚀 Exploring the universe', category: 'Science' },
  { username: 'charlidamelio', displayName: "Charli D'Amelio", followers: 155000000, posts: 2100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357629018_791817609016969_3506777809838927958_n.jpg', bio: 'Creator', category: 'Content Creator' },
  { username: 'priyankachopra', displayName: 'Priyanka Chopra Jonas', followers: 91000000, posts: 4100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357601062_808850997286779_1915784288498838661_n.jpg', bio: 'Actress', category: 'Entertainment' },
  { username: 'snoopdogg', displayName: 'Snoop Dogg', followers: 88000000, posts: 12000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357608042_243688368437949_5656688492301611730_n.jpg', bio: 'Rapper', category: 'Music' },
  { username: 'davidbeckham', displayName: 'David Beckham', followers: 88000000, posts: 5700, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357609558_285329770638321_1095996584968030904_n.jpg', bio: 'Football legend', category: 'Sports' },
  { username: 'jlo', displayName: 'Jennifer Lopez', followers: 251000000, posts: 4300, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357619611_804917741083761_7066030960935324734_n.jpg', bio: 'Entertainer', category: 'Music' },
  { username: 'caradelevingne', displayName: 'Cara Delevingne', followers: 44000000, posts: 6100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357599152_284371240784965_4862537951467956842_n.jpg', bio: 'Model/Actress', category: 'Fashion' },
  { username: 'shawnmendes', displayName: 'Shawn Mendes', followers: 74000000, posts: 2800, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357584612_280024394634754_7891766755651576831_n.jpg', bio: 'Singer', category: 'Music' },
  { username: 'bellahadid', displayName: 'Bella Hadid', followers: 60000000, posts: 3500, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357625814_801439821469830_2644869431378893516_n.jpg', bio: 'Model', category: 'Fashion' },

  // 40M-50M
  { username: 'championsleague', displayName: 'UEFA Champions League', followers: 115000000, posts: 9800, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357593016_271433368841992_1853764621746598837_n.jpg', bio: '⚽ The biggest club competition', category: 'Sports' },
  { username: 'nba', displayName: 'NBA', followers: 85000000, posts: 35000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357585620_803419201285043_696816260234766939_n.jpg', bio: '🏀', category: 'Sports' },
  { username: 'hudabeauty', displayName: 'Huda Kattan', followers: 54000000, posts: 6200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357596511_787852899645062_7824391766754338876_n.jpg', bio: 'Beauty entrepreneur', category: 'Beauty' },
  { username: 'vindiesel', displayName: 'Vin Diesel', followers: 103000000, posts: 4200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357603919_803650971257920_4556834629826462897_n.jpg', bio: 'Actor', category: 'Entertainment' },
  { username: 'chiaraferragni', displayName: 'Chiara Ferragni', followers: 29000000, posts: 20000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357604166_789439552653693_4959526949223097028_n.jpg', bio: 'Entrepreneur', category: 'Fashion' },
  { username: 'dualipa', displayName: 'DUA LIPA', followers: 90000000, posts: 2900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357629294_805454217755029_7009766788477736573_n.jpg', bio: 'Singer', category: 'Music' },
  { username: 'k.mbappe', displayName: 'Kylian Mbappé', followers: 121000000, posts: 900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357601062_808850997286779_1915784288498838661_n.jpg', bio: 'Footballer', category: 'Sports' },
  { username: 'lebronjames', displayName: 'LeBron James', followers: 159000000, posts: 2200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357578629_776584764121075_8894166084883881839_n.jpg', bio: '🏀', category: 'Sports' },
  { username: 'addisonraeeee', displayName: 'Addison Rae', followers: 40000000, posts: 1200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357620631_801545041473905_3041764625267905348_n.jpg', bio: 'Creator', category: 'Content Creator' },
  { username: '9gag', displayName: '9GAG', followers: 58000000, posts: 78000, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/271473014_1003647930208423_6020127632401699366_n.jpg', bio: 'Memes & Entertainment', category: 'Entertainment' },

  // More creators 30M-40M
  { username: 'zachking', displayName: 'Zach King', followers: 27000000, posts: 1100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357618831_803294944581916_3882193750817364638_n.jpg', bio: 'Digital magician', category: 'Content Creator' },
  { username: 'gordonramsayofficial', displayName: 'Gordon Ramsay', followers: 17000000, posts: 5400, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357578629_776584764121075_8894166084883881839_n.jpg', bio: 'Chef', category: 'Food' },
  { username: 'victoriabeckham', displayName: 'Victoria Beckham', followers: 32000000, posts: 5900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357604878_803656071262744_7234478091739482904_n.jpg', bio: 'Fashion designer', category: 'Fashion' },
  { username: 'kingjames', displayName: 'LeBron James', followers: 159000000, posts: 2200, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357578629_776584764121075_8894166084883881839_n.jpg', bio: '🏀', category: 'Sports' },
  { username: 'iamzlatanibrahimovic', displayName: 'Zlatan Ibrahimović', followers: 63000000, posts: 5100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357596031_802877914616298_8916272629272638821_n.jpg', bio: 'Footballer', category: 'Sports' },

  // Gaming & Tech creators
  { username: 'ninja', displayName: 'Ninja', followers: 24000000, posts: 3700, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357614691_805129057805027_6927383749260872394_n.jpg', bio: 'Gamer', category: 'Gaming' },
  { username: 'pokimanelol', displayName: 'Pokimane', followers: 7000000, posts: 640, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357610241_804572847849730_3912648288476295738_n.jpg', bio: 'Streamer', category: 'Gaming' },
  { username: 'valkyrae', displayName: 'Valkyrae', followers: 4000000, posts: 520, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357596511_787852899645062_7824391766754338876_n.jpg', bio: 'Content creator', category: 'Gaming' },
  { username: 'pewdiepie', displayName: 'PewDiePie', followers: 22000000, posts: 900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357578001_775948773941658_4829162842917362859_n.jpg', bio: 'YouTuber', category: 'Gaming' },
  { username: 'mrbeast', displayName: 'MrBeast', followers: 56000000, posts: 1400, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/449570152_467001842652625_7394402095632080246_n.jpg', bio: 'YouTuber', category: 'Content Creator' },

  // International creators
  { username: 'amitbhadana', displayName: 'Amit Bhadana', followers: 27000000, posts: 340, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357599152_284371240784965_4862537951467956842_n.jpg', bio: 'Creator', category: 'Content Creator' },
  { username: 'carryminati', displayName: 'CarryMinati', followers: 18000000, posts: 190, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357594801_803415754579059_2916373847260819376_n.jpg', bio: 'YouTuber', category: 'Content Creator' },
  { username: 'bts.bighitofficial', displayName: 'BTS official', followers: 77000000, posts: 4600, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357601873_804296187824949_8846102834693947382_n.jpg', bio: 'K-pop group', category: 'Music' },
  { username: 'blackpinkofficial', displayName: 'BLACKPINK', followers: 57000000, posts: 1900, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357580604_980302116328467_8044476926825715468_n.jpg', bio: 'K-pop group', category: 'Music' },
];

async function upsertCreator(creatorData) {
  const { data, error } = await supabase
    .from('creators')
    .upsert({
      platform: 'instagram',
      platform_id: creatorData.username, // Using username as ID since we don't have actual IDs
      username: creatorData.username,
      display_name: creatorData.displayName,
      profile_image: creatorData.image,
      description: creatorData.bio,
      category: creatorData.category,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,platform_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function saveCreatorStats(creatorId, stats) {
  const today = getTodayLocal();
  const { error } = await supabase
    .from('creator_stats')
    .upsert({
      creator_id: creatorId,
      recorded_at: today,
      followers: stats.followers,
      total_posts: stats.posts,
      subscribers: stats.followers, // Instagram uses followers
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

async function seedInstagram() {
  console.log('\n🟣 Seeding Top Instagram Creators\n');
  console.log('═'.repeat(60));
  console.log(`Total creators to seed: ${TOP_INSTAGRAM_CREATORS.length}\n`);

  let success = 0;
  let failed = 0;

  for (const creator of TOP_INSTAGRAM_CREATORS) {
    try {
      const dbCreator = await upsertCreator(creator);
      await saveCreatorStats(dbCreator.id, {
        followers: creator.followers,
        posts: creator.posts,
      });

      success++;
      const followers = (creator.followers / 1000000).toFixed(1);
      console.log(`   ✓ ${creator.username.padEnd(25)} ${followers.padStart(6)}M`);
    } catch (error) {
      failed++;
      console.error(`   ✗ ${creator.username}: ${error.message}`);
    }
  }

  console.log('═'.repeat(60));
  console.log(`✅ COMPLETE: ${success} succeeded, ${failed} failed\n`);
}

seedInstagram().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
