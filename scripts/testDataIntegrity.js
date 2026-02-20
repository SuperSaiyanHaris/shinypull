/**
 * Data Integrity Test Suite
 *
 * Validates data accuracy for the top 5 creators per platform by:
 *   1. Comparing stored stats against live platform APIs
 *   2. Running internal sanity checks on 30-day history
 *
 * Checks per creator:
 *   Staleness   — latest stat row must be < 48h old
 *   Zero check  — no 0/null subscriber rows in last 30 days
 *   Swing check — no day-over-day change > 30% in last 30 days
 *   Gap check   — no more than 3 consecutive missing days in last 30 days
 *   API match   — stored followers/subs within tolerance of live API value
 *
 * Usage:   node scripts/testDataIntegrity.js
 * Exit 0 = all checks PASS or WARN only
 * Exit 1 = one or more FAIL
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { scrapeTikTokProfile } from '../src/services/tiktokScraper.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.VITE_TWITCH_CLIENT_SECRET || process.env.TWITCH_CLIENT_SECRET;
const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

// ─── Thresholds ───────────────────────────────────────────────────────────────
const STALE_HOURS      = 48;   // Latest stat must be within this many hours
const API_WARN_PCT     = 5;    // % diff from live API → WARN
const API_FAIL_PCT     = 15;   // % diff from live API → FAIL
const SWING_WARN_PCT   = 30;   // Day-over-day change threshold → WARN
const MAX_GAP_WARN     = 2;    // Consecutive missing days → WARN
const MAX_GAP_FAIL     = 3;    // Consecutive missing days → FAIL
const TOP_N            = 5;    // Creators to test per platform

// ─── Counters ─────────────────────────────────────────────────────────────────
let totalPass = 0;
let totalWarn = 0;
let totalFail = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNum(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return n?.toLocaleString() ?? '0';
}

function pctDiff(stored, live) {
  if (!live || live === 0) return Infinity;
  return Math.abs((stored - live) / live) * 100;
}

function result(label, status, detail = '') {
  const badge =
    status === 'PASS' ? `${C.green}PASS${C.reset}` :
    status === 'WARN' ? `${C.yellow}WARN${C.reset}` :
                        `${C.red}FAIL${C.reset}`;
  const detailColor =
    status === 'PASS' ? C.gray :
    status === 'WARN' ? C.yellow :
                        C.red;
  const detailStr = detail ? ` ${detailColor}${detail}${C.reset}` : '';
  console.log(`    [${badge}] ${label}${detailStr}`);
  if (status === 'PASS') totalPass++;
  else if (status === 'WARN') totalWarn++;
  else totalFail++;
}

// ─── Internal history checks ──────────────────────────────────────────────────
function runHistoryChecks(platform, history, createdAt) {
  if (!history || history.length === 0) {
    result('Staleness',   'FAIL', 'No stats rows found in database');
    result('Zero check',  'FAIL', 'No data to check');
    result('Swing check', 'FAIL', 'No data to check');
    result('Gap check',   'FAIL', 'No data to check');
    return;
  }

  // 1. Staleness — latest row must be recent
  const latest = history[0];
  const latestDate = new Date(latest.recorded_at + 'T12:00:00');
  const hoursAgo = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= STALE_HOURS) {
    result('Staleness', 'PASS', `Last updated ${Math.round(hoursAgo)}h ago`);
  } else {
    result('Staleness', 'FAIL', `Last updated ${Math.round(hoursAgo)}h ago (limit: ${STALE_HOURS}h)`);
  }

  // 2. Zero check — no 0 or null in subscriber/follower counts
  // Kick is exempt: active_subscribers_count (paid subs) can legitimately be 0
  // for streamers who have no paid subscribers. For all other platforms, 0 = API failure.
  const last30 = history.slice(0, 30);
  if (platform === 'kick') {
    result('Zero check', 'PASS', 'Skipped — Kick paid subs can legitimately be 0');
  } else {
    const zeroRows = last30.filter(s => {
      const val = s.subscribers ?? s.followers;
      return !val || val === 0;
    });
    if (zeroRows.length === 0) {
      result('Zero check', 'PASS', `No zero/null rows in last ${last30.length} days`);
    } else {
      result('Zero check', 'FAIL', `${zeroRows.length} row(s) with 0/null: ${zeroRows.map(r => r.recorded_at).slice(0, 5).join(', ')}`);
    }
  }

  // 3. Swing check — flag large day-over-day changes
  const sorted = [...last30].reverse(); // oldest → newest
  const bigSwings = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].subscribers || sorted[i - 1].followers || 0;
    const curr = sorted[i].subscribers || sorted[i].followers || 0;
    if (prev === 0) continue;
    const changePct = ((curr - prev) / prev) * 100;
    if (Math.abs(changePct) > SWING_WARN_PCT) {
      bigSwings.push(`${sorted[i].recorded_at} ${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}%`);
    }
  }
  if (bigSwings.length === 0) {
    result('Swing check', 'PASS', `No day-over-day swings > ${SWING_WARN_PCT}%`);
  } else {
    result('Swing check', 'WARN', `${bigSwings.length} large swing(s): ${bigSwings.slice(0, 3).join(', ')}`);
  }

  // 4. Gap check — consecutive missing days within the window we should have data
  // Clamp to creator's DB creation date so we don't flag days before we started tracking
  const trackingStart = createdAt ? new Date(createdAt) : null;
  const dateSet = new Set(last30.map(s => s.recorded_at));
  let maxGap = 0;
  let currentGap = 0;
  let gapStart = null;
  let worstGapStart = null;

  // Use EST "today" as the anchor so we don't flag future UTC dates as missing
  const estToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const estAnchor = new Date(estToday + 'T12:00:00'); // noon EST, safe for date math

  for (let d = 0; d < 30; d++) {
    const date = new Date(estAnchor);
    date.setDate(date.getDate() - d);
    // Skip dates before we started tracking this creator
    if (trackingStart && date < trackingStart) continue;
    const dateStr = date.toISOString().split('T')[0];
    if (!dateSet.has(dateStr)) {
      if (currentGap === 0) gapStart = dateStr;
      currentGap++;
      if (currentGap > maxGap) {
        maxGap = currentGap;
        worstGapStart = gapStart;
      }
    } else {
      currentGap = 0;
    }
  }

  if (maxGap === 0) {
    result('Gap check', 'PASS', 'No missing days in last 30 days');
  } else if (maxGap <= MAX_GAP_WARN) {
    result('Gap check', 'WARN', `${maxGap} consecutive missing day(s) starting ${worstGapStart}`);
  } else if (maxGap <= MAX_GAP_FAIL) {
    result('Gap check', 'WARN', `${maxGap} consecutive missing days starting ${worstGapStart}`);
  } else {
    result('Gap check', 'FAIL', `${maxGap} consecutive missing days starting ${worstGapStart}`);
  }
}

// ─── API match check ──────────────────────────────────────────────────────────
function checkApiMatch(field, stored, live) {
  if (live === 0 || live == null) {
    result(`API match (${field})`, 'WARN', "Live API returned 0 — can't validate");
    return;
  }
  const diff = pctDiff(stored, live);
  const detail = `stored ${formatNum(stored)} vs live ${formatNum(live)} (${diff.toFixed(1)}% diff)`;
  if (diff <= API_WARN_PCT) {
    result(`API match (${field})`, 'PASS', detail);
  } else if (diff <= API_FAIL_PCT) {
    result(`API match (${field})`, 'WARN', detail);
  } else {
    result(`API match (${field})`, 'FAIL', detail);
  }
}

// ─── Per-creator runner ───────────────────────────────────────────────────────
async function testCreator(creator, fetchLive) {
  console.log(`\n  ${C.bold}${creator.display_name}${C.reset} ${C.gray}@${creator.username}${C.reset}`);

  // Fetch 30-day history from DB
  const { data: history } = await supabase
    .from('creator_stats')
    .select('recorded_at, subscribers, followers, total_views, total_posts')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false })
    .limit(30);

  // Internal checks (no API needed)
  runHistoryChecks(creator.platform, history || [], creator.created_at);

  // Live API comparison
  try {
    const live = await fetchLive();
    const latest = history?.[0];

    if (!latest) {
      result('API match', 'FAIL', 'No stored stats to compare against');
      return;
    }

    const storedFollowers = latest.subscribers || latest.followers || 0;

    // All platforms: followers/subscribers
    checkApiMatch('followers/subs', storedFollowers, live.followers ?? live.subscribers ?? 0);

    // YouTube: also validate total views
    if (creator.platform === 'youtube' && live.total_views != null) {
      checkApiMatch('total_views', latest.total_views || 0, live.total_views);
    }

    // TikTok: also validate video count and likes
    if (creator.platform === 'tiktok') {
      if (live.totalPosts != null) {
        checkApiMatch('video_count', latest.total_posts || 0, live.totalPosts);
      }
      if (live.totalLikes != null) {
        // total_views stores likes for TikTok (see CLAUDE.md)
        checkApiMatch('likes', latest.total_views || 0, live.totalLikes);
      }
    }
  } catch (err) {
    result('API match', 'WARN', `Could not fetch live data: ${err.message}`);
  }
}

// ─── Top N creators per platform ──────────────────────────────────────────────
async function getTopCreators(platform) {
  // Get all creators for this platform
  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, platform, platform_id, username, display_name, created_at')
    .eq('platform', platform);

  if (error || !creators || creators.length === 0) return [];

  // Get most recent stats for each creator (last 14 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const { data: recentStats } = await supabase
    .from('creator_stats')
    .select('creator_id, recorded_at, subscribers, followers')
    .in('creator_id', creators.map(c => c.id))
    .gte('recorded_at', cutoffStr)
    .order('recorded_at', { ascending: false });

  // Build map: creator_id → latest stat
  const latestMap = new Map();
  for (const stat of (recentStats || [])) {
    if (!latestMap.has(stat.creator_id)) {
      latestMap.set(stat.creator_id, stat);
    }
  }

  // Attach follower count and sort
  return creators
    .map(c => ({
      ...c,
      _followers: latestMap.get(c.id)?.subscribers || latestMap.get(c.id)?.followers || 0,
    }))
    .sort((a, b) => b._followers - a._followers)
    .slice(0, TOP_N);
}

// ─── Platform API fetchers ────────────────────────────────────────────────────
let twitchToken = null;

async function getTwitchToken() {
  if (twitchToken) return twitchToken;
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  twitchToken = data.access_token;
  return twitchToken;
}

let kickToken = null;

async function getKickToken() {
  if (kickToken) return kickToken;
  const res = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: KICK_CLIENT_ID,
      client_secret: KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  kickToken = data.access_token;
  return kickToken;
}

async function fetchYouTubeLive(platformId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${platformId}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const ch = data.items?.[0];
  if (!ch) throw new Error('Channel not found in YouTube API');
  return {
    subscribers:  parseInt(ch.statistics.subscriberCount) || 0,
    total_views:  parseInt(ch.statistics.viewCount) || 0,
    total_posts:  parseInt(ch.statistics.videoCount) || 0,
  };
}

async function fetchTwitchLive(username) {
  const token = await getTwitchToken();

  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`, {
    headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` },
  });
  const userData = await userRes.json();
  const user = userData.data?.[0];
  if (!user) throw new Error('User not found in Twitch API');

  const followRes = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}&first=1`,
    { headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` } }
  );
  const followData = await followRes.json();
  if (followData.total === undefined) throw new Error('Twitch followers API returned no total');

  return { followers: followData.total };
}

async function fetchKickLive(username) {
  const token = await getKickToken();
  const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(username)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  const channel = data.data?.[0];
  if (!channel) throw new Error('Channel not found in Kick API');
  return { subscribers: channel.active_subscribers_count || 0 };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗`);
  console.log(`║         ShinyPull — Data Integrity Test Suite            ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.gray}${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST${C.reset}`);
  console.log(`${C.gray}Testing top ${TOP_N} creators per platform · API tolerance: warn >${API_WARN_PCT}% / fail >${API_FAIL_PCT}%${C.reset}\n`);

  // Credential check
  const creds = {
    '📺 YouTube': !!YOUTUBE_API_KEY,
    '🎮 Twitch':  !!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET),
    '📱 TikTok':  true, // no creds (scraping)
    '🟢 Kick':    !!(KICK_CLIENT_ID && KICK_CLIENT_SECRET),
  };
  console.log('Credentials:');
  for (const [name, ok] of Object.entries(creds)) {
    console.log(`  ${ok ? C.green + '✓' : C.red + '✗'}${C.reset} ${name}`);
  }

  // ── YouTube ────────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.blue}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}📺 YOUTUBE${C.reset}`);
  console.log(`${C.blue}${'─'.repeat(60)}${C.reset}`);

  if (!YOUTUBE_API_KEY) {
    console.log(`  ${C.yellow}Skipped — YouTube API key not configured${C.reset}`);
  } else {
    const creators = await getTopCreators('youtube');
    if (creators.length === 0) {
      console.log(`  ${C.yellow}No YouTube creators found in database${C.reset}`);
    }
    for (const creator of creators) {
      await testCreator(creator, () => fetchYouTubeLive(creator.platform_id));
    }
  }

  // ── Twitch ─────────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.blue}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}🎮 TWITCH${C.reset}`);
  console.log(`${C.blue}${'─'.repeat(60)}${C.reset}`);

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.log(`  ${C.yellow}Skipped — Twitch credentials not configured${C.reset}`);
  } else {
    const creators = await getTopCreators('twitch');
    if (creators.length === 0) {
      console.log(`  ${C.yellow}No Twitch creators found in database${C.reset}`);
    }
    for (const creator of creators) {
      await testCreator(creator, () => fetchTwitchLive(creator.username));
    }
  }

  // ── TikTok ─────────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.blue}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}📱 TIKTOK${C.reset}`);
  console.log(`${C.blue}${'─'.repeat(60)}${C.reset}`);

  {
    const creators = await getTopCreators('tiktok');
    if (creators.length === 0) {
      console.log(`  ${C.yellow}No TikTok creators found in database${C.reset}`);
    }
    for (const creator of creators) {
      await testCreator(creator, () => scrapeTikTokProfile(creator.username));
      // Polite delay between TikTok scrapes
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ── Kick ───────────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.blue}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}🟢 KICK${C.reset}`);
  console.log(`${C.blue}${'─'.repeat(60)}${C.reset}`);

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
    console.log(`  ${C.yellow}Skipped — Kick credentials not configured${C.reset}`);
  } else {
    const creators = await getTopCreators('kick');
    if (creators.length === 0) {
      console.log(`  ${C.yellow}No Kick creators found in database${C.reset}`);
    }
    for (const creator of creators) {
      await testCreator(creator, () => fetchKickLive(creator.username));
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const total = totalPass + totalWarn + totalFail;

  console.log(`\n${C.bold}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}RESULTS${C.reset}  (${total} checks · ${elapsed}s)`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  ${C.green}${C.bold}PASS${C.reset}  ${totalPass}`);
  console.log(`  ${C.yellow}${C.bold}WARN${C.reset}  ${totalWarn}  ${C.gray}(within tolerance — review if persistent)${C.reset}`);
  console.log(`  ${C.red}${C.bold}FAIL${C.reset}  ${totalFail}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (totalFail > 0) {
    console.log(`${C.red}${C.bold}✗ ${totalFail} check(s) failed. Investigate before next data collection run.${C.reset}\n`);
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log(`${C.yellow}${C.bold}⚠ All checks passed with ${totalWarn} warning(s). Data looks healthy.${C.reset}\n`);
  } else {
    console.log(`${C.green}${C.bold}✓ All ${total} checks passed. Data integrity confirmed.${C.reset}\n`);
  }
}

main().catch(err => {
  console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}`);
  process.exit(1);
});
