/**
 * Instagram Service - Public Data Scraping
 * Uses Instagram's public JSON endpoints (no authentication required)
 * Rate-limited for respectful scraping
 */

/**
 * Fetch Instagram profile data using public endpoint
 * @param {string} username - Instagram username (without @)
 * @returns {Promise<Object>} Profile data
 */
export async function fetchInstagramProfile(username) {
  try {
    // Instagram's public JSON endpoint
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459', // Public Instagram web app ID
      },
    });

    if (response.status === 404) {
      throw new Error('Profile not found');
    }

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.data?.user;

    if (!user) {
      throw new Error('Invalid response from Instagram');
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
      externalUrl: user.external_url || null,
      category: user.category_name || null,
    };
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
