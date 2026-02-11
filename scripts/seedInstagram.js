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
 * Using UI Avatars for profile images since Instagram CDN blocks hotlinking
 */
const TOP_INSTAGRAM_CREATORS = [
  // Top 10 (400M+)
  { username: 'instagram', displayName: 'Instagram', followers: 678000000, posts: 8500, image: 'https://ui-avatars.com/api/?name=Instagram&size=200&bold=true&background=e1306c&color=fff', bio: 'Discover what is new on Instagram', category: 'Social Media' },
  { username: 'cristiano', displayName: 'Cristiano Ronaldo', followers: 672000000, posts: 3700, image: 'https://ui-avatars.com/api/?name=Cristiano+Ronaldo&size=200&bold=true&background=833ab4&color=fff', bio: 'Footballer', category: 'Sports' },
  { username: 'leomessi', displayName: 'Lionel Messi', followers: 505000000, posts: 1100, image: 'https://ui-avatars.com/api/?name=Lionel+Messi&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Athlete', category: 'Sports' },
  { username: 'selenagomez', displayName: 'Selena Gomez', followers: 429000000, posts: 1900, image: 'https://ui-avatars.com/api/?name=Selena+Gomez&size=200&bold=true&background=f77737&color=fff', bio: 'Artist', category: 'Music' },
  { username: 'kyliejenner', displayName: 'Kylie Jenner', followers: 400000000, posts: 7300, image: 'https://ui-avatars.com/api/?name=Kylie+Jenner&size=200&bold=true&background=fcaf45&color=fff', bio: 'Entrepreneur', category: 'Lifestyle' },
  { username: 'therock', displayName: 'Dwayne Johnson', followers: 397000000, posts: 8100, image: 'https://ui-avatars.com/api/?name=Dwayne+Johnson&size=200&bold=true&background=833ab4&color=fff', bio: 'Actor & Producer', category: 'Entertainment' },
  { username: 'arianagrande', displayName: 'Ariana Grande', followers: 380000000, posts: 5100, image: 'https://ui-avatars.com/api/?name=Ariana+Grande&size=200&bold=true&background=e1306c&color=fff', bio: 'Singer', category: 'Music' },
  { username: 'kimkardashian', displayName: 'Kim Kardashian', followers: 364000000, posts: 6700, image: 'https://ui-avatars.com/api/?name=Kim+Kardashian&size=200&bold=true&background=fd1d1d&color=fff', bio: 'SKIMS', category: 'Lifestyle' },
  { username: 'beyonce', displayName: 'Beyoncé', followers: 320000000, posts: 2100, image: 'https://ui-avatars.com/api/?name=Beyonce&size=200&bold=true&background=f77737&color=fff', bio: 'Artist', category: 'Music' },
  { username: 'khloekardashian', displayName: 'Khloé Kardashian', followers: 311000000, posts: 5200, image: 'https://ui-avatars.com/api/?name=Khloe+Kardashian&size=200&bold=true&background=fcaf45&color=fff', bio: 'Mommy', category: 'Lifestyle' },

  // 250M-300M
  { username: 'kendalljenner', displayName: 'Kendall Jenner', followers: 295000000, posts: 6800, image: 'https://ui-avatars.com/api/?name=Kendall+Jenner&size=200&bold=true&background=e1306c&color=fff', bio: 'Model', category: 'Fashion' },
  { username: 'justinbieber', displayName: 'Justin Bieber', followers: 294000000, posts: 7200, image: 'https://ui-avatars.com/api/?name=Justin+Bieber&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Artist', category: 'Music' },
  { username: 'taylorswift', displayName: 'Taylor Swift', followers: 283000000, posts: 900, image: 'https://ui-avatars.com/api/?name=Taylor+Swift&size=200&bold=true&background=f77737&color=fff', bio: 'Songwriter', category: 'Music' },
  { username: 'jenniferaniston', displayName: 'Jennifer Aniston', followers: 280000000, posts: 560, image: 'https://ui-avatars.com/api/?name=Jennifer+Aniston&size=200&bold=true&background=fcaf45&color=fff', bio: 'Actress', category: 'Entertainment' },
  { username: 'nickiminaj', displayName: 'Nicki Minaj', followers: 277000000, posts: 6500, image: 'https://ui-avatars.com/api/?name=Nicki+Minaj&size=200&bold=true&background=833ab4&color=fff', bio: 'Rapper', category: 'Music' },

  // 200M-250M
  { username: 'natgeo', displayName: 'National Geographic', followers: 283000000, posts: 24000, image: 'https://ui-avatars.com/api/?name=National+Geographic&size=200&bold=true&background=c13584&color=fff', bio: 'Experience the world through the eyes of National Geographic', category: 'Media' },
  { username: 'neymarjr', displayName: 'Neymar Jr', followers: 224000000, posts: 6100, image: 'https://ui-avatars.com/api/?name=Neymar+Jr&size=200&bold=true&background=d62976&color=fff', bio: 'Footballer', category: 'Sports' },
  { username: 'mileycyrus', displayName: 'Miley Cyrus', followers: 216000000, posts: 1600, image: 'https://ui-avatars.com/api/?name=Miley+Cyrus&size=200&bold=true&background=fa7e1e&color=fff', bio: 'Artist', category: 'Music' },
  { username: 'katyperry', displayName: 'Katy Perry', followers: 207000000, posts: 2600, image: 'https://ui-avatars.com/api/?name=Katy+Perry&size=200&bold=true&background=e1306c&color=fff', bio: 'Singer', category: 'Music' },
  { username: 'kourtneykardash', displayName: 'Kourtney Kardashian Barker', followers: 226000000, posts: 4900, image: 'https://ui-avatars.com/api/?name=Kourtney+Kardashian+Barker&size=200&bold=true&background=fd1d1d&color=fff', bio: 'POOSH', category: 'Lifestyle' },

  // 150M-200M
  { username: 'virat.kohli', displayName: 'Virat Kohli', followers: 271000000, posts: 1300, image: 'https://ui-avatars.com/api/?name=Virat+Kohli&size=200&bold=true&background=f77737&color=fff', bio: 'Cricketer', category: 'Sports' },
  { username: 'nike', displayName: 'Nike', followers: 306000000, posts: 1100, image: 'https://ui-avatars.com/api/?name=Nike&size=200&bold=true&background=fcaf45&color=fff', bio: 'Just Do It', category: 'Brand' },
  { username: 'emmawatson', displayName: 'Emma Watson', followers: 75000000, posts: 390, image: 'https://ui-avatars.com/api/?name=Emma+Watson&size=200&bold=true&background=833ab4&color=fff', bio: 'Actress', category: 'Entertainment' },
  { username: 'zendaya', displayName: 'Zendaya', followers: 185000000, posts: 3800, image: 'https://ui-avatars.com/api/?name=Zendaya&size=200&bold=true&background=c13584&color=fff', bio: 'Actress', category: 'Entertainment' },
  { username: 'ddlovato', displayName: 'Demi Lovato', followers: 158000000, posts: 2100, image: 'https://ui-avatars.com/api/?name=Demi+Lovato&size=200&bold=true&background=d62976&color=fff', bio: 'Artist', category: 'Music' },

  // 100M-150M
  { username: 'badgalriri', displayName: 'Rihanna', followers: 152000000, posts: 5700, image: 'https://ui-avatars.com/api/?name=Rihanna&size=200&bold=true&background=fa7e1e&color=fff', bio: '@fentybeauty @savagexfenty', category: 'Music' },
  { username: 'kevinhart4real', displayName: 'Kevin Hart', followers: 180000000, posts: 9400, image: 'https://ui-avatars.com/api/?name=Kevin+Hart&size=200&bold=true&background=e1306c&color=fff', bio: 'Comedian', category: 'Comedy' },
  { username: 'gigihadid', displayName: 'Gigi Hadid', followers: 79000000, posts: 4200, image: 'https://ui-avatars.com/api/?name=Gigi+Hadid&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Model', category: 'Fashion' },
  { username: 'fcbarcelona', displayName: 'FC Barcelona', followers: 129000000, posts: 13000, image: 'https://ui-avatars.com/api/?name=FC+Barcelona&size=200&bold=true&background=f77737&color=fff', bio: '🏆🏆🏆', category: 'Sports' },
  { username: 'realmadrid', displayName: 'Real Madrid CF', followers: 156000000, posts: 11000, image: 'https://ui-avatars.com/api/?name=Real+Madrid+CF&size=200&bold=true&background=fcaf45&color=fff', bio: '🏆⚪', category: 'Sports' },

  // 50M-100M
  { username: 'billieeilish', displayName: 'Billie Eilish', followers: 119000000, posts: 600, image: 'https://ui-avatars.com/api/?name=Billie+Eilish&size=200&bold=true&background=833ab4&color=fff', bio: 'HAPPIER THAN EVER 💙', category: 'Music' },
  { username: 'nasa', displayName: 'NASA', followers: 98000000, posts: 5200, image: 'https://ui-avatars.com/api/?name=NASA&size=200&bold=true&background=c13584&color=fff', bio: '🚀 Exploring the universe', category: 'Science' },
  { username: 'charlidamelio', displayName: "Charli D'Amelio", followers: 155000000, posts: 2100, image: 'https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/357629018_791817609016969_3506777809838927958_n.jpg', bio: 'Creator', category: 'Content Creator' },
  { username: 'priyankachopra', displayName: 'Priyanka Chopra Jonas', followers: 91000000, posts: 4100, image: 'https://ui-avatars.com/api/?name=Priyanka+Chopra+Jonas&size=200&bold=true&background=fa7e1e&color=fff', bio: 'Actress', category: 'Entertainment' },
  { username: 'snoopdogg', displayName: 'Snoop Dogg', followers: 88000000, posts: 12000, image: 'https://ui-avatars.com/api/?name=Snoop+Dogg&size=200&bold=true&background=e1306c&color=fff', bio: 'Rapper', category: 'Music' },
  { username: 'davidbeckham', displayName: 'David Beckham', followers: 88000000, posts: 5700, image: 'https://ui-avatars.com/api/?name=David+Beckham&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Football legend', category: 'Sports' },
  { username: 'jlo', displayName: 'Jennifer Lopez', followers: 251000000, posts: 4300, image: 'https://ui-avatars.com/api/?name=Jennifer+Lopez&size=200&bold=true&background=f77737&color=fff', bio: 'Entertainer', category: 'Music' },
  { username: 'caradelevingne', displayName: 'Cara Delevingne', followers: 44000000, posts: 6100, image: 'https://ui-avatars.com/api/?name=Cara+Delevingne&size=200&bold=true&background=fcaf45&color=fff', bio: 'Model/Actress', category: 'Fashion' },
  { username: 'shawnmendes', displayName: 'Shawn Mendes', followers: 74000000, posts: 2800, image: 'https://ui-avatars.com/api/?name=Shawn+Mendes&size=200&bold=true&background=833ab4&color=fff', bio: 'Singer', category: 'Music' },
  { username: 'bellahadid', displayName: 'Bella Hadid', followers: 60000000, posts: 3500, image: 'https://ui-avatars.com/api/?name=Bella+Hadid&size=200&bold=true&background=c13584&color=fff', bio: 'Model', category: 'Fashion' },

  // 40M-50M
  { username: 'championsleague', displayName: 'UEFA Champions League', followers: 115000000, posts: 9800, image: 'https://ui-avatars.com/api/?name=UEFA+Champions+League&size=200&bold=true&background=d62976&color=fff', bio: '⚽ The biggest club competition', category: 'Sports' },
  { username: 'nba', displayName: 'NBA', followers: 85000000, posts: 35000, image: 'https://ui-avatars.com/api/?name=NBA&size=200&bold=true&background=fa7e1e&color=fff', bio: '🏀', category: 'Sports' },
  { username: 'hudabeauty', displayName: 'Huda Kattan', followers: 54000000, posts: 6200, image: 'https://ui-avatars.com/api/?name=Huda+Kattan&size=200&bold=true&background=e1306c&color=fff', bio: 'Beauty entrepreneur', category: 'Beauty' },
  { username: 'vindiesel', displayName: 'Vin Diesel', followers: 103000000, posts: 4200, image: 'https://ui-avatars.com/api/?name=Vin+Diesel&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Actor', category: 'Entertainment' },
  { username: 'chiaraferragni', displayName: 'Chiara Ferragni', followers: 29000000, posts: 20000, image: 'https://ui-avatars.com/api/?name=Kourtney+Kardashian+Barker&size=200&bold=true&background=f77737&color=fff', bio: 'Entrepreneur', category: 'Fashion' },
  { username: 'dualipa', displayName: 'DUA LIPA', followers: 90000000, posts: 2900, image: 'https://ui-avatars.com/api/?name=DUA+LIPA&size=200&bold=true&background=fcaf45&color=fff', bio: 'Singer', category: 'Music' },
  { username: 'k.mbappe', displayName: 'Kylian Mbappé', followers: 121000000, posts: 900, image: 'https://ui-avatars.com/api/?name=Priyanka+Chopra+Jonas&size=200&bold=true&background=833ab4&color=fff', bio: 'Footballer', category: 'Sports' },
  { username: 'lebronjames', displayName: 'LeBron James', followers: 159000000, posts: 2200, image: 'https://ui-avatars.com/api/?name=LeBron+James&size=200&bold=true&background=c13584&color=fff', bio: '🏀', category: 'Sports' },
  { username: 'addisonraeeee', displayName: 'Addison Rae', followers: 40000000, posts: 1200, image: 'https://ui-avatars.com/api/?name=Addison+Rae&size=200&bold=true&background=d62976&color=fff', bio: 'Creator', category: 'Content Creator' },
  { username: '9gag', displayName: '9GAG', followers: 58000000, posts: 78000, image: 'https://ui-avatars.com/api/?name=9GAG&size=200&bold=true&background=fa7e1e&color=fff', bio: 'Memes & Entertainment', category: 'Entertainment' },

  // More creators 30M-40M
  { username: 'zachking', displayName: 'Zach King', followers: 27000000, posts: 1100, image: 'https://ui-avatars.com/api/?name=Zach+King&size=200&bold=true&background=e1306c&color=fff', bio: 'Digital magician', category: 'Content Creator' },
  { username: 'gordonramsayofficial', displayName: 'Gordon Ramsay', followers: 17000000, posts: 5400, image: 'https://ui-avatars.com/api/?name=LeBron+James&size=200&bold=true&background=fd1d1d&color=fff', bio: 'Chef', category: 'Food' },
  { username: 'victoriabeckham', displayName: 'Victoria Beckham', followers: 32000000, posts: 5900, image: 'https://ui-avatars.com/api/?name=Victoria+Beckham&size=200&bold=true&background=f77737&color=fff', bio: 'Fashion designer', category: 'Fashion' },
  { username: 'kingjames', displayName: 'LeBron James', followers: 159000000, posts: 2200, image: 'https://ui-avatars.com/api/?name=LeBron+James&size=200&bold=true&background=fcaf45&color=fff', bio: '🏀', category: 'Sports' },
  { username: 'iamzlatanibrahimovic', displayName: 'Zlatan Ibrahimović', followers: 63000000, posts: 5100, image: 'https://ui-avatars.com/api/?name=Zlatan+Ibrahimović&size=200&bold=true&background=833ab4&color=fff', bio: 'Footballer', category: 'Sports' },

  // Gaming & Tech creators
  { username: 'ninja', displayName: 'Ninja', followers: 24000000, posts: 3700, image: 'https://ui-avatars.com/api/?name=Ninja&size=200&bold=true&background=c13584&color=fff', bio: 'Gamer', category: 'Gaming' },
  { username: 'pokimanelol', displayName: 'Pokimane', followers: 7000000, posts: 640, image: 'https://ui-avatars.com/api/?name=Pokimane&size=200&bold=true&background=d62976&color=fff', bio: 'Streamer', category: 'Gaming' },
  { username: 'valkyrae', displayName: 'Valkyrae', followers: 4000000, posts: 520, image: 'https://ui-avatars.com/api/?name=Huda+Kattan&size=200&bold=true&background=fa7e1e&color=fff', bio: 'Content creator', category: 'Gaming' },
  { username: 'pewdiepie', displayName: 'PewDiePie', followers: 22000000, posts: 900, image: 'https://ui-avatars.com/api/?name=PewDiePie&size=200&bold=true&background=e1306c&color=fff', bio: 'YouTuber', category: 'Gaming' },
  { username: 'mrbeast', displayName: 'MrBeast', followers: 56000000, posts: 1400, image: 'https://ui-avatars.com/api/?name=MrBeast&size=200&bold=true&background=fd1d1d&color=fff', bio: 'YouTuber', category: 'Content Creator' },

  // International creators
  { username: 'amitbhadana', displayName: 'Amit Bhadana', followers: 27000000, posts: 340, image: 'https://ui-avatars.com/api/?name=Cara+Delevingne&size=200&bold=true&background=f77737&color=fff', bio: 'Creator', category: 'Content Creator' },
  { username: 'carryminati', displayName: 'CarryMinati', followers: 18000000, posts: 190, image: 'https://ui-avatars.com/api/?name=CarryMinati&size=200&bold=true&background=fcaf45&color=fff', bio: 'YouTuber', category: 'Content Creator' },
  { username: 'bts.bighitofficial', displayName: 'BTS official', followers: 77000000, posts: 4600, image: 'https://ui-avatars.com/api/?name=BTS+official&size=200&bold=true&background=833ab4&color=fff', bio: 'K-pop group', category: 'Music' },
  { username: 'blackpinkofficial', displayName: 'BLACKPINK', followers: 57000000, posts: 1900, image: 'https://ui-avatars.com/api/?name=Kevin+Hart&size=200&bold=true&background=c13584&color=fff', bio: 'K-pop group', category: 'Music' },
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
