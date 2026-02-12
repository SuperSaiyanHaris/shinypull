/**
 * Instagram Profile Scraper
 *
 * Uses a simple HTTP fetch with a bot user agent to get profile data
 * from Instagram's og:description meta tags. Instagram serves these
 * to social media bots (Facebook, Twitter, etc.) for link previews,
 * even when showing a login wall to regular browsers.
 *
 * No Puppeteer/Chrome needed — just a lightweight HTTP request.
 */

const BOT_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

/**
 * Parse abbreviated numbers like "1.2M", "345K", "1,234"
 */
function parseCount(text) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '');
  const match = cleaned.match(/([\d.]+)\s*([KMBkmb])?/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  if (suffix === 'K') return Math.round(num * 1000);
  if (suffix === 'M') return Math.round(num * 1000000);
  if (suffix === 'B') return Math.round(num * 1000000000);
  return Math.round(num);
}

/**
 * Decode HTML entities (&#064; → @, &#x1f5e1; → emoji, etc.)
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

/**
 * Scrape Instagram profile data using HTTP fetch + meta tags
 */
export async function scrapeInstagramProfile(username) {
  const url = `https://www.instagram.com/${username}/`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': BOT_USER_AGENT,
      'Accept': 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();

  // Extract og:description meta tag
  // Format: "1M Followers, 60 Following, 351 Posts - See Instagram photos and videos from Display Name (&#064;username)"
  const ogDescMatch = html.match(/property="og:description"\s+content="([^"]*)"/);
  const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]*)"/);

  if (!ogDescMatch) {
    throw new Error(`No og:description meta tag found for ${username}`);
  }

  const ogDesc = decodeHtmlEntities(ogDescMatch[1]);
  const ogTitle = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : '';

  // Parse stats: "1M Followers, 60 Following, 351 Posts"
  const statsMatch = ogDesc.match(/^([\d.,]+[KMBkmb]?)\s+Followers?,\s*([\d.,]+[KMBkmb]?)\s+Following,\s*([\d.,]+[KMBkmb]?)\s+Posts?/i);

  if (!statsMatch) {
    throw new Error(`Could not parse stats from og:description: "${ogDesc.substring(0, 100)}"`);
  }

  const followers = parseCount(statsMatch[1]);
  const following = parseCount(statsMatch[2]);
  const posts = parseCount(statsMatch[3]);

  // Extract display name from og:description: "... from Display Name (@username)"
  let displayName = username;
  const nameMatch = ogDesc.match(/from\s+(.+?)\s*\(@/);
  if (nameMatch) {
    displayName = nameMatch[1].trim();
  } else if (ogTitle) {
    const titleMatch = ogTitle.match(/^(.+?)\s*\(@/);
    if (titleMatch) {
      displayName = titleMatch[1].trim();
    }
  }

  // Extract bio from the description portion after "Posts - "
  let bio = '';
  const bioMatch = ogDesc.match(/Posts?\s*-\s*See Instagram.*?from\s+.+?\(@\w+\)\s*(.+)?$/);
  // Bio isn't reliably in og:description, so leave empty if not found

  return {
    platform: 'instagram',
    platformId: username,
    username: username,
    displayName: displayName,
    profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200&bold=true&background=e1306c&color=fff`,
    description: bio,
    followers: followers,
    following: following,
    totalPosts: posts,
    isVerified: false,
    isPrivate: false,
    category: 'Creator',
  };
}

/**
 * No-op for backwards compatibility (no browser to close)
 */
export async function closeBrowser() {
  // No browser to close — using fetch, not Puppeteer
}

/**
 * Scrape multiple profiles with delays
 */
export async function scrapeInstagramProfilesBatch(usernames, delayMs = 2000) {
  const profiles = [];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      console.log(`[${i + 1}/${usernames.length}] Scraping ${username}...`);
      const profile = await scrapeInstagramProfile(username);
      profiles.push(profile);
      console.log(`  ✓ ${profile.displayName}: ${(profile.followers / 1000000).toFixed(1)}M followers`);

      if (i < usernames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`  ✗ Failed to scrape ${username}:`, error.message);
    }
  }

  return profiles;
}

export default {
  scrapeInstagramProfile,
  scrapeInstagramProfilesBatch,
  closeBrowser,
};
