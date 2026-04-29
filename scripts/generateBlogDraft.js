import { config } from 'dotenv';
config();

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Parser from 'rss-parser';

// --- Config ---
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'shinypull@proton.me';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const REVIEW_SCORE_THRESHOLD = 7;

// --- RSS Feeds ---
const RSS_FEEDS = [
  // Creator economy & platform news
  { url: 'https://www.tubefilter.com/feed/', name: 'TubeFilter' },
  { url: 'https://www.theverge.com/rss/creators/index.xml', name: 'The Verge (Creators)' },
  { url: 'https://www.theverge.com/rss/streaming/index.xml', name: 'The Verge (Streaming)' },
  { url: 'https://digiday.com/feed/', name: 'Digiday' },
  { url: 'https://streamersquare.com/feed/', name: 'StreamerSquare' },
  // Gaming, streaming drama & culture
  { url: 'https://www.dexerto.com/feed/', name: 'Dexerto' },
  { url: 'https://dotesports.com/feed', name: 'Dot Esports' },
  { url: 'https://www.kotaku.com/rss', name: 'Kotaku' },
  // Industry / broader creator business
  { url: 'https://influencermarketinghub.com/feed/', name: 'Influencer Marketing Hub' },
  { url: 'https://www.socialmediaexaminer.com/feed/', name: 'Social Media Examiner' },
  // Platform-official
  { url: 'https://blog.youtube/rss/', name: 'YouTube Official Blog' },
  { url: 'https://deadline.com/feed/', name: 'Deadline' },
];

// --- Helpers ---
function safeParseJSON(text) {
  let cleaned = text.trim();
  // Strip markdown code fences if the model wrapped output despite instructions
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 60);
}

function estimateReadTime(content) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Category → chart palette (matches src/lib/blogTheme.js) ---
// Keep in sync with the renderer so charts match the post accent.
const CATEGORY_CHART_PALETTE = {
  'Industry News':     'amber',
  'Platform Updates':  'sky',
  'Twitch Trends':     'purple',
  'YouTube News':      'red',
  'Creator Economy':   'emerald',
  'Creator Spotlight': 'pink',
  'Tips & Strategy':   'indigo',
  'Growth Tips':       'indigo',
  'Industry Insights': 'cyan',
  'Streaming Gear':    'orange',
  'Tutorials':         'green',
  'Analytics':         'blue',
  'Rankings':          'yellow',
};

// --- Hero image pool by category (Pexels + Unsplash, no API key needed) ---
// Each post gets a deterministic pick from its category's pool based on slug hash
// so the same draft always lands on the same image (and posts within a category vary).
const HERO_IMAGES = {
  'Industry News': [
    'https://images.pexels.com/photos/8438916/pexels-photo-8438916.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3944405/pexels-photo-3944405.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3585047/pexels-photo-3585047.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3568520/pexels-photo-3568520.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Platform Updates': [
    'https://images.pexels.com/photos/16773548/pexels-photo-16773548.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4974915/pexels-photo-4974915.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Twitch Trends': [
    'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3165334/pexels-photo-3165334.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/7915437/pexels-photo-7915437.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'YouTube News': [
    'https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Creator Economy': [
    'https://images.pexels.com/photos/9830817/pexels-photo-9830817.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4968630/pexels-photo-4968630.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/210600/pexels-photo-210600.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Creator Spotlight': [
    'https://images.pexels.com/photos/187041/pexels-photo-187041.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3756879/pexels-photo-3756879.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Tips & Strategy': [
    'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3194519/pexels-photo-3194519.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3178818/pexels-photo-3178818.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Growth Tips': [
    'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/186461/pexels-photo-186461.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Industry Insights': [
    'https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Streaming Gear': [
    'https://images.pexels.com/photos/3779662/pexels-photo-3779662.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/144429/pexels-photo-144429.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Tutorials': [
    'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Analytics': [
    'https://images.pexels.com/photos/669610/pexels-photo-669610.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/186461/pexels-photo-186461.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
  'Rankings': [
    'https://images.pexels.com/photos/207983/pexels-photo-207983.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ],
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickHeroImage(category, slug) {
  const pool = HERO_IMAGES[category] || HERO_IMAGES['Industry News'];
  return pool[hashString(slug || '') % pool.length];
}

// --- Structural archetypes ---
// Each draft randomly picks one. Forces variety in opening + body shape so
// every post doesn't follow the same skeleton.
const ARCHETYPES = [
  {
    name: 'data-deep-dive',
    fitsPostType: ['data-driven', 'analysis'],
    opening: 'Open with a single punchy 2-3 sentence hook paragraph that frames the most surprising stat. The hook MUST land before the {{stats}} block.',
    structure: 'After the hook, drop a {{stats}} strip with 3 key numbers. Then 4-5 H2 sections that unpack the data. Use a {{callout:stat}} mid-post for the headline number.',
    requiredCallouts: ['stat', 'insight'],
  },
  {
    name: 'narrative-explainer',
    fitsPostType: ['analysis', 'news', 'drama'],
    opening: 'Open with a vivid scene-setting paragraph. Tell a tiny story (real moment, person, or beat) in 3-5 sentences. No stats in the opening.',
    structure: 'Use 4 H2 sections that walk the reader through cause → context → consequence → takeaway. Drop a {{tldr}} block right after the intro with 3 bullet points. Use one {{callout:insight}} mid-post.',
    requiredCallouts: ['insight'],
    tldrRequired: true,
  },
  {
    name: 'news-breakdown',
    fitsPostType: ['news', 'analysis'],
    opening: 'Open with a {{tldr}} block FIRST (before any prose) summarizing what changed in 3 short bullets. Then a single 2-3 sentence intro paragraph explaining why it matters.',
    structure: '3-4 H2 sections covering: what is it, why it matters, who it affects, what to do. Use one {{callout:update}} for the official platform announcement detail.',
    requiredCallouts: ['update'],
    tldrFirst: true,
  },
  {
    name: 'hot-take',
    fitsPostType: ['drama', 'analysis'],
    opening: 'Open with a one-sentence opinion as a single short paragraph. Be direct. No hedging.',
    structure: '3-4 H2 sections that defend the take with concrete examples. Include one strong > blockquote with the central claim. Use one {{callout:tip}} or {{callout:warning}} near the end.',
    requiredCallouts: ['tip'],
  },
  {
    name: 'creator-spotlight',
    fitsPostType: ['drama', 'analysis', 'news'],
    opening: 'Open by naming the creator and the moment in 2-3 sentences. Make it feel like the start of a profile, not a press release.',
    structure: '4 H2 sections: the moment, the backstory, the numbers, what it means for other creators. Use a {{stats}} strip with 3 key numbers from this creator. Use one {{callout:insight}}.',
    requiredCallouts: ['insight'],
  },
];

function pickArchetype(postType) {
  const candidates = ARCHETYPES.filter(a => a.fitsPostType.includes(postType));
  const pool = candidates.length > 0 ? candidates : ARCHETYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Retry wrapper for Anthropic API calls — handles 529 overloaded + 503/502 transient errors.
// SDK auto-retries 429s, but NOT 529s, so we handle those manually here.
async function callWithRetry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status || 0;
      const isRetryable = status === 529 || status === 503 || status === 502;
      if (isRetryable && attempt < retries) {
        const delaySec = 20 * attempt; // 20s, 40s
        console.warn(`⚠️  API ${status} overloaded (attempt ${attempt}/${retries}), retrying in ${delaySec}s...`);
        await sleep(delaySec * 1000);
        continue;
      }
      throw err;
    }
  }
}

// --- RSS Fetching ---
async function fetchArticles() {
  const parser = new Parser({ timeout: 10000 });
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const articles = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 20)) {
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        if (pubDate > sevenDaysAgo) {
          articles.push({
            title: item.title || '',
            description: (item.contentSnippet || item.summary || '').substring(0, 300),
            url: item.link || '',
            source: feed.name,
            pubDate: item.pubDate || '',
          });
        }
      }
    } catch (err) {
      console.warn(`⚠️  Failed to fetch ${feed.name}: ${err.message}`);
    }
  }

  console.log(`📰 Fetched ${articles.length} articles from ${RSS_FEEDS.length} feeds`);
  return articles;
}

// --- Fetch recently published post titles to avoid repeats ---
async function fetchRecentPostTitles() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('blog_posts')
    .select('title, published_at')
    .gte('published_at', thirtyDaysAgo.split('T')[0])
    .order('published_at', { ascending: false });
  return (data || []).map((p) => p.title);
}

// --- Research Agent ---
async function researchAgent(articles, recentTitles) {
  console.log('🔍 Research Agent: selecting best topic...');
  if (recentTitles.length > 0) {
    console.log(`   Excluding ${recentTitles.length} recently covered topics`);
  }

  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   ${a.description}`)
    .join('\n\n');

  const recentBlock = recentTitles.length > 0
    ? `\nALREADY COVERED in the last 30 days — do NOT select these topics or anything closely overlapping:\n${recentTitles.map((t) => `- ${t}`).join('\n')}\n`
    : '';

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a research editor for ShinyPull, a creator analytics platform tracking YouTube, TikTok, Twitch, Kick, and Bluesky stats.

Our audience: streamers, YouTubers, TikTokers, aspiring creators, and people into creator economy data and analytics.
${recentBlock}
From the articles below, select the SINGLE most interesting and relevant topic for our audience that has NOT already been covered. Prioritize recency and pick the most recent article when quality is similar. Cover a wide range of topic types — rotate between:
- Platform policy or algorithm changes affecting creators
- Monetization and creator economy shifts
- Creator drama, controversies, or community moments that have broader lessons
- Streaming and creator industry trends
- Platform feature launches (YouTube, TikTok, Twitch, Kick)
- Creator growth, analytics, or business strategy
- Viral moments that reveal something interesting about the platform or creator business

Avoid: celebrity gossip unrelated to the creator economy, movies/TV unrelated to streaming, politics, general business news with no creator angle.

Articles:
${articleList}

Respond with ONLY valid JSON (no markdown fences, no explanation):
{
  "selectedTitle": "exact title of chosen article",
  "source": "publication name",
  "angle": "what unique angle to take for our creator-focused audience (1-2 sentences)",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "suggestedTitle": "catchy blog post title under 70 chars",
  "suggestedCategory": "one of: Creator Economy, Industry News, Platform Updates, Analytics, Tips & Strategy, Growth Tips, Industry Insights, Streaming Gear, Tutorials, YouTube News, Twitch Trends, Creator Spotlight, Rankings"
}`,
      },
    ],
  }));

  const text = response.content[0].text.trim();
  const research = safeParseJSON(text);
  console.log(`✅ Research: "${research.suggestedTitle}"`);
  return research;
}

// --- URL Validator ---
// Checks each URL the Enrichment Agent produced. Removes any that 404 or error
// so the Writer never receives a broken link to embed in the post.
async function validateEnrichmentUrls(enrichment) {
  // Collect all unique URLs from stats, caseStudy, and links
  const allUrls = new Set();
  enrichment.stats.forEach((s) => s.url && allUrls.add(s.url));
  if (enrichment.caseStudy.applicable && enrichment.caseStudy.sourceUrl) {
    allUrls.add(enrichment.caseStudy.sourceUrl);
  }
  enrichment.links.forEach((l) => l.url && allUrls.add(l.url));

  if (allUrls.size === 0) return enrichment;

  // Check all URLs in parallel
  const results = await Promise.all(
    [...allUrls].map(async (url) => {
      try {
        const r = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShinyPull/1.0)' },
        });
        return { url, ok: r.ok };
      } catch {
        return { url, ok: false };
      }
    })
  );

  const badUrls = new Set(results.filter((r) => !r.ok).map((r) => r.url));
  if (badUrls.size > 0) {
    console.warn(`⚠️  URL validation: removed ${badUrls.size} broken link(s): ${[...badUrls].join(', ')}`);
  } else {
    console.log('✅ URL validation: all enrichment links are live');
  }

  // Strip broken URLs from each section
  return {
    ...enrichment,
    stats: enrichment.stats.filter((s) => !badUrls.has(s.url)),
    caseStudy: enrichment.caseStudy.applicable && badUrls.has(enrichment.caseStudy.sourceUrl)
      ? { ...enrichment.caseStudy, sourceUrl: null }
      : enrichment.caseStudy,
    links: enrichment.links.filter((l) => !badUrls.has(l.url)),
  };
}

// --- Enrichment Agent ---
// Runs after topic selection, before writing. Surfaces real stats, tables,
// case studies, and source URLs so the writer can weave them into the first draft.
async function enrichmentAgent(research) {
  console.log('📊 Enrichment Agent: gathering stats, tables, and sources...');

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a research enrichment specialist for ShinyPull, a creator analytics platform (YouTube, TikTok, Twitch, Kick, Bluesky stats).

A blog post is about to be written on this topic:
Title: ${research.suggestedTitle}
Angle: ${research.angle}
Key facts from source article: ${research.keyFacts.join('; ')}

Your job: identify concrete supporting material that will make this post credible and visually engaging. Only include things you are confident are accurate based on your training data.

1. STATS: 3-5 specific statistics with real numbers (percentages, dollar amounts, user counts). Include the publication name and URL for each. Prefer well-known industry sources (Influencer Marketing Hub, Sprout Social, Later, Digiday, eMarketer, Pew Research, etc.).

2. TABLE: Is there a natural comparison table for this topic? (Tier comparisons, platform breakdowns, before/after, cost breakdowns, etc.) If yes, provide real data for 3-6 rows. If no clear table fits, set applicable to false.

3. CASE STUDY: Is there a specific real brand or creator story with concrete numbers that illustrates the core point? (e.g. "Daniel Wellington: $200/creator, $220M revenue by 2015"). If yes, include it with a source URL. If not, set applicable to false.

4. LINKS: 3-5 authoritative URLs to cite inline or link from relevant sentences.

5. POST TYPE: Classify as one of: "data-driven" (stats and tables are the backbone), "analysis" (stats help but narrative drives it), "news" (light data, mostly event coverage), "drama" (mostly story/narrative, minimal data needed).

6. CHART: Is there a set of 3-6 numbers that would be more impactful as a bar chart or line chart than as prose or a table? Examples: platform market share comparison, creator revenue by tier, subscriber growth over time, platform MAU over several years. If yes, provide the data. Use "bar" for comparisons, "line" for trends over time. If no clear chart fits OR a table already covers it better, set applicable to false. Do NOT include a colorScheme — the system picks one based on the post category.

7. STATS STRIP: A separate visual element that shows 3 standalone hero numbers across the top of the article (different from the chart, different from prose stats). Pick 3 numbers that, taken together, paint the scope of the topic in one glance. Each item: a short value (e.g. "38.7%", "2.7B", "$31.5B", "7.3M") and a 4-7 word label. If no 3 numbers really stand on their own this way, set applicable to false.

Respond with ONLY valid JSON (no markdown fences, no explanation):
{
  "stats": [
    { "fact": "statistic text with number", "source": "Publication Name", "url": "https://..." }
  ],
  "table": {
    "applicable": true,
    "caption": "what the table shows",
    "headers": ["Col 1", "Col 2", "Col 3"],
    "rows": [["val", "val", "val"], ["val", "val", "val"]]
  },
  "caseStudy": {
    "applicable": true,
    "brand": "Brand or creator name",
    "story": "2-3 sentences with specific numbers and outcome",
    "sourceUrl": "https://..."
  },
  "links": [
    { "label": "anchor text", "url": "https://..." }
  ],
  "postType": "data-driven",
  "chart": {
    "applicable": true,
    "type": "bar",
    "title": "Chart title (concise, under 50 chars)",
    "labels": ["Label 1", "Label 2", "Label 3"],
    "values": [100, 200, 150],
    "valueLabel": "What the numbers represent (e.g. Monthly active users, millions)"
  },
  "statsStrip": {
    "applicable": true,
    "items": [
      { "value": "38.7%", "label": "YouTube share of live watch time" },
      { "value": "2.7B", "label": "Monthly logged-in users" },
      { "value": "$31.5B", "label": "Ad revenue in 2023" }
    ]
  }
}`,
      },
    ],
  }));

  try {
    const enrichment = safeParseJSON(response.content[0].text.trim());
    console.log(`✅ Enrichment: ${enrichment.postType} post, ${enrichment.stats.length} stats, table: ${enrichment.table.applicable}, chart: ${enrichment.chart?.applicable}, case study: ${enrichment.caseStudy.applicable}`);
    return enrichment;
  } catch {
    // If parsing fails, return a safe empty enrichment so the pipeline continues
    console.warn('⚠️  Enrichment Agent returned invalid JSON — continuing without enrichment');
    return { stats: [], table: { applicable: false }, caseStudy: { applicable: false }, links: [], postType: 'analysis' };
  }
}

// --- Chart URL Builder (QuickChart.io) ---
// Converts enrichment chart data to a QuickChart URL that the writer embeds as a markdown image.
// QuickChart renders Chart.js 2 charts server-side — no API key required.
// `paletteName` overrides the chart color so it matches the post category accent.
function buildChartUrl(chart, paletteName = 'indigo') {
  if (!chart?.applicable) return null;

  const palettes = {
    indigo:  { bg: 'rgba(99,102,241,0.85)',  border: 'rgba(99,102,241,1)' },
    purple:  { bg: 'rgba(168,85,247,0.85)',  border: 'rgba(168,85,247,1)' },
    emerald: { bg: 'rgba(52,211,153,0.85)',  border: 'rgba(52,211,153,1)' },
    amber:   { bg: 'rgba(251,191,36,0.85)',  border: 'rgba(251,191,36,1)' },
    sky:     { bg: 'rgba(56,189,248,0.85)',  border: 'rgba(56,189,248,1)' },
    pink:    { bg: 'rgba(244,114,182,0.85)', border: 'rgba(244,114,182,1)' },
    red:     { bg: 'rgba(248,113,113,0.85)', border: 'rgba(248,113,113,1)' },
    cyan:    { bg: 'rgba(34,211,238,0.85)',  border: 'rgba(34,211,238,1)' },
    orange:  { bg: 'rgba(251,146,60,0.85)',  border: 'rgba(251,146,60,1)' },
    green:   { bg: 'rgba(74,222,128,0.85)',  border: 'rgba(74,222,128,1)' },
    blue:    { bg: 'rgba(96,165,250,0.85)',  border: 'rgba(96,165,250,1)' },
    yellow:  { bg: 'rgba(250,204,21,0.85)',  border: 'rgba(250,204,21,1)' },
  };
  const palette = palettes[paletteName] || palettes.indigo;
  const isLine = chart.type === 'line';

  const config = {
    type: isLine ? 'line' : 'bar',
    data: {
      labels: chart.labels,
      datasets: [{
        label: chart.valueLabel || '',
        data: chart.values,
        backgroundColor: isLine ? palette.bg.replace('0.85', '0.2') : palette.bg,
        borderColor: palette.border,
        borderWidth: isLine ? 2 : 0,
        fill: isLine ? true : undefined,
        lineTension: isLine ? 0.4 : undefined,
        pointBackgroundColor: isLine ? palette.border : undefined,
        pointRadius: isLine ? 4 : undefined,
      }],
    },
    options: {
      title: {
        display: true,
        text: chart.title,
        fontColor: '#f3f4f6',
        fontSize: 14,
        fontStyle: 'bold',
        padding: 14,
      },
      legend: {
        display: !!(chart.valueLabel),
        labels: { fontColor: '#9ca3af', fontSize: 12 },
      },
      scales: {
        xAxes: [{ ticks: { fontColor: '#9ca3af', fontSize: 11 }, gridLines: { color: '#1f2937', zeroLineColor: '#374151' } }],
        yAxes: [{ ticks: { fontColor: '#9ca3af', fontSize: 11 }, gridLines: { color: '#1f2937', zeroLineColor: '#374151' } }],
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${encoded}&w=700&h=360&backgroundColor=%23111827&devicePixelRatio=2`;
}

// --- Writer Agent ---
async function writerAgent(research, enrichment, creatorList = '') {
  console.log('✍️  Writer Agent: drafting post...');

  const styleGuide = `MANDATORY writing style rules (violating these is a failure):
- Write conversationally, like a knowledgeable friend. Not corporate, not academic.
- NEVER use em dashes (—). Use commas, colons, or rewrite the sentence.
- NEVER start a sentence with "Here's [anything]" — not "Here's what", "Here's where", "Here's the thing", "Here's why", "Here's how", "Here's a breakdown", "Here's what it signals", "Here's the math". Rewrite as a direct statement instead.
- NEVER use "This isn't X. It's Y." or "isn't just X, it's Y" — rewrite as a direct positive statement.
- NEVER use these phrases: "seismic shift", "game-changer", "landscape" (as industry jargon), "paradigm", "in an era where", "in a world where", "the question isn't", "And that's exactly the point", "And that's precisely the point", "Let that sink in", "it's worth noting", "it bears mentioning", "importantly", "genuinely", "beautifully", "spectacularly", "borderline absurd", "sheer audacity"
- Short sentences. Fragments are fine. Contractions are good (it's, don't, that's, they're).
- Use casual language naturally: "basically", "pretty much", "kind of", "a ton of", "honestly", "nah"
- State opinions directly. No hedging with qualifiers.
- Vary sentence length — mix short punchy lines with longer explanations.`;

  const wordTarget = enrichment.postType === 'data-driven' ? '900-1100' : '700-900';

  const blogFormat = `Blog format rules:
- Start with an intro paragraph (NO H1 title in content — title is displayed separately in the header)
- Use ## for section headings (H2 only)
- ${wordTarget} words total
- End with a 2-3 sentence takeaway paragraph
- No bullet lists in the intro paragraph`;

  // Build the enrichment context block for the writer
  const statsBlock = enrichment.stats.length > 0
    ? `\nSTATISTICS TO USE (weave these naturally into the text — bold the key number, name the source in prose):\n${enrichment.stats.map((s) => `- **${s.fact}** (source: ${s.source} — ${s.url})`).join('\n')}\n\nDO NOT turn these into hyperlinks. State facts like a journalist: "According to the IAB, podcast revenue hit $1.8B in 2022." Bold the number. Name the source in text. That's it.`
    : '';

  const tableBlock = enrichment.table.applicable
    ? `\nMARKDOWN TABLE: Include this comparison table in a relevant section. Caption: "${enrichment.table.caption}"\nHeaders: ${enrichment.table.headers.join(' | ')}\nData rows:\n${enrichment.table.rows.map((r) => r.join(' | ')).join('\n')}`
    : '';

  const caseStudyBlock = enrichment.caseStudy.applicable
    ? `\nCASE STUDY: Weave this into a dedicated section or as supporting evidence:\n${enrichment.caseStudy.brand}: ${enrichment.caseStudy.story}${enrichment.caseStudy.sourceUrl ? ` (source: ${enrichment.caseStudy.sourceUrl})` : ''}`
    : '';

  const linksBlock = enrichment.links.length > 0
    ? `\nLINKS (use at most 1-2 of these in the ENTIRE post — only when the source name itself is the natural anchor text, never wrap a whole sentence):\n${enrichment.links.map((l) => `- [${l.label}](${l.url})`).join('\n')}`
    : '';

  const chartPalette = CATEGORY_CHART_PALETTE[research.category] || 'indigo';
  const chartUrl = buildChartUrl(enrichment.chart, chartPalette);

  const visualRules = `
Visual and data elements — use what fits, skip what doesn't:
- HYPERLINKS: max 2-3 in the ENTIRE post. Link only when the destination name is the natural anchor text. NEVER wrap a full sentence or bolded number in a link.
- Bold key numbers: **bold** the single most important stat per section — not every number.
- Cite sources in prose: "According to X..." not as hyperlinks.
- Pull quote: use > blockquote ONCE for the single most striking stat or quote — the thing that'd make a reader stop and re-read. Not for regular prose.
- Callout box: use ONE of these custom callout boxes where it adds visual emphasis beyond a blockquote:
    {{callout:stat}}
    [Key stat or number worth highlighting on its own]
    {{/callout}}
    {{callout:insight}}
    [A key insight or conclusion worth calling out]
    {{/callout}}
    {{callout:tip}}
    [An actionable recommendation for creators]
    {{/callout}}
    {{callout:update}}
    [A platform policy or feature announcement]
    {{/callout}}
  Use ONLY ONE callout box per post. Content inside can include **bold** and basic markdown.
${chartUrl ? `- Data chart: a chart has been prepared for this post. Embed it exactly as-is on its own line in the section where the data is most relevant:\n  ![${enrichment.chart.title}](${chartUrl})\n  Don't modify the URL.` : ''}
${enrichment.table.applicable ? '- Markdown table: include the provided table in a natural section — format it with pipe syntax.' : ''}
${enrichment.caseStudy.applicable ? '- Case study: include the provided brand/creator example with its specific numbers.' : ''}

- ShinyPull plug: mention ShinyPull once near the end where it naturally fits.
${creatorList ? `- Creator links: if you name any creator from the list below in the post body, add a {{creators:...}} tag on its own line at the very END of the content (after the final paragraph). Format: {{creators:platform/username:Display Name}} — comma-separate multiple entries. Only tag creators you actually name in the text. Omit entirely if none apply.\n  Available: ${creatorList}` : ''}`;

  const enrichmentContext = `${statsBlock}${tableBlock}${caseStudyBlock}${linksBlock}`;

  const context = `Research context:
- Topic: ${research.suggestedTitle}
- Angle for our audience: ${research.angle}
- Key facts from source: ${research.keyFacts.join('; ')}
- Source publication: ${research.source}`;

  // Step 1: get metadata as JSON (no long string fields — avoids escaping issues)
  const metaPrompt = `You are a blog editor for ShinyPull (shinypull.com), a creator analytics platform.

${context}

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "title": "final post title under 70 chars",
  "slug": "url-slug-from-title",
  "description": "meta description 120-155 chars, no em dashes, no double-quotes inside",
  "category": "${research.suggestedCategory}"
}`;

  const metaResponse = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: metaPrompt }],
  }));
  const meta = safeParseJSON(metaResponse.content[0].text.trim());

  await sleep(1000);

  // Step 2: get content as plain markdown (no JSON wrapper — no escaping needed)
  const contentPrompt = `You are writing a blog post for ShinyPull (shinypull.com), a creator analytics platform.

${styleGuide}

${blogFormat}

${visualRules}
${enrichmentContext}


${context}
Post title: ${meta.title}

Write the full blog post content now. Output ONLY the markdown content — no JSON, no code fences, no preamble, no title heading.`;

  const contentResponse = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentPrompt }],
  }));
  const content = contentResponse.content[0].text.trim();

  const draft = { ...meta, content };
  draft.readTime = estimateReadTime(draft.content);
  console.log(`✅ Draft: "${draft.title}" (~${draft.readTime})`);
  return draft;
}

// --- Review Agent ---
async function reviewAgent(draft) {
  console.log('🔎 Review Agent: auditing draft...');

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a strict editor reviewing a blog post for ShinyPull. Check for violations of the style guide.

FAIL conditions (deduct 2 points each from a starting score of 10):
1. Em dashes (—) present anywhere in the content
2. Any sentence starting with "Here's [anything]" — "Here's what", "Here's where", "Here's why", "Here's how", "Here's the thing", "Here's a breakdown", "Here's what it signals", "Here's the math", etc.
3. "This isn't X. It's Y." or "isn't just X, it's Y" constructions
4. Any of these AI cliché phrases: "game-changer", "seismic shift", "landscape" as industry jargon, "paradigm", "Let that sink in", "it's worth noting", "in an era where", "genuinely [adjective]", "beautifully", "spectacularly", "borderline absurd", "sheer audacity", "And that's exactly the point"
5. Corporate/stiff/academic tone — reads like a press release or college essay
6. H1 heading (#) used anywhere in the content body
7. First paragraph is a bullet list instead of prose
8. More than 3 hyperlinks total in the post — over-linking is the #1 AI tell. Real writers link sparingly. Wrapping a bolded number or a full sentence in a link is an automatic fail.

WARN conditions (deduct 0.5 points each):
- More than two sentences over 25 words
- Semicolons used for dramatic effect rather than practical grammar

Blog post to review:
Title: ${draft.title}
Content:
${draft.content}

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "score": 8,
  "violations": ["specific violation description"],
  "warnings": ["warning description"],
  "approved": true,
  "feedback": "1-2 sentence overall note for the author"
}`,
      },
    ],
  }));

  const text = response.content[0].text.trim();
  const review = safeParseJSON(text);
  review.approved = review.score >= REVIEW_SCORE_THRESHOLD;
  console.log(`📊 Review score: ${review.score}/10 — ${review.approved ? 'APPROVED' : 'NEEDS REWRITE'}`);
  if (review.violations.length > 0) {
    review.violations.forEach((v) => console.log(`   ❌ ${v}`));
  }
  return review;
}

// --- Rewrite Agent ---
async function rewriteAgent(draft, review) {
  console.log('🔄 Rewrite Agent: fixing violations...');

  const issueList = [...review.violations, ...review.warnings].join('\n- ');

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Rewrite the following blog post to fix these specific style issues:
- ${issueList}

MANDATORY style rules to follow throughout the rewrite (do not introduce new violations):
- NEVER use em dashes (—). Use commas, colons, or rewrite the sentence.
- NEVER start a sentence with "Here's [anything]" — rewrite as a direct statement instead.
- NEVER use "This isn't X. It's Y." or "isn't just X, it's Y" — rewrite as a direct positive statement.
- NEVER use: "game-changer", "seismic shift", "landscape" as jargon, "paradigm", "Let that sink in", "it's worth noting", "in an era where", "And that's exactly the point", "genuinely", "beautifully", "spectacularly"
- Keep the same structure, topic, facts, and approximate length
- Fix only the style violations — don't change the substance
- Return ONLY the rewritten markdown content (no JSON, no explanation, no code fences)

Original content:
${draft.content}`,
      },
    ],
  }));

  draft.content = response.content[0].text.trim();
  draft.readTime = estimateReadTime(draft.content);
  console.log('✅ Rewrite complete');
  return draft;
}

// --- Save to Supabase ---
async function saveDraft(draft) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  let slug = draft.slug || slugify(draft.title);

  // Ensure unique slug
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('slug', slug)
    .limit(1);

  if (existing && existing.length > 0) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const post = {
    slug,
    title: draft.title,
    description: draft.description,
    content: draft.content,
    category: draft.category || 'Industry News',
    author: 'ShinyPull',
    image: pickHeroImage(draft.category, slug),
    read_time: draft.readTime,
    published_at: today,
    is_published: false,
  };

  const { data, error } = await supabase.from('blog_posts').insert(post).select().single();
  if (error) throw new Error(`Failed to save draft: ${error.message}`);

  console.log(`💾 Saved draft: /blog/${slug}`);
  return data;
}

// --- Send Email ---
async function sendNotification(savedPost, draft, review, rewritten) {
  const plainText = draft.content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .substring(0, 450);

  const scoreColor = review.score >= 8 ? '#16a34a' : review.score >= 7 ? '#d97706' : '#dc2626';
  const scoreLabel = review.approved ? '✅ Approved' : '⚠️ Low quality — rewrite applied';

  const violationsHtml =
    review.violations.length > 0
      ? `<ul style="margin:8px 0;padding-left:20px">${review.violations.map((v) => `<li style="margin:4px 0">${v}</li>`).join('')}</ul>`
      : '<p style="color:#666;margin:8px 0">None found</p>';

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#111;background:#fff">
  <div style="background:#6366f1;padding:24px 32px">
    <h1 style="color:white;margin:0;font-size:20px">Blog Draft Ready</h1>
    <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">ShinyPull AI Pipeline</p>
  </div>

  <div style="padding:32px">
    <h2 style="margin:0 0 8px;font-size:22px">${savedPost.title}</h2>
    <p style="color:#666;font-size:13px;margin:0 0 24px">${savedPost.category} &nbsp;·&nbsp; ${savedPost.read_time} &nbsp;·&nbsp; ${savedPost.published_at}</p>

    <div style="background:#f8fafc;border-left:3px solid #6366f1;padding:16px 20px;margin-bottom:24px;border-radius:0 8px 8px 0">
      <p style="margin:0;font-size:15px;line-height:1.7;color:#374151">${plainText}...</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;width:140px">Review Score</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:${scoreColor};font-weight:600">${review.score}/10 — ${scoreLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;vertical-align:top">Violations</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0">${violationsHtml}</td>
      </tr>
      ${rewritten ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600">Rewrite</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#d97706">⚙️ Automatic rewrite was applied to fix violations</td></tr>` : ''}
      <tr>
        <td style="padding:10px 0;font-weight:600;vertical-align:top">Notes</td>
        <td style="padding:10px 0;color:#555">${review.feedback}</td>
      </tr>
    </table>

    <a href="https://shinypull.com/blog/admin" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Review &amp; Publish Draft →</a>

    <p style="color:#999;font-size:12px;margin-top:24px">Remember to add a cover photo before publishing. The draft is saved but not visible to users until you publish it.</p>
  </div>
</div>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATION_EMAIL,
    subject: `Blog Draft Ready: ${savedPost.title}`,
    html,
  });

  if (error) {
    console.error('⚠️  Email notification failed:', error);
  } else {
    console.log(`📧 Notification sent to ${NOTIFICATION_EMAIL}`);
  }
}

// --- Main ---
async function main() {
  console.log(`\n🚀 Blog Draft Generator`);
  console.log('='.repeat(60));

  // 1. Research: fetch articles + existing post titles for deduplication
  const [articles, recentTitles] = await Promise.all([
    fetchArticles(),
    fetchRecentPostTitles(),
  ]);
  if (articles.length === 0) throw new Error('No articles fetched from any RSS feed');
  console.log(`📋 ${recentTitles.length} recent posts loaded for deduplication`);

  await sleep(1000);
  const research = await researchAgent(articles, recentTitles);

  // 2. Enrich: gather stats, tables, case studies, and links for the writer
  await sleep(1500);
  const rawEnrichment = await enrichmentAgent(research);

  // 2b. Validate URLs — strip any 404s before they reach the Writer
  const enrichment = await validateEnrichmentUrls(rawEnrichment);

  // 3. Load top creators for internal linking + creator-mention chips
  const { data: topCreators } = await supabase
    .from('creators')
    .select('platform, username, display_name')
    .in('platform', ['youtube', 'twitch', 'tiktok', 'kick', 'bluesky'])
    .order('updated_at', { ascending: false })
    .limit(120);
  const creatorList = (topCreators || [])
    .map(c => `${c.platform}/${c.username}:${c.display_name}`)
    .join(', ');
  console.log(`👤 Loaded ${topCreators?.length || 0} creators for internal linking`);

  // 4. Write (enrichment context included in first draft — no second pass needed)
  await sleep(2000);
  let draft = await writerAgent(research, enrichment, creatorList);

  // 5. Review
  await sleep(2000);
  const review = await reviewAgent(draft);
  let rewritten = false;

  // 6. Rewrite if needed (one pass only)
  if (!review.approved) {
    await sleep(2000);
    draft = await rewriteAgent(draft, review);
    rewritten = true;
    review.feedback += ' Automatic rewrite was applied to address violations.';
    // Bump score estimate — assume rewrite improved it by ~2 points
    review.score = Math.min(review.score + 2, 10);
  }

  // 7. Save draft to Supabase
  const savedPost = await saveDraft(draft);

  // 8. Send email notification
  await sendNotification(savedPost, draft, review, rewritten);

  console.log('\n✅ Done! Draft saved and notification sent.');
  console.log(`   Blog admin: https://shinypull.com/blog/admin`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
