# ShinyPull - Agent Context

> **This file is maintained by AI agents for AI agents.** Update it when making significant architectural changes, adding new features, or changing conventions. Do NOT update for minor bug fixes or small tweaks.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube, TikTok, Twitch, Kick, and Bluesky.

**Status:** YouTube, TikTok, Twitch, Kick, and Bluesky integrations fully working. Live subscriber/follower counts, historical charts, and automated data collection operational.

## Critical Rules

**DATA INTEGRITY — THIS IS THE MOST IMPORTANT RULE:**

Our creator stats are the entire reason this site exists. Every chart and table users see is powered directly by the `creator_stats` table. A single corrupt row can trash a chart by causing wild swings (e.g., 630K → 0 → 630K). The rules below are non-negotiable:

- **Never write 0 or null for subscriber/follower counts.** A 0 means the API call failed — it is NOT a real value. Always validate API responses before saving.
- **Always check `response.ok` before reading API data.** Never do `data.total || 0` as a fallback — throw an error instead so the calling code can skip the write.
- **`aggregateHoursWatched.js` and similar secondary scripts must use `.update()`, never `.upsert()`.** If the primary stats collection failed and no row exists for today, a secondary script must not create a row with NULL subscribers. Use `update` — if no row exists, nothing happens (correct behavior).
- **`api/update-creator.js` must never write stats with 0 subscribers.** If the API returns 0, skip the stats write entirely — a failed API call must not overwrite a good historical record.
- **Never backfill or generate synthetic data.** We use REAL API data only. Historical data builds up naturally from daily snapshots.
- **When in doubt, skip the write.** A missing row is far better than a corrupt row with 0 data. Charts handle gaps gracefully; they cannot handle zeros masquerading as real values.

**UI/UX - NO DISCLAIMERS:**
- NEVER add warning banners, info boxes, or explanatory notes to user-facing pages
- Handle API limitations gracefully in the UI without explaining why to users
- The only exception is the Terms of Service page for legal disclaimers
- Keep the UI clean and professional like SocialBlade

**WRITING STYLE - ALL USER-FACING COPY (tooltips, labels, descriptions, notifications, blog posts):**
- NEVER use em dashes (—). Use commas or periods instead.
- Write like a human. Short sentences. Direct. No corporate fluff.
- No AI clichés: "game-changer", "landscape", "seamless", "robust", "leverage", "unlock"
- No semicolons for dramatic effect. No "it's worth noting". No "importantly".
- See the Blog Post Format section for the full list of patterns to avoid.

**TIMEZONE:**
- All dates use America/New_York timezone via `getTodayLocal()` helper
- This prevents future-date issues when UTC is ahead of local time

**DESIGN STYLE - PREFERRED CARD PATTERN (apply this to all new sections and redesigns):**

The user loves the dark-card style introduced in the Features Section on the home page. Use it for all new UI sections and when redesigning existing ones. Key patterns:

- **Section backgrounds:** `bg-[#0a0a0f]` (deep black) or `bg-gray-900` (alternating for visual rhythm)
- **Card base:** `bg-gray-900 border border-gray-800 rounded-2xl`
- **Hover state:** `hover:border-{color}-500/60 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-{color}-500/10` — always pair border glow + lift + shadow
- **Glow blob:** `pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-{color}-500/10 rounded-full blur-3xl group-hover:bg-{color}-500/20 transition-colors duration-500`
- **Ghost numbers/labels:** `absolute top-6 right-7 text-3xl font-black text-gray-800 select-none` — subtle watermarks (01, 02, 03 or $$$)
- **Icon box:** `w-14 h-14 bg-gradient-to-br from-{color1} to-{color2} rounded-xl flex items-center justify-center shadow-lg shadow-{color}-500/30 group-hover:scale-105 transition-transform duration-300`
- **Section header:** `text-2xl sm:text-3xl font-extrabold text-gray-100` title + `mt-3 text-gray-400 text-base sm:text-lg` subtitle, centered with `text-center mb-12 sm:mb-16`
- **Inline CTA:** `inline-flex items-center gap-1.5 text-sm font-semibold text-{color}-400 group-hover:gap-3 transition-all duration-200` with ArrowRight icon
- **Category labels:** small uppercase pill — `px-2.5 py-1 bg-{color}-500/10 border border-{color}-500/20 text-{color}-400 text-xs font-semibold rounded-full`
- **Color identity per section:** each card/section gets a unique accent (indigo/purple, amber/orange, emerald/teal, yellow/amber). Never reuse the same color twice in a single view.
- **Never** use flat solid gradient banners (`bg-gradient-to-r from-X to-Y`) for promo sections. Use the dark card pattern instead.
- All cards use `group` on the container so child elements can use `group-hover:` utilities.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (auto-deploys on push to main)
- **Icons:** Lucide React
- **APIs:** YouTube Data API v3, TikTok (embedded JSON scraping), Twitch Helix API, Kick API v1

## Project Structure

```
src/
├── components/
│   ├── Header.jsx        # Navigation header
│   ├── Footer.jsx        # Site footer
│   ├── SEO.jsx           # Meta tags for pages
│   ├── Odometer.jsx      # Animated number counter
│   ├── KickIcon.jsx      # Custom Kick platform SVG icon
│   ├── TikTokIcon.jsx    # Custom TikTok platform SVG icon
│   ├── ProductCard.jsx   # Full-size affiliate product card
│   └── MiniProductCard.jsx # Compact product card + grid
├── pages/
│   ├── Home.jsx          # Landing page with search
│   ├── Search.jsx        # Creator search
│   ├── Rankings.jsx      # Top creators by platform
│   ├── CreatorProfile.jsx # Individual creator stats
│   ├── LiveCount.jsx     # Real-time subscriber counter
│   ├── Compare.jsx       # Compare creators
│   ├── Blog.jsx          # Blog listing page
│   ├── BlogPost.jsx      # Individual blog post viewer
│   ├── BlogAdmin.jsx     # Blog & products admin panel
│   ├── About.jsx         # About page
│   ├── Contact.jsx       # Contact page
│   ├── Privacy.jsx       # Privacy policy
│   └── Terms.jsx         # Terms of service
├── services/
│   ├── youtubeService.js # YouTube Data API integration
│   ├── twitchService.js  # Twitch Helix API integration
│   ├── kickService.js    # Kick API integration
│   ├── tiktokScraper.js  # TikTok scraper (fetch + embedded JSON, no Puppeteer)
│   ├── creatorService.js # Supabase CRUD operations
│   ├── blogService.js    # Blog posts CRUD
│   ├── blogAdminService.js # Blog admin operations
│   └── productsService.js # Affiliate products CRUD
├── lib/
│   ├── supabase.js       # Supabase client
│   └── analytics.js      # Google Analytics
├── App.jsx               # Main app with routes
├── main.jsx              # Entry point
└── index.css             # Tailwind + custom styles

scripts/
├── collectDailyStats.js      # Daily stats collection (runs 2x daily)
├── refreshTikTokProfiles.js  # Refresh N TikTok profiles (staleness order)
├── discoverTikTokCreators.js  # Discover new TikTok creators from curated list
├── monitorTwitchStreams.js   # Twitch stream monitoring (every 5 min)
├── monitorKickStreams.js     # Kick stream monitoring (every 5 min)
├── aggregateHoursWatched.js  # Calculate Twitch/Kick hours watched
├── processCreatorRequests.js # Process pending TikTok creator requests (runs 4x daily via GitHub Actions)
├── seedTopCreators.js        # Seed top 50 creators
├── seedTopCreatorsExpanded.js # Seed 200+ creators
├── seedTopKickCreators.js    # Seed top Kick creators
├── seedBlogPosts.js          # Seed initial blog posts
├── seedProducts.js           # Seed affiliate products
├── generateSitemap.js        # Generate sitemap.xml dynamically
├── updateBlogPost.js         # Update blog post content from temp files
└── local/                    # Local automation (Windows Task Scheduler)
    ├── README.md             # Setup instructions for local tasks
    ├── refresh-tiktok.bat    # Batch script for TikTok profile refresh
    └── discover-tiktok.bat   # Batch script for TikTok creator discovery

api/                              # Vercel serverless functions
├── twitch.js                 # Twitch API proxy (keeps secrets server-side)
├── kick.js                   # Kick API proxy (keeps secrets server-side)
├── request-creator.js        # Creator request submission endpoint
└── admin.js                  # Admin verification endpoint
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page with search |
| `/search` | Search | Search creators |
| `/rankings` | Rankings | Top creators overall |
| `/rankings/:platform` | Rankings | Top creators for platform |
| `/compare` | Compare | Compare multiple creators |
| `/live/:platform/:username` | LiveCount | Real-time counter |
| `/:platform/:username` | CreatorProfile | Creator stats page |
| `/blog` | Blog | Blog listing page |
| `/blog/:slug` | BlogPost | Individual blog post |
| `/blog/admin` | BlogAdmin | Blog & products admin panel |
| `/about`, `/contact`, `/privacy`, `/terms` | Static | Info pages |

## Database Schema

```sql
creators (id, platform, platform_id, username, display_name, profile_image, description, country, category, created_at, updated_at)
creator_stats (id, creator_id, recorded_at, subscribers, followers, total_views, total_posts, hours_watched_*, peak_viewers_*, avg_viewers_*, streams_count_*)
creator_requests (id, platform, username, user_id, status, error_message, created_at, processed_at)
stream_sessions (id, creator_id, stream_id, started_at, ended_at, peak_viewers, avg_viewers, hours_watched, game_name, title)
viewer_samples (id, session_id, recorded_at, viewer_count, game_name)
blog_posts (id, slug, title, description, content, category, author, image, read_time, published_at, is_published, created_at, updated_at)
products (id, slug, name, price, badge, description, features[], image, affiliate_link, is_active, created_at, updated_at)
```

## Platform API Notes

**YouTube:**
- Subscriber counts rounded to 3 significant figures (YouTube policy since 2019)
- UI defaults to showing Views (accurate) instead of Subscribers for growth metrics
- Daily subscriber changes hidden in UI since they're always 0 for large channels

**Twitch:**
- `view_count` deprecated in April 2022
- We track **Hours Watched** instead (industry standard)
- Follower counts are accurate

**Kick:**
- No follower count endpoint in API — only `active_subscribers_count` (paid subs)
- `subscribers` field stores paid subscriber count (not free followers)
- Live stream status available via `/channels` endpoint (`stream.is_live`)
- Uses OAuth2 Client Credentials flow (same pattern as Twitch)
- Batch up to 50 slugs per request
- Custom `KickIcon` SVG component (no lucide-react icon available)

**TikTok:**
- No official public API for querying arbitrary profiles
- Uses **HTTP fetch with browser user-agent** to scrape `__UNIVERSAL_DATA_FOR_REHYDRATION__` embedded JSON
- TikTok embeds all profile data (followers, likes, videos) in a script tag as structured JSON
- **No Puppeteer/Chrome needed** — lightweight HTTP request only
- Service: `src/services/tiktokScraper.js`
- Runs via `refreshTikTokProfiles.js` (2x daily, ALL creators per run — via GitHub Actions)
- Discovery via `discoverTikTokCreators.js` (curated list of top creators)
- Rate-limited scraping: 2 seconds between requests
- Custom `TikTokIcon` component using `currentColor` pattern (like Lucide icons)
- Profile displays: Followers, Likes, Videos (3-card stats grid)
- Growth summary shows: Followers and Posts growth
- Daily Metrics Table columns: Date, Followers (with changes), Likes (with changes), Videos (with changes)
- `total_views` field stores TikTok likes count (repurposed since TikTok doesn't have "views" per profile)
- **Creator Request System:** Users can request TikTok creators not in the database
  - Request button appears on search page when no results found
  - Backend validates username format and checks for duplicates
  - Requests stored in `creator_requests` table with status tracking
  - Processed by GitHub Actions (4x daily) — TikTok doesn't block cloud IPs
  - 429 errors revert requests to `pending` (not `failed`) for retry on next run
  - Scalable queueing system prevents timeout issues

**Bluesky:**
- Uses the AT Protocol public API — zero authentication required, no API key, no approval process
- Base URL: `https://public.api.bsky.app/xrpc/`
- Key endpoints: `app.bsky.actor.getProfile` (single), `app.bsky.actor.searchActors` (search), `app.bsky.actor.getProfiles` (batch up to 25)
- `platform_id` stores the DID (e.g. `did:plc:abc123`) — stable unique identifier
- `username` stores the handle (e.g. `mosseri.bsky.social`)
- `subscribers` field stores `followersCount`
- `total_posts` stores `postsCount`
- `total_views` is null (no profile-level views metric on Bluesky)
- Service: `src/services/blueskyService.js`
- Search is live from AT Protocol API (not database-only like TikTok)
- No creator request system needed — API is fully public
- No live stream support (Bluesky is not a streaming platform)
- Custom `BlueskyIcon` SVG butterfly component (no lucide-react icon available)
- Profile displays: Followers, Posts (2-card stats grid)
- Daily Metrics Table columns: Date, Followers (with changes), Posts (with changes)
- Collected in `collectDailyStats.js` with batch size of 25
- Color scheme: sky-500 Tailwind palette (`text-sky-400`, `bg-sky-950/30`, `border-sky-800`)

## Commands

```bash
npm run dev                    # Dev server on port 3000
npm run build                  # Production build
npm run seed:top-creators      # Seed top creators
npm run seed:kick              # Seed top Kick creators
npm run seed:bluesky           # Seed top Bluesky accounts
npm run seed:blog              # Seed blog posts
npm run seed:products          # Seed affiliate products
npm run collect:daily          # Collect daily stats (YouTube, Twitch, Kick, Bluesky)
npm run monitor:twitch         # Monitor Twitch streams
npm run monitor:kick           # Monitor Kick streams
npm run aggregate:hours-watched # Aggregate hours watched
npm run discover:tiktok         # Discover new TikTok creators
npm run refresh:tiktok           # Refresh TikTok profile data
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://ziiqqbfcncjdewjkbvyq.supabase.co
VITE_SUPABASE_ANON_KEY=<key>
VITE_YOUTUBE_API_KEY=<key>
VITE_TWITCH_CLIENT_ID=<key>
TWITCH_CLIENT_SECRET=<key>
KICK_CLIENT_ID=<key>
KICK_CLIENT_SECRET=<key>
```

Scripts use `dotenv` to load `.env` automatically.

## GitHub Actions

**Optimized for 2,000 minutes/month budget:**
- **Daily Stats Collection:** Runs 2x daily (6 AM, 6 PM UTC) — collects YouTube, Twitch, and Kick stats (API-only)
- **TikTok Profile Refresh:** Runs 2x daily (2 AM, 2 PM UTC / 9 PM, 9 AM EST) — scrapes all TikTok creator profiles
- **Creator Request Processor:** Runs 4x daily (every 6 hours) — processes pending TikTok creator requests
- **Creator Discovery:** Runs 4x daily (every 6 hours) — discovers new creators across all platforms
- **Twitch Stream Monitor:** Runs every 3 hours (8x daily) — tracks live streams and hours watched
- **Kick Stream Monitor:** Runs every 3 hours (8x daily, offset) — tracks live streams and hours watched

**Monthly usage:** ~1,200 minutes (within 2,000 min free tier)

**Note:** TikTok scraping works from GitHub Actions IPs (confirmed Feb 2026). Local scripts kept as fallback only.

## Local Automation (Fallback Only)

Local scripts in `scripts/local/` are kept as a fallback if GitHub Actions gets rate-limited by TikTok. Normal operation is fully automated via GitHub Actions — no Windows Task Scheduler setup needed.

- `refresh-tiktok.bat` — manual TikTok profile refresh
- `discover-tiktok.bat` — manual TikTok creator discovery

See `scripts/local/README.md` for usage.

## Conventions

- UUIDs: Use `gen_random_uuid()` in Supabase
- Numbers: Format with K/M/B suffixes via `formatNumber()`
- Dates: Use `getTodayLocal()` for America/New_York timezone
- Usernames: Store without @ prefix

## Authentication & Follow System

**AuthPanel Component (ONLY way to sign in/up):**
- Slide-out panel from the right side (component: `src/components/AuthPanel.jsx`)
- Controlled by custom events: `openAuthPanel` and `closeAuthPanel`
- Supports contextual messages (e.g., "Sign in to follow creators")
- Smooth animations: `translate-x-full` → `translate-x-0` with transition
- Input fields have visible text (text-gray-900) and placeholders
- Integrated into Header component with event listeners
- Shows benefits section when in signup mode (Follow creators, Dashboard, Compare, Recently viewed)
- **To open the auth panel, always dispatch the custom event:**
  ```jsx
  window.dispatchEvent(new CustomEvent('openAuthPanel', {
    detail: { message: 'Sign in to access this feature' }
  }));
  ```
- **There is NO `/auth` page route** - AuthPanel is the only authentication UI

**Follow Button Integration:**
- Follow/unfollow buttons dispatch `openAuthPanel` event when user not authenticated
- Opens auth panel with message: "Sign in to follow creators"
- `ensureUserExists()` helper creates public.users entry if auth.users exists but public.users doesn't

**Dashboard Link:**
- Desktop: Shows in main header navigation (right side)
- Mobile: Appears in hamburger menu dropdown
- Only visible when user is authenticated

## Search Bar Pattern

All search interfaces (Home, Search, Compare) follow this pattern:
- Centered layout with `max-w-2xl mx-auto`
- Search input and button stacked vertically (`space-y-3`)
- Button appears **below** the input (not inline)
- Responsive button width: `w-full sm:w-auto sm:min-w-[200px]`
- Full width on mobile, auto-sized on desktop (min 200px)

## Twitch & Kick Stream Features

**Hours Watched Tracking:**
- Primary metric for Twitch and Kick
- Tracked via `stream_sessions` table with start/end times
- `viewer_samples` table stores viewer count every 5 minutes
- Aggregated daily/weekly/monthly via `aggregateHoursWatched.js`
- **Aggregation approach:** Calendar day snapshots, NOT rolling 24-hour windows
  - Daily: streams that ENDED today (todayStart to todayEnd)
  - Weekly: last 7 calendar days
  - Monthly: last 30 calendar days
- Displayed as "XK Hours" (divide by 1000, add K suffix)

**Daily Channel Metrics Table:**
- Shows Watch Hours column for Twitch creators
- Queries `hours_watched_day` field from `creator_stats`
- Formats large numbers: 58365 → "58K Hours"
- Falls back to "Building Historical Data" when no data yet

## Blog Post Format

**Content Structure:**
- Blog post content starts with intro paragraph (NO H1 title in content)
- Title is rendered from `title` field in header, not from markdown
- First paragraph automatically styled as intro box:
  - Larger text (text-xl)
  - Gradient background (indigo-50 to purple-50)
  - Rounded border with padding
  - Detected by checking `node?.position?.start?.line === 1`
- All blog posts follow this pattern for consistency

**Blog Post Creation:**
1. Title goes in `title` field (used in header)
2. Content starts with intro paragraph (no H1)
3. First heading in content should be H2 (##)
4. Intro paragraph gets automatic gradient box styling
5. Always set `published_at` to the publish date (never leave it null or posts sort incorrectly)

**Writing Style (MANDATORY):**
- Write like a real person, not a language model. Conversational, direct, opinionated.
- **NEVER use em dashes (—).** Use commas, periods, or rewrite the sentence instead.
- **NEVER use these AI cliché patterns:**
  - "isn't just X — it's Y" / "not just X, it's Y"
  - "Here's what it signals:" / "Here's the math:"
  - "seismic shift," "game-changer," "landscape," "paradigm"
  - "beautifully [adjective]," "spectacularly [adverb]"
  - "borderline absurd," "sheer audacity," "genuinely [anything]"
  - "it's worth noting," "it bears mentioning," "importantly"
  - "in an era where," "in a world where"
  - "the question isn't X — it's Y"
  - "And that's [exactly/precisely] the point"
  - "Let that sink in"
  - Semicolons used for dramatic effect
- **DO** use short sentences. Fragments are fine. Contractions are good.
- **DO** use casual language: "nah," "basically," "pretty much," "kind of," "a ton of"
- **DO** state opinions directly instead of hedging with qualifiers
- **DO** vary sentence length. Mix punchy one-liners with longer explanations.
- Read the final draft out loud. If it sounds like a press release or a college essay, rewrite it.

## Blog & Products System

**Blog Admin Panel (`/blog/admin`):**
- Full CRUD interface for blog posts and affiliate products
- Two tabs: Posts and Products
- Markdown content editor with product embed support
- Publish/unpublish toggle for posts
- Active/inactive toggle for products
- Copy embed codes to clipboard

**Product Embeds:**
- Use `{{product:slug}}` for full-size product cards in blog content
- Use `{{product-mini:slug}}` for compact vertical cards (image, name, price, buy button)
- Use `{{product-grid}}...{{/product-grid}}` to wrap mini cards in a responsive grid
- BlogPost component parses and replaces with ProductCard/MiniProductCard components
- Products are fetched asynchronously from Supabase
- Both components support snake_case (DB) and camelCase (legacy) fields

**Updating Blog Content:**
When you need to update a blog post with large content changes:
1. Create the new content in a temp file (e.g., `temp_blog_updated.txt`)
2. Use `scripts/updateBlogPost.js` as a template
3. Modify the script to read your temp file and target the correct slug
4. Run: `node scripts/updateBlogPost.js`
5. Content is updated in Supabase (no need to git commit temp files)

**Adding Products:**
1. Visit `/blog/admin` → Products tab
2. Click "New Product"
3. Fill in: name, slug, price, badge, description, features, image URL, affiliate link
4. Copy the embed code: `{{product:slug}}`
5. Paste into any blog post content
6. Product card automatically renders with image, features, and buy button

**Product Images:**
- Use Amazon product images: Right-click product image → "Open image in new tab" → Copy URL
- Format: `https://m.media-amazon.com/images/I/[IMAGE_ID]._AC_SL1500_.jpg`

## Database Management

**NO local migrations folder.** All database changes are made directly against the live Supabase database.

**Two ways to interact with the database:**

1. **Data operations (CRUD):** Use the Supabase JS client with `SUPABASE_SERVICE_ROLE_KEY` from `.env`. This bypasses RLS and works for reads/writes via PostgREST. Cannot run DDL (CREATE/ALTER/DROP).

2. **Schema/DDL/RLS changes:** Use the Supabase Management API SQL endpoint. This can run ANY SQL including CREATE POLICY, ALTER TABLE, etc.

**Running DDL/schema SQL — use the built-in helper script:**
```bash
node scripts/run-sql.js "YOUR SQL HERE"

# Examples:
node scripts/run-sql.js "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'"
node scripts/run-sql.js "CREATE INDEX CONCURRENTLY ..."
node scripts/run-sql.js "ALTER TABLE creators ADD COLUMN ..."
node scripts/run-sql.js "$(cat my-migration.sql)"
```

`scripts/run-sql.js` reads the Supabase CLI access token from Windows Credential Manager at runtime (stored there by `npx supabase login`). No credentials are in the file — it is safe to commit. If it fails with a token error, run `npx supabase login` to re-authenticate.

**NEVER write `.ps1` files to the repo** to extract the token manually. That's what `run-sql.js` is for. The repo has `*.ps1` in `.gitignore` as a safeguard.

**Important notes:**
- `npx supabase db dump`, `db pull`, and `db diff` all require Docker (not installed) — do NOT use them
- `npx supabase projects list` and `projects api-keys` work fine (Management API only)
- `npx supabase db lint --linked` works for linting (connects directly)
- The Supabase JS client (`pg` via PostgREST) CANNOT run DDL — always use the Management API for schema changes

**NEVER use migration files** — they were deleted and should not be recreated. Always use direct database access.

## RLS Policy Reference

All tables have RLS enabled. Here are the current policies:

**Read-only tables (frontend can SELECT, only service_role can write):**
- `creators`, `creator_stats`, `blog_posts`, `products`, `stream_sessions`, `viewer_samples`
- SELECT: `TO anon, authenticated USING (true)`
- INSERT/UPDATE/DELETE: `TO anon, authenticated USING/WITH CHECK (false)`
- Server-side scripts use `service_role` key which bypasses RLS

**User-owned tables (authenticated users can manage their own data):**
- `user_saved_creators`:
  - SELECT own: `TO authenticated USING (auth.uid() = user_id)`
  - INSERT own: `TO authenticated WITH CHECK (auth.uid() = user_id)`
  - DELETE own: `TO authenticated USING (auth.uid() = user_id)`
  - Anon blocked: `TO anon USING/WITH CHECK (false)`
- `users`:
  - SELECT own: `TO authenticated USING (auth.uid() = id)`
  - INSERT own: `TO authenticated WITH CHECK (auth.uid() = id)`
  - UPDATE own: `TO authenticated USING/WITH CHECK (auth.uid() = id)`
  - Anon blocked: `TO anon USING/WITH CHECK (false)`

## Agent Instructions

**Autonomy:**
- Run commands directly - don't ask user to run them
- Use `vercel` or `vercel --prod` for deployment
- For database changes, use the Management API SQL endpoint (NOT migration files)

**When to Update This File:**
- Adding new pages, services, or major features
- Changing database schema or RLS policies
- Adding new API integrations
- Changing architectural patterns or conventions
- Do NOT update for bug fixes, styling changes, or minor tweaks

## Performance Optimization

**PageSpeed scores (as of Feb 2026):** Mobile 85, Desktop 96. SEO 100, Best Practices 100.

**Code splitting (React.lazy):**
- `App.jsx` uses `React.lazy()` + `Suspense` for all page routes except Home
- Home is eagerly loaded (critical path); all other pages load on-demand
- `PageLoader` spinner component shown during lazy chunk loading
- This reduced initial JS payload by ~60%

**index.html optimizations:**
- Google Fonts loaded non-blocking via `media="print" onload="this.media='all'"` pattern
- Google Analytics deferred until `window.load` event (not render-blocking)
- `preconnect` to Supabase origin for faster API calls
- Only font weights 400/500/600/700 loaded (300 removed — unused)

**Image loading:**
- All below-fold `<img>` tags use `loading="lazy"`
- Above-fold hero/LCP images intentionally do NOT have lazy loading

**When adding new pages:**
- Add them as lazy imports in `App.jsx`: `const NewPage = lazy(() => import('./pages/NewPage'));`
- Do NOT add regular imports — this would bundle them into the main chunk and hurt performance

---

*Last updated: 2026-02-24*
