# 🚀 SETUP INSTRUCTIONS - New Card-Level Chunking System

## ✅ What's Done
- Edge Function updated with card-level chunking (50 cards at a time)
- Frontend updated with dual progress bars (per-set + overall)
- Progress tracking columns created in SQL migrations
- Documentation created

## 📋 What You Need To Do (3 Steps)

### Step 1: Run SQL Migrations in Supabase Dashboard

Go to: **Supabase Dashboard → SQL Editor → New Query**

#### Migration 1: Add metadata sync progress
```sql
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS metadata_sync_progress INTEGER DEFAULT 0;

COMMENT ON COLUMN sets.metadata_sync_progress IS 'Number of cards with metadata synced (0 = not started, equals total_cards = complete)';
```

#### Migration 2: Add price sync progress
```sql
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS price_sync_progress INTEGER DEFAULT 0;

COMMENT ON COLUMN sets.price_sync_progress IS 'Number of cards with prices synced in current cycle (0 = ready for new sync)';
```

#### Migration 3: Add card type columns (if not already done)
```sql
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS types TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS supertype TEXT DEFAULT NULL;

COMMENT ON COLUMN cards.types IS 'Array of Pokemon types (e.g., Fire, Water, Dragon)';
COMMENT ON COLUMN cards.supertype IS 'Card supertype: Pokémon, Trainer, or Energy';
```

### Step 2: Update Cron Job (Database → Cron Jobs)

**Find your existing price sync cron job and change it:**

```sql
-- Change from 15 minutes (*/15 * * * *) to 1 hour (0 * * * *)
SELECT cron.schedule(
  'sync-prices',
  '0 * * * *',  -- <-- CHANGED: Every hour instead of 15 minutes
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

### Step 3: Test Metadata Sync

1. Go to your site with `?admin=true` in URL
2. Click **"Sync Metadata"** button
3. Watch the dual progress bars:
   - **Top bar**: Current set (e.g., "Paradox Rift: 100/266 cards")
   - **Bottom bar**: Overall progress (e.g., "Set 5/170")

## 🎯 How It Works Now

### Before (Broken):
```
❌ Try to sync sv4 (266 cards) → Timeout after 30s → Retry forever
```

### After (Fixed):
```
✅ Call 1: sv4 cards 1-50   (5 seconds)
✅ Call 2: sv4 cards 51-100 (5 seconds)
✅ Call 3: sv4 cards 101-150 (5 seconds)
✅ Call 4: sv4 cards 151-200 (5 seconds)
✅ Call 5: sv4 cards 201-250 (5 seconds)
✅ Call 6: sv4 cards 251-266 (5 seconds)
→ sv4 COMPLETE! → Move to next set
```

## 📊 Progress Tracking

### Metadata Sync
- `metadata_sync_progress`: Tracks cards synced (0 to total_cards)
- When progress = total_cards → Set complete → Reset to 0
- `last_metadata_sync`: Updated only when set is 100% complete

### Price Sync (Automated)
- `price_sync_progress`: Tracks cards synced (0 to total_cards)
- When progress = total_cards → Set complete → Reset to 0
- `last_price_sync`: Updated only when set is 100% complete
- Cron job runs every hour, processes 50 cards per call

## 🔍 Monitoring

### Check Sync Status
```sql
-- See which sets are in progress
SELECT 
  name,
  total_cards,
  metadata_sync_progress,
  price_sync_progress,
  last_metadata_sync,
  last_price_sync
FROM sets
WHERE 
  metadata_sync_progress > 0 
  OR price_sync_progress > 0
ORDER BY name;
```

### Check Completion
```sql
-- Count completed sets
SELECT 
  COUNT(*) FILTER (WHERE last_metadata_sync IS NOT NULL) as metadata_complete,
  COUNT(*) FILTER (WHERE last_price_sync IS NOT NULL) as price_complete,
  COUNT(*) as total_sets
FROM sets;
```

## 🐛 Troubleshooting

### "0 out of 0 cards" in price sync logs
- **Cause**: Missing `price_sync_progress` column
- **Fix**: Run Migration 2 above

### Metadata sync not showing progress
- **Cause**: Missing `metadata_sync_progress` column
- **Fix**: Run Migration 1 above

### Filters not working (Type/Supertype)
- **Cause**: Missing `types` and `supertype` columns
- **Fix**: Run Migration 3 above

## 📖 Documentation
See [CLEAN_SYNC_STRATEGY.md](./CLEAN_SYNC_STRATEGY.md) for detailed technical explanation.

## ✨ Benefits
- **No more timeouts**: 50 cards = always under 10 seconds
- **Resumable**: Pick up exactly where you left off if interrupted
- **Clean logs**: See exactly which cards are processing
- **Works for all syncs**: Metadata AND pricing use same strategy
- **Simple**: Click once, let it run to completion
