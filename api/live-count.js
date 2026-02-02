// Vercel Serverless Function for Real-Time YouTube Subscriber Count
// Scrapes YouTube's public page for live subscriber data

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
  // Build the URL
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

  // Extract ytInitialData JSON from the page
  const ytInitialData = extractYtInitialData(html);

  if (!ytInitialData) {
    throw new Error('Could not find ytInitialData in page');
  }

  // Parse the data
  const subscriberCount = findSubscriberCount(ytInitialData);
  const channelName = findChannelName(ytInitialData, html);
  const channelImage = findChannelImage(ytInitialData, html);
  const extractedChannelId = findChannelId(ytInitialData, html);

  if (subscriberCount === null) {
    throw new Error('Could not extract subscriber count from ytInitialData');
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

function extractYtInitialData(html) {
  // Find ytInitialData in the page - it's in a script tag
  const patterns = [
    /var\s+ytInitialData\s*=\s*(\{.+?\});(?:\s*<\/script>|;\s*var)/s,
    /ytInitialData\s*=\s*(\{.+?\});/s,
    /window\["ytInitialData"\]\s*=\s*(\{.+?\});/s,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        // Clean up the JSON string - remove any trailing content
        let jsonStr = match[1];

        // Try to parse, handling potential issues
        const parsed = JSON.parse(jsonStr);
        return parsed;
      } catch (e) {
        // Try to find the end of the JSON object by counting braces
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
  // Recursively search for subscriberCountText in the data
  const searchPaths = [
    // Common paths where subscriber count is found
    'header.c4TabbedHeaderRenderer.subscriberCountText.simpleText',
    'header.c4TabbedHeaderRenderer.subscriberCountText.accessibility.accessibilityData.label',
    'header.pageHeaderRenderer.content.pageHeaderViewModel.metadata.contentMetadataViewModel.metadataRows',
    'metadata.channelMetadataRenderer.subscriberCountText',
  ];

  // Try direct paths first
  for (const path of searchPaths) {
    const value = getNestedValue(data, path);
    if (value) {
      if (typeof value === 'string') {
        const count = parseSubscriberString(value);
        if (count !== null && count > 0) return count;
      } else if (Array.isArray(value)) {
        // Handle metadataRows array
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

  // Look for subscriberCount as a number
  const subscriberCounts = deepSearch(data, 'subscriberCount');
  for (const item of subscriberCounts) {
    if (typeof item === 'number' && item > 0) return item;
    if (typeof item === 'string') {
      const num = parseInt(item, 10);
      if (!isNaN(num) && num > 0) return num;
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

  // Extract the number part - handle various formats
  // "278M subscribers" -> 278000000
  // "278 million subscribers" -> 278000000
  // "1.23M subscribers" -> 1230000
  // "309M subscribers" -> 309000000

  let cleaned = str.toLowerCase().trim();

  // Remove "subscribers" and similar text
  cleaned = cleaned.replace(/subscriber[s]?/gi, '').trim();

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

  // Handle plain numbers with commas: 309,000,000
  const plainNumber = cleaned.replace(/[,\s]/g, '').match(/^(\d+)$/);
  if (plainNumber) {
    return parseInt(plainNumber[1], 10);
  }

  // Last resort - extract any number
  const anyNumber = cleaned.match(/([\d,]+)/);
  if (anyNumber) {
    const num = parseInt(anyNumber[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 1000) return num; // Only return if it looks like a real count
  }

  return null;
}

function findChannelName(data, html) {
  // Try ytInitialData first
  const names = deepSearch(data, 'title');
  for (const name of names) {
    if (typeof name === 'string' && name.length > 0 && name.length < 100) {
      return name;
    }
  }

  // Fallback to HTML meta tags
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
  // Try ytInitialData
  const avatars = deepSearch(data, 'avatar');
  for (const avatar of avatars) {
    if (avatar?.thumbnails?.[0]?.url) {
      return avatar.thumbnails[avatar.thumbnails.length - 1].url.replace(/=s\d+-/, '=s176-');
    }
  }

  // Fallback to HTML
  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImage && ogImage[1]) {
    return ogImage[1];
  }

  return null;
}

function findChannelId(data, html) {
  // Try ytInitialData
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

  // Fallback to HTML
  const channelMatch = html.match(/channel\/([UC][a-zA-Z0-9_-]{22})/);
  if (channelMatch) {
    return channelMatch[1];
  }

  return null;
}
