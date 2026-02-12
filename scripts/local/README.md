# Local Instagram Automation

Since GitHub Actions IPs are blocked by Instagram, we run Instagram data collection locally using Windows Task Scheduler.

## Scripts

- **`refresh-instagram.bat`** - Refreshes 15 Instagram profiles (oldest first)
- **`process-instagram-requests.bat`** - Processes pending creator requests

## Setup Windows Task Scheduler

### 1. Open Task Scheduler
- Press `Win + R`
- Type `taskschd.msc`
- Press Enter

### 2. Create Task for Profile Refresh

**Basic Settings:**
- Click "Create Task" (right sidebar)
- Name: `Instagram Profile Refresh`
- Description: `Refresh 15 Instagram creator profiles`
- Security: Run whether user is logged on or not
- Configure for: Windows 10

**Triggers (3x daily):**
Click "New" for each trigger:
1. Daily at 8:00 AM
2. Daily at 2:00 PM
3. Daily at 8:00 PM

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

### 3. Create Task for Creator Requests

**Basic Settings:**
- Name: `Instagram Creator Requests`
- Description: `Process pending Instagram creator requests`
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

## Manual Running

You can also run these scripts manually anytime:
- Double-click `refresh-instagram.bat` to refresh profiles
- Double-click `process-instagram-requests.bat` to process requests

## Monitoring

Check the Task Scheduler History tab to see run results:
- Right-click task → "History"
- Look for "Task completed" events
- Check for any errors

## Coverage

**Profile Refresh:**
- 15 profiles per run × 3 runs/day = 45 profiles/day
- With ~63 Instagram creators, all cycle through every ~1.4 days
- Sorted by `updated_at` ASC so least-recently-updated go first

**Creator Requests:**
- Processes all pending requests (no limit)
- Handles 429 errors gracefully (reverts to pending)
- Stops batch on first 429 to avoid IP blacklisting

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
