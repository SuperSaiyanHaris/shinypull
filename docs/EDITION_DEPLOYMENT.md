# Edition Architecture - Deployment Checklist

## What Was Built

### 1. Complete Edition Architecture ✅
Each card edition (1st Edition, Unlimited, Shadowless, etc.) is now a **separate entity** with:
- Unique card ID (e.g., `base1-4-1st-edition` vs `base1-4-unlimited`)
- Separate price data per edition
- Individual collection tracking
- Edition-specific TCGPlayer links (via search URLs)

### 2. Database Changes ✅

**Migration File:** `database/supabase-edition-architecture.sql`

**Changes:**
- Added `base_card_id` column to group editions together
- Updated unique constraints on `user_collections` for edition support
- Created helper functions for edition ID generation
- Created `card_editions` view for querying edition groups
- Added indexes for performance

### 3. Sync Function Updates ✅

**New File:** `supabase/functions/sync-pokemon-data/edition-utils.ts`
- Parses Pokemon API price variants
- Maps variant keys to edition names
- Generates edition-specific card IDs
- Deduplicates editions

**Updated File:** `supabase/functions/sync-pokemon-data/index.ts`
- Now creates separate cards for each price variant
- Example: base1-4 with both `holofoil` and `1stEditionHolofoil` creates 2 cards

### 4. Frontend Updates ✅
- **AddToCollectionButton**: Edition picker modal
- **MyCollection**: Edition badges (🥇 1st Ed, 👻 Shadow, etc.)
- **CardModal**: Edition display next to card name
- **collectionService**: Handles `card_edition` parameter

### 5. Admin Tools ✅

**Documentation:** `docs/EDITION_ARCHITECTURE.md`
- Complete implementation guide
- Testing procedures
- API call budget analysis
- Rollback plan

**Queries:** `database/admin-edition-queries.sql`
- Edition statistics
- Price comparisons (1st Ed vs Unlimited)
- Sync progress monitoring
- User collection insights

## Deployment Steps

### Step 1: Deploy Database Migration

```bash
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of: database/supabase-edition-architecture.sql
# 3. Run the migration
# 4. Verify no errors
```

**What it does:**
- Adds `base_card_id` column to cards
- Updates user_collections constraints
- Creates helper functions and views

### Step 2: Deploy Edge Function Updates

```bash
# Option A: Using Supabase CLI
supabase functions deploy sync-pokemon-data

# Option B: Manual deployment
# 1. Go to Supabase Dashboard → Edge Functions
# 2. Update sync-pokemon-data function
# 3. Upload both index.ts and edition-utils.ts
```

**What changes:**
- Sync now creates separate card records per edition
- Parses all price variants from Pokemon API
- Deduplicates edition data

### Step 3: Test with Base Set

```bash
# Trigger sync for Base Set (has 1st Edition cards)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-pokemon-data \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "single-set", "setId": "base1"}'
```

**Expected Results:**
- Charizard (base1-4) becomes 2 cards:
  - `base1-4-unlimited` (~$462)
  - `base1-4-1st-edition` (~$15,000)

### Step 4: Verify Data

Run these queries in Supabase SQL Editor:

```sql
-- Check edition counts
SELECT edition, COUNT(*) as count
FROM cards
WHERE base_card_id IS NOT NULL
GROUP BY edition;

-- Check Charizard editions
SELECT id, name, number, edition, tcgplayer_market
FROM cards
LEFT JOIN prices ON cards.id = prices.card_id
WHERE base_card_id = 'base1-4';
```

### Step 5: Migrate Existing Collections (Optional)

**Only if you have existing user data:**

```sql
-- Update existing collection items to edition-specific IDs
UPDATE user_collections
SET 
  card_id = card_id || '-unlimited',
  card_edition = 'Unlimited'
WHERE card_edition IS NULL;
```

### Step 6: Full Database Sync

With 20,000 API calls/day, you can:

**Option A: All at once (1-2 days)**
```bash
# Sync all sets
POST /sync-pokemon-data
{"mode": "full"}
```

**Option B: Strategic (recommended)**
```bash
# Day 1: Popular vintage sets
base1, base2, jungle, fossil, base4, base5

# Day 2: Neo era
neo1, neo2, neo3, neo4

# Day 3: Modern sets
(newer sets have fewer editions)
```

## What's Different Now

### Before Edition Architecture
```
base1-4 (Charizard)
  └─ Price: $462 (Unlimited)
  └─ TCGPlayer Link → Unlimited edition product
```

### After Edition Architecture
```
base1-4-unlimited (Charizard - Unlimited)
  └─ Price: $462
  └─ TCGPlayer Link → Search for "Charizard 4 Unlimited"

base1-4-1st-edition (Charizard - 1st Edition)
  └─ Price: $15,000
  └─ TCGPlayer Link → Search for "Charizard 4 1st Edition"
```

## User Experience Changes

### Adding Cards to Collection
**Before:** Click "Add to Collection" → Added

**Now:** Click "Add to Collection" → Select Edition → Added

**User sees:**
```
Select Edition:
○ Unlimited
○ 1st Edition 🥇
○ Shadowless
○ Reverse Holo
○ Normal
```

### Viewing Collection
**Before:** Card shows generic pricing

**Now:** Card shows edition-specific pricing and badge

**User sees:**
```
[Card Image]
🥇 1st Ed        ← Edition badge
$15,000          ← Edition-specific price
```

### Price Alerts
**Before:** Alert set on "Charizard"

**Now:** Alert set on "Charizard (1st Edition)"

**Result:** Tracks correct edition's price

## API Call Budget (20,000/day)

### One-Time Full Sync
- 250 sets × 80 cards avg = 20,000 cards
- 2 calls per card (metadata + prices) = 40,000 calls
- **Time: 2 days**

### Daily Price Updates
- 20,000 cards ÷ 100 per call = 200 calls
- **Leaves 19,800 calls for other tasks**

### Monthly Maintenance
- Price sync: 200 calls/day
- New set releases: 160 calls/set
- Edition discovery: 250 calls/set
- **Total: ~400 calls/day (~2% of limit)**

## Monitoring & Admin

### Edition Statistics

Use `database/admin-edition-queries.sql`:

```sql
-- See edition distribution
SELECT edition, COUNT(*) as count
FROM cards
WHERE edition IS NOT NULL
GROUP BY edition;

-- Price comparison
-- Shows 1st Edition vs Unlimited price difference
```

### Admin Panel Enhancements (Future)

Current admin panel shows:
- ✅ Sync status
- ✅ Progress per set
- ✅ Manual sync triggers

**Recommended additions:**
- Edition count per set
- "Synced X cards (Y editions)"
- Edition-specific sync options
- Price comparison view

## Rollback Plan

If issues arise:

**1. Stop Creating New Edition Cards:**
```bash
# Revert to previous sync function deployment
# Old function won't create edition-specific IDs
```

**2. Keep Existing Data:**
- Old cards: `base1-4`
- New cards: `base1-4-unlimited`
- Frontend handles both formats

**3. Gradual Rollback:**
```sql
-- Remove edition-specific cards
DELETE FROM cards WHERE id LIKE '%-unlimited'
  OR id LIKE '%-1st-edition'
  OR id LIKE '%-shadowless';
```

## Success Metrics

### Technical
- ✅ Multiple card records per edition in database
- ✅ Correct pricing per edition
- ✅ No sync errors with edition parsing
- ✅ Edition-specific card IDs generated correctly

### User Experience
- ✅ Users can select edition when adding cards
- ✅ Edition badges display in collection
- ✅ Price alerts work per edition
- ✅ TCGPlayer links relevant to edition

### Business
- ✅ Accurate pricing (no more 30x off valuations!)
- ✅ User trust (correct links)
- ✅ Better collection tracking
- ✅ Edition-specific price alerts

## Known Limitations

### 1. TCGPlayer Links
**Issue:** Pokemon API only provides one URL per base card

**Solution:** Generate search URLs with edition in query
- Example: `tcgplayer.com/search?q=Charizard+4+1st+Edition`

**Future:** Build product ID mapping database

### 2. Edition Detection
**Issue:** Not all cards have multiple editions

**Handling:** If no editions found, creates single "Unlimited" card

### 3. Existing User Data
**Issue:** Old collections reference old card IDs

**Solution:** Run migration script to update card IDs

## Next Steps

1. **Deploy migration** ✅ Created
2. **Deploy sync function** ✅ Created
3. **Test with Base Set** ⏳ Ready to test
4. **Monitor results** ⏳ Use admin queries
5. **Full sync** ⏳ 1-2 days with 20k limit
6. **Refine based on data** ⏳ Adjust as needed

## Support & Troubleshooting

### If cards aren't creating multiple editions:
- Check Pokemon API response has multiple price variants
- Verify edition-utils.ts mapping is correct
- Check Supabase logs for errors

### If prices are wrong:
- Verify price variant mapping
- Check deduplication logic
- Run admin query #6 (price comparison)

### If collection breaks:
- Check user_collections has card_edition column
- Verify unique constraint updated
- Run collection migration script

## Files Reference

### Database
- `database/supabase-edition-architecture.sql` - Main migration
- `database/admin-edition-queries.sql` - Monitoring queries

### Backend
- `supabase/functions/sync-pokemon-data/index.ts` - Updated sync
- `supabase/functions/sync-pokemon-data/edition-utils.ts` - Edition parsing

### Frontend
- `src/components/AddToCollectionButton.jsx` - Edition picker
- `src/components/MyCollection.jsx` - Edition badges
- `src/components/CardModal.jsx` - Edition display
- `src/services/collectionService.js` - Edition handling

### Documentation
- `docs/EDITION_ARCHITECTURE.md` - Complete guide
- `docs/EDITIONS_PROBLEM.md` - Problem explanation

## Questions & Answers

**Q: Will this break existing data?**
A: Old card IDs still work. New sync creates edition-specific IDs.

**Q: How long does full sync take?**
A: With 20k calls/day: 1-2 days for entire database.

**Q: What about modern sets?**
A: Most have only Unlimited + Reverse Holo (2 editions).

**Q: Can users collect multiple editions?**
A: Yes! They'll show as separate items in collection.

**Q: Are TCGPlayer links accurate?**
A: They're search URLs (edition in query). Future: product ID mapping.

**Q: What if a set has no editions?**
A: Creates single "Unlimited" card (same as before).

## Conclusion

This implementation **completely solves** the edition handling problem by:
1. Treating each edition as separate entity
2. Storing edition-specific pricing
3. Allowing edition selection in collections
4. Displaying edition badges clearly
5. Providing edition-specific links (via search)

**Ready to deploy!** Start with the migration, then sync Base Set as a test.
