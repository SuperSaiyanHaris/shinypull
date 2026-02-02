// Vercel Serverless Function for Real-Time YouTube Subscriber Count
// Uses multiple methods to try to get exact subscriber counts

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
  // First, get the channel ID if we only have username
  let resolvedChannelId = channelId;
  let channelName = null;
  let channelImage = null;

  // Build the URL to fetch channel page
  let url;
  if (channelId) {
    url = `https://www.youtube.com/channel/${channelId}`;
  } else if (username) {
    const handle = username.startsWith('@') ? username : `@${username}`;
    url = `https://www.youtube.com/${handle}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube returned ${response.status}`);
  }

  const html = await response.text();
  const ytInitialData = extractYtInitialData(html);

  if (!ytInitialData) {
    throw new Error('Could not find ytInitialData in page');
  }

  // Get channel info
  channelName = findChannelName(ytInitialData, html);
  channelImage = findChannelImage(ytInitialData, html);
  resolvedChannelId = resolvedChannelId || findChannelId(ytInitialData, html);

  // Try to get exact subscriber count from multiple sources
  let subscriberCount = null;
  let isExact = false;

  // Method 1: Try to get exact count from third-party API (socialcounts.org style)
  if (resolvedChannelId) {
    try {
      const exactCount = await fetchExactCount(resolvedChannelId);
      if (exactCount && exactCount > 0) {
        subscriberCount = exactCount;
        isExact = true;
      }
    } catch (e) {
      console.log('Exact count fetch failed, falling back to scraping');
    }
  }

  // Method 2: Fall back to scraping if exact count not available
  if (!subscriberCount) {
    subscriberCount = findSubscriberCount(ytInitialData);
    isExact = false;
  }

  if (subscriberCount === null) {
    throw new Error('Could not extract subscriber count');
  }

  return {
    platform: 'youtube',
    username: username,
    channelId: resolvedChannelId || channelId,
    displayName: channelName,
    profileImage: channelImage,
    subscribers: subscriberCount,
    isExact: isExact,
    timestamp: new Date().toISOString(),
    source: isExact ? 'api' : 'scrape',
  };
}

// Try to fetch exact count from YouTube's internal API
async function fetchExactCount(channelId) {
  try {
    // Try YouTube's internal browse endpoint
    const response = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-Youtube-Client-Name': '1',
        'X-Youtube-Client-Version': '2.20240101.00.00',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00',
            hl: 'en',
            gl: 'US',
          },
        },
        browseId: channelId,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // Search for subscriberCount in the response
      const exactCounts = deepSearch(data, 'subscriberCount');
      for (const count of exactCounts) {
        if (typeof count === 'number' && count > 0) {
          return count;
        }
        if (typeof count === 'string') {
          const num = parseInt(count, 10);
          if (!isNaN(num) && num > 0) {
            return num;
          }
        }
      }

      // Also try to find exact count in subscriberCountText
      const texts = deepSearch(data, 'subscriberCountText');
      for (const text of texts) {
        // Check for exact numbers first (no abbreviations)
        const content = text?.simpleText || text?.content || '';
        if (content) {
          // Look for exact count patterns like "465,523,243 subscribers"
          const exactMatch = content.match(/^([\d,]+)\s*subscriber/i);
          if (exactMatch) {
            const num = parseInt(exactMatch[1].replace(/,/g, ''), 10);
            if (!isNaN(num) && num > 1000) {
              return num;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Internal API fetch failed:', e.message);
  }

  return null;
}

function extractYtInitialData(html) {
  const patterns = [
    /var\s+ytInitialData\s*=\s*(\{.+?\});(?:\s*<\/script>|;\s*var)/s,
    /ytInitialData\s*=\s*(\{.+?\});/s,
    /window\["ytInitialData"\]\s*=\s*(\{.+?\});/s,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        let jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);
        return parsed;
      } catch (e) {
        try {
          let jsonStr = match[1];
          let braceCount = 0;
          let endIndex = 0;

          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            if (jsonStr[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }

          if (endIndex > 0) {
            jsonStr = jsonStr.substring(0, endIndex);
            return JSON.parse(jsonStr);
          }
        } catch (e2) {
          console.error('Failed to parse ytInitialData:', e2.message);
        }
      }
    }
  }

  return null;
}

function findSubscriberCount(data) {
  // First, look for exact counts (no abbreviations)
  const subscriberCounts = deepSearch(data, 'subscriberCount');
  for (const item of subscriberCounts) {
    if (typeof item === 'number' && item > 0) return item;
    if (typeof item === 'string') {
      const num = parseInt(item, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // Search for subscriberCountText and parse it
  const searchPaths = [
    'header.c4TabbedHeaderRenderer.subscriberCountText.simpleText',
    'header.c4TabbedHeaderRenderer.subscriberCountText.accessibility.accessibilityData.label',
    'header.pageHeaderRenderer.content.pageHeaderViewModel.metadata.contentMetadataViewModel.metadataRows',
    'metadata.channelMetadataRenderer.subscriberCountText',
  ];

  for (const path of searchPaths) {
    const value = getNestedValue(data, path);
    if (value) {
      if (typeof value === 'string') {
        const count = parseSubscriberString(value);
        if (count !== null && count > 0) return count;
      } else if (Array.isArray(value)) {
        for (const row of value) {
          const parts = row?.metadataParts || [];
          for (const part of parts) {
            const text = part?.text?.content || part?.text?.simpleText || '';
            if (text.toLowerCase().includes('subscriber')) {
              const count = parseSubscriberString(text);
              if (count !== null && count > 0) return count;
            }
          }
        }
      }
    }
  }

  // Deep search for subscriberCountText
  const found = deepSearch(data, 'subscriberCountText');
  for (const item of found) {
    if (item.simpleText) {
      const count = parseSubscriberString(item.simpleText);
      if (count !== null && count > 0) return count;
    }
    if (item.accessibility?.accessibilityData?.label) {
      const count = parseSubscriberString(item.accessibility.accessibilityData.label);
      if (count !== null && count > 0) return count;
    }
  }

  return null;
}

function deepSearch(obj, key, results = []) {
  if (!obj || typeof obj !== 'object') return results;

  if (obj[key] !== undefined) {
    results.push(obj[key]);
  }

  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object') {
      deepSearch(obj[k], key, results);
    }
  }

  return results;
}

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return null;
    current = current[key];
  }

  return current;
}

function parseSubscriberString(str) {
  if (!str || typeof str !== 'string') return null;

  let cleaned = str.toLowerCase().trim();
  cleaned = cleaned.replace(/subscriber[s]?/gi, '').trim();

  // Check for exact number first (with commas)
  const exactMatch = cleaned.match(/^([\d,]+)$/);
  if (exactMatch) {
    return parseInt(exactMatch[1].replace(/,/g, ''), 10);
  }

  // Handle "million", "billion", "thousand" words
  if (cleaned.includes('million')) {
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return Math.round(num * 1000000);
  }
  if (cleaned.includes('billion')) {
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return Math.round(num * 1000000000);
  }
  if (cleaned.includes('thousand')) {
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return Math.round(num * 1000);
  }

  // Handle abbreviated format: 309M, 1.23K, 45.6B
  const abbrevMatch = cleaned.match(/([\d.]+)\s*([kmb])/i);
  if (abbrevMatch) {
    let num = parseFloat(abbrevMatch[1]);
    const suffix = abbrevMatch[2].toLowerCase();

    if (suffix === 'k') num *= 1000;
    else if (suffix === 'm') num *= 1000000;
    else if (suffix === 'b') num *= 1000000000;

    return Math.round(num);
  }

  // Handle plain numbers with commas
  const plainNumber = cleaned.replace(/[,\s]/g, '').match(/^(\d+)$/);
  if (plainNumber) {
    return parseInt(plainNumber[1], 10);
  }

  // Last resort
  const anyNumber = cleaned.match(/([\d,]+)/);
  if (anyNumber) {
    const num = parseInt(anyNumber[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 1000) return num;
  }

  return null;
}

function findChannelName(data, html) {
  const names = deepSearch(data, 'title');
  for (const name of names) {
    if (typeof name === 'string' && name.length > 0 && name.length < 100) {
      return name;
    }
  }

  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (ogTitle && ogTitle[1]) {
    return ogTitle[1].replace(/ - YouTube$/, '').trim();
  }

  const titleTag = html.match(/<title>([^<]+)<\/title>/);
  if (titleTag && titleTag[1]) {
    return titleTag[1].replace(/ - YouTube$/, '').trim();
  }

  return null;
}

function findChannelImage(data, html) {
  const avatars = deepSearch(data, 'avatar');
  for (const avatar of avatars) {
    if (avatar?.thumbnails?.[0]?.url) {
      return avatar.thumbnails[avatar.thumbnails.length - 1].url.replace(/=s\d+-/, '=s176-');
    }
  }

  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImage && ogImage[1]) {
    return ogImage[1];
  }

  return null;
}

function findChannelId(data, html) {
  const channelIds = deepSearch(data, 'channelId');
  for (const id of channelIds) {
    if (typeof id === 'string' && id.startsWith('UC') && id.length === 24) {
      return id;
    }
  }

  const externalIds = deepSearch(data, 'externalId');
  for (const id of externalIds) {
    if (typeof id === 'string' && id.startsWith('UC') && id.length === 24) {
      return id;
    }
  }

  const channelMatch = html.match(/channel\/([UC][a-zA-Z0-9_-]{22})/);
  if (channelMatch) {
    return channelMatch[1];
  }

  return null;
}
