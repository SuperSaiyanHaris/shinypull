/**
 * Vercel Serverless Function — Rumble proxy.
 *
 * Rumble has no public API and the channel pages must be scraped from the
 * server side (CORS blocks browser-side fetch). This endpoint takes a
 * `platform_id` ("c:slug" or "user:slug") or a bare slug, fetches the channel
 * page, parses out followers + video count, and returns JSON.
 *
 * Usage:
 *   GET /api/rumble?id=c:Bongino
 *   GET /api/rumble?id=user:Styxhexenhammer666
 *   GET /api/rumble?id=Bongino  (assumed /c/)
 */

import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

const BASE = 'https://rumble.com';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'en-US,en;q=0.9',
};

function parseAbbreviated(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/i);
  if (!match) {
    const direct = parseInt(cleaned, 10);
    return Number.isNaN(direct) ? 0 : direct;
  }
  const num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') return Math.round(num * 1_000);
  if (suffix === 'M') return Math.round(num * 1_000_000);
  if (suffix === 'B') return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

function cleanText(html) {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim().substring(0, 500);
}

// Rumble's HTML mixes quoted, single-quoted, and unquoted attribute values
// (e.g. `property=og:image content=https://...`). This helper extracts the
// content attribute regardless of which quoting style was used.
function extractMeta(html, propertyName, propertyAttr = 'property') {
  // Matches: property="og:image" content="VALUE"  OR  property=og:image content=VALUE  OR  property='og:image' content='VALUE'
  const re = new RegExp(
    `<meta\\s+${propertyAttr}\\s*=\\s*["']?${propertyName.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}["']?\\s+content\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`,
    'i'
  );
  const m = html.match(re);
  if (!m) return null;
  return m[1] || m[2] || m[3] || null;
}

function parseChannelHtml(html, { slug, kind, profileUrl }) {
  if (!html) return null;

  // Title: prefer the <h1 class="channel-header--title">, fall back to og:title
  const h1Match = html.match(/<h1[^>]*class=["']?[^"'>]*channel-header--title[^"'>]*["']?[^>]*>([^<]+)<\/h1>/i);
  const ogTitle = extractMeta(html, 'og:title');
  const displayName = cleanText(h1Match ? h1Match[1] : ogTitle) || slug;

  // Avatar: og:image is the most reliable source
  const profileImage = extractMeta(html, 'og:image') || null;

  // Banner: channel-header--backsplash-img (full-width banner at top)
  let bannerImage = null;
  const bannerMatch = html.match(/class=["']?channel-header--backsplash-img["']?[^>]*src=["']([^"']+)["']/i)
    || html.match(/<img[^>]*class=["']channel-header--backsplash-img["'][^>]*src=["']([^"']+)["']/i);
  if (bannerMatch) bannerImage = bannerMatch[1];

  // Verified: presence of the verification-badge-icon SVG in the channel header block
  const verified = /channel-header--verified|verification-badge-icon/i.test(html);

  // Description: prefer name=description, fall back to og:description
  const description = cleanText(
    extractMeta(html, 'description', 'name') || extractMeta(html, 'og:description')
  );

  // Latest video: first .videostream block in the thumbnail__grid
  let latestPost = null;
  const videoBlockMatch = html.match(/<div\s+class=["']videostream[^"']*["'][\s\S]*?data-video-id=["'](\d+)["'][\s\S]*?<\/address>/i);
  if (videoBlockMatch) {
    const block = videoBlockMatch[0];
    const linkMatch = block.match(/href=["'](\/v[^"'?]+\.html)/i);
    const titleAttrMatch = block.match(/<h3[^>]*title=["']([^"']+)["']/i)
      || block.match(/<h3[^>]*>\s*([^<]+?)\s*<\/h3>/i);
    const dateMatch = block.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    const viewsMatch = block.match(/data-views=["'](\d+)["']/i);
    const thumbMatch = block.match(/class=["']thumbnail__image[^"']*["']\s+[^>]*src=["']([^"']+)["']/i);
    if (linkMatch && titleAttrMatch) {
      latestPost = {
        url: `${BASE}${linkMatch[1]}`,
        title: cleanText(titleAttrMatch[1]),
        publishedAt: dateMatch ? dateMatch[1] : null,
        views: viewsMatch ? parseInt(viewsMatch[1], 10) : null,
        thumbnail: thumbMatch ? thumbMatch[1] : null,
      };
    }
  }

  let followers = 0;
  for (const re of [
    /<span[^>]*data-test="follower-count"[^>]*>([\d.,KMB\s]+)<\/span>/i,
    /([\d.,]+\s*[KMB]?)<\/span>\s*<span[^>]*>\s*Followers/i,
    />\s*([\d.,]+\s*[KMB])\s*Followers\b/i,
    />\s*([\d,]+)\s*Followers\b/i,
  ]) {
    const m = html.match(re);
    if (m && m[1]) {
      followers = parseAbbreviated(m[1]);
      if (followers > 0) break;
    }
  }

  let totalPosts = 0;
  for (const re of [
    /<span[^>]*data-test="video-count"[^>]*>([\d.,KMB\s]+)<\/span>/i,
    />\s*([\d.,]+\s*[KMB]?)\s*videos?\b/i,
  ]) {
    const m = html.match(re);
    if (m && m[1]) {
      totalPosts = parseAbbreviated(m[1]);
      if (totalPosts > 0) break;
    }
  }

  return {
    platform: 'rumble',
    platformId: `${kind}:${slug}`,
    username: slug,
    displayName,
    profileImage,
    bannerImage,
    verified,
    description,
    country: null,
    category: null,
    subscribers: followers,
    followers,
    totalPosts,
    totalViews: null,
    latestPost,
    profileUrl,
  };
}

function parseHandle(input, defaultKind = 'c') {
  if (!input) return null;
  const raw = String(input).trim();
  const urlMatch = raw.match(/rumble\.com\/(c|user)\/([^/?#\s]+)/i);
  if (urlMatch) {
    return { kind: urlMatch[1].toLowerCase(), slug: urlMatch[2] };
  }
  const prefixed = raw.match(/^(c|user):(.+)$/i);
  if (prefixed) {
    return { kind: prefixed[1].toLowerCase(), slug: prefixed[2] };
  }
  return { kind: defaultKind, slug: raw };
}

export default async function handler(req, res) {
  // Rate-limit by client IP to stop runaway scraping via our proxy
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(clientId, 'rumble', { limit: 30, windowMs: 60_000 });
  if (!rate.allowed) {
    res.setHeader('Retry-After', Math.ceil(rate.resetIn / 1000));
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const id = req.query.id || req.query.slug;
  if (!id) {
    return res.status(400).json({ error: 'Missing id or slug parameter' });
  }

  const parsed = parseHandle(id);
  if (!parsed) return res.status(400).json({ error: 'Invalid handle' });

  // Try the parsed kind first, then fall back to the other kind on 404
  async function tryFetch(kind, slug) {
    const profileUrl = `${BASE}/${kind}/${slug}`;
    const r = await fetch(profileUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
    return { res: r, profileUrl, kind, slug };
  }

  try {
    let result = await tryFetch(parsed.kind, parsed.slug);
    if (result.res.status === 404 && parsed.kind === 'c') {
      result = await tryFetch('user', parsed.slug);
    }

    if (!result.res.ok && result.res.status !== 410) {
      // 410 still has a body we can parse; only bail on actual hard errors
      return res.status(result.res.status).json({ error: `Rumble returned ${result.res.status}` });
    }

    const html = await result.res.text();
    const profile = parseChannelHtml(html, { slug: result.slug, kind: result.kind, profileUrl: result.profileUrl });

    if (!profile) return res.status(404).json({ error: 'Could not parse channel' });

    // Edge cache: 5 min fresh, 1 hr SWR. Channel data doesn't change every second.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(profile);
  } catch (err) {
    console.error('[api/rumble] fetch error:', err.message);
    return res.status(502).json({ error: 'Failed to reach Rumble' });
  }
}
