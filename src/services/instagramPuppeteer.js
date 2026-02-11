/**
 * Instagram Scraper using Puppeteer
 * Launches headless Chrome to fully render pages and extract data
 */
import puppeteer from 'puppeteer';

let browser = null;

/**
 * Get or create browser instance (reuse for efficiency)
 */
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
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
 * Scrape Instagram profile data using Puppeteer
 */
export async function scrapeInstagramProfile(username) {
  const br = await getBrowser();
  const page = await br.newPage();

  try {
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // Navigate to profile
    const url = `https://www.instagram.com/${username}/`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for main content to load
    await page.waitForSelector('main', { timeout: 10000 });

    // Extract data from the page
    const data = await page.evaluate(() => {
      // Try to find follower count in various places
      const getTextContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      // Helper to parse numbers like "1.2M" or "345K"
      const parseCount = (text) => {
        if (!text) return 0;
        const cleaned = text.replace(/,/g, '');
        const match = cleaned.match(/([\d.]+)([KMBkmb])?/);
        if (!match) return 0;

        const num = parseFloat(match[1]);
        const suffix = match[2]?.toUpperCase();

        if (suffix === 'K') return Math.round(num * 1000);
        if (suffix === 'M') return Math.round(num * 1000000);
        if (suffix === 'B') return Math.round(num * 1000000000);
        return Math.round(num);
      };

      // Extract from header meta section
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

      // Get name and bio
      const nameEl = document.querySelector('header section h2, header section span');
      const name = nameEl ? nameEl.textContent.trim() : '';

      const bioEl = document.querySelector('header section > div h1, header section > div span');
      const bio = bioEl ? bioEl.textContent.trim() : '';

      // Get profile image
      const imgEl = document.querySelector('header img');
      const profileImage = imgEl ? imgEl.src : '';

      // Check if verified
      const isVerified = !!document.querySelector('[aria-label*="Verified"]');

      return {
        username: window.location.pathname.split('/')[1],
        displayName: name || '',
        bio: bio || '',
        profileImage: profileImage,
        followers: followers,
        following: following,
        posts: posts,
        isVerified: isVerified,
      };
    });

    await page.close();

    if (data.followers === 0 && data.posts === 0) {
      throw new Error('Could not extract follower data - page structure may have changed');
    }

    return {
      platform: 'instagram',
      platformId: username, // Use username as ID
      username: username,
      displayName: data.displayName || username,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || username)}&size=200&bold=true&background=e1306c&color=fff`,
      description: data.bio || '',
      followers: data.followers,
      following: data.following,
      totalPosts: data.posts,
      isVerified: data.isVerified,
      isPrivate: false,
      category: 'Creator',
    };

  } catch (error) {
    await page.close();
    throw new Error(`Failed to scrape ${username}: ${error.message}`);
  }
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
