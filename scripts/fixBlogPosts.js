/**
 * One-time script to fix existing blog posts:
 * 1. Rename all "What Creators Need/Must Know" and similar lazy titles
 * 2. Unpublish the two garbage seed posts (bullet-point dumps, not real articles)
 * 3. Rewrite the truncated YouTube deepfake post (118 words, cut off mid-sentence)
 *
 * Run: node scripts/fixBlogPosts.js
 */

import { config } from 'dotenv';
config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.7 } });

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripEmDashes(text) {
  return text
    .replace(/\s*—\s*/g, (m) => m.trim() === '—' ? '-' : ', ')
    .replace(/&mdash;/gi, ', ')
    .replace(/&#8212;/g, ', ')
    .replace(/&#x2014;/gi, ', ');
}

// ---------------------------------------------------------------------------
// Step 1: Title fixes — replace formulaic titles with specific, fresh ones
// ---------------------------------------------------------------------------
const TITLE_FIXES = [
  {
    slug: 'youtube-shorts-coming-to-tv-what-creators-must-know',
    newTitle: 'YouTube Shorts Are Landing on Living Room TVs This Summer',
  },
  {
    slug: 'instagram-suppressing-reposts-what-creators-must-know',
    newTitle: 'Instagram Started Penalizing Reposts. The Reach Hit Is Already Showing.',
  },
  {
    slug: 'netflix-clips-feed-what-creators-need-to-know',
    newTitle: 'Netflix Built a Vertical Clips Feed. The Distribution Play Is Bigger Than It Looks.',
  },
  {
    slug: 'tiktok-radio-iheartmedia-what-creators-need-to-know',
    newTitle: 'TikTok Radio Just Launched With iHeartMedia. The Licensing Model Favors Creators.',
  },
  {
    slug: 'apple-music-inside-tiktok-what-creators-need-to-know',
    newTitle: 'Apple Music Moved Into TikTok. Soundtrack Licensing Just Got Complicated.',
  },
  {
    slug: 'youtube-deepfake-shield-what-creators-need-to-know',
    newTitle: "YouTube's Deepfake Detection System Is Live. It Already Has Real Gaps.",
  },
  {
    slug: 'tiktok-ad-free-tier-uk-creators',
    newTitle: "TikTok's Ad-Free Tier Hit the UK. Creator CPMs Are About to Split.",
  },
  {
    slug: 'clippers-new-promo-machine-what-creators-must-know',
    newTitle: 'Clipping Accounts Are Out-Promoting Most Creators. That Imbalance Is Worth Studying.',
  },
  {
    slug: 'youtube-killed-viewer-clips-what-this-means-for-creators',
    newTitle: 'YouTube Killed Viewer Clips. The Power Dynamic Behind That Decision Is Telling.',
  },
  {
    slug: 'mrbeast-1m-concurrent-viewers-creator-live-events',
    newTitle: 'MrBeast Pulled 1M Concurrent Viewers. The Gap Between Him and Everyone Else Widened.',
  },
  {
    slug: 'jonah-peretti-explains-buzzfeed-sale-what-it-means-for-creators',
    newTitle: "Jonah Peretti's BuzzFeed Autopsy Has Uncomfortable Lessons for Creator-Run Media",
  },
  {
    slug: 'youtubes-first-native-late-night-show-changes-the-game',
    newTitle: "YouTube Built Its First Native Late-Night Show. Early Numbers Are Beating Network TV.",
  },
  {
    slug: 'youtube-premium-price-hike-what-creators-need-to-know',
    newTitle: 'YouTube Premium Got More Expensive. Subscriber Counts Will Tell the Story.',
  },
  {
    slug: 'greece-bans-under-15s-social-media-creators',
    newTitle: "Greece Banned Teens From Social Media. Europe's Age War on Platforms Is Accelerating.",
  },
  {
    slug: 'youtube-live-new-tools-streamers-earn-more',
    newTitle: "YouTube Live Just Got Its Best Monetization Upgrade in Years",
  },
];

// ---------------------------------------------------------------------------
// Step 2: Posts to unpublish (garbage seed posts — bullet dumps, not articles)
// ---------------------------------------------------------------------------
const UNPUBLISH_SLUGS = [
  'creator-economy-statistics-2026',  // 328 words of fake stat bullet points
  'grow-youtube-channel-2026',        // 519 words of generic AI advice
];

// ---------------------------------------------------------------------------
// Step 3: Rewrite the truncated post
// ---------------------------------------------------------------------------
const TRUNCATED_POST = {
  slug: 'youtube-deepfake-battle-goes-global-likeness-detection-live',
  title: "YouTube's Deepfake Detection Went Global. Creators Are in the Middle of It.",
  description: "YouTube expanded its AI likeness detection system globally in May 2026. Here's what the rollout means for creators whose faces and voices are being misused.",
  partialContent: `YouTube's new global likeness detection is a necessary, if sometimes clunky, step toward protecting creators.

It's May 18, 2026, and a big change is rolling out across YouTube. For a while now, we've seen AI-generated content explode, from harmless fun to genuinely concerning deepfakes. This update goes beyond mere technical changes; it fundamentally alters how creators need to think about their content and brand on the platform. YouTube is finally drawing a clearer line in the sand, globally implementing a system to detect when a person's likeness is created or altered by AI.

## Why Now? The Rise of AI and Identity Theft

The internet has been grappling with AI-generated media for years. In 2025, reports showed a`,
};

async function rewriteTruncatedPost(post) {
  console.log(`\n✍️  Rewriting truncated post: "${post.title}"...`);

  const prompt = `You are writing a blog post for ShinyPull (shinypull.com), a creator analytics platform.

Today's date is May 22, 2026.

MANDATORY writing style rules:
- Write conversationally, like a knowledgeable friend. Not corporate, not academic.
- NEVER use em dashes (—). Use commas, colons, or rewrite the sentence.
- NEVER start a sentence with "Here's [anything]". Rewrite as a direct statement.
- NEVER use "This isn't X. It's Y." constructions.
- NEVER use: "game-changer", "seismic shift", "landscape" as jargon, "paradigm", "Let that sink in", "it's worth noting", "in an era where", "And that's exactly the point", "genuinely", "beautifully"
- Short sentences. Fragments are fine. Contractions are good.
- Casual language: "basically", "pretty much", "kind of", "a ton of", "honestly"
- State opinions directly. No hedging.

Blog format rules:
- Start with an intro paragraph (NO H1 title — title is shown separately in the header)
- Use ## for all section headings (H2 only, never H1)
- 850-1000 words total
- End with a 2-3 sentence takeaway paragraph
- MUST include: one callout block ({{callout:insight}} or {{callout:update}}), one > blockquote, and a {{tldr}} block

Callout syntax:
{{callout:insight}}
A single tight paragraph with the key insight. Bold the most important phrase.
{{/callout}}

TLDR syntax:
{{tldr}}
- First key takeaway as a short sentence
- Second key takeaway
- Third key takeaway
{{/tldr}}

Topic: YouTube expanded its AI-generated likeness detection system globally in May 2026.

Key facts to cover:
- YouTube rolled out its Privacy Request for Synthetic Content tool globally (previously US-only)
- Creators can request removal of AI-generated content that uses their face, voice, or likeness without consent
- YouTube uses a combination of Content ID signals and human review to assess claims
- The system covers both AI face-swaps (deepfakes) and AI voice cloning
- Challenges: false positives on parody/satire, consent documentation requirements, processing times
- YouTube requires 48-hour removal window after notification before escalating to manual review
- Creators with verified accounts get priority processing
- The tool does NOT cover fictional AI characters that merely resemble creators — only clear likeness replication

The post should take the angle: this is a real protection that's meaningfully impactful but still has rough edges — not a silver bullet, and the gaming/misuse patterns are already emerging.

Write the full blog post content now. Output ONLY the markdown content — no JSON, no code fences, no preamble, no title heading.`;

  const result = await gemini.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  });
  return stripEmDashes(result.response.text().trim());
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🔧 Blog Post Fixer');
  console.log('='.repeat(60));

  // Step 1: Title fixes
  console.log(`\n📝 Step 1: Fixing ${TITLE_FIXES.length} lazy titles...`);
  let titleFixed = 0;
  for (const fix of TITLE_FIXES) {
    const { data, error } = await sb
      .from('blog_posts')
      .update({ title: fix.newTitle })
      .eq('slug', fix.slug)
      .select('slug, title');

    if (error) {
      console.warn(`   ⚠️  Failed to update "${fix.slug}": ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`   ✅ "${fix.slug}"`);
      console.log(`      → "${fix.newTitle}"`);
      titleFixed++;
    } else {
      console.log(`   ⚪ Skipped (not found): ${fix.slug}`);
    }
  }
  console.log(`   ${titleFixed}/${TITLE_FIXES.length} titles updated`);

  // Step 2: Unpublish garbage seed posts
  console.log(`\n🚫 Step 2: Unpublishing ${UNPUBLISH_SLUGS.length} low-quality seed posts...`);
  for (const slug of UNPUBLISH_SLUGS) {
    const { error } = await sb
      .from('blog_posts')
      .update({ is_published: false })
      .eq('slug', slug);

    if (error) {
      console.warn(`   ⚠️  Failed to unpublish "${slug}": ${error.message}`);
    } else {
      console.log(`   ✅ Unpublished: ${slug}`);
    }
  }

  // Step 3: Rewrite the truncated deepfake post
  console.log(`\n✍️  Step 3: Rewriting truncated post...`);
  await sleep(2000);
  const newContent = await rewriteTruncatedPost(TRUNCATED_POST);
  const wordCount = newContent.split(/\s+/).length;
  console.log(`   Generated ${wordCount} words`);

  const { error: rewriteError } = await sb
    .from('blog_posts')
    .update({
      title: TRUNCATED_POST.title,
      description: TRUNCATED_POST.description,
      content: newContent,
    })
    .eq('slug', TRUNCATED_POST.slug);

  if (rewriteError) {
    console.error(`   ❌ Failed to save rewrite: ${rewriteError.message}`);
  } else {
    console.log(`   ✅ Truncated post rewritten and saved`);
  }

  console.log('\n✅ Done! All fixes applied.');
  console.log('   Review at https://shinypull.com/blog/admin');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
