# Bulk Import Strategy for Pokemon TCG Data

## The Problem We Solved

**Original Issue:** 
- Pokemon TCG API is slow (each request takes 1-5 seconds)
- Vercel has strict timeouts: 10 seconds (Hobby), 60 seconds (Pro)
- Syncing 19,000+ cards would take hours and timeout immediately
- API is designed for individual lookups, not bulk operations

**The Solution:**
Pokemon TCG publishes their **entire dataset as JSON files** on GitHub!
- All sets in one file: `sets/en.json`
- All cards organized by set: `cards/en/{setId}.json`
- No rate limits, no timeouts, instant download
- Complete and accurate data matching the API

## Architecture Overview

### 1. One-Time Bulk Import (Local)
Run once from your computer to populate the entire database:
```bash
npm install
npm run bulk-import
```

This script:
- Downloads all 160+ sets from GitHub
- Downloads all 19k+ cards organized by set
- Transforms data to match your database schema
- Bulk inserts into Supabase (takes 2-5 minutes total)

### 2. Incremental Price Updates (Vercel API)
After the initial import, use the API only for price updates:
```
GET /api/incremental-price-update?limit=20
```

This endpoint:
- Updates 20 cards at a time (finishes in ~3 seconds)
- Focuses on cards with oldest prices
- Can run on Vercel Hobby plan (10s timeout)
- Call it periodically to keep prices fresh

### 3. User Experience
- Users browse cards instantly (no loading, no API calls)
- Prices update in background incrementally
- No timeouts, no errors, smooth experience

## Files Created

### `/scripts/bulk-import-from-github.js`
Main bulk import script for one-time database population.

**Features:**
- Downloads entire dataset from GitHub
- Batch inserts (1000 sets, 500 cards at a time)
- Progress reporting
- Error handling and retry logic
- Complete data transformation

**Usage:**
```bash
# Make sure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run bulk-import
```

**Expected Output:**
```
Sets imported: 160+
Cards imported: 19,000+
Duration: 2-5 minutes
```

### `/api/incremental-price-update.js`
Vercel API endpoint for gradual price updates.

**Features:**
- Updates small batches (default 20, max 50)
- Respects Vercel timeouts
- Updates oldest prices first
- Optional set filtering

**Usage:**
```bash
# Update 20 oldest cards
GET /api/incremental-price-update

# Update 50 cards from specific set
GET /api/incremental-price-update?limit=50&setId=base1
```

**Response:**
```json
{
  "success": true,
  "updated": 20,
  "failed": 0,
  "total": 20
}
```

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

This adds:
- `node-fetch` - For fetching from GitHub
- `dotenv` - For environment variables

### 2. Run Bulk Import (One Time)
```bash
npm run bulk-import
```

**What it does:**
1. Fetches sets/en.json from GitHub (160+ sets)
2. Imports all sets to `sets` table
3. For each set, fetches cards/en/{setId}.json
4. Imports all cards to `cards` table with full metadata
5. Takes 2-5 minutes depending on connection

**Data Included:**
- ✅ All card images
- ✅ All card metadata (HP, types, attacks, etc.)
- ✅ Initial prices (from GitHub snapshot)
- ✅ Set information
- ✅ Legalities, rarity, artist, etc.

### 3. Set Up Incremental Price Updates

Add to your cron job or admin panel:
```javascript
// Update 20 cards every hour
async function updatePrices() {
  const response = await fetch('/api/incremental-price-update?limit=20');
  const result = await response.json();
  console.log(`Updated ${result.updated} card prices`);
}
```

Or manually trigger from admin panel:
```jsx
const handlePriceUpdate = async () => {
  const response = await fetch('/api/incremental-price-update?limit=50');
  const result = await response.json();
  alert(`Updated ${result.updated} cards`);
};
```

## Data Freshness Strategy

### Static Data (Never Changes)
These don't need updates once imported:
- Card images
- Card names, numbers
- HP, types, attacks
- Set information
- Artists, rarity

### Dynamic Data (Needs Updates)
Only prices change over time:
- `price` (market price)
- `price_holofoil`
- `price_reverse_holofoil`
- `price_normal`
- `last_price_update`

**Strategy:**
1. Import everything from GitHub once
2. Update prices incrementally using API
3. Prioritize popular/expensive cards
4. Update full catalog every few weeks

## Comparison: Old vs New Approach

### ❌ Old Approach (API-Only)
```
Syncing 19,000 cards...
→ 19,000 API requests × 2 seconds = 10.5 hours
→ Vercel timeout after 10-60 seconds ❌
→ Never completes
```

### ✅ New Approach (GitHub Bulk + API Updates)
```
One-time bulk import from GitHub:
→ 1 set file + 160 card files = 161 requests
→ ~2-5 minutes total
→ All data imported ✅

Ongoing price updates:
→ 20 cards × 200ms = 4 seconds per batch
→ Stays within Vercel limits ✅
→ Gradually updates all prices ✅
```

## Advanced: Scheduling Price Updates

### Option 1: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/incremental-price-update?limit=30",
    "schedule": "0 * * * *"
  }]
}
```
Updates 30 cards every hour = full catalog every ~26 days

### Option 2: Manual Triggers
Add button in admin panel:
```jsx
<button onClick={updatePrices}>
  Update Prices (20 cards)
</button>
```

### Option 3: GitHub Actions
Run locally on schedule:
```yaml
# .github/workflows/update-prices.yml
name: Update Prices
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: node scripts/update-prices-batch.js
```

## Troubleshooting

### Bulk Import Fails
**Error:** `Failed to fetch from GitHub`
- Check internet connection
- GitHub might be rate limiting (wait a bit)
- Try again - script handles partial failures

**Error:** `Supabase error`
- Check .env credentials
- Verify database schema matches (run migrations)
- Check Supabase quotas

### Price Updates Slow
- Reduce batch size: `?limit=10`
- Check Pokemon API key is set
- Without key: limited to 100 requests/day

### Cards Missing Prices
Normal! Not all cards have price data:
- Promotional cards often lack prices
- Very old/rare cards might not be tracked
- Updates will fill in over time

## Data Source Credits

All data sourced from:
- **Pokemon TCG API**: https://pokemontcg.io
- **GitHub Repository**: https://github.com/PokemonTCG/pokemon-tcg-data
- Maintained by the Pokemon TCG community
- Updated regularly with new releases

## Next Steps

1. ✅ Run bulk import (`npm run bulk-import`)
2. ✅ Verify data in Supabase dashboard
3. ✅ Test your app - cards should load instantly
4. ⏭️ Set up price update schedule
5. ⏭️ Monitor price freshness in admin panel

Your app now has complete Pokemon TCG data with no API timeout issues! 🎉
