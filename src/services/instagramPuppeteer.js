/**
 * Instagram Scraper using Puppeteer
 * Launches headless Chrome to fully render pages and extract data
 *
 * Two extraction strategies:
 * 1. DOM extraction (header section) — most accurate, requires full page render
 * 2. Meta tag fallback (og:description) — works even behind login walls
 */
import puppeteer from 'puppeteer';

let browser = null;

/**
 * Get or create browser instance (reuse for efficiency)
 */
async function getBrowser() {
  if (!browser) {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    };

    // Use system Chrome if explicitly configured
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    browser.on('disconnected', () => { browser = null; });
  }
  return browser;
}

/**
 * Close browser when done
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

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
 * Scrape Instagram profile data using Puppeteer
 */
export async function scrapeInstagramProfile(username) {
  const br = await getBrowser();
  const page = await br.newPage();

  try {
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // Navigate to profile
    const url = `https://www.instagram.com/${username}/`;
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() || 'no response'} for ${url}`);
    }

    // Try DOM extraction first (most accurate), fall back to meta tags
    const hasMain = await page.$('main').then(el => !!el);

    let data;
    if (hasMain) {
      data = await extractFromDOM(page);
    }

    // If DOM extraction failed or returned no data, try meta tags
    if (!data || (data.followers === 0 && data.posts === 0)) {
      const metaData = await extractFromMetaTags(page);
      if (metaData && (metaData.followers > 0 || metaData.posts > 0)) {
        data = metaData;
      }
    }

    await page.close();

    if (!data || (data.followers === 0 && data.posts === 0)) {
      throw new Error('Could not extract profile data from DOM or meta tags');
    }

    return {
      platform: 'instagram',
      platformId: username,
      username: username,
      displayName: data.displayName || username,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || username)}&size=200&bold=true&background=e1306c&color=fff`,
      description: data.bio || '',
      followers: data.followers,
      following: data.following,
      totalPosts: data.posts,
      isVerified: data.isVerified || false,
      isPrivate: false,
      category: 'Creator',
    };

  } catch (error) {
    try { await page.close(); } catch (_) { /* page already closed */ }
    throw new Error(`Failed to scrape ${username}: ${error.message}`);
  }
}

/**
 * Extract profile data from the rendered DOM (primary strategy)
 */
async function extractFromDOM(page) {
  return page.evaluate(() => {
    const parseCount = (text) => {
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
    };

    const headerSection = document.querySelector('header section');
    let followers = 0;
    let following = 0;
    let posts = 0;

    if (headerSection) {
      const listItems = headerSection.querySelectorAll('ul li');
      listItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const count = parseCount(item.querySelector('span')?.textContent || item.textContent);
        if (text.includes('post')) posts = count;
        if (text.includes('follower')) followers = count;
        if (text.includes('following')) following = count;
      });
    }

    const nameEl = document.querySelector('header section h2, header section span');
    const name = nameEl ? nameEl.textContent.trim() : '';

    const bioEl = document.querySelector('header section > div h1, header section > div span');
    const bio = bioEl ? bioEl.textContent.trim() : '';

    const isVerified = !!document.querySelector('[aria-label*="Verified"]');

    return {
      displayName: name || '',
      bio: bio || '',
      followers,
      following,
      posts,
      isVerified,
    };
  });
}

/**
 * Extract profile data from og:description meta tag (fallback strategy)
 * Works even behind Instagram's login wall since meta tags are server-rendered
 * Format: "123M Followers, 100 Following, 456 Posts - See Instagram photos and videos from Display Name (@username)"
 */
async function extractFromMetaTags(page) {
  return page.evaluate(() => {
    const parseCount = (text) => {
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
    };

    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';

    // Parse: "123M Followers, 100 Following, 456 Posts - See Instagram photos..."
    const statsMatch = ogDesc.match(/^([\d.,]+[KMBkmb]?)\s+Followers?,\s*([\d.,]+[KMBkmb]?)\s+Following,\s*([\d.,]+[KMBkmb]?)\s+Posts?/i);

    if (!statsMatch) return null;

    const followers = parseCount(statsMatch[1]);
    const following = parseCount(statsMatch[2]);
    const posts = parseCount(statsMatch[3]);

    // Extract display name from og:description or og:title
    // og:description format: "... from Display Name (@username)"
    let displayName = '';
    const nameMatch = ogDesc.match(/from\s+(.+?)\s*\(@/);
    if (nameMatch) {
      displayName = nameMatch[1].trim();
    } else if (ogTitle) {
      // og:title is often "Display Name (@username) • Instagram photos and videos"
      const titleMatch = ogTitle.match(/^(.+?)\s*\(@/);
      if (titleMatch) {
        displayName = titleMatch[1].trim();
      }
    }

    // Extract bio from description meta tag (different from og:description)
    const descMeta = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    let bio = '';
    const bioMatch = descMeta.match(/Posts\s*-\s*(.+)/);
    if (bioMatch) {
      bio = bioMatch[1].trim();
    }

    return {
      displayName,
      bio,
      followers,
      following,
      posts,
      isVerified: false, // Can't determine from meta tags
    };
  });
}

/**
 * Scrape multiple profiles with delays
 */
export async function scrapeInstagramProfilesBatch(usernames, delayMs = 5000) {
  const profiles = [];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      console.log(`[${i + 1}/${usernames.length}] Scraping ${username}...`);
      const profile = await scrapeInstagramProfile(username);
      profiles.push(profile);
      console.log(`  ✓ ${profile.displayName}: ${(profile.followers / 1000000).toFixed(1)}M followers`);

      // Delay between requests to avoid detection
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
