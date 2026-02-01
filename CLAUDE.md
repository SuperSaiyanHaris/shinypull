# ShinyPull - Agent Context

> This file is maintained by AI agents for AI agents. Update it when making significant changes.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube, Twitch, TikTok, Instagram, and Twitter/X.

**Status:** Early scaffold - basic UI structure exists, no data fetching implemented yet.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Icons:** Lucide React

## Project Structure

```
src/
├── components/
│   └── Header.jsx          # Navigation header
├── pages/
│   ├── Home.jsx            # Landing page with search + platform cards
│   ├── Search.jsx          # Creator search (TODO: implement)
│   ├── Rankings.jsx        # Top creators by platform (TODO: implement)
│   └── CreatorProfile.jsx  # Individual creator stats (TODO: implement)
├── lib/
│   └── supabase.js         # Supabase client
├── services/               # (empty - add API services here)
├── hooks/                  # (empty - add custom hooks here)
├── contexts/               # (empty - add React contexts here)
├── App.jsx                 # Main app with routes
├── main.jsx                # Entry point
└── index.css               # Tailwind + custom styles
```

## Database Schema (Supabase)

```sql
-- Core tables
creators (id, platform, platform_id, username, display_name, profile_image, description, country, category, created_at, updated_at)
creator_stats (id, creator_id, recorded_at, followers, following, total_views, total_posts, subscribers, avg_views_per_post, engagement_rate, estimated_earnings_low/high, followers_gained_day/week/month, views_gained_day/week/month)
users (id, email, display_name, avatar_url, created_at, updated_at)  -- References auth.users
user_saved_creators (id, user_id, creator_id, created_at)
rankings (id, platform, category, rank_type, rank_position, creator_id, recorded_at)

-- Platforms: 'youtube', 'twitch', 'tiktok', 'instagram', 'twitter'
-- Rank types: 'subscribers', 'views', 'growth'
```

All tables have RLS enabled. `creators`, `creator_stats`, and `rankings` have public read access.

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Supabase CLI

```bash
supabase link --project-ref ziiqqbfcncjdewjkbvyq
supabase db push              # Push migrations to remote
supabase migration new <name> # Create new migration
supabase db pull              # Pull remote schema
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://ziiqqbfcncjdewjkbvyq.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page with search and platform cards |
| `/search` | Search | Search creators across platforms |
| `/rankings` | Rankings | Top creators overall |
| `/rankings/:platform` | Rankings | Top creators for specific platform |
| `/:platform/:username` | CreatorProfile | Individual creator stats page |

## What's Implemented

- [x] Project scaffold and routing
- [x] Basic UI components (Header, Home, Search, Rankings, CreatorProfile)
- [x] Supabase database schema
- [x] Tailwind styling with platform colors
- [x] Vercel deployment pipeline

## What Needs Implementation

- [ ] **Data fetching:** Connect pages to Supabase queries
- [ ] **Platform APIs:** Fetch real data from YouTube/Twitch/TikTok/Instagram/Twitter
- [ ] **Creator search:** Implement search against `creators` table
- [ ] **Rankings display:** Query and display top creators
- [ ] **Creator profiles:** Show stats, charts, growth history
- [ ] **Charts:** Use recharts for historical data visualization
- [ ] **User auth:** Allow users to save/track creators
- [ ] **Data ingestion:** Background jobs to fetch and store creator stats

## Platform API Notes

| Platform | API | Auth | Notes |
|----------|-----|------|-------|
| YouTube | Data API v3 | API Key | Has daily quotas |
| Twitch | Helix API | OAuth Client Credentials | Need client ID + secret |
| TikTok | Research API | Limited access | May need scraping alternative |
| Instagram | Graph API | Facebook App | Complex auth flow |
| Twitter/X | API v2 | Paid tiers | Free tier very limited |

## Conventions

- Use `gen_random_uuid()` for UUIDs in Supabase (not `uuid_generate_v4()`)
- Platform colors defined in `index.css` as `.platform-{name}` classes
- Format large numbers with K/M suffixes (see `formatNumber` helper in pages)
- All times stored as TIMESTAMPTZ, dates as DATE

## Deployment

- **Vercel:** Auto-deploys on push to `main`
- **Supabase:** Run `supabase db push` after migration changes

---

*Last updated: 2026-01-31 - Initial scaffold after pivot from Pokemon TCG tracker*
