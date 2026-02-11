import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || process.env.VITE_TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

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

// 300 Additional YouTube Channel IDs
// Focus: Gaming, Music, Tech, Education, International creators
const YOUTUBE_CHANNEL_IDS = [
  // Gaming creators (not already in expanded seed)
  'UCo_IB5145EVNcf8hw1Kku7w', // The Game Theorists
  'UC-lHJZR3Gqxm24_Vd_AJ5Yw', // PewDiePie (backup)
  'UCqrN67tOdygLgDsUdSInRZw', // Loserfruit
  'UCjgpFI5dU-D1-kh9H1muoxQ', // shane
  'UCYzPXprvl5Y-Sf0g4vX-m6g', // Dream
  'UCzQUP1qoWDoEbmsQxvdjxgQ', // VanossGaming
  'UClO_0NqA-5CaJ5ZceVTbm5g', // H2ODelirious
  'UCkxctb0jr8vwa4Do6c6su0Q', // PowerfulJRE
  'UCmqYccz-alTgFdvPIZxWszw', // CouRageJD
  'UCsvn_Po0SmunchJYOWpOxMg', // TheRadBrad
  'UCNvzD7Z-g64bPXxGzaQaa4g', // SMii7Y
  'UC-Oyu-cINmo4gDe8ZR_FRpg', // Drift0r
  'UCIgDj89VeU1KgXOI_jidJkw', // RadicalSoda
  'UC6QYFutt9cluQ3uSM813qKw', // Blarg
  'UCkQO3QsgTpNTsOw6ujimT5Q', // CinemaSins
  'UC9CuvdOVfMPvKCiwdGKL3cQ', // Rclbeauty101
  'UCqMDNf3Pn5L7pcNkuSEeO3w', // Typical Gamer
  'UCR1D15p_vdP3HkrH8wgjQRw', // jacksfilms
  'UCpB959t8iPrxQWj7G6n0ctQ', // Teo
  'UCkAGrHCLFmlK3H2kd6isipw', // Biaheza
  'UCHbGQ4HYOtBwdMFD9bk8YHg', // Zanny
  'UCpSgg_ECBj25s9moCDfSTsA', // SSSniperWolf (backup)
  'UCcK6lQBBlCEqRJfN1_fTh3A', // GhostRobo
  'UCkWQ0gDrqOCarmUKmppD7GQ', // ohmwrecker / Maskedgamer
  'UCr3cBLTYmIK9kY0F_OdFWFQ', // penguinz0/moistcritikal

  // Music artists & labels
  'UC07Kxew-cMIaykMOkzqHtBQ', // Dua Lipa
  'UCwppdrjsBPAZg5_cUwQjfMQ', // Coldplay Official
  'UCIwFjwMjI0y7PDBVEO9-bkQ', // Super Simple Songs (backup)
  'UC9XH7GJsNdD-pZLZzueVPNw', // Shakira (backup)
  'UCo-_TnXBoi5Gajh5LGHYFWg', // Post Malone
  'UCRI0yNmrG2nVLqmhOvczzYQ', // StoneMountain64
  'UCEagEo2AJWCZXWJoMwmV7uA', // Noisestorm
  'UCat0_TF2vFb5DGa1JBPqGKw', // Alan Walker
  'UC-yXuc1__VjAevZJiLrxUKQ', // Billie Eilish Topic
  'UCYSbvY6G3xM34z8cF_oJPjQ', // The Chainsmokers
  'UCGhFO5Lxc1mmYOk-s8N-W4g', // OneRepublic
  'UCBVjMGOIkavEAhyqpxJ73Dw', // Maroon 5
  'UC_aEa8K-EOJ3D6gOs7HcyNg', // NoCopyrightSounds
  'UCeZLO2VgbZHeDcongKzzfOw', // Trap Nation
  'UCd5bGwZqRuk2r3AsPCJZpWg', // Bass Nation
  'UCCvVpbYRgYjMN7mG7qQN0Pg', // Proximity
  'UChSpME-S8bDBMRD6DHN3J5Q', // Chill Nation
  'UCp8OOssjSjGZRVYK6zWbNYg', // The Vamps
  'UC3ifTl5zKiCAhHIBQYcaTeg', // 24kGoldn
  'UCKy1dAqELo0zrOtPkf0eTMw', // Ava Max
  'UCrkK92JyKs0JDiSKcQD_dlw', // Pink Pantheress

  // Tech & Science
  'UCBJycsmduvYEL83R_U4JriQ', // MKBHD (backup)
  'UC6nSFpj9HTCZ5t-N3Rm3-HA', // Vsauce (backup)
  'UCHaHD477h-FeBbVh9Sh7syA', // Vsauce2 (backup)
  'UCSju5G2aFaWMqn-_0YBtq5A', // Vsauce3
  'UCiGm_E4ZwYSHV3bcW1pnSeQ', // Corridor Digital
  'UCY1kMZp36IQSyNx_9h4mpCg', // Mark Rober
  'UC9RM-iSvTu1uPJb8X5yp3EQ', // Wendover Productions (backup)
  'UCsXVk37bltHxD1rDPwtNM8Q', // Kurzgesagt (backup)
  'UCsT0YIqwnpJCM-mx7-gSA4Q', // TEDx Talks (backup)
  'UChIs72whgZI9w6d6FhwGGHA', // Tom Scott
  'UCJ-vHE5CrGaL_ITEg-n3OeA', // Austin McConnell
  'UC7_YxT-KID8kRbqZo7MyscQ', // Markiplier (backup)
  'UCRNo8nE715hz2FjkYV0KxCA', // Brandon Sanderson
  'UCZYTClx2T1of7BRZ86-8fow', // SciShow (backup)
  'UC-3SbfTPJsL8fJAPKiVqBLg', // Two Minute Papers
  'UCtYLUTtgS3k1Fg4y5tAhLbw', // Smarter Every Day
  'UCHnyfMqiRRG1u-2MsSQLbXA', // Veritasium (backup)
  'UCoxcjq-8xIDTYp3uz647V5A', // Numberphile (backup)
  'UC2eYFnH61tmytImy1mTYvhA', // Luke Smith
  'UCsBjURrPoezykLs9EqgamOA', // Fireship
  'UCld68syR8Wi-GY_n4CaoJGA', // Brackeys
  'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp (backup)
  'UCX6OQ3DkcsbYNE6H8uQQuVA', // MrBeast (backup)
  'UCcdwLMPsaU2ezNSJU1nFoBQ', // MrBeast Gaming (backup)

  // Education & Explainers
  'UCrlIS7z5duHFN8PTfGW_qtw', // The Infographics Show
  'UCasMBGJhZyZ01SpLu2LsqSQ', // Dictionary.com
  'UConVfxXodg78Tzh5nNu85Ew', // TierZoo
  'UCR1IuLEqb6UEA_zQ81kwXfg', // Real Science
  'UCMiJRAwDNSNzuYeN2uWa0pA', // Mrwhosetheboss (backup)
  'UCZFipeZtQM5CKUjx6grh54g', // Real Engineering
  'UC4rlAVgAK0SGk-yTfe48Qpw', // PeanutButterGamer
  'UC3KEoMzNz8eYnwBC34RaKCQ', // Simone Giertz
  'UCy0tKL1T7wFoYcxCe0xjN6Q', // Technology Connections (backup)
  'UCUHW94eEFW7hkUMVaZz4eDg', // MinutePhysics (backup)
  'UCUzQJ3JBuQ9w-po4TXRJHiA', // Half as Interesting
  'UC2C_jShtL725hvbm1arSV9w', // CGP Grey (backup)
  'UC7IcJI8PUf5Z3zKxnZvTBog', // The School of Life (backup)
  'UC9CoOnJkIBMdeijd9qYoT_g', // ERB (Epic Rap Battles)
  'UCvjgXvBlbQiydffTwlTfKKQ', // Crash Course
  'UCo8bcnLyZH8tBIH9V1mLgqQ', // TheOdd1sOut (backup)
  'UCj5i58mCkAREDqFWlhaQbOw', // TheOdd1sOut (backup2)
  'UCGwu0nbY2wSkW8N-cghnLpA', // Jaiden Animations (backup)
  'UC1DTYW241WD64ah5BFWn4JA', // Sam O'Nella Academy
  'UCPPZoYsfoSekIpLcz9plX1Q', // Legal Eagle
  'UC_aEa8K-EOJ3D6gOs7HcyNg', // NCS (backup)

  // Lifestyle & Vlog
  'UCN1hnUccO4FD5WfM7ithXaw', // Dude Perfect (backup)
  'UCX3lss95Hsr8F4z1ToB7TZA', // Yes Theory
  'UCn8zNIfYAQNdrFRrr8oibKw', // Zach King
  'UCN1hnUccO4FD5WfM7ithXaw', // Mr. Kate
  'UCxVjgT6i7zPinOCg_JcHZCw', // Nikkietutorials
  'UC9CoOnJkIBMdeijd9qYoT_g', // Ariana Grande (backup)
  'UCPIvT-zcQl2H0vabdXJGcpg', // Good Mythical Morning (backup)
  'UCtinbF-Q-fVthA0qrFQTgXQ', // Casey Neistat (backup)
  'UCHkj014U2CQ2Nv0UZeYpE_A', // Ryan's World
  'UCLVEn8lmg77D-mHNv7dN5MQ', // Poppy Playtime
  'UC9hKm-GI-1yYKXxn65erMdg', // Aphmau
  'UC0M0rxSz3IF0CsSour1iWmw', // SSundee
  'UCaO6VoaYJv4kS-TQO_M-N_g', // Jelly
  'UC8cx_HeOT-nymJD_J8kP5xQ', // Slogo
  'UCEIrfZ_5zyqDPZj2JJCrU-g', // Crainer
  'UC2wKfjlioOCLP4xQMOWNcgg', // Unspeakable
  'UCHaHD477h-FeBbVh9Sh7syA', // Preston Playz
  'UCG8rbF3g2AMX70yOd8vqIZg', // LazarBeam (backup)
  'UCWh0tZFZ7dXuEQJ7j6f0nEw', // Socksfor1

  // Comedy & Entertainment
  'UCIjYyZxkFucP_W-tmXg_9Ow', // Ryan Higa
  'UCqA8H22FwgBVcF3GJpp0MQw', // CollegeHumor
  'UC4USoIAL9qcsx5nCZV_QRnA', // iDubbbzTV (backup)
  'UC4S8BRsIr-PJ1dkoGHvnX6Q', // H3 Podcast
  'UCQD3awTLw9i8Xzh85FKsuJA', // FunHausTV
  'UCboMX_UNgaPBsUOIgasn3-Q', // videogamedunkey
  'UCaUrHJIW-vmj9W1VYbJqcqA', // Funhaus
  'UCcQvgOHs7FDAUXNPMRAlemQ', // nigahiga (alt)
  'UC491geVsCq-yS1PdvmWZeyg', // RDCworld1
  'UCeAbJH9cIKnmYNlYcpH6Iew', // CalebCity
  'UC_3dGr1cB6Zr3aEik4jbONQ', // Brandon Rogers
  'UCjTGFMWePc9yZRw-CQiVRmQ', // gusjohnson
  'UCR8Ea20hQEMOAzYl1N8pXqg', // Abelina Sabrina
  'UC4_bwov47DseacR1-ttTdOg', // King Bach
  'UCriCjoJc-5BMCaE-cBZOsrw', // Danny Gonzalez
  'UC9CoOnJkIBMdeijd9qYoT_g', // Drew Gooden
  'UCG-KntY7aVnIGXYEBQvmBAQ', // Thomas Sanders
  'UC6gsOkYc6EpPgP7LhMdsJJg', // Gus Johnson (backup)
  'UC07Kxew-cMIaykMOkzqHtBQ', // Eddy Burback

  // International Creators
  // Spanish
  'UCz834xYLjPL6EQOZyE494aA', // Luisito Comunica
  'UC7mt1JNIwCLXNpr8SLw2TKw', // Sos
  'UCNJbqYcJIDfNFrT7pXR0Pww', // Yolo Aventuras
  'UC7zYY4e1rC64MPaP3bH3UaA', // Amara Que Linda
  'UCg7gVJvUCGDAglJF13YpJ0A', // La Divaza
  'UCQ0mAVHCJbfBSGzMKdFcLSw', // Lulu99
  'UC6jNDNkoOKQfB5djK2IBDoA', // Windygirk (backup)
  'UCJRJXWnO0aM-Zeppo41uRww', // Mariana Avila
  'UC8BZA1JWZB5j7IxCjOy1DTg', // Kimberly Loaiza
  'UCXazgXDIYyWH-yXLAkcrFxw', // elrubiusOMG (backup)
  'UCh7wqniVyRBMVOQCRr1hn8w', // Auronplay (backup)
  'UC8Yv3sbdhavHE-6vAqjPDMg', // TheGrefg (backup)
  'UCvfJLcBHSaRe-NwFYpgv-ag', // Rawvana
  'UCwxN30JS91TYR92WKkBuRMw', // Yuya

  // Portuguese/Brazilian
  'UCmzD4IYqx06n17ITEPHxm5g', // Felipe Neto
  'UCXaMzZd6pqC8mSGeTeuZcuA', // Whindersson Nunes
  'UC5Dc0Uc6gx498zGWzj0W3qg', // Luccas Neto
  'UC1dGiLXQVmxmFaEb4IVPMDw', // Irmãos Neto
  'UC98RcX_pHKEsLSRQDyqQfpA', // Manuel Freyre
  'UC-5mE7RwC6qvh99KMSBxvVg', // Tigresa Vip
  'UCFOXeMIueCv0Aw7n3Kpk5Ww', // Bia Lobo
  'UCYz1qYkLQw4HM8G4TbN8h0Q', // Everson Zoio
  'UCN2H8zPKr0tOo2EIAkqaGhA', // Blue3299
  'UC5A3tbDRHDhZwN0txyP9rLw', // Stella Cinderela

  // French
  'UCWg6jNc3P8r1RL55DyRskBQ', // Cyprien
  'UCvkO_8L-9nPGb-zR2mK3Ybg', // Norman fait des vidéos
  'UCj8orMezFWVcoN-4S545Wtw', // Squeezie
  'UCZVT0vxJTCjBDu_SpN1YY0g', // Rémi Gaillard
  'UCYRy8fHizLD1IBTjjJyCKLw', // MCFLY ET CARLITO

  // German
  'UCrB5c-nNdlCKuKgFr3fPkKg', // Gronkh (backup)
  'UC8vGK6bT_FpHOQp8eXlDuQg', // Julien Bam
  'UC6OvFe1kCLqUlN-jO3Cg_JQ', // Y-Titty
  'UCbDPHx0TINu9v9rXgzLEh-Q', // Dagi Bee
  'UCiiiX3nnAHF-KOifqnUfW1g', // Simon Desue

  // Japanese
  'UC-eDXiN1YrH3SKyFr5THqjw', // HIKAKIN
  'UCgMPP6RRjktV7krOfyUewqw', // はじめしゃちょー (Hajime Shacho)
  'UCpQi5vFvt8i1C_DvCEo8_PA', // 水溜りボンド (Mizutamaribondo)
  'UCfQiSIZ07kGlKqWxhdorFZg', // 東海オンエア (Tokai Onair)
  'UCOmAFzK6pF8VHo2g6oXUF2g', // Fischer's-フィッシャーズ

  // Korean
  'UC7W6v4O0SwjBACWZPgFP6_Q', // Pony Syndrome
  'UCeFSWE5kZ6LgFdnKE7s3A0g', // Jella!
  'UC7FDI-0OgoPZe2iLedQ9wBg', // 뜬뜬
  'UC4i9hXqlGrhu2jTHDCFvIVw', // 1theK
  'UClyUClKFwDYcSqYhB-XWxmw', // M2

  // Indian (more variety)
  'UCqwUrj10mAEsqezcItqvwEw', // BB Ki Vines (backup)
  'UCyoXW-Dse7fURq30EWl_CUA', // Amit Bhadana (backup)
  'UC_vcKmg67vjMP7ciLnSxSHQ', // GauravZone
  'UCg-8g-dPhGZ1EsWPU9VvR2g', // Mythpat
  'UC6cIQRsaZYC0rfvd5oZeYzw', // Gaming Guru
  'UCBxrLRqvX0I2PVD_tMbJbkQ', // MostlySane
  'UCY8qz3efmlqp3PUjYRcSTnw', // Sejal Kumar
  'UC7_p_0a0GCAhPPD1SjvYADA', // Ranveer Allahbadia
  'UCmYTgpKxd4uPiguMr3dnIcg', // Flying Beast
  'UCFNHTy-en5NsG4wa0hhX8kQ', // Nisha Madhulika

  // Misc Popular
  'UCBR8-60-B28hp2BmDPdntcQ', // YouTube Spotlight
  'UCI_ALIrYmwHZy30GVMOxRGQ', // Gorilla Tag
  'UCOqq_Qj-d8QkHXPVMeEXfDw', // Safiya Nygaard
  'UC4wUsZws0tZ0cdieW2bPPeg', // LongBeachGriffy
  'UCC9Cvt8dpEMr3r1xk1NdMDQ', // Daz Games
  'UCH4BNI0-FOK2dMXoFtViWHw', // BuzzFeedVideo
  'UCc02mYbwYcMkVMgIZrWU45g', // TheFineBros REACT
  'UCX6b17PVsYBQ0ip5gyeme-Q', // CrashCourse (backup)
  'UCf_suVrG2dA5BTbxRMCT5ig', // Yes. Theory
  'UCiDJtJKMICpb9B1qf7qjEOA', // Cyanide & Happiness (backup)
  'UCh3SYwKick8llpvhv5cJTfg', // SidemenReacts
  'UCjmeAUgoMG7qOtRTiHICjKg', // MoreSidemen
  'UC7tZyH8uP-hj0WRO5MwG6zQ', // 123 GO!
  'UCWKfVEoinEz4y0Bm9pUsJnA', // Troom Troom
  'UC6l-o6yWwEHrhICjH-Y_i7A', // 5-Minute Crafts PLAY
  'UCIJ0lLcABPdYGp7pRMGccAQ', // SlivkiShow
];

// 150 Additional Twitch Streamers
const TWITCH_USERNAMES = [
  // New wave (2023-2025)
  'caseoh', 'jynxzi', 'kai_cenat', 'ishowspeed', 'adin', 'fousey', 'silky',
  'fanum', 'duke_dennis', 'agent00', 'zias', 'chrisnxtdoor', 'davis',
  'plaqueboymax', 'yourrage', 'flight', 'dontai', 'jidion', 'ricegum',
  'ommioyo', 'hqtez', 'cinnaluvs', 'kenzplayslol',

  // Minecraft/MCYT
  'tommyinnit', 'tubbo', 'ranboo', 'philza', 'wilbursoot', 'quackity',
  'georgenotfound', 'sapnap', 'punz', 'antfrost', 'badboyhalo', 'skeppy',
  'technoblade', 'smajor', 'quig', 'captainsparklez', 'seapeekay',
  'hannahxxrose', 'purpled', '5up', 'fundy', 'nihachu', 'eret',

  // Speedrunners & Challenge runners
  'smallant', 'pointcrow', 'wirtual', 'linkus7', 'atrioc', 'simply',
  'calebhart42', 'cheese05', 'kosmic', 'darbian', 'summoning_salt',
  'ezscape', 'apollolegend', 'distortion2', 'lobos', 'crowbcat',

  // Variety streamers
  'nmplol', 'malena', 'esfand', 'cyr', 'kkatamina', 'tectone',
  'emiru', 'qt', 'avialongi', 'extraemily', 'cinna', 'natsumiii',
  'arianable', 'fanfan', 'emongg', 'aspen', 'akemi', 'zoil',

  // OTK & friends
  'tips', 'emiru', 'tipst', 'jschlatt', 'connoreatspants', 'slimecicle',
  'willneff', 'austinshow', 'kaceytron', 'hasan', 'qorantos', 'cooksux',

  // League streamers
  'baus', 'druttut', 'thebausffs', 'nemesis', 'caedrel', 'agurin',
  'spearshot', 'ratirl', 'yimit', 'dantes', 'loltyler1', 'tarzaned',
  'drututt', 'quantum', 'sinerias', 'pekinwoof', 'solarbacca',

  // Valorant pros & streamers
  'tenz', 'shroud', 'wardell', 'sinatraa', 'shahzam', 'zombs', 'dapr',
  'sick', 'subroza', 'c0m', 'asuna', 'hiko', 'steel', 'nitro', 'ethos',
  's0m', 'fns', 'crashies', 'victor', 'yay', 'marved', 'zekken',

  // Chess
  'gmhikaru', 'botezlive', 'alexandra', 'andrea', 'chessbrahs',
  'dannychess', 'quin69', 'danielnaroditsky', 'chesscom',

  // Fortnite/Battle Royale pros
  'sym', 'bugha', 'clix', 'ronaldo', 'mero', 'peterbot', 'deyy',
  'jelty', 'edgey', 'commandment', 'acorn', 'pinguefy',

  // Just Chatting
  'alinity', 'amouwu', 'meowko', 'jaycgee', 'stefaniegee', 'berry0314',
  'yuggie_tv', 'jinny', 'hachu', 'jinnytty', 'aceu', 'supcaitlin',

  // Reaction/Podcast streamers
  'xqcow', 'hassan', 'destiny', 'trainwrecks', 'greek', 'ice_poseidon',
  'erobbs', 'nmplol', 'grizzleh_', 'buddah',
];

// 50 Additional Kick Streamers
const KICK_USERNAMES = [
  'trainwreckstv', 'adinross', 'sneako', 'yourrage', 'jasontheween',
  'suspendas', 'fousey', 'silky', 'fousy', 'bigdaws',
  'ricegum', 'boogie', 'ice', 'steveewilldoit', 'bangs',
  'jasontheween', 'cuffem', 'natexu', 'rudywillingham', 'bryce',
  'cheesur', 'gmhikaru', 'adin', 'trainwreck', 'xqc',
  'corinna', 'lena', 'amouranth', 'brianna', 'morgpie',
  'tectone', 'zherka', 'jasontheween', 'sneako', 'oba',
  'n3on', 'zias', 'davis', 'chieff', 'sketch',
  'squeeze', 'stable', 'ronaldo', 'dillz', 'lil',
  'knut', 'meowko', 'destiny', 'gibi', 'raystreams',
];

// Utility functions
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
      country: creatorData.country,
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
      subscribers: stats.subscribers,
      total_views: stats.totalViews,
      total_posts: stats.totalPosts,
      followers: stats.subscribers,
    }, { onConflict: 'creator_id,recorded_at' });

  if (error) throw error;
}

// YouTube batch fetch
async function fetchYouTubeChannelsBatch(channelIds) {
  const params = new URLSearchParams({
    part: 'snippet,statistics,brandingSettings',
    id: channelIds.join(','),
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch YouTube channels');
  }

  const data = await response.json();
  return (data.items || [])
    .filter(channel => !!channel.snippet.customUrl)
    .map(channel => ({
      platform: 'youtube',
      platformId: channel.id,
      username: channel.snippet.customUrl.replace('@', ''),
      displayName: channel.snippet.title,
      profileImage: channel.snippet.thumbnails?.high?.url,
      description: channel.snippet.description?.slice(0, 500),
      country: channel.brandingSettings?.channel?.country || null,
      category: null,
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      totalViews: parseInt(channel.statistics.viewCount) || 0,
      totalPosts: parseInt(channel.statistics.videoCount) || 0,
    }));
}

// Twitch functions
let twitchToken = null;

async function getTwitchToken() {
  if (twitchToken) return twitchToken;

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  twitchToken = data.access_token;
  return twitchToken;
}

async function fetchTwitchUsersBatch(usernames) {
  const token = await getTwitchToken();
  const params = usernames.map(u => `login=${encodeURIComponent(u)}`).join('&');

  const response = await fetch(`https://api.twitch.tv/helix/users?${params}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
}

async function fetchTwitchFollowers(userId) {
  const token = await getTwitchToken();
  const response = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=1`,
    {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) return 0;
  const data = await response.json();
  return data.total || 0;
}

// Kick functions
let kickToken = null;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

async function getKickToken() {
  if (kickToken) return kickToken;

  const response = await fetch('https://kick.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  kickToken = data.access_token;
  return kickToken;
}

async function fetchKickChannelsBatch(slugs) {
  try {
    const token = await getKickToken();
    const response = await fetch('https://kick.com/api/v2/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slugs }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.channels || [];
  } catch (err) {
    console.error('   Kick API error:', err.message);
    return [];
  }
}

// Main seeding functions
async function seedYouTube() {
  if (!YOUTUBE_API_KEY) {
    console.log('\n⚠️  Skipping YouTube: Missing API key\n');
    return 0;
  }

  console.log(`\n📺 Seeding ${YOUTUBE_CHANNEL_IDS.length} YouTube channels...\n`);

  const uniqueIds = [...new Set(YOUTUBE_CHANNEL_IDS)];
  console.log(`   (${uniqueIds.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    console.log(`   Fetching batch ${Math.floor(i/50) + 1}/${Math.ceil(uniqueIds.length/50)}...`);

    try {
      const channels = await fetchYouTubeChannelsBatch(batch);

      for (const channel of channels) {
        try {
          const dbCreator = await upsertCreator(channel);
          await saveCreatorStats(dbCreator.id, {
            subscribers: channel.subscribers,
            totalViews: channel.totalViews,
            totalPosts: channel.totalPosts,
          });
          success++;
          console.log(`   ✅ ${channel.displayName} (${(channel.subscribers/1000000).toFixed(1)}M subs)`);
        } catch (err) {
          failed++;
          console.log(`   ❌ ${channel.displayName}: ${err.message}`);
        }
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\n   YouTube: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function seedTwitch() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.log('\n⚠️  Skipping Twitch: Missing credentials\n');
    return 0;
  }

  console.log(`\n🟣 Seeding ${TWITCH_USERNAMES.length} Twitch streamers...\n`);

  const uniqueUsernames = [...new Set(TWITCH_USERNAMES.map(u => u.toLowerCase()))];
  console.log(`   (${uniqueUsernames.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < uniqueUsernames.length; i += 100) {
    const batch = uniqueUsernames.slice(i, i + 100);
    console.log(`   Fetching batch ${Math.floor(i/100) + 1}/${Math.ceil(uniqueUsernames.length/100)}...`);

    try {
      const users = await fetchTwitchUsersBatch(batch);

      for (const user of users) {
        try {
          const followers = await fetchTwitchFollowers(user.id);

          const channel = {
            platform: 'twitch',
            platformId: user.id,
            username: user.login,
            displayName: user.display_name,
            profileImage: user.profile_image_url,
            description: user.description,
            category: null,
            subscribers: followers,
            totalViews: user.view_count || 0,
            totalPosts: 0,
          };

          const dbCreator = await upsertCreator(channel);
          await saveCreatorStats(dbCreator.id, {
            subscribers: followers,
            totalViews: channel.totalViews,
            totalPosts: 0,
          });

          success++;
          console.log(`   ✅ ${user.display_name} (${(followers/1000).toFixed(0)}K followers)`);

          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          failed++;
          console.log(`   ❌ ${user.display_name}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\n   Twitch: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function seedKick() {
  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    console.log('\n⚠️  Skipping Kick: Missing credentials\n');
    return 0;
  }

  console.log(`\n🟢 Seeding ${KICK_USERNAMES.length} Kick streamers...\n`);

  const uniqueUsernames = [...new Set(KICK_USERNAMES.map(u => u.toLowerCase()))];
  console.log(`   (${uniqueUsernames.length} unique after dedup)\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < uniqueUsernames.length; i += 50) {
    const batch = uniqueUsernames.slice(i, i + 50);
    console.log(`   Fetching batch ${Math.floor(i/50) + 1}/${Math.ceil(uniqueUsernames.length/50)}...`);

    try {
      const channels = await fetchKickChannelsBatch(batch);

      for (const channel of channels) {
        try {
          const creatorData = {
            platform: 'kick',
            platformId: channel.id?.toString(),
            username: channel.slug,
            displayName: channel.user?.username || channel.slug,
            profileImage: channel.user?.profile_pic,
            description: channel.description || '',
            category: null,
            subscribers: channel.active_subscribers_count || 0,
            totalViews: 0,
            totalPosts: 0,
          };

          const dbCreator = await upsertCreator(creatorData);
          await saveCreatorStats(dbCreator.id, {
            subscribers: creatorData.subscribers,
            totalViews: 0,
            totalPosts: 0,
          });

          success++;
          console.log(`   ✅ ${creatorData.displayName} (${creatorData.subscribers} paid subs)`);
        } catch (err) {
          failed++;
          console.log(`   ❌ ${channel.slug}: ${err.message}`);
        }
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`   ❌ Batch failed: ${err.message}`);
      failed += batch.length;
    }
  }

  console.log(`\n   Kick: ${success} succeeded, ${failed} failed\n`);
  return success;
}

async function run() {
  console.log('═'.repeat(60));
  console.log('🚀 MEDIUM EXPANSION: +500 Creators Across All Platforms');
  console.log('═'.repeat(60));

  const ytCount = await seedYouTube();
  const twitchCount = await seedTwitch();
  const kickCount = await seedKick();

  console.log('═'.repeat(60));
  console.log(`✅ COMPLETE: ${ytCount} YouTube + ${twitchCount} Twitch + ${kickCount} Kick`);
  console.log(`   Total added: ${ytCount + twitchCount + kickCount} creators`);
  console.log('═'.repeat(60));
}

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
