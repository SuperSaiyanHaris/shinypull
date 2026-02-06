# ShinyPull - Agent Context

> **This file is maintained by AI agents for AI agents.** Update it when making significant architectural changes, adding new features, or changing conventions. Do NOT update for minor bug fixes or small tweaks.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube and Twitch.

**Status:** YouTube and Twitch integrations fully working. Live subscriber/follower counts, historical charts, and automated data collection operational.

## Critical Rules

**DATA INTEGRITY:**
- We use REAL API data only - NO fake/generated historical data
- Historical data builds up naturally from daily snapshots
- Never backfill or generate synthetic data

**UI/UX - NO DISCLAIMERS:**
- NEVER add warning banners, info boxes, or explanatory notes to user-facing pages
- Handle API limitations gracefully in the UI without explaining why to users
- The only exception is the Terms of Service page for legal disclaimers
- Keep the UI clean and professional like SocialBlade

**TIMEZONE:**
- All dates use America/New_York timezone via `getTodayLocal()` helper
- This prevents future-date issues when UTC is ahead of local time

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (auto-deploys on push to main)
- **Icons:** Lucide React
- **APIs:** YouTube Data API v3, Twitch Helix API

## Project Structure

```
src/
├── components/
│   ├── Header.jsx        # Navigation header
│   ├── Footer.jsx        # Site footer
│   ├── SEO.jsx           # Meta tags for pages
│   ├── Odometer.jsx      # Animated number counter
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
│   ├── Auth.jsx          # Sign in/up
│   ├── About.jsx         # About page
│   ├── Contact.jsx       # Contact page
│   ├── Privacy.jsx       # Privacy policy
│   └── Terms.jsx         # Terms of service
├── services/
│   ├── youtubeService.js # YouTube Data API integration
│   ├── twitchService.js  # Twitch Helix API integration
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
├── collectDailyStats.js      # Daily stats collection (runs 3x daily)
├── monitorTwitchStreams.js   # Twitch stream monitoring (every 5 min)
├── aggregateHoursWatched.js  # Calculate Twitch hours watched
├── seedTopCreators.js        # Seed top 50 creators
├── seedTopCreatorsExpanded.js # Seed 200+ creators
├── seedBlogPosts.js          # Seed initial blog posts
├── seedProducts.js           # Seed affiliate products
└── updateBlogPost.js         # Update blog post content from temp files
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
| `/auth`, `/signin`, `/signup` | Auth | Authentication |
| `/about`, `/contact`, `/privacy`, `/terms` | Static | Info pages |

## Database Schema

```sql
creators (id, platform, platform_id, username, display_name, profile_image, description, country, category, created_at, updated_at)
creator_stats (id, creator_id, recorded_at, subscribers, followers, total_views, total_posts, hours_watched_*, peak_viewers_*, avg_viewers_*, streams_count_*)
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

## Commands

```bash
npm run dev                    # Dev server on port 3000
npm run build                  # Production build
npm run seed:top-creators      # Seed top creators
npm run seed:blog              # Seed blog posts
npm run seed:products          # Seed affiliate products
npm run collect:daily          # Collect daily stats
npm run monitor:twitch         # Monitor Twitch streams
npm run aggregate:hours-watched # Aggregate hours watched
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://ziiqqbfcncjdewjkbvyq.supabase.co
VITE_SUPABASE_ANON_KEY=<key>
VITE_YOUTUBE_API_KEY=<key>
VITE_TWITCH_CLIENT_ID=<key>
TWITCH_CLIENT_SECRET=<key>
```

Scripts use `dotenv` to load `.env` automatically.

## GitHub Actions

- **Daily Stats Collection:** Runs 3x daily (6 AM, 2 PM, 10 PM UTC)
- **Twitch Stream Monitor:** Runs every 5 minutes

## Conventions

- UUIDs: Use `gen_random_uuid()` in Supabase
- Numbers: Format with K/M/B suffixes via `formatNumber()`
- Dates: Use `getTodayLocal()` for America/New_York timezone
- Usernames: Store without @ prefix

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

## Agent Instructions

**Autonomy:**
- Run commands directly - don't ask user to run them
- Use `vercel` or `vercel --prod` for deployment
- Use `supabase db push` for migrations

**When to Update This File:**
- Adding new pages, services, or major features
- Changing database schema
- Adding new API integrations
- Changing architectural patterns or conventions
- Do NOT update for bug fixes, styling changes, or minor tweaks

---

*Last updated: 2026-02-06*
