/**
 * Image proxy — fetches remote images server-side so the browser doesn't get blocked
 * by referrer-based hotlink protection. YouTube's `yt3.googleusercontent.com` thumbnails
 * for very large channels (MrBeast, T-Series, etc.) sometimes 403 when loaded from
 * non-google.com origins. We proxy through this endpoint when that happens.
 *
 * GET /api/image-proxy?url=<encoded-url>
 *
 * Restrictions:
 *   - Only allows specific hostnames (creator avatar CDNs)
 *   - Caches aggressively at the edge (1 day)
 *   - Strips referrer + UA before forwarding
 */

const ALLOWED_HOSTS = new Set([
  'yt3.googleusercontent.com',
  'yt3.ggpht.com',
  'i.ytimg.com',
  'lh3.googleusercontent.com',
  'p16-sign-va.tiktokcdn.com',
  'p16-sign-sg.tiktokcdn.com',
  'p77-sign-va.tiktokcdn.com',
  'p77-sign-sg.tiktokcdn.com',
  'static-cdn.jtvnw.net',                // Twitch
  'files.kick.com',
  'cdn.bsky.app',
  'video.bsky.app',
  'i.scdn.co',                           // Spotify
  'lastfm.freetls.fastly.net',           // Last.fm
]);

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url parameter');

    let target;
    try { target = new URL(url); }
    catch { return res.status(400).send('Invalid url'); }

    if (target.protocol !== 'https:') {
      return res.status(400).send('Only https URLs are allowed');
    }
    if (!ALLOWED_HOSTS.has(target.hostname)) {
      return res.status(400).send('Host not allowed');
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShinyPull/1.0)',
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,*/*',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream error');
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.status(200).send(buf);
  } catch (err) {
    console.error('Image proxy error:', err.message);
    return res.status(500).send('Proxy error');
  }
}
