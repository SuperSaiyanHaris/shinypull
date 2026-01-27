# Quick Start: Bulk Import Pokemon TCG Data

## 🚀 TL;DR - Get All 19k Cards in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Make sure .env has Supabase credentials
# VITE_SUPABASE_URL=your-url
# VITE_SUPABASE_ANON_KEY=your-key

# 3. Run the import
npm run bulk-import

# 4. Done! Check Supabase - you now have:
#    - 160+ sets
#    - 19,000+ cards with full data
```

## What Happens During Import

```
╔════════════════════════════════════════════════════════╗
║  Pokemon TCG Bulk Import from GitHub                  ║
║  Source: PokemonTCG/pokemon-tcg-data                   ║
╚════════════════════════════════════════════════════════╝

🎴 STEP 1: Importing Sets from GitHub...

📥 Fetching: https://raw.githubusercontent.com/...sets/en.json
✅ Downloaded 164 sets from GitHub
  ✓ Imported 164/164 sets

✅ Successfully imported 164 sets!

🃏 STEP 2: Importing Cards from GitHub...

[1/164] Importing cards for set: base1
  ✓ Imported 102 cards from base1
[2/164] Importing cards for set: base2
  ✓ Imported 64 cards from base2
[3/164] Importing cards for set: base3
  ✓ Imported 62 cards from base3
...
[164/164] Importing cards for set: sv10
  ✓ Imported 244 cards from sv10

✅ Card Import Complete!
   Total cards imported: 19,423
   Successful sets: 164/164

╔════════════════════════════════════════════════════════╗
║  🎉 IMPORT COMPLETE!                                   ║
╚════════════════════════════════════════════════════════╝

Total time: 287 seconds
Sets imported: 164
Cards imported: 19,423

✨ All data successfully imported!

📝 Next steps:
   1. Your database now has all Pokemon TCG cards with static data
   2. Use the Pokemon API only for incremental price updates
   3. Cards are ready to browse in your app!
```

## Verify Import Success

### Check Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor**
3. Check `sets` table - should have ~164 rows
4. Check `cards` table - should have ~19,400 rows

### Test in Your App

```bash
npm run dev
# Open http://localhost:5173
# Browse cards - should load instantly!
```

## Update Prices (After Import)

### Option 1: Manual (From Browser)
```
Open: https://your-app.vercel.app/api/incremental-price-update?limit=20
Result: Updates 20 card prices
```

### Option 2: From Admin Panel
Add this button to your admin component:

```jsx
const updatePrices = async () => {
  const res = await fetch('/api/incremental-price-update?limit=50');
  const data = await res.json();
  console.log(`Updated ${data.updated} prices`);
};

<button onClick={updatePrices}>Update Prices</button>
```

### Option 3: Scheduled (Vercel Cron)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/incremental-price-update?limit=30",
    "schedule": "0 */2 * * *"
  }]
}
```

## Common Questions

### Q: How long does the import take?
**A:** 2-5 minutes depending on your internet connection

### Q: Does it cost anything?
**A:** No! GitHub data is free, no API limits

### Q: Will it work on Vercel?
**A:** Import must run locally (your computer). Updates run on Vercel.

### Q: Can I re-run the import?
**A:** Yes! It will upsert (update existing, insert new). Safe to run multiple times.

### Q: What if some cards fail to import?
**A:** Script continues and reports failures at end. You can re-run to retry.

### Q: Do I need a Pokemon API key?
**A:** Not for bulk import! Only for price updates (optional but recommended).

### Q: How do I get an API key?
**A:** Sign up at https://pokemontcg.io - free tier gives 20,000 requests/day

## Troubleshooting

### Error: "Missing Supabase credentials"
```bash
# Check your .env file has:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Error: "ENOTFOUND github.com"
- Check internet connection
- Try again in a few minutes

### Error: "Foreign key violation"
- Run database migrations first
- Verify `sets` table exists before `cards`

### Some Cards Missing Prices
- Normal! Not all cards have market prices
- Run `/api/incremental-price-update` to fill in more prices
- Some promo/old cards may never have prices

## Files Involved

```
scripts/
  bulk-import-from-github.js    ← Main import script

api/
  incremental-price-update.js   ← Price update endpoint

docs/
  BULK_IMPORT_STRATEGY.md        ← Full documentation
  BULK_IMPORT_QUICKSTART.md      ← This file

package.json                     ← Added npm run bulk-import
```

## Success Checklist

- [ ] `npm install` completed
- [ ] `.env` has Supabase credentials
- [ ] `npm run bulk-import` completed successfully
- [ ] Supabase has ~164 sets
- [ ] Supabase has ~19,400 cards
- [ ] App loads cards instantly
- [ ] Set up price update schedule

## Need Help?

Check the full documentation: [BULK_IMPORT_STRATEGY.md](./BULK_IMPORT_STRATEGY.md)

---

**Note:** This import strategy completely eliminates the timeout issues you were experiencing. The Pokemon API is now only used for incremental price updates, not bulk data loading! 🎉
