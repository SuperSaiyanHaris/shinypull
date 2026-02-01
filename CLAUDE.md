# ShinyPull - Agent Context

> This file is maintained by AI agents for AI agents. Update it when making significant changes.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube, Twitch, TikTok, Instagram, and Twitter/X.

**Status:** YouTube integration working. Search and profile pages fetch live data from YouTube API.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Icons:** Lucide React
- **APIs:** YouTube Data API v3

## Project Structure

```
src/
├── components/
│   └── Header.jsx            # Navigation header
├── pages/
│   ├── Home.jsx              # Landing page with search + platform cards
│   ├── Search.jsx            # Creator search (YouTube working)
│   ├── Rankings.jsx          # Top creators by platform (TODO)
│   └── CreatorProfile.jsx    # Individual creator stats (YouTube working)
├── services/
│   ├── youtubeService.js     # YouTube Data API integration
│   └── creatorService.js     # Supabase CRUD for creators/stats
├── lib/
│   └── supabase.js           # Supabase client
├── hooks/                    # (empty - add custom hooks here)
├── contexts/                 # (empty - add React contexts here)
├── App.jsx                   # Main app with routes
├── main.jsx                  # Entry point
└── index.css                 # Tailwind + custom styles
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
VITE_YOUTUBE_API_KEY=<youtube-api-key>
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page with search and platform cards |
| `/search` | Search | Search creators (YouTube working) |
| `/rankings` | Rankings | Top creators overall |
| `/rankings/:platform` | Rankings | Top creators for specific platform |
| `/:platform/:username` | CreatorProfile | Individual creator stats (YouTube working) |

## What's Implemented

- [x] Project scaffold and routing
- [x] Basic UI components (Header, Home, Search, Rankings, CreatorProfile)
- [x] Supabase database schema
- [x] Tailwind styling with platform colors
- [x] Vercel deployment pipeline
- [x] **YouTube API integration** - search channels, fetch stats
- [x] **Creator profiles** - display YouTube channel stats with banner/avatar
- [x] **Database persistence** - creators and stats saved to Supabase on view

## What Needs Implementation

- [ ] **Rankings display:** Query and display top creators from database
- [ ] **Charts:** Use recharts for historical data visualization
- [ ] **Growth calculations:** Calculate daily/weekly/monthly growth from stats history
- [ ] **User auth:** Allow users to save/track creators
- [ ] **Twitch integration:** Add Twitch API support
- [ ] **Background jobs:** Scheduled stats collection for tracked creators
- [ ] **Estimated earnings:** Calculate based on views/engagement

## Platform API Status

| Platform | Status | Notes |
|----------|--------|-------|
| YouTube | Working | Data API v3 with API key |
| Twitch | Not started | Need OAuth client credentials |
| TikTok | Not started | Limited API access |
| Instagram | Not started | Requires Facebook app |
| Twitter/X | Skipped | Paid API ($100+/month) |

## YouTube Service (`src/services/youtubeService.js`)

```javascript
searchChannels(query, maxResults)  // Search for channels
getChannelByUsername(username)     // Get channel by @handle
getChannelById(channelId)          // Get channel by ID
getChannelsByIds(channelIds)       // Batch fetch channels
```

## Creator Service (`src/services/creatorService.js`)

```javascript
upsertCreator(creatorData)         // Save/update creator
saveCreatorStats(creatorId, stats) // Save daily stats snapshot
getCreatorByUsername(platform, username)
getCreatorStats(creatorId, days)   // Get stats history
searchCreators(query, platform)    // Search database
```

## Conventions

- Use `gen_random_uuid()` for UUIDs in Supabase (not `uuid_generate_v4()`)
- Platform colors defined in `index.css` as `.platform-{name}` classes
- Format large numbers with K/M/B suffixes (see `formatNumber` helper)
- All times stored as TIMESTAMPTZ, dates as DATE
- YouTube usernames stored without @ prefix

## Deployment

- **Vercel:** Auto-deploys on push to `main`
- **Supabase:** Run `supabase db push` after migration changes

---

*Last updated: 2026-01-31 - Added YouTube API integration*
