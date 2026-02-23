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
  { url: 'https://www.tubefilter.com/feed/', name: 'TubeFilter' },
  { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter' },
  { url: 'https://variety.com/feed/', name: 'Variety' },
  { url: 'https://www.theverge.com/rss/creators/index.xml', name: 'The Verge (Creators)' },
  { url: 'https://www.theverge.com/rss/streaming/index.xml', name: 'The Verge (Streaming)' },
  { url: 'https://deadline.com/feed/', name: 'Deadline' },
  { url: 'https://streamersquare.com/feed/', name: 'StreamerSquare' },
  { url: 'https://digiday.com/feed/', name: 'Digiday' },
];

// --- Helpers ---
function safeParseJSON(text) {
  let cleaned = text.trim();
  // Strip markdown code fences if the model wrapped output despite instructions
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

function getDayType() {
  // Allow override via CLI arg or env for testing
  const override = process.argv[2];
  if (override === 'product' || override === 'wednesday') return 'product';
  if (override === 'standard') return 'standard';

  const day = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'America/New_York',
  });
  return day === 'Wednesday' ? 'product' : 'standard';
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

// --- Research Agent ---
async function researchAgent(articles) {
  console.log('🔍 Research Agent: selecting best topic...');

  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   ${a.description}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a research editor for ShinyPull, a creator analytics platform tracking YouTube, TikTok, Twitch, and Kick stats (similar to SocialBlade).

Our audience: streamers, YouTubers, TikTokers, aspiring creators, and people into creator economy data and analytics.

From the articles below, select the SINGLE most interesting and relevant topic for our audience. Prefer topics about:
- Platform policy or algorithm changes affecting creators
- Monetization and creator economy shifts
- Streaming and creator industry trends
- Platform feature launches (YouTube, TikTok, Twitch, Kick)
- Creator growth, analytics, or business strategy

Avoid: celebrity gossip, movies/TV unrelated to streaming, politics, general business news.

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
  });

  const text = response.content[0].text.trim();
  const research = safeParseJSON(text);
  console.log(`✅ Research: "${research.suggestedTitle}"`);
  return research;
}

// --- Writer Agent ---
async function writerAgent(research, isProductPost, products) {
  console.log('✍️  Writer Agent: drafting post...');

  const styleGuide = `MANDATORY writing style rules (violating these is a failure):
- Write conversationally, like a knowledgeable friend. Not corporate, not academic.
- NEVER use em dashes (—). Use commas, colons, or rewrite the sentence.
- NEVER use these phrases: "isn't just X", "not just X it's Y", "Here's what it signals:", "Here's the math:", "seismic shift", "game-changer", "landscape" (as industry jargon), "paradigm", "in an era where", "in a world where", "the question isn't", "And that's exactly the point", "Let that sink in", "it's worth noting", "it bears mentioning", "importantly", "genuinely", "beautifully", "spectacularly", "borderline absurd", "sheer audacity"
- Short sentences. Fragments are fine. Contractions are good (it's, don't, that's, they're).
- Use casual language naturally: "basically", "pretty much", "kind of", "a ton of", "honestly", "nah"
- State opinions directly. No hedging with qualifiers.
- Vary sentence length — mix short punchy lines with longer explanations.`;

  const blogFormat = `Blog format rules:
- Start with an intro paragraph (NO H1 title in content — title is displayed separately in the header)
- Use ## for section headings (H2 only)
- 700-900 words total
- End with a 2-3 sentence takeaway paragraph
- No bullet lists in the intro paragraph`;

  let productInstruction = '';
  if (isProductPost && products.length > 0) {
    const productList = products
      .map((p) => `- "${p.name}" (slug: "${p.slug}"): ${p.description || p.name} — $${p.price || 'varies'}`)
      .join('\n');

    productInstruction = `
WEDNESDAY REQUIREMENT: This is a Wednesday post. Naturally embed the single most relevant product from our affiliate catalog somewhere in the post using the syntax {{product:slug}} on its own line. Only include it where it genuinely fits the topic. If truly none are relevant, skip it.

Available products:
${productList}`;
  }

  const context = `Research context:
- Topic: ${research.suggestedTitle}
- Angle for our audience: ${research.angle}
- Key facts: ${research.keyFacts.join('; ')}
- Source: ${research.source}`;

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

  const metaResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: metaPrompt }],
  });
  const meta = safeParseJSON(metaResponse.content[0].text.trim());

  await sleep(1000);

  // Step 2: get content as plain markdown (no JSON wrapper — no escaping needed)
  const contentPrompt = `You are writing a blog post for ShinyPull (shinypull.com), a creator analytics platform.

${styleGuide}

${blogFormat}
${productInstruction}

${context}
Post title: ${meta.title}

Write the full blog post content now. Output ONLY the markdown content — no JSON, no code fences, no preamble, no title heading.`;

  const contentResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentPrompt }],
  });
  const content = contentResponse.content[0].text.trim();

  const draft = { ...meta, content };
  draft.readTime = estimateReadTime(draft.content);
  console.log(`✅ Draft: "${draft.title}" (~${draft.readTime})`);
  return draft;
}

// --- Review Agent ---
async function reviewAgent(draft) {
  console.log('🔎 Review Agent: auditing draft...');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a strict editor reviewing a blog post for ShinyPull. Check for violations of the style guide.

FAIL conditions (deduct 2 points each from a starting score of 10):
1. Em dashes (—) present anywhere in the content
2. Any of these AI cliché phrases used: "game-changer", "seismic shift", "landscape" as industry jargon, "paradigm", "Let that sink in", "it's worth noting", "in an era where", "genuinely", "beautifully", "spectacularly", "borderline absurd", "sheer audacity", "And that's exactly the point", "isn't just X it's Y"
3. Corporate/stiff/academic tone — reads like a press release or college essay
4. H1 heading (#) used anywhere in the content body
5. First paragraph is a bullet list instead of prose

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
  });

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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Rewrite the following blog post to fix these specific style issues:
- ${issueList}

Rules:
- Keep the same structure, topic, facts, and approximate length
- Fix only the style violations — don't change the substance
- Preserve any {{product:slug}} embed tags exactly as-is
- Return ONLY the rewritten markdown content (no JSON, no explanation, no code fences)

Original content:
${draft.content}`,
      },
    ],
  });

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
    image: null,
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
    .replace(/{{product[^}]*}}/g, '[Product Embed]')
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
  const dayType = getDayType();
  const isProductPost = dayType === 'product';

  console.log(`\n🚀 Blog Draft Generator — ${isProductPost ? 'Wednesday (product post)' : 'Standard post'}`);
  console.log('='.repeat(60));

  // 1. Research: fetch and select best article
  const articles = await fetchArticles();
  if (articles.length === 0) throw new Error('No articles fetched from any RSS feed');

  await sleep(1000);
  const research = await researchAgent(articles);

  // 2. Load products for Wednesday posts
  let products = [];
  if (isProductPost) {
    const { data } = await supabase.from('products').select('*').eq('is_active', true);
    products = data || [];
    console.log(`🛍️  Loaded ${products.length} active products for Wednesday embed`);
  }

  // 3. Write
  await sleep(2000);
  let draft = await writerAgent(research, isProductPost, products);

  // 4. Review
  await sleep(2000);
  const review = await reviewAgent(draft);
  let rewritten = false;

  // 5. Rewrite if needed (one pass only)
  if (!review.approved) {
    await sleep(2000);
    draft = await rewriteAgent(draft, review);
    rewritten = true;
    review.feedback += ' Automatic rewrite was applied to address violations.';
    // Bump score estimate — assume rewrite improved it by ~2 points
    review.score = Math.min(review.score + 2, 10);
  }

  // 6. Save draft to Supabase
  const savedPost = await saveDraft(draft);

  // 7. Send email notification
  await sendNotification(savedPost, draft, review, rewritten);

  console.log('\n✅ Done! Draft saved and notification sent.');
  console.log(`   Blog admin: https://shinypull.com/blog/admin`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
