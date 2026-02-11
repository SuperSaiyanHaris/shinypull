# ShinyPull - Agent Context

> **This file is maintained by AI agents for AI agents.** Update it when making significant architectural changes, adding new features, or changing conventions. Do NOT update for minor bug fixes or small tweaks.

## Project Overview

ShinyPull is a social media analytics platform (similar to SocialBlade) that tracks creator statistics across YouTube, Twitch, and Kick.

**Status:** YouTube, Twitch, and Kick integrations fully working. Live subscriber/follower counts, historical charts, and automated data collection operational.

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
- **APIs:** YouTube Data API v3, Twitch Helix API, Kick API v1

## Project Structure

```
src/
├── components/
│   ├── Header.jsx        # Navigation header
│   ├── Footer.jsx        # Site footer
│   ├── SEO.jsx           # Meta tags for pages
│   ├── Odometer.jsx      # Animated number counter
│   ├── KickIcon.jsx      # Custom Kick platform SVG icon
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
│   ├── kickService.js    # Kick API integration
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
├── monitorKickStreams.js     # Kick stream monitoring (every 5 min)
├── aggregateHoursWatched.js  # Calculate Twitch/Kick hours watched
├── seedTopCreators.js        # Seed top 50 creators
├── seedTopCreatorsExpanded.js # Seed 200+ creators
├── seedTopKickCreators.js    # Seed top Kick creators
├── seedBlogPosts.js          # Seed initial blog posts
├── seedProducts.js           # Seed affiliate products
└── updateBlogPost.js         # Update blog post content from temp files

api/                              # Vercel serverless functions
├── twitch.js                 # Twitch API proxy (keeps secrets server-side)
├── kick.js                   # Kick API proxy (keeps secrets server-side)
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

**Kick:**
- No follower count endpoint in API — only `active_subscribers_count` (paid subs)
- `subscribers` field stores paid subscriber count (not free followers)
- Live stream status available via `/channels` endpoint (`stream.is_live`)
- Uses OAuth2 Client Credentials flow (same pattern as Twitch)
- Batch up to 50 slugs per request
- Custom `KickIcon` SVG component (no lucide-react icon available)

## Commands

```bash
npm run dev                    # Dev server on port 3000
npm run build                  # Production build
npm run seed:top-creators      # Seed top creators
npm run seed:kick              # Seed top Kick creators
npm run seed:blog              # Seed blog posts
npm run seed:products          # Seed affiliate products
npm run collect:daily          # Collect daily stats (YouTube, Twitch, Kick)
npm run monitor:twitch         # Monitor Twitch streams
npm run monitor:kick           # Monitor Kick streams
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
KICK_CLIENT_ID=<key>
KICK_CLIENT_SECRET=<key>
```

Scripts use `dotenv` to load `.env` automatically.

## GitHub Actions

- **Daily Stats Collection:** Runs 3x daily (6 AM, 2 PM, 10 PM UTC) — collects YouTube, Twitch, and Kick
- **Twitch Stream Monitor:** Runs every 5 minutes
- **Kick Stream Monitor:** Runs every 5 minutes

## Conventions

- UUIDs: Use `gen_random_uuid()` in Supabase
- Numbers: Format with K/M/B suffixes via `formatNumber()`
- Dates: Use `getTodayLocal()` for America/New_York timezone
- Usernames: Store without @ prefix

## Authentication & Follow System

**AuthPanel Component (ALWAYS use this — NEVER `navigate('/auth')`):**
- Slide-out panel from the right side (not a separate page)
- Controlled by custom events: `openAuthPanel` and `closeAuthPanel`
- Supports contextual messages (e.g., "Sign in to follow creators")
- Smooth animations: `translate-x-full` → `translate-x-0` with transition
- Input fields have visible text (text-gray-900) and placeholders
- Integrated into Header component with event listeners
- **NEVER use `navigate('/auth')` or `<Link to="/auth">` to send users to sign in.** Always dispatch the `openAuthPanel` event instead:
  ```jsx
  window.dispatchEvent(new CustomEvent('openAuthPanel', {
    detail: { message: 'Sign in to access this feature' }
  }));
  ```
- The `/auth` page route exists only as a direct-URL fallback, not for programmatic navigation

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

**Management API setup (for DDL/RLS changes):**
- Project ref: `ziiqqbfcncjdewjkbvyq`
- Endpoint: `POST https://api.supabase.com/v1/projects/{ref}/database/query`
- Auth: `Bearer <access_token>` (NOT the service_role key)
- Body: `{ "query": "YOUR SQL HERE" }`
- The access token is stored in **Windows Credential Manager** under `Supabase CLI:supabase`

**Extracting the access token (PowerShell — copy-paste ready):**
```powershell
powershell.exe -Command "
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CREDENTIAL {
        public int Flags; public int Type;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetName;
        [MarshalAs(UnmanagedType.LPWStr)] public string Comment;
        public long LastWritten; public int CredentialBlobSize;
        public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetAlias;
        [MarshalAs(UnmanagedType.LPWStr)] public string UserName;
    }
    [DllImport(\"advapi32.dll\", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport(\"advapi32.dll\")]
    private static extern void CredFree(IntPtr buffer);
    public static string GetCredential(string target) {
        IntPtr ptr;
        if (CredRead(target, 1, 0, out ptr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            CredFree(ptr);
            return Encoding.UTF8.GetString(bytes);
        }
        return null;
    }
}
'@
Add-Type -TypeDefinition \$code
[CredManager]::GetCredential('Supabase CLI:supabase')
"
```

**Complete Node.js example for running SQL:**
```js
// Pass the access token as argv[2]
const ACCESS_TOKEN = process.argv[2];
const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Example: inspect policies
const policies = await runSQL(`
  SELECT tablename, policyname, roles, cmd
  FROM pg_policies WHERE schemaname = 'public'
`);
```

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

---

*Last updated: 2026-02-11*
