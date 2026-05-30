/**
 * Rumble integration — public HTML scraping (no API exists).
 *
 * Rumble channels live at either `/c/{slug}` (channels) or `/user/{slug}`
 * (user accounts). We store the `c:slug` or `user:slug` prefix in
 * `platform_id` so we can rebuild the right URL on lookup. The `username`
 * column holds the bare slug for clean shinypull.com URLs.
 *
 * Parsing: Rumble's channel pages embed follower / video counts as plain
 * text in HTML elements with predictable class names. We grab the page,
 * regex out the numbers, and normalize to our schema.
 */

const BASE = 'https://rumble.com';

// Browser-ish UA so cloudfront doesn't 403 us
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Parse a "3.64M", "12.5K", "1.2B", or plain "1234" number into an integer.
 */
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

/**
 * Strip HTML entities + tags from a description blob.
 */
function cleanText(html) {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Given a Rumble channel page HTML, extract the data points we store.
 * Returns the normalized profile shape used by the rest of the app.
 *
 * The parser is intentionally permissive — Rumble has changed class names
 * before. We try multiple selectors and fall back gracefully.
 */
export function parseChannelHtml(html, { slug, kind, profileUrl }) {
  if (!html) return null;

  // Display name — `<h1 class="channel-header--title">` or `<h1>` near top
  const titleMatch =
    html.match(/<h1[^>]*class="[^"]*channel-header--title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const displayName = titleMatch ? cleanText(titleMatch[1]) : slug;

  // Avatar from og:image or the channel header img tag
  const avatarMatch =
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/class="channel-header--thumbnail"[^>]*src="([^"]+)"/i);
  const profileImage = avatarMatch ? avatarMatch[1] : null;

  // Description / bio
  const descMatch =
    html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
    html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  const description = descMatch ? cleanText(descMatch[1]) : null;

  // Followers — visible label is "Followers"; the number is in a span just before it.
  // Look for variants like `data-test="follower-count"` or the labeled pair.
  let followers = 0;
  const followerPatterns = [
    /<span[^>]*data-test="follower-count"[^>]*>([\d.,KMB\s]+)<\/span>/i,
    /([\d.,]+\s*[KMB]?)<\/span>\s*<span[^>]*>\s*Followers/i,
    /<div[^>]*class="[^"]*listing-header--followers[^"]*"[^>]*>\s*<span[^>]*>([\d.,KMB\s]+)<\/span>/i,
    />\s*([\d.,]+\s*[KMB])\s*Followers\b/i,
    />\s*([\d,]+)\s*Followers\b/i,
  ];
  for (const re of followerPatterns) {
    const m = html.match(re);
    if (m && m[1]) {
      followers = parseAbbreviated(m[1]);
      if (followers > 0) break;
    }
  }

  // Video count — Rumble shows "X videos" near the channel header
  let totalPosts = 0;
  const videoPatterns = [
    /<span[^>]*data-test="video-count"[^>]*>([\d.,KMB\s]+)<\/span>/i,
    />\s*([\d.,]+\s*[KMB]?)\s*videos?\b/i,
    /<span[^>]*>([\d,]+)<\/span>\s*<span[^>]*>\s*Videos/i,
  ];
  for (const re of videoPatterns) {
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
    description,
    country: null,
    category: null,
    subscribers: followers,
    followers,
    totalPosts,
    totalViews: null, // Aggregating per-video view counts would require N extra requests; skip for v1
    profileUrl,
  };
}

/**
 * Parse an input that might be:
 *   - a bare slug like `Bongino`
 *   - a `c:Bongino` or `user:Viva` platform_id
 *   - a full URL like `https://rumble.com/c/Bongino`
 * Returns `{ slug, kind, profileUrl }`.
 */
export function parseRumbleHandle(input, defaultKind = 'c') {
  if (!input) return null;
  const raw = String(input).trim();

  // Full URL
  const urlMatch = raw.match(/rumble\.com\/(c|user)\/([^/?#\s]+)/i);
  if (urlMatch) {
    const kind = urlMatch[1].toLowerCase();
    const slug = urlMatch[2];
    return { kind, slug, profileUrl: `${BASE}/${kind}/${slug}` };
  }

  // `c:Bongino` / `user:Viva` form
  const prefixed = raw.match(/^(c|user):(.+)$/i);
  if (prefixed) {
    const kind = prefixed[1].toLowerCase();
    const slug = prefixed[2];
    return { kind, slug, profileUrl: `${BASE}/${kind}/${slug}` };
  }

  // Bare slug — assume default kind (channel)
  return { kind: defaultKind, slug: raw, profileUrl: `${BASE}/${defaultKind}/${raw}` };
}

/**
 * Fetch a Rumble channel by slug or full input.
 * Falls back from /c/ to /user/ automatically if the first 404s.
 */
export async function getRumbleChannel(input) {
  const parsed = parseRumbleHandle(input);
  if (!parsed) return null;

  // Try the parsed URL first
  let res = await fetch(parsed.profileUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
  if (res.status === 404 && parsed.kind === 'c') {
    // Try the /user/ fallback
    const fallback = `${BASE}/user/${parsed.slug}`;
    res = await fetch(fallback, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      parsed.kind = 'user';
      parsed.profileUrl = fallback;
    }
  }
  if (!res.ok) return null;

  const html = await res.text();
  return parseChannelHtml(html, parsed);
}

/**
 * Browse a Rumble category page (e.g. `news`, `gaming`, `entertainment`).
 * Returns an array of `{ kind, slug }` for channels discovered on that page.
 * Used by both the seed and discovery scripts.
 */
export async function browseCategoryChannels(category, page = 1) {
  const url = `${BASE}/browse/${category}${page > 1 ? `?page=${page}` : ''}`;
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return [];
  const html = await res.text();

  // Pull all href="/c/foo" and href="/user/bar" occurrences. Dedupe.
  const seen = new Set();
  const out = [];
  // Rumble appends `?e9s=src_v1_clr` tracking params; match the slug only
  const re = /href="\/(c|user)\/([^"/?#]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const key = `${m[1]}:${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: m[1], slug: m[2] });
  }
  return out;
}

/**
 * Search Rumble for channels matching a query. Returns up to `limit` profiles.
 * Rumble's site search is video-focused but the result page does include some
 * channel hits — we extract those and skip the rest.
 */
export async function searchRumble(query, limit = 15) {
  if (!query || !query.trim()) return [];
  const url = `${BASE}/search/channel?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return [];
  const html = await res.text();

  const seen = new Set();
  const handles = [];
  // Rumble appends `?e9s=src_v1_clr` tracking params; match the slug only
  const re = /href="\/(c|user)\/([^"/?#]+)/g;
  let m;
  while ((m = re.exec(html)) !== null && handles.length < limit) {
    const key = `${m[1]}:${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    handles.push({ kind: m[1], slug: m[2] });
  }

  // Fetch each profile in parallel (cap concurrency = 5 to be polite)
  const results = [];
  for (let i = 0; i < handles.length; i += 5) {
    const slice = handles.slice(i, i + 5);
    const batch = await Promise.all(slice.map(({ kind, slug }) =>
      getRumbleChannel(`${kind}:${slug}`).catch(() => null)
    ));
    results.push(...batch.filter(Boolean));
  }
  return results;
}
