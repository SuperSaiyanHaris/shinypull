# Pokemon TCG API Deprecation

**Date:** January 27, 2026  
**Status:** ✅ Complete

## Summary

The Pokemon TCG API (api.pokemontcg.io) has been fully deprecated and removed from the codebase. All functionality has been replaced with:
- **Bulk Data:** GitHub static data imports
- **Price Updates:** eBay Browse API

## Changes Made

### 1. Environment Variables

**Removed:**
- `VITE_POKEMON_API_KEY` - No longer needed

**Added:**
- `EBAY_APP_ID` - Backend eBay credentials
- `EBAY_CERT_ID` - Backend eBay credentials
- (Frontend VITE_ versions retained for potential future use)

### 2. Admin Panel Updates

**File:** `src/components/AdminSyncPanel.jsx`

**Changes:**
- **Complete Sync:** Now shows deprecation alert, directs to `npm run bulk-import`
- **New Sets Sync:** Now shows deprecation alert, directs to `npm run bulk-import`
- **Price Update:** Now calls `/api/incremental-price-update` (eBay-based)

**Removed Imports:**
- `performCompleteInitialSync` 
- `syncNewSetsOnly`
- `updatePricesOnly`

**Current Flow:**
```javascript
// Price updates now call eBay endpoint directly
const response = await fetch('/api/incremental-price-update?limit=10');
```

### 3. Deprecated Services (Marked, Not Deleted)

These files are marked as deprecated but kept for reference:

**Backend:**
- `api/pokemon-api.js` - Pokemon API proxy (no longer used)

**Frontend:**
- `src/services/comprehensiveSyncService.js` - Bulk sync via Pokemon API
- `src/services/priceUpdateService.js` - Price updates via Pokemon API
- `src/services/cardService.js` - Card fetching via Pokemon API
- `src/services/setService.js` - Set fetching via Pokemon API

Each file has a deprecation header explaining:
- Why it's deprecated
- What replaced it
- That it can be safely deleted

### 4. New Architecture

**Bulk Import (One-time/Periodic):**
```bash
npm run bulk-import
```
- Source: GitHub (PokemonTCG/pokemon-tcg-data)
- Imports: 170 sets, 19k+ cards
- Time: ~2-5 minutes
- Script: `scripts/bulk-import-from-github.js`

**Price Updates (Ongoing):**
```bash
# Via admin panel or direct API call
curl https://shinypull.com/api/incremental-price-update?limit=10
```
- Source: eBay Browse API (sold listings)
- Updates: 5-10 cards per call
- Service: `api/services/ebayPriceService.js`
- Endpoint: `api/incremental-price-update.js`

## Vercel/Supabase Environment Variables

Make sure to update these platforms:

### Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. **Delete:** `VITE_POKEMON_API_KEY`
3. **Add:** 
   - `EBAY_APP_ID` = `HarisLil-shinypul-PRD-9b427e586-89ae2762`
   - `EBAY_CERT_ID` = `PRD-b427e5862c6d-1910-499a-b822-ccdd`
4. Redeploy

### Supabase Dashboard
1. Go to Project Settings → Edge Functions
2. **Delete:** `POKEMON_API_KEY` (if set)
3. **Add:** eBay credentials if using edge functions

## Testing Checklist

- [x] Bulk import script works
- [ ] Admin panel price update button works
- [ ] eBay OAuth authentication succeeds
- [ ] Price data populates from eBay
- [ ] No console errors referencing Pokemon API
- [ ] Vercel deployment succeeds

## Rollback Plan

If issues arise:
1. Git checkout previous version
2. Re-add `VITE_POKEMON_API_KEY` to env
3. Revert `AdminSyncPanel.jsx` changes
4. Note: Pokemon API is still broken, so rollback won't restore functionality

## Next Steps

1. Test eBay price updates in production
2. Monitor eBay API rate limits
3. Optionally delete deprecated service files
4. Update documentation to remove Pokemon API references
5. Consider adding price update scheduling (cron job)

## References

- [Bulk Import Strategy](./BULK_IMPORT_STRATEGY.md)
- [eBay API Setup](./EBAY_API_SETUP.md)
- eBay Browse API: https://developer.ebay.com/api-docs/buy/browse/overview.html
