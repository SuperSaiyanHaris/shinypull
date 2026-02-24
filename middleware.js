/**
 * Vercel Edge Middleware — injects page-specific OG meta tags for social sharing.
 *
 * Problem: ShinyPull is a React SPA. When iMessage/Slack/Twitter fetches a URL
 * for a link preview, they get index.html — the React app never runs, so the
 * per-page <SEO> components never fire. Every shared link shows the same
 * generic "Creator Analytics" title.
 *
 * Solution: Intercept HTML requests at the edge, fetch index.html, do a string
 * replacement on the meta tags based on the URL path, and return the modified HTML.
 * This runs before any crawler sees the page, without affecting the SPA experience
 * for real users (the React app still boots and overrides meta tags normally).
 */

export const config = {
  // Match all paths except API routes and static assets (files with extensions)
  matcher: ['/((?!api|.*\\..*).*)'],
};

const PLATFORM_NAMES = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  twitch: 'Twitch',
  kick: 'Kick',
  bluesky: 'Bluesky',
};

function getMeta(pathname, searchParams) {
  // /rankings or /rankings/:platform
  const rankingsMatch = pathname.match(/^\/rankings(?:\/(\w+))?$/);
  if (rankingsMatch) {
    const platform = PLATFORM_NAMES[rankingsMatch[1]];
    if (platform) {
      return {
        title: `Top ${platform} Creators - ShinyPull`,
        description: `Top ${platform} creators ranked by followers, subscribers, and growth.`,
      };
    }
    return {
      title: 'Top Creator Rankings - ShinyPull',
      description: 'Top creators ranked by followers, subscribers, and growth across YouTube, TikTok, Twitch, Kick, and Bluesky.',
    };
  }

  // /compare (with or without ?creators=...)
  if (pathname === '/compare') {
    const creatorsParam = searchParams.get('creators');
    if (creatorsParam) {
      const names = creatorsParam
        .split(',')
        .slice(0, 2)
        .map(c => c.split(':')[1])
        .filter(Boolean);
      if (names.length >= 2) {
        return {
          title: `${names[0]} vs ${names[1]} - ShinyPull`,
          description: `Compare ${names[0]} and ${names[1]} side-by-side on ShinyPull.`,
        };
      }
    }
    return {
      title: 'Compare Creators - ShinyPull',
      description: 'Compare social media creators side-by-side across YouTube, TikTok, Twitch, Kick, and Bluesky.',
    };
  }

  // /search
  if (pathname === '/search') {
    return {
      title: 'Search Creators - ShinyPull',
      description: 'Search for any creator across YouTube, TikTok, Twitch, Kick, and Bluesky.',
    };
  }

  // /live/:platform/:username — noindex (transient real-time pages, not useful for search)
  const liveMatch = pathname.match(/^\/live\/(\w+)\/([^/]+)$/);
  if (liveMatch && PLATFORM_NAMES[liveMatch[1]]) {
    const platform = PLATFORM_NAMES[liveMatch[1]];
    const username = liveMatch[2];
    return {
      title: `${username} Live Count - ShinyPull`,
      description: `Real-time live ${platform} subscriber and follower count for ${username}.`,
      noindex: true,
    };
  }

  // /:platform/:username  (creator profile)
  const profileMatch = pathname.match(/^\/(\w+)\/([^/]+)$/);
  if (profileMatch && PLATFORM_NAMES[profileMatch[1]]) {
    const platform = PLATFORM_NAMES[profileMatch[1]];
    const username = profileMatch[2];
    return {
      title: `${username} ${platform} Stats - ShinyPull`,
      description: `${username}'s ${platform} subscriber count, follower growth, and rankings on ShinyPull.`,
    };
  }

  // /blog/:slug
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && blogMatch[1] !== 'admin') {
    return {
      title: 'ShinyPull Blog',
      description: 'Creator economy insights, platform trends, and analytics tips from ShinyPull.',
    };
  }

  return null; // Use index.html defaults for / and other pages
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const meta = getMeta(url.pathname, url.searchParams);

  if (!meta) return; // No modification needed — fall through to normal serving

  // Fetch the static index.html (the .html extension excludes it from the matcher,
  // so this fetch will NOT re-enter middleware — no infinite loop)
  let html;
  try {
    const res = await fetch(new URL('/index.html', url.origin));
    if (!res.ok) return; // Graceful fallback: serve unmodified if fetch fails
    html = await res.text();
  } catch {
    return;
  }

  // Inject page-specific values via string replacement
  const canonicalUrl = `https://shinypull.com${url.pathname}`;
  html = html
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${meta.title}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${meta.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${meta.description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${meta.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${meta.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,               `$1${canonicalUrl}$2`);

  // For live pages, add noindex so they don't appear in search results
  if (meta.noindex) {
    html = html.replace('</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>');
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      // Cache for 1 min at edge, stale-while-revalidate for up to 1 hour
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=3600',
    },
  });
}
