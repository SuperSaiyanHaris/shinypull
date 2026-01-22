# Supabase Edge Functions for ShinyPull

## sync-pokemon-data

Syncs Pokemon TCG data from the official API to your Supabase database.

### Sync Modes

| Mode | Description | Recommended Frequency |
|------|-------------|----------------------|
| `prices` | Updates prices for recent sets only (fast) | Every 4-6 hours |
| `full` | Syncs all sets and all cards | Weekly or manual |
| `sets` | Syncs set metadata only | Daily |
| `single-set` | Syncs a specific set by ID | Manual |

### Deployment

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   cd tcg-price-tracker
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Set environment variables** (in Supabase Dashboard > Settings > Edge Functions):
   - `POKEMON_API_KEY` - Your Pokemon TCG API key (optional but recommended)

5. **Deploy the function**:
   ```bash
   supabase functions deploy sync-pokemon-data
   ```

### Setting Up Scheduled Runs (Cron)

In your Supabase Dashboard:

1. Go to **Database** > **Extensions** and enable `pg_cron` if not already enabled

2. Go to **SQL Editor** and run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule prices sync every 6 hours
SELECT cron.schedule(
  'sync-prices-every-6-hours',
  '0 */6 * * *',  -- Every 6 hours at minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-pokemon-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"mode": "prices"}'::jsonb
  );
  $$
);

-- Schedule full sync weekly (Sundays at 3 AM)
SELECT cron.schedule(
  'sync-full-weekly',
  '0 3 * * 0',  -- Sunday at 3 AM
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-pokemon-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"mode": "full"}'::jsonb
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key

### Manual Triggering

**Via HTTP (from your app or curl):**

```bash
# Prices only (fast)
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-pokemon-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "prices"}'

# Full sync
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-pokemon-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "full"}'

# Single set
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-pokemon-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single-set", "setId": "sv6"}'
```

**Via Vercel API endpoint:**

```bash
# From your deployed app
curl "https://your-app.vercel.app/api/trigger-sync?mode=prices"
curl "https://your-app.vercel.app/api/trigger-sync?mode=full"
curl "https://your-app.vercel.app/api/trigger-sync?mode=single-set&setId=sv6"
```

### Database Schema Requirements

Ensure your database has these columns:

```sql
-- Add tcgplayer_url column if missing
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tcgplayer_url TEXT;

-- Add last_updated to prices if missing
ALTER TABLE prices ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Ensure sync_metadata table exists
CREATE TABLE IF NOT EXISTS sync_metadata (
  entity_type TEXT PRIMARY KEY,
  status TEXT,
  message TEXT,
  last_sync TIMESTAMPTZ
);
```

### Viewing Scheduled Jobs

```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Unschedule a job
SELECT cron.unschedule('sync-prices-every-6-hours');
```
