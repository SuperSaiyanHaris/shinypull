# Card Filters - Database Migration Required

## Issue Fixed
The Card Type and Pokémon Type filters weren't working because the database was missing the `types` and `supertype` columns.

## What Was Changed

### 1. Database Schema Update
**File:** `database/supabase-add-card-types.sql`

Added two new columns to the `cards` table:
- `types` (TEXT[]): Array of Pokemon types (e.g., ['Fire', 'Dragon'])
- `supertype` (TEXT): Card supertype ('Pokémon', 'Trainer', or 'Energy')

### 2. Edge Function Update
**File:** `supabase/functions/sync-pokemon-data/index.ts`

Updated to store `types` and `supertype` when syncing cards from the Pokemon TCG API.

### 3. Frontend Updates
- **SetDetailPage & MyCollection**: Filters now appear as a sticky right sidebar (lg:col-span-3) instead of taking full width
- **dbSetService.js**: Now returns `types` and `supertype` fields from database
- **CardFilters**: Works with actual card data

## Required Action: Run Database Migration

⚠️ **IMPORTANT**: You need to run the SQL migration in Supabase to add the new columns:

### Steps:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your ShinyPull project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/supabase-add-card-types.sql`
6. Click **Run** or press `Ctrl+Enter`

### What the migration does:
```sql
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS types TEXT[],
ADD COLUMN IF NOT EXISTS supertype TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_types ON cards USING GIN (types);
CREATE INDEX IF NOT EXISTS idx_cards_supertype ON cards(supertype);
```

## After Migration: Re-sync Data

Once the migration is complete, you need to re-sync your card data to populate the new fields:

### Option 1: Full Sync (Recommended - updates all cards)
1. Go to your app's Collection page
2. Use the Admin Sync Panel
3. Select "Full Sync (Sets + Cards + Prices)"
4. Click "Start Sync"

### Option 2: API Trigger
```bash
# Using curl or Postman
POST https://your-project.supabase.co/functions/v1/sync-pokemon-data
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

{
  "mode": "full"
}
```

## Filter Features Now Working

✅ **Sort By**: Name, Number, Price
✅ **Card Type**: Pokémon, Trainer, Energy
✅ **Pokémon Type**: Fire, Water, Grass, Lightning, etc. (all 11 types)
✅ **Rarity**: All 20+ rarities
✅ **Ownership** (Collection page): All Cards, Owned, Not Owned

## Layout Improvements

- Filters now appear as a **sticky right sidebar** on desktop (takes 3/12 columns)
- Cards take up **9/12 columns** when filters are shown
- Cards take **full width** when filters are hidden
- On mobile, filters appear full-width above cards
- Sidebar scrolls independently and stays visible as you scroll down

## Timeline

1. **Now**: Run SQL migration in Supabase
2. **2-3 minutes**: Wait for Edge Function deployment (auto-deploys from GitHub)
3. **5-30 minutes**: Run full sync to populate types/supertype data
4. **Done**: All filters working!

## Verification

After sync completes, test the filters:
1. Go to any set detail page
2. Click "Filters" button
3. Try filtering by "Card Type" → Pokémon
4. Try filtering by "Pokémon Type" → Fire
5. Cards should filter correctly

If filters still don't work, check:
- SQL migration completed successfully (no errors)
- Data sync completed (check Admin Sync Panel status)
- Browser cache cleared (Ctrl+Shift+R / Cmd+Shift+R)
