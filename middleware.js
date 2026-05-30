/**
 * Vercel Edge Middleware — injects page-specific OG meta tags for social sharing.
 *
 * Problem: ShinyPull is a React SPA. When iMessage/Slack/Twitter/Facebook fetches
 * a URL for a link preview, they get index.html — the React app never runs, so the
 * per-page <SEO> components never fire. Every shared link would otherwise show the
 * same generic "Creator Analytics" title.
 *
 * Solution: Intercept HTML requests at the edge, fetch index.html, do string
 * replacements on the meta tags based on the URL path, and return modified HTML.
 * Runs before any crawler sees the page; doesn't affect the SPA for real users
 * (the React app still boots and re-overrides meta tags via the SEO component).
 *
 * IMPORTANT: keep PLATFORM_NAMES + static page map in sync with new platforms /
 * new routes. The "adding a new platform" checklist in CLAUDE.md flags this file.
 */

export const config = {
  // Match all paths except API routes and static assets (files with extensions)
  matcher: ['/((?!api|.*\\..*).*)'],
};

const PLATFORM_NAMES = {
  youtube:  'YouTube',
  tiktok:   'TikTok',
  twitch:   'Twitch',
  kick:     'Kick',
  bluesky:  'Bluesky',
  music:    'Music',
  mastodon: 'Mastodon',
  rumble:   'Rumble',
};

const ALL_PLATFORM_LIST = 'YouTube, TikTok, Twitch, Kick, Bluesky, Mastodon, Rumble, and Music';

function getMeta(pathname, searchParams) {
  // /rankings or /rankings/:platform
  const rankingsMatch = pathname.match(/^\/rankings(?:\/(\w+))?$/);
  if (rankingsMatch) {
    const platform = PLATFORM_NAMES[rankingsMatch[1]];
    if (platform) {
      return {
        title: `Top ${platform} Creators - ShinyPull`,
        description: `Top ${platform} creators ranked by followers, subscribers, and growth. Updated daily.`,
      };
    }
    return {
      title: 'Top Creator Rankings - ShinyPull',
      description: `Top creators ranked by followers, subscribers, and growth across ${ALL_PLATFORM_LIST}.`,
    };
  }

  // /trending (or /trending/:platform if added later)
  if (pathname === '/trending' || pathname.startsWith('/trending/')) {
    return {
      title: 'Trending Creators - ShinyPull',
      description: 'The fastest growing creators across every platform. See who is gaining the most followers, subscribers, and listeners this month.',
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
          description: `Compare ${names[0]} and ${names[1]} side-by-side on ShinyPull. Subscribers, followers, views, growth, and earnings.`,
        };
      }
    }
    return {
      title: 'Compare Creators - ShinyPull',
      description: `Compare social media creators side-by-side across ${ALL_PLATFORM_LIST}.`,
    };
  }

  // /search
  if (pathname === '/search') {
    return {
      title: 'Search Creators - ShinyPull',
      description: `Search for any creator across ${ALL_PLATFORM_LIST}. Live profile lookup and instant stats.`,
    };
  }

  // /youtube/money-calculator (specific tool)
  if (pathname === '/youtube/money-calculator') {
    return {
      title: 'YouTube Money Calculator - ShinyPull',
      description: 'Estimate YouTube earnings based on views, CPM, and channel data. Free YouTube revenue calculator.',
    };
  }

  // /live/:platform/:username — noindex (transient real-time pages, not useful for search)
  const liveMatch = pathname.match(/^\/live\/(\w+)\/([^/]+)$/);
  if (liveMatch && PLATFORM_NAMES[liveMatch[1]]) {
    const platform = PLATFORM_NAMES[liveMatch[1]];
    const username = decodeURIComponent(liveMatch[2]);
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
    const username = decodeURIComponent(profileMatch[2]);
    return {
      title: `${username} ${platform} Stats - ShinyPull`,
      description: `${username}'s ${platform} subscriber count, follower growth, and rankings on ShinyPull.`,
    };
  }

  // /blog/:slug (placeholder — full blog metadata is injected client-side by the SEO component;
  // social previews show this generic title which is better than the default)
  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && blogMatch[1] !== 'admin') {
    return {
      title: 'ShinyPull Blog',
      description: 'Creator economy insights, platform trends, and analytics tips from ShinyPull.',
    };
  }

  // Static pages — keep this map exhaustive so every public route gets accurate social previews
  const staticPages = {
    '/blog':         { title: 'Blog - ShinyPull',                description: 'Creator economy insights, platform trends, and analytics tips from ShinyPull.' },
    '/dashboard':    { title: 'Dashboard - ShinyPull',           description: 'Track your followed creators and see their latest stats in one place.', noindex: true },
    '/account':      { title: 'Account - ShinyPull',             description: 'Manage your ShinyPull account and Featured Listings.', noindex: true },
    '/reports':      { title: 'Reports - ShinyPull',             description: 'Build custom reports and export creator stats across platforms.', noindex: true },
    '/about':        { title: 'About - ShinyPull',               description: `ShinyPull tracks creator stats across ${ALL_PLATFORM_LIST}. Real data, updated daily.` },
    '/contact':      { title: 'Contact - ShinyPull',             description: 'Get in touch with the ShinyPull team. We respond within 24-48 hours.' },
    '/faq':          { title: 'FAQ - ShinyPull',                 description: 'Frequently asked questions about ShinyPull, creator stats, and how we track the creator economy.' },
    '/methodology':  { title: 'Methodology - ShinyPull',         description: 'How ShinyPull collects creator statistics across YouTube, TikTok, Twitch, Kick, Bluesky, Mastodon, and Music.' },
    '/support':      { title: 'Support ShinyPull',               description: 'Support the data behind ShinyPull. Donations help cover API costs.' },
    '/promote':      { title: 'Featured Listings - ShinyPull',   description: 'Get your creator featured in our daily rankings. From $49/mo. Cancel anytime.' },
    '/refunds':      { title: 'Refund Policy - ShinyPull',       description: "ShinyPull's refund policy for Featured Listings." },
    '/privacy':      { title: 'Privacy Policy - ShinyPull',      description: "ShinyPull's privacy policy." },
    '/terms':        { title: 'Terms of Service - ShinyPull',    description: "ShinyPull's terms of service." },
    '/reset-password': { title: 'Reset Password - ShinyPull',    description: 'Reset your ShinyPull account password.', noindex: true },
  };
  if (staticPages[pathname]) return staticPages[pathname];

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
    .replace(/(<meta property="og:title" content=")[^"]*(")/,        `$1${meta.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${meta.description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${canonicalUrl}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${meta.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${meta.description}$2`)
    .replace(/(<meta name="description" content=")[^"]*(")/,         `$1${meta.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,               `$1${canonicalUrl}$2`);

  // For live + private pages, add noindex so they don't appear in search results
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
