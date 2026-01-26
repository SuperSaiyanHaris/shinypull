# Card Editions Problem & Solution

## The Problem

**Current State:**
- We store ONE entry per card (e.g., `base1-4` = Charizard)
- We link to TCGPlayer using the Pokemon API's URL
- But Pokemon API's URL points to **Unlimited Edition by default**
- 1st Edition, Shadowless, and other variants are **separate products** on TCGPlayer with different prices

**Example:**
- Card in DB: `base1-4` (Charizard)
- Our link: `https://www.tcgplayer.com/product/42382` (Unlimited Holofoil ~$462)
- But user has: **1st Edition Holofoil** (~$15,000+)
- **Wrong price by 30x!**

## The Root Cause

Pokemon TCG API **does NOT distinguish editions**:
- They return one card ID: `base1-4`
- Different editions share the same ID
- Price object has variants like `holofoil`, `1stEditionHolofoil`, etc.
- But TCGPlayer URL always goes to unlimited

**Pokemon API Response:**
```json
{
  "id": "base1-4",
  "name": "Charizard",
  "tcgplayer": {
    "url": "https://prices.pokemontcg.io/tcgplayer/base1-4",
    "prices": {
      "holofoil": { "market": 462.35 },          // Unlimited
      "1stEditionHolofoil": { "market": 15000 }  // 1st Edition (if available)
    }
  }
}
```

## The Solution

### Phase 1: Add Edition Field (Quick Fix)

**Migration:** `supabase-add-edition-field.sql`

```sql
ALTER TABLE cards ADD COLUMN edition TEXT DEFAULT 'Unlimited';
```

This allows us to:
1. Track which edition a user has in their collection
2. Display the correct edition name in UI
3. Filter by edition in searches

**Limitations:** 
- Still links to wrong TCGPlayer product
- Prices still show unlimited edition

### Phase 2: Separate Edition Products (Complete Fix)

**Strategy:** Treat each edition as a separate card

Instead of:
```
base1-4 (Charizard)
```

Store as:
```
base1-4-unlimited (Charizard - Unlimited)
base1-4-1st-edition (Charizard - 1st Edition)
base1-4-shadowless (Charizard - Shadowless)
```

**Implementation:**

1. **Database Changes:**
   - Add `edition` field (done)
   - Change primary key strategy or add `edition` to unique constraint
   - Migrate existing cards to `edition = 'Unlimited'`

2. **Sync Updates:**
   - When syncing from Pokemon API, check ALL price variants
   - Create separate card entries for each variant that has pricing:
     - `holofoil` → Unlimited Holofoil
     - `1stEditionHolofoil` → 1st Edition Holofoil  
     - `unlimitedHolofoil` → Unlimited Holofoil
     - `normal` → Normal
     - `reverseHolofoil` → Reverse Holofoil

3. **TCGPlayer URL Fix:**
   - Pokemon API doesn't provide edition-specific URLs
   - Options:
     a. **Manual mapping:** Create our own product ID database
     b. **Scraping:** Get product IDs from TCGPlayer search
     c. **API Key:** Use TCGPlayer's API (requires partnership)
     d. **Smart links:** Link to TCGPlayer search with edition in query

### Phase 3: UI Updates

**Collection Management:**
- When adding card, let user SELECT edition:
  ```
  [ ] Unlimited
  [ ] 1st Edition  
  [ ] Shadowless
  [ ] Reverse Holo
  ```

**Display:**
- Show edition badge: `🥇 1st Edition` or `📜 Shadowless`
- Filter by edition in search/browse
- Show correct prices for selected edition

**Card Modal:**
- Display edition prominently
- Show price comparison PER edition:
  ```
  Unlimited:    $462
  1st Edition:  $15,000
  Shadowless:   $2,500
  ```

## Immediate Action Plan

### Step 1: Run Migration (5 minutes)
```sql
-- Run supabase-add-edition-field.sql in Supabase SQL Editor
```

### Step 2: Update Collection UI (30 minutes)
- Add edition dropdown to AddToCollectionButton
- Store edition when user adds card
- Display edition badge in collection

### Step 3: Update Card Sync (2 hours)
- Modify sync function to create cards per edition
- Extract edition from price variant keys
- Store proper edition value

### Step 4: Fix TCGPlayer Links (options)

**Option A: Smart Search Links (Quick - 30 min)**
```javascript
const getTCGPlayerLink = (card, edition) => {
  const query = `${card.name} ${card.number} ${edition} ${card.set}`;
  return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(query)}`;
};
```

**Option B: Product ID Mapping (Better - ongoing)**
- Build database of card → edition → product ID mappings
- Start with popular cards (Charizards, etc.)
- Crowd-source or scrape remaining

## Testing Plan

1. **Create test cards:**
   - Add Charizard Unlimited to collection
   - Add Charizard 1st Edition to collection
   - Verify they show different prices

2. **Test links:**
   - Click TCGPlayer links
   - Verify they go to correct product page

3. **Test alerts:**
   - Set price alert on 1st Edition
   - Verify it tracks 1st Edition price, not Unlimited

## Estimated Impact

**Cards Affected:**
- Base Set (1st Ed & Shadowless): ~102 cards × 2 editions = 204 entries
- Jungle/Fossil (1st Ed): ~60 cards × 2 = 120 entries
- Later sets: Mostly Unlimited + Reverse Holo

**Total:** ~500-1000 additional card entries needed

**Storage:** Minimal (text field + index)

**Performance:** No impact (same queries, just more rows)

## Priority

**HIGH** - This affects:
- ✅ Collection value accuracy (30x off for some cards!)
- ✅ Price alerts (wrong prices)
- ✅ User trust (linking to wrong products)
- ✅ eBay comparisons (comparing 1st Ed to Unlimited)

## Next Steps

1. Run migration to add `edition` field
2. Update UI to let users select edition when adding to collection
3. Begin tracking editions for new additions
4. Plan Phase 2 rollout for full edition support
