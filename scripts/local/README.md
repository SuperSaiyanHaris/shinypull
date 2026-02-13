# Local Instagram & TikTok Automation

Since GitHub Actions IPs are blocked by Instagram/TikTok, we run data collection locally using Windows Task Scheduler.

Both scripts default to processing ALL creators when run without arguments. This ensures every creator gets fresh daily stats, just like YouTube/Twitch/Kick.

## Scripts

- **`refresh-instagram.bat`** - Refreshes ALL Instagram profiles (~12 min for 140 creators)
- **`refresh-tiktok.bat`** - Refreshes ALL TikTok profiles (~4 min for 114 creators)
- **`process-instagram-requests.bat`** - Processes pending creator requests
- **`discover-instagram.bat`** - Discovers 10 new creators from curated list

## Setup Windows Task Scheduler

### 1. Open Task Scheduler
- Press `Win + R`
- Type `taskschd.msc`
- Press Enter

### 2. Create Task for Instagram Profile Refresh

**Basic Settings:**
- Click "Create Task" (right sidebar)
- Name: `Instagram Profile Refresh`
- Description: `Refresh ALL Instagram creator profiles`
- Security: Run whether user is logged on or not
- Configure for: Windows 10

**Triggers (2x daily):**
Click "New" for each trigger:
1. Daily at 8:00 AM
2. Daily at 8:00 PM

**Actions:**
- Click "New"
- Action: Start a program
- Program/script: `d:\Claude\ShinyPull\scripts\local\refresh-instagram.bat`
- Start in: `d:\Claude\ShinyPull`

**Conditions:**
- Uncheck "Start the task only if the computer is on AC power"
- Check "Wake the computer to run this task"

**Settings:**
- Check "Allow task to be run on demand"
- Check "Run task as soon as possible after a scheduled start is missed"
- If task fails, restart every: 15 minutes, up to 3 times

### 3. Create Task for TikTok Profile Refresh

**Basic Settings:**
- Name: `TikTok Profile Refresh`
- Description: `Refresh ALL TikTok creator profiles`
- Same security settings as above

**Triggers (2x daily):**
1. Daily at 9:00 AM
2. Daily at 9:00 PM

**Actions:**
- Program/script: `d:\Claude\ShinyPull\scripts\local\refresh-tiktok.bat`
- Start in: `d:\Claude\ShinyPull`

**Same Conditions and Settings as above**

### 4. Create Task for Creator Requests

**Basic Settings:**
- Name: `Creator Requests`
- Description: `Process pending Instagram & TikTok creator requests`
- Same security settings as above

**Triggers (4x daily - every 6 hours):**
1. Daily at 6:00 AM
2. Daily at 12:00 PM
3. Daily at 6:00 PM
4. Daily at 12:00 AM (midnight)

**Actions:**
- Program/script: `d:\Claude\ShinyPull\scripts\local\process-instagram-requests.bat`
- Start in: `d:\Claude\ShinyPull`

**Same Conditions and Settings as above**

### 5. Create Task for Creator Discovery (Optional - Weekly)

**Basic Settings:**
- Name: `Instagram Creator Discovery`
- Description: `Discover new Instagram creators from curated list`
- Same security settings as above

**Trigger (weekly):**
- Weekly on Sunday at 10:00 AM

**Actions:**
- Program/script: `d:\Claude\ShinyPull\scripts\local\discover-instagram.bat`
- Start in: `d:\Claude\ShinyPull`

**Same Conditions and Settings as above**

## Manual Running

You can also run these scripts manually anytime:
- Double-click `refresh-instagram.bat` to refresh profiles
- Double-click `process-instagram-requests.bat` to process requests
- Double-click `discover-instagram.bat` to discover new creators

## Monitoring

Check the Task Scheduler History tab to see run results:
- Right-click task → "History"
- Look for "Task completed" events
- Check for any errors

## Coverage

**Profile Refresh (ALL creators, daily):**
- Instagram: ALL ~141 creators refreshed per run, 2x daily (~12 min/run)
- TikTok: ALL ~114 creators refreshed per run, 2x daily (~4 min/run)
- Every creator gets fresh daily stats — same coverage as YouTube/Twitch/Kick
- Sorted by `updated_at` ASC so if rate-limited, stale profiles go first
- Second daily run is insurance — catches anything missed by the first

**Creator Requests:**
- Processes all pending requests (no limit)
- Handles 429 errors gracefully (reverts to pending)
- Stops batch on first 429 to avoid IP blacklisting

**Creator Discovery:**
- Discovers 10 new creators per run (weekly schedule)
- **Guarantees 100% fresh creators every run** - NO DUPLICATES
- Works through curated list of 110+ popular Instagram creators
- Automatically tracks which creators are already in database
- Each run adds the NEXT 10 from the list that aren't in the DB yet
- Example progression:
  - Week 1: Adds creators 1-10 from list
  - Week 2: Adds creators 11-20 from list (skips 1-10 already in DB)
  - Week 3: Adds creators 21-30 from list
  - And so on...
- When list is exhausted, you can add more usernames to the script
- Rate-limited: 8 seconds between requests

## Troubleshooting

**Task runs but nothing happens:**
- Check that Node.js is in your system PATH
- Open CMD and run: `node --version`
- If not found, add Node.js to PATH

**Still getting 429 errors locally:**
- Instagram may have rate-limited your residential IP
- Wait 24 hours before trying again
- Consider using mobile hotspot temporarily (different IP)

**Script crashes:**
- Check `.env` file exists in `d:\Claude\ShinyPull`
- Verify `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Run manually to see full error output
