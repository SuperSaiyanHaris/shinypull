# Edition Architecture - Complete Implementation Guide

## Overview

This implementation treats each card edition as a **separate entity** with its own:
- Unique card ID
- Price data
- TCGPlayer links
- Collection tracking

## Architecture Changes

### 1. Database Schema

**Card IDs Now Include Edition:**
- Old: `base1-4` (Charizard)
- New: 
  - `base1-4-unlimited` (Unlimited Charizard)
  - `base1-4-1st-edition` (1st Edition Charizard)
  - `base1-4-shadowless` (Shadowless Charizard)

**New Columns:**
- `cards.base_card_id`: Groups all editions together (e.g., `base1-4`)
- `cards.edition`: Edition name (`1st Edition`, `Unlimited`, etc.)
- `user_collections.card_edition`: Edition in user's collection

**Key Changes:**
- Each edition is a separate row in `cards` table
- Each edition has its own row in `prices` table
- Users can collect multiple editions of the same card
- Unique constraint changed from `(user_id, card_id)` to `(user_id, card_id, card_edition)`

### 2. Sync Logic

**Edition Detection:**
The sync function now:
1. Fetches card from Pokemon API (e.g., `base1-4`)
2. Parses ALL price variants from `tcgplayer.prices`:
   - `1stEditionHolofoil` → Creates `base1-4-1st-edition`
   - `holofoil` → Creates `base1-4-unlimited`
   - `reverseHolofoil` → Creates `base1-4-reverse-holo`
3. Creates separate card records for each edition
4. Stores edition-specific pricing

**Example Pokemon API Response:**
```json
{
  "id": "base1-4",
  "name": "Charizard",
  "tcgplayer": {
    "prices": {
      "holofoil": {
        "low": 384.90,
        "market": 462.35,
        "high": 1500.00
      },
      "1stEditionHolofoil": {
        "low": 12000.00,
        "market": 15000.00,
        "high": 25000.00
      }
    }
  }
}
```

**Becomes 2 Cards:**
1. `base1-4-unlimited` with Unlimited pricing
2. `base1-4-1st-edition` with 1st Edition pricing

### 3. Edition Mapping

**Pokemon API → Our Edition Names:**
- `1stEditionHolofoil` → `1st Edition`
- `1stEditionNormal` → `1st Edition`
- `unlimitedHolofoil` → `Unlimited`
- `holofoil` → `Unlimited` (default)
- `normal` → `Unlimited` (default)
- `reverseHolofoil` → `Reverse Holofoil`

### 4. TCGPlayer URL Strategy

**Problem:** Pokemon API only provides ONE TCGPlayer URL per base card

**Solution Options:**

**A. Search URLs (Current Implementation):**
```javascript
buildTCGPlayerSearchUrl(
  "Charizard",
  "Base Set",
  "4",
  "1st Edition"
)
// Returns: https://www.tcgplayer.com/search/pokemon/product?q=Charizard%204%201st%20Edition%20Base%20Set
```

**B. Product ID Mapping (Future Enhancement):**
- Build database of `base_card_id` + `edition` → TCGPlayer product ID
- Start with popular cards manually
- Crowd-source or scrape remaining

**C. Pokemon API URL (Limited):**
- Use Pokemon API's URL as fallback
- Only works for the "default" edition (usually Unlimited)

## Implementation Steps

### Step 1: Run Database Migrations

```sql
-- Copy and run: database/supabase-edition-architecture.sql
```

This migration:
- Adds `base_card_id` column to cards
- Updates unique constraints for collections
- Creates helper functions for edition IDs
- Creates view for querying editions

### Step 2: Deploy Updated Sync Function

The sync function now uses `edition-utils.ts` which:
- Parses all price variants
- Creates separate cards per edition
- Deduplicates editions (e.g., keeps `unlimitedHolofoil` over `holofoil`)

**Files Changed:**
- `supabase/functions/sync-pokemon-data/index.ts`
- `supabase/functions/sync-pokemon-data/edition-utils.ts` (new)

### Step 3: Re-sync Data

**With 20,000 API calls/day, you can now:**
- Sync ~80 sets per day (250 cards each = 20,000 calls)
- Full database sync in 3-4 days
- Or target specific sets (Base, Jungle, Fossil first)

**Sync Strategy:**
```bash
# Option 1: Sync one set with all editions
POST /sync-pokemon-data
{
  "mode": "single-set",
  "setId": "base1"
}

# Option 2: Full resync (run multiple times over days)
POST /sync-pokemon-data
{
  "mode": "full"
}
```

### Step 4: Update Frontend (Already Done)

- ✅ AddToCollectionButton shows edition picker
- ✅ Edition badges display in collection
- ✅ CardModal shows edition
- ✅ Collection service handles edition parameter

### Step 5: Update Existing Collections

**Migration Script for User Collections:**
```sql
-- Update existing collection items to point to edition-specific card IDs
UPDATE user_collections
SET 
  card_id = card_id || '-unlimited',
  card_edition = 'Unlimited'
WHERE card_edition IS NULL;
```

## Testing Plan

### Test 1: Sync a Set with Editions

1. Go to Admin Panel
2. Sync Base Set (`base1`)
3. Check database:
   ```sql
   SELECT id, base_card_id, name, number, edition, tcgplayer_market
   FROM cards
   WHERE base_card_id = 'base1-4'
   ORDER BY edition;
   ```
4. Should see multiple rows:
   - `base1-4-unlimited` with ~$462 market
   - `base1-4-1st-edition` with ~$15,000 market

### Test 2: Add Card with Edition

1. Browse Base Set
2. Find Charizard
3. Should see multiple cards:
   - Charizard (Unlimited)
   - Charizard (1st Edition)
4. Add 1st Edition to collection
5. Verify collection shows edition badge

### Test 3: Price Alerts per Edition

1. Set price alert on Charizard 1st Edition
2. Set price alert on Charizard Unlimited
3. Verify alerts track different prices
4. Check `price_alerts` table has correct `card_id` (with edition suffix)

### Test 4: Multiple Editions in Collection

1. Add Charizard Unlimited
2. Add Charizard 1st Edition
3. Collection should show BOTH as separate items
4. Each should have correct pricing and edition badge

## Admin Sync Panel Review

### Current State
- Manual sync buttons for sets/metadata/prices
- Progress tracking per set
- Chunked processing (10 cards at a time)

### With 20k API Calls/Day

**Optimization Recommendations:**

**1. Increase Chunk Size:**
- Current: 10 cards per call
- Recommended: 50-100 cards per call
- Rationale: With API key, no rate limit issues

**2. Parallel Set Syncing:**
- Current: 1 set at a time
- Possible: 5-10 sets in parallel
- Benefit: Faster full database sync

**3. Smart Sync Priority:**
- Sync popular sets first (Base, Jungle, Fossil)
- Track which sets have edition data
- Skip sets with no edition variants (newer sets)

**4. Edition-Aware Progress:**
- Show: "Synced 102 cards (248 editions)"
- Track edition count per set

**5. Sync Modes:**
```
1. Quick Sync - Prices only (existing editions)
2. Full Sync - All cards + editions
3. Edition Discovery - Check which cards have multiple editions
4. Targeted Sync - Sync specific base card IDs
```

### Recommended Sync Strategy

**Day 1: Popular Sets**
- Base Set, Base Set 2, Jungle, Fossil
- ~400 base cards = ~800 editions
- 2 API calls per card (metadata + prices) = 800 calls

**Day 2-3: Early Sets**
- Team Rocket through Neo Destiny
- ~1,000 base cards = ~2,000 editions
- 4,000 API calls

**Day 4+: Modern Sets**
- Most modern sets have fewer editions
- Reverse Holo is main variant
- ~2 editions per card average

**Maintenance:**
- Price sync: Once per day for all cards
- With chunking: 20,000 cards ÷ 100 per call = 200 calls
- Leaves 19,800 calls for new set additions

## API Call Budget

**With 20,000 calls/day:**

| Task | Calls Needed | Frequency |
|------|-------------|-----------|
| Full DB (250 sets × 80 cards avg) | 20,000 | One-time (1 day) |
| Price sync all cards | 200-500 | Daily |
| New set (80 cards) | 160 | As released |
| Edition discovery (1 set) | 250 | On-demand |

**Conservative Daily Usage:**
- Morning: Price sync (500 calls)
- Afternoon: New content (1,000 calls)
- Evening: Edition sync (2,000 calls)
- **Total: 3,500 calls (~17% of limit)**

## TCGPlayer Link Enhancement (Future)

### Option 1: Manual Product ID Database

Create a mapping table:
```sql
CREATE TABLE tcgplayer_product_mapping (
  base_card_id TEXT,
  edition TEXT,
  tcgplayer_product_id INTEGER,
  PRIMARY KEY (base_card_id, edition)
);
```

Populate with known cards:
```javascript
{
  "base1-4": {
    "Unlimited": 42382,
    "1st Edition": 42383,
    "Shadowless": 42384
  }
}
```

### Option 2: TCGPlayer API

- Requires TCGPlayer partnership
- Provides accurate product IDs
- Better than search URLs

### Option 3: Community Contribution

- Let users submit correct links
- Verify and store in mapping table
- Gradually build complete database

## Breaking Changes

**For Existing Data:**
1. Card IDs will change (add edition suffix)
2. User collections need migration
3. Price alerts need card_id updates
4. Saved searches/filters may break

**Migration Script Needed:**
```sql
-- Migrate existing cards to edition-specific IDs
-- Migrate user collections
-- Migrate price alerts
-- Update any saved state
```

## Rollback Plan

If issues arise:

**1. Revert Sync Function:**
- Deploy previous version
- Stop creating edition-specific cards

**2. Keep Both Schemas:**
- Old cards: `base1-4`
- New cards: `base1-4-unlimited`
- Frontend shows correct version

**3. Gradual Migration:**
- Sync new sets with editions
- Keep old sets as-is
- Migrate popular sets one by one

## Success Metrics

1. ✅ Multiple editions per card in database
2. ✅ Correct pricing per edition
3. ✅ Users can collect multiple editions
4. ✅ Price alerts work per edition
5. ✅ TCGPlayer links go to correct product (or search)
6. ✅ Admin panel shows edition counts
7. ✅ Collection displays editions clearly

## Next Steps

1. **Deploy migration** → Add base_card_id and edition architecture
2. **Deploy sync updates** → Edition-aware sync function
3. **Re-sync Base Set** → Test with real data
4. **Monitor results** → Check card counts, pricing accuracy
5. **Update admin panel** → Add edition metrics
6. **Document edge cases** → Cards with unusual edition variants
7. **Build TCGPlayer mapping** → Start with top 100 cards
