# Clean Sync Strategy - Card-Level Chunking

## Problem
- Pokemon API is slow for large sets (>200 cards)
- 30-second Edge Function timeout causes failures
- Previous approach: 1 set = all cards = timeout

## New Solution
**Process cards in 50-card chunks, track progress per set**

## Database Changes

### 1. Run these SQL migrations in Supabase SQL Editor:

```sql
-- Add metadata sync progress (run: supabase-add-sync-progress.sql)
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS metadata_sync_progress INTEGER DEFAULT 0;

COMMENT ON COLUMN sets.metadata_sync_progress IS 'Number of cards with metadata synced (0 = not started, equals total_cards = complete)';

-- Add price sync progress (run: supabase-add-price-sync-progress.sql)
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS price_sync_progress INTEGER DEFAULT 0;

COMMENT ON COLUMN sets.price_sync_progress IS 'Number of cards with prices synced in current cycle (0 = ready for new sync)';
```

### 2. Update Cron Job (Database → Cron Jobs in Supabase Dashboard)

**Find the existing 15-minute price sync job and change to 1 hour:**

```sql
-- OLD (15 minutes):
SELECT cron.schedule('sync-prices', '*/15 * * * *', ...);

-- NEW (1 hour):
SELECT cron.schedule('sync-prices', '0 * * * *', 
  $$
  SELECT net.http_post(
    url := 'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/sync-pokemon-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [ROTATED_SERVICE_ROLE_KEY]'
    ),
    body := '{"mode": "prices"}'::jsonb
  );
  $$
);
```

## How It Works

### Metadata Sync (One-Time)
1. **Manual Call**: Admin clicks "Sync Metadata" button
2. **Frontend Loop**: Calls Edge Function repeatedly until all sets complete
3. **Edge Function**: Processes 50 cards at a time from current set
4. **Progress Tracking**: 
   - `metadata_sync_progress`: Tracks which card we're on (0-250)
   - When progress = total_cards, set is complete
   - Moves to next set automatically

### Price Sync (Automated - Every Hour)
1. **Cron Job**: Runs every hour automatically
2. **Edge Function**: Processes 50 cards from oldest-synced set
3. **Progress Tracking**:
   - `price_sync_progress`: Tracks which card we're on (0-250)
   - When progress = total_cards, resets to 0 and updates `last_price_sync`
4. **Rotation**: Always picks set with oldest `last_price_sync` timestamp
5. **No Timeouts**: 50 cards processes in ~5-10 seconds

### Example Flow for sv4 (266 cards):
```
Call 1: Cards 1-50    (progress: 50/266)
Call 2: Cards 51-100  (progress: 100/266)
Call 3: Cards 101-150 (progress: 150/266)
Call 4: Cards 151-200 (progress: 200/266)
Call 5: Cards 201-250 (progress: 250/266)
Call 6: Cards 251-266 (progress: 266/266) ✓ COMPLETE
```

## Benefits
✅ **No timeouts**: 50 cards = fast processing (<10s)
✅ **Resumable**: If anything fails, picks up where it left off
✅ **Progress tracking**: Know exactly which card is processing
✅ **Simple**: One call = one chunk, frontend loops automatically
✅ **Clean logs**: "Processing set X: cards 51-100 (100/266)"
✅ **Works for pricing**: Same chunking strategy for price updates

## API Endpoints

### Metadata Sync (Manual)
```
POST /functions/v1/sync-pokemon-data
Body: { "mode": "card-metadata" }
```

### Price Sync (Manual or Cron)
```
POST /functions/v1/sync-pokemon-data
Body: { "mode": "prices" }
```

## Response Format
```json
{
  "success": true,
  "cardsUpdated": 50,
  "setsProcessed": 0,
  "progress": 100,
  "total": 266,
  "setName": "Paradox Rift",
  "isComplete": false
}
```

When `isComplete: true`, set is done and function moves to next set automatically.
