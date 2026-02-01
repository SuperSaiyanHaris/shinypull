# ShinyPull - Agent Context

> This file is maintained by AI agents for AI agents. Update it when making significant changes.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube, Twitch, TikTok, Instagram, and Twitter/X.

**Status:** YouTube integration working. Search and profile pages fetch live data from YouTube API.

**⚠️ IMPORTANT - DATA INTEGRITY:**
- We use REAL API data only - NO fake/generated historical data
- Historical data builds up naturally as we collect daily snapshots
- APIs only provide current snapshots, not historical data
- Daily collection script runs to capture real stats over time

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
│   ├── Rankings.jsx          # Top creators by platform (displaying DB data)
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
npm run seed:top-creators  # Seed top YouTube/Twitch creators
npm run backfill:stats     # Generate 30 days of historical data
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
- [x] **Rankings display** - Rankings page pulls top creators from Supabase
- [x] **Seed script** - Seed top 50+ YouTube/Twitch creators into database
- [x] **Search persistence** - YouTube search results auto-save to database

## What Needs Implementation

- [ ] **Automated daily stats collection:** GitHub Actions cron or Vercel Cron to run collectDailyStats.js
- [ ] **Charts:** Use recharts for historical data visualization
- [ ] **Growth calculations:** Calculate daily/weekly/monthly growth from stats history (partially done)
- [ ] **User auth:** Allow users to save/track creators
- [ ] **Background jobs:** Scheduled stats collection for tracked creators
- [ ] **Estimated earnings:** Calculate based on views/engagement

## Data Collection Strategy

### Current Approach (REAL DATA ONLY):
1. **On-Demand Collection:** When a user searches/views a profile, we fetch current stats from API
2. **Daily Snapshots:** Run `collectDailyStats.js` once per day to capture all tracked creators
3. **Historical Build-Up:** Data accumulates naturally over time from daily snapshots
4. **No Backfilling:** We do NOT generate fake historical data - only real API responses

### Scripts:
- `scripts/seedTopCreators.js` - Initial seed of top 50 creators (one-time)
- `scripts/collectDailyStats.js` - **Daily collection of REAL stats from APIs**
- `scripts/deleteFakeData.js` - Emergency cleanup (deletes any non-today data)
- `scripts/validateData.js` - QA tool to check data integrity

## Platform API Status

| Platform | Status | Notes |
|----------|--------|-------|
| YouTube | Working | Data API v3 with API key |
| Twitch | Working | Serverless API + OAuth, search/profile/seeding |
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
getRankedCreators(platform, rankType, limit) // Get top creators by subs/views/growth
```

## Conventions

- Use `gen_random_uuid()` for UUIDs in Supabase (not `uuid_generate_v4()`)
- Platform colors defined in `index.css` as `.platform-{name}` classes
- Format large numbers with K/M/B suffixes (see `formatNumber` helper)
- All times stored as TIMESTAMPTZ, dates as DATE
- YouTube usernames stored without @ prefix

## Seeding Top Creators

The database can be seeded with top YouTube and Twitch creators using:

```bash
npm run seed:top-creators
```

**Required environment variables:**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)
- `VITE_YOUTUBE_API_KEY` (or `YOUTUBE_API_KEY`)
- Optional for Twitch: `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET`

The seed script ([scripts/seedTopCreators.js](scripts/seedTopCreators.js)) seeds:
- 31 top YouTube channels (MrBeast, PewDiePie, T-Series, etc.)
- 20 top Twitch streamers (xQc, Ninja, Pokimane, etc.)

## Historical Data Backfill

To generate 30 days of realistic historical stats:

```bash
npm run backfill:stats
```

This script ([scripts/backfillHistoricalStats.js](scripts/backfillHistoricalStats.js)):
- Generates 30 days of historical data with realistic minimal growth (0.01% - 0.1% daily)
- Deletes any existing backfilled data first to ensure accuracy
- Creates data points for all seeded creators
- Makes the daily metrics table look professional and accurate

## Automated Data Collection (TODO)

**Current Status:** Manual collection only. Need to implement:

1. **Daily Stats Cron Job** - Run once per day:
   - Fetch latest stats for all tracked creators
   - Insert new daily snapshot into `creator_stats` table
   - Options:
     - Vercel Cron Jobs (requires Pro plan)
     - GitHub Actions with scheduled workflows (free)
     - External cron service (cron-job.org, etc.) hitting an API endpoint

2. **On-Demand Updates** - When users view a profile:
   - Check if today's stats exist
   - If not, fetch and save latest stats
   - Currently implemented in CreatorProfile.jsx when loading

3. **Recommended Approach:**
   - GitHub Actions workflow that runs daily at midnight UTC
   - Calls a Vercel API endpoint (e.g., `/api/update-stats`)
   - Endpoint iterates through creators and fetches/saves latest stats
   - Respects API rate limits (YouTube: 10,000 units/day)

**Manual Update:** For now, visiting a creator profile automatically updates their stats for today.

## Agent Instructions

**IMPORTANT FOR AI AGENTS:**

- **You have access to Vercel CLI and Supabase CLI** - Use them to run commands, deploy, manage database, etc.
- **DO NOT ask the user to run commands** - You should run them yourself using `run_in_terminal`
- **For deployment:** Use `vercel` or `vercel --prod` commands
- **For database migrations:** Use `supabase db push` or `supabase migration new <name>`
- **For seeding data:** Run `npm run seed:top-creators` directly
- **Load .env variables** when running Node scripts:
  ```powershell
  Get-Content ".env" | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.*)$') { $name = $matches[1].Trim(); $value = $matches[2].Trim().Trim('"'); [System.Environment]::SetEnvironmentVariable($name, $value, 'Process') } }; npm run <script>
  ```

Agents are expected to be autonomous and execute all necessary commands without user intervention.

## Deployment

- **Vercel:** Auto-deploys on push to `main`
- **Supabase:** Run `supabase db push` after migration changes

---

*Last updated: 2026-01-31 - Added rankings display + seeding script*
