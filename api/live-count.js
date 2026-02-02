// Vercel Serverless Function for Real-Time YouTube Subscriber Count
// Scrapes YouTube's public page for live subscriber data (like livecounts.io)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { platform, username, channelId } = req.query;

  if (!platform || (!username && !channelId)) {
    return res.status(400).json({ error: 'Missing platform and username/channelId' });
  }

  try {
    if (platform === 'youtube') {
      const result = await getYouTubeLiveCount(username, channelId);
      return res.status(200).json(result);
    } else if (platform === 'twitch') {
      return res.status(400).json({ error: 'Use /api/twitch for Twitch data' });
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    console.error('Live count error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch live count' });
  }
}

async function getYouTubeLiveCount(username, channelId) {
  // Try multiple methods to get the most accurate count

  // Method 1: Fetch channel page and parse subscriber count
  let url;
  if (channelId) {
    url = `https://www.youtube.com/channel/${channelId}`;
  } else if (username) {
    // Handle both @username and plain username
    const handle = username.startsWith('@') ? username : `@${username}`;
    url = `https://www.youtube.com/${handle}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube returned ${response.status}`);
  }

  const html = await response.text();

  // Extract subscriber count from the page
  // YouTube embeds data in ytInitialData JSON object
  const subscriberCount = extractSubscriberCount(html);
  const channelName = extractChannelName(html);
  const channelImage = extractChannelImage(html);
  const extractedChannelId = extractChannelId(html);

  if (subscriberCount === null) {
    throw new Error('Could not extract subscriber count');
  }

  return {
    platform: 'youtube',
    username: username,
    channelId: extractedChannelId || channelId,
    displayName: channelName,
    profileImage: channelImage,
    subscribers: subscriberCount,
    timestamp: new Date().toISOString(),
    source: 'live-scrape',
  };
}

function extractSubscriberCount(html) {
  // Method 1: Look for subscriberCountText in ytInitialData
  // This gives us the exact count like "356,247,893 subscribers"

  // Try to find the exact count first
  const exactPatterns = [
    // Pattern for "X subscribers" in the page data
    /"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/,
    /"subscriberCountText":\s*\{\s*"accessibility":\s*\{\s*"accessibilityData":\s*\{\s*"label":\s*"([^"]+)"/,
    // Backup patterns
    /subscriberCountText['"]\s*:\s*\{[^}]*['"]simpleText['"]\s*:\s*['"]([^'"]+)['"]/,
    /subscriberCountText['"]\s*:\s*\{[^}]*accessibilityData[^}]*['"]label['"]\s*:\s*['"]([^'"]+)['"]/,
  ];

  for (const pattern of exactPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const countStr = match[1];
      // Parse "356M subscribers" or "356,247,893 subscribers" or "123K subscribers"
      const count = parseSubscriberString(countStr);
      if (count !== null) {
        return count;
      }
    }
  }

  // Method 2: Look for channel metadata
  const metaPatterns = [
    /"subscriberCount":\s*"?(\d+)"?/,
    /"subscriberCount":\s*(\d+)/,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

function parseSubscriberString(str) {
  if (!str) return null;

  // Remove "subscribers" and clean up
  let cleaned = str.toLowerCase()
    .replace(/subscribers?/gi, '')
    .replace(/\s+/g, '')
    .trim();

  // Handle abbreviated counts (123M, 45.6K, etc.)
  const abbreviated = cleaned.match(/^([\d.]+)([kmb])?$/i);
  if (abbreviated) {
    let num = parseFloat(abbreviated[1]);
    const suffix = (abbreviated[2] || '').toLowerCase();

    if (suffix === 'k') num *= 1000;
    else if (suffix === 'm') num *= 1000000;
    else if (suffix === 'b') num *= 1000000000;

    return Math.round(num);
  }

  // Handle full numbers with commas (356,247,893)
  const fullNumber = cleaned.replace(/,/g, '');
  const parsed = parseInt(fullNumber, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return null;
}

function extractChannelName(html) {
  const patterns = [
    /"channelMetadataRenderer":\s*\{[^}]*"title":\s*"([^"]+)"/,
    /"c4TabbedHeaderRenderer":[^}]*"title":\s*"([^"]+)"/,
    /<meta\s+property="og:title"\s+content="([^"]+)"/,
    /<title>([^<]+)<\/title>/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/ - YouTube$/, '').trim();
    }
  }

  return null;
}

function extractChannelImage(html) {
  const patterns = [
    /"avatar":\s*\{\s*"thumbnails":\s*\[\s*\{\s*"url":\s*"([^"]+)"/,
    /<meta\s+property="og:image"\s+content="([^"]+)"/,
    /"thumbnails":\s*\[\s*\{\s*"url":\s*"(https:\/\/yt3[^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/=s\d+-/, '=s176-');
    }
  }

  return null;
}

function extractChannelId(html) {
  const patterns = [
    /"channelId":\s*"([^"]+)"/,
    /"externalId":\s*"([^"]+)"/,
    /channel\/([UC][a-zA-Z0-9_-]{22})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
