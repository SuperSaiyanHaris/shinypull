# Fix TCGPlayer Links to Show Product Pages

## Problem
Currently, TCGPlayer links show search results instead of direct product pages:
- **Current**: `https://www.tcgplayer.com/search/pokemon/product?q=...`
- **Desired**: `https://www.tcgplayer.com/product/662184/pokemon-me02-...`

## Solution
The Pokemon TCG API already provides direct TCGPlayer product URLs in the `card.tcgplayer.url` field. These URLs redirect to the actual product pages.

Example:
- API provides: `https://prices.pokemontcg.io/tcgplayer/me2-125`
- Redirects to: `https://tcgplayer.pxf.io/scrydex?u=https://tcgplayer.com/product/662184`
- Final page: TCGPlayer product page with proper URL structure

## Implementation Steps

### 1. Add Database Column ✅
Run the SQL migration:
```bash
# In Supabase SQL Editor, run:
supabase-add-tcgplayer-url.sql
```

This adds the `tcgplayer_url` column to the `cards` table.

### 2. Re-sync Data from Pokemon TCG API
The sync function (`supabase/functions/sync-pokemon-data/index.ts`) already saves `tcgplayer_url` at line 233:
```typescript
tcgplayer_url: card.tcgplayer?.url || null,
```

After adding the column, trigger a data sync to populate URLs for all existing cards.

### 3. Code Already Configured ✅
All code is already set up to use the database column:

**cardService.js** (line 273):
```javascript
tcgplayerUrl: card.tcgplayer?.url || `search fallback`
```

**dbSetService.js** (lines 111 & 199):
```javascript
tcgplayerUrl: card.tcgplayer_url || tcgplayerSearchUrl
```

The code checks for the stored URL first, then falls back to search if not available.

## Testing
1. Run the SQL migration
2. Trigger sync: `POST /api/trigger-sync?type=full` or `?type=prices`
3. Open any card modal and click "View on TCGPlayer"
4. Should navigate directly to product page instead of search results

## Fallback Behavior
If `tcgplayer_url` is not available (older cards, API missing data), the system automatically falls back to search URLs. No errors will occur.
