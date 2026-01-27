# Database Schema Migration Plan
**Date:** January 27, 2026  
**Purpose:** Clean up pricing columns after switching from TCGPlayer to eBay as primary data source

## Current Issues

1. **Confusing column names**: `tcgplayer_market` actually stores eBay prices
2. **Redundant columns**: `ebay_avg`, `ebay_verified` not used (data is in tcgplayer_market)
3. **Legacy columns**: Many variant columns from old TCGPlayer API structure
4. **Missing PSA10 fields**: Only have average, not low/high range

## Proposed Changes

### Column Renames (Breaking changes - requires code updates)
```
tcgplayer_market      → market_price      (Primary eBay median price)
tcgplayer_low         → market_low        (eBay low from 10-15 listings)
tcgplayer_high        → market_high       (eBay high from 10-15 listings)
tcgplayer_updated_at  → price_updated_at  (Generic timestamp)
psa10_avg             → psa10_market      (PSA 10 median price)
```

### New Columns
```
tcg_comparison_price  NUMERIC   (For TCGPlayer price in comparison section)
tcg_affiliate_url     TEXT      (For future affiliate links)
psa10_low            NUMERIC    (PSA 10 price range)
psa10_high           NUMERIC    (PSA 10 price range)
```

### Columns to Remove
```
ebay_avg             (Redundant - market_price stores this)
ebay_verified        (Not needed - always verified from live API)
psa10_verified       (Not needed)
```

### Columns to Keep (No changes)
```
card_id              (Primary key relationship)
normal_market        (Variant pricing for multi-variant cards)
normal_low
normal_high
normal_mid
normal_direct_low
holofoil_market      (And all holofoil price fields)
reverse_holofoil_*   (And all reverse holo fields)
first_ed_*           (1st edition variants)
unlimited_*          (Unlimited variants)
```

## Migration Steps

### 1. Run Migration SQL
```bash
# Connect to Supabase
npx supabase db push

# Or via SQL editor in Supabase dashboard:
# Copy/paste contents of supabase/migrations/rename_pricing_columns.sql
```

### 2. Update Code
See `CODE_UPDATES_AFTER_MIGRATION.md` for all required code changes in:
- `src/services/dbSetService.js`
- `api/incremental-price-update.js`
- `api/admin-refresh-price.js`
- `src/components/CardModal.jsx`
- `src/components/CardItem.jsx`

### 3. Test
1. Run incremental price update for a few cards
2. Open card modals and verify prices display correctly
3. Check price comparison section shows TCG and eBay rows properly
4. Verify card grid displays market prices

### 4. Data Backfill (if needed)
If you want to populate `tcg_comparison_price` with TCGPlayer data for comparison:
```sql
-- This is optional - only if you want actual TCGPlayer prices
-- Currently this field can be NULL and TCG row won't show
UPDATE prices 
SET tcg_comparison_price = NULL  -- Set to NULL until you get real TCGPlayer data
WHERE tcg_comparison_price IS NULL;
```

## Benefits

1. **Clarity**: Column names match their actual content
2. **Simplicity**: Remove unused legacy columns
3. **Flexibility**: Can add actual TCGPlayer prices later for comparison
4. **Completeness**: PSA 10 now has full price range (low/high)
5. **Future-proof**: Ready for affiliate links in `tcg_affiliate_url`

## Breaking Changes

All code that reads from `prices` table needs updating. See `CODE_UPDATES_AFTER_MIGRATION.md`.

## Rollback Plan

If issues arise:
```sql
-- Rollback script (run before migration if nervous)
ALTER TABLE prices RENAME COLUMN market_price TO tcgplayer_market;
ALTER TABLE prices RENAME COLUMN market_low TO tcgplayer_low;
ALTER TABLE prices RENAME COLUMN market_high TO tcgplayer_high;
ALTER TABLE prices RENAME COLUMN price_updated_at TO tcgplayer_updated_at;
ALTER TABLE prices RENAME COLUMN psa10_market TO psa10_avg;
ALTER TABLE prices DROP COLUMN IF EXISTS tcg_comparison_price;
ALTER TABLE prices DROP COLUMN IF EXISTS tcg_affiliate_url;
ALTER TABLE prices DROP COLUMN IF EXISTS psa10_low;
ALTER TABLE prices DROP COLUMN IF EXISTS psa10_high;
```
