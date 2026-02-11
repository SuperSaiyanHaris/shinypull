/**
 * Instagram Service - Public Data Scraping
 * Scrapes public HTML pages since API requires authentication
 * Rate-limited for respectful scraping
 */

/**
 * Fetch Instagram profile data by scraping public HTML
 * @param {string} username - Instagram username (without @)
 * @returns {Promise<Object>} Profile data
 */
export async function fetchInstagramProfile(username) {
  try {
    // Use regular HTML page, not API endpoint (API requires auth/cookies)
    const url = `https://www.instagram.com/${username}/`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    if (response.status === 404) {
      throw new Error('Profile not found');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract shared data JSON from HTML
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/);
    if (sharedDataMatch) {
      const sharedData = JSON.parse(sharedDataMatch[1]);
      const userData = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;

      if (userData) {
        return {
          platform: 'instagram',
          platformId: userData.id,
          username: userData.username,
          displayName: userData.full_name || userData.username,
          profileImage: userData.profile_pic_url_hd || userData.profile_pic_url,
          description: userData.biography || '',
          isVerified: userData.is_verified || false,
          isPrivate: userData.is_private || false,
          followers: userData.edge_followed_by?.count || 0,
          following: userData.edge_follow?.count || 0,
          totalPosts: userData.edge_owner_to_timeline_media?.count || 0,
          externalUrl: userData.external_url || null,
          category: userData.category_name || 'Creator',
        };
      }
    }

    // Fallback: Extract from meta tags
    const metaFollowers = html.match(/content="([0-9,]+)\s+Followers/i);
    const metaPosts = html.match(/content="([0-9,]+)\s+Posts/i);
    const metaName = html.match(/<meta property="og:title"\s+content="([^"]+)"/i);
    const metaImage = html.match(/<meta property="og:image"\s+content="([^"]+)"/i);
    const metaBio = html.match(/<meta property="og:description"\s+content="([^"]+)"/i);

    if (metaName) {
      const fullTitle = metaName[1];
      // Title format: "Name (@username) • Instagram photos and videos"
      const nameMatch = fullTitle.match(/^(.+?)\s*\(@/);
      const displayName = nameMatch ? nameMatch[1] : username;

      return {
        platform: 'instagram',
        platformId: username, // Use username as ID since we can't get numeric ID
        username: username,
        displayName: displayName,
        profileImage: metaImage?.[1] || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=200&bold=true&background=e1306c&color=fff`,
        description: metaBio?.[1] || '',
        isVerified: false,
        isPrivate: false,
        followers: metaFollowers ? parseInt(metaFollowers[1].replace(/,/g, '')) : 0,
        following: 0,
        totalPosts: metaPosts ? parseInt(metaPosts[1].replace(/,/g, '')) : 0,
        externalUrl: null,
        category: 'Creator',
      };
    }

    throw new Error('Could not parse profile data from HTML');

  } catch (error) {
    console.error(`Error fetching Instagram profile ${username}:`, error.message);
    throw error;
  }
}

/**
 * Fetch multiple Instagram profiles with rate limiting
 * @param {string[]} usernames - Array of Instagram usernames
 * @param {number} delayMs - Delay between requests (default: 3000ms)
 * @returns {Promise<Object[]>} Array of profile data
 */
export async function fetchInstagramProfilesBatch(usernames, delayMs = 3000) {
  const profiles = [];

  for (const username of usernames) {
    try {
      const profile = await fetchInstagramProfile(username);
      profiles.push(profile);
      console.log(`✓ Fetched ${username}: ${(profile.followers / 1000).toFixed(0)}K followers`);

      // Rate limiting: wait between requests
      if (profiles.length < usernames.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`✗ Failed to fetch ${username}:`, error.message);
    }
  }

  return profiles;
}

/**
 * Search for Instagram profiles (uses basic web scraping)
 * Note: Limited functionality without authentication
 * @param {string} query - Search query
 * @returns {Promise<string[]>} Array of usernames
 */
export async function searchInstagramProfiles(query) {
  // For now, return empty array - discovery will use a curated list
  // Instagram's search endpoint requires authentication
  console.log(`Instagram search for "${query}" - using curated list instead`);
  return [];
}

export default {
  fetchInstagramProfile,
  fetchInstagramProfilesBatch,
  searchInstagramProfiles,
};
