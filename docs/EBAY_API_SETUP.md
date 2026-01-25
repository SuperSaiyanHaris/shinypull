# Adding eBay Price Data

Currently, the app shows **estimated** eBay prices. Here's how to add REAL eBay sold listing data.

## Option 1: eBay Finding API (Recommended)

**Pros:**
- ✅ FREE tier: 5,000 calls/day
- ✅ Official API, won't get banned
- ✅ Real sold listing data
- ✅ Easy to implement

**Cons:**
- Requires eBay developer account
- Takes 1-2 days for approval

### Setup Steps:

1. **Create eBay Developer Account**
   - Go to https://developer.ebay.com/
   - Click "Register"
   - Complete the signup process

2. **Create an Application**
   - Go to https://developer.ebay.com/my/keys
   - Click "Create a Keyset"
   - Choose "Production" environment
   - Fill in app details:
     - Name: "TCG Price Tracker"
     - Description: "Pokemon card price comparison"
     - Website: Your domain (or localhost for testing)

3. **Get Your App ID**
   - Copy your "App ID (Client ID)"
   - You'll see something like: `YourName-TCGPrice-PRD-abc123def`

4. **Add to Environment Variables**
   
   Create a `.env` file in your project root:
   ```env
   VITE_EBAY_APP_ID=YourName-TCGPrice-PRD-abc123def
   ```

5. **Update cardService.js**

   Add this import at the top:
   ```javascript
   import { getEbayPriceAPI } from './ebayService';
   ```

   Update the `transformCards` function:
   ```javascript
   function transformCards(cards) {
     return cards.map(async card => {
       const prices = card.tcgplayer?.prices || {};
       const priceType = prices.holofoil || prices.reverseHolofoil || prices.normal || {};
       
       // Get real eBay data
       const ebayData = await getEbayPriceAPI(card.name, card.set.name);
       
       return {
         id: card.id,
         name: card.name,
         set: card.set.name,
         number: card.number,
         rarity: card.rarity || 'Common',
         image: card.images.large,
         prices: {
           tcgplayer: {
             market: priceType.market || 0,
             low: priceType.low || 0,
             high: priceType.high || 0,
           },
           ebay: ebayData ? {
             avg: ebayData.avg,
             median: ebayData.median,
             recent: ebayData.recent
           } : {
             avg: estimateEbayPrice(priceType.market),
             recent: []
           },
           cardmarket: {
             avg: priceType.market ? priceType.market * 0.92 : 0,
             trend: 'stable'
           }
         },
         priceHistory: generateMockHistory(priceType.market || 0)
       };
     });
   }
   
   // Update searchCards to handle async
   export const searchCards = async (query) => {
     try {
       // ... existing code ...
       const data = await response.json();
       const transformedCards = await Promise.all(transformCards(data.data));
       return transformedCards;
     } catch (error) {
       console.error('Error fetching cards:', error);
       return [];
     }
   };
   ```

6. **Test It**
   ```bash
   npm run dev
   ```
   
   Open browser console (F12) and search for a card. You should see eBay API calls in the Network tab.

7. **Verify Real Data**
   
   In the Compare tab, eBay should now show "✓ Live" badge instead of "~Est"

### Rate Limits

eBay Finding API limits:
- **Free tier**: 5,000 calls/day
- **Per IP**: 100 calls/minute
- **Recommendation**: Cache results for 30 minutes (already implemented in ebayService.js)

With caching, you can handle:
- ~10,000 unique card searches per day
- Millions of page views (cached results)

### Testing Without API Key

The app works fine without an eBay API key - it just shows estimated prices. To test the API integration:

1. Sign up for eBay developer account
2. Get sandbox credentials first
3. Test with those
4. Then get production credentials

## Option 2: Web Scraping (Not Recommended for Production)

**Legal Issues:**
- Violates eBay's Terms of Service
- Can get IP banned
- Unreliable (they change HTML frequently)
- Requires CORS proxy or backend

**Only use for:**
- Learning purposes
- Personal use only
- Not for deployed apps

### If You Still Want to Try:

You'd need a backend server (can't do in browser due to CORS):

```javascript
// backend/scraper.js (Node.js)
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEbay(cardName) {
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cardName)}&LH_Sold=1`;
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Educational Project)'
      }
    });
    
    const $ = cheerio.load(data);
    const prices = [];
    
    $('.s-item__price').each((i, el) => {
      const price = $(el).text().replace('$', '');
      prices.push(parseFloat(price));
    });
    
    return prices;
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
}
```

**But seriously, just use the official API.** It's free, legal, and better.

## Option 3: Buy from Data Aggregators

Services like:
- **TCGPlayer Pricing API** (if they ever reopen)
- **PriceCharting API** (paid)
- **Scryfall** (for MTG)

These aggregate data from multiple sources and provide clean APIs.

## Current Setup (No API Key Needed)

Right now, without eBay API:
- Shows Pokemon TCG API data (real, verified)
- Shows estimated eBay/Cardmarket prices based on TCG data
- Works perfectly for MVP and testing
- Users see "~Est" badges for estimated data

## My Recommendation

**For MVP/Learning:**
- Keep current setup with estimates
- It works great and costs $0

**For Production:**
1. Get eBay Finding API (1 week)
2. Later add PriceCharting API for more sources ($$$)
3. Build backend to aggregate and cache all data

**Timeline:**
- Week 1-2: Use estimates (current setup)
- Week 3: Apply for eBay API
- Week 4: Integrate eBay API
- Month 2: Consider paid aggregators if scaling

## Questions?

- **"Is the free tier enough?"** Yes! 5,000 calls/day with 30-min caching = ~10k searches/day
- **"Will I get banned?"** Not if you use official API with proper rate limiting
- **"Can I monetize?"** Yes, eBay Finding API allows commercial use
- **"What about other TCGs?"** eBay API works for ALL cards, not just Pokemon

## Next Steps

1. Decide: estimates (easy) vs real data (1 week setup)
2. If real data: Sign up at https://developer.ebay.com/
3. Get App ID
4. Add to `.env`
5. Update code as shown above
6. Deploy!

The app works great either way. Real eBay data is a nice-to-have, not a must-have for launch.
