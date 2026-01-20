# API Integration Guide

This guide helps you replace the mock data with real pricing APIs.

## Quick Start Recommendation: Pokemon TCG API

**Why start here?**
- ✅ FREE - No authentication required
- ✅ Well-documented
- ✅ Easy to use
- ✅ Good for MVP testing
- ❌ Limited to Pokemon only
- ❌ No real-time pricing (uses market averages)

### Implementation

1. **Update `src/services/cardService.js`**

```javascript
const POKEMON_API = 'https://api.pokemontcg.io/v2';

export const searchCards = async (query) => {
  try {
    const response = await fetch(
      `${POKEMON_API}/cards?q=name:${encodeURIComponent(query)}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch cards');
    
    const data = await response.json();
    
    // Transform to our app format
    return data.data.map(card => ({
      id: card.id,
      name: card.name,
      set: card.set.name,
      number: card.number,
      rarity: card.rarity,
      image: card.images.large,
      prices: {
        tcgplayer: {
          market: card.tcgplayer?.prices?.holofoil?.market || 0,
          low: card.tcgplayer?.prices?.holofoil?.low || 0,
          high: card.tcgplayer?.prices?.holofoil?.high || 0,
        },
        // Add other sources as available
      }
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
};
```

2. **Test it!**
   ```bash
   npm run dev
   ```

## Production Option: TCGPlayer API

**Best for production because:**
- ✅ Most comprehensive pricing data
- ✅ Real-time market prices
- ✅ Supports Pokemon, MTG, Yu-Gi-Oh
- ✅ Official data source
- ❌ Requires approval process
- ❌ API keys needed

### Setup Steps

1. **Create Account**
   - Go to https://tcgplayer.com/
   - Sign up for free account

2. **Apply for API Access**
   - Navigate to https://docs.tcgplayer.com/
   - Request developer access
   - Wait for approval (usually 1-3 days)

3. **Get Credentials**
   - Public Key
   - Private Key
   - App ID

4. **Add to `.env`**
   ```env
   VITE_TCGPLAYER_PUBLIC_KEY=your_public_key
   VITE_TCGPLAYER_PRIVATE_KEY=your_private_key
   ```

5. **Implement OAuth Flow**

```javascript
// src/services/tcgplayer.js

let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry > Date.now()) {
    return accessToken;
  }

  const publicKey = import.meta.env.VITE_TCGPLAYER_PUBLIC_KEY;
  const privateKey = import.meta.env.VITE_TCGPLAYER_PRIVATE_KEY;

  const response = await fetch('https://api.tcgplayer.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: publicKey,
      client_secret: privateKey,
    }),
  });

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  return accessToken;
}

export const searchCards = async (query) => {
  const token = await getAccessToken();
  
  const response = await fetch(
    `https://api.tcgplayer.com/catalog/products?name=${encodeURIComponent(query)}&categoryId=3`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  return transformTCGPlayerData(data.results);
};

function transformTCGPlayerData(cards) {
  return cards.map(card => ({
    id: card.productId,
    name: card.name,
    set: card.groupName,
    number: card.numberInSet || 'N/A',
    rarity: card.rarity,
    image: card.imageUrl,
    prices: {
      tcgplayer: {
        market: card.marketPrice,
        low: card.lowPrice,
        high: card.highPrice,
      }
    }
  }));
}
```

## Alternative: eBay Finding API

**Good for:**
- ✅ Real sold listings
- ✅ Market price validation
- ✅ Free tier available
- ❌ More complex setup
- ❌ Rate limits

### Setup

1. **Sign up** at https://developer.ebay.com/
2. **Create App**
3. **Get API Keys**
4. **Implement**

```javascript
const EBAY_APP_ID = import.meta.env.VITE_EBAY_APP_ID;

export const getEbayPrices = async (cardName) => {
  const response = await fetch(
    `https://svcs.ebay.com/services/search/FindingService/v1` +
    `?OPERATION-NAME=findCompletedItems` +
    `&SERVICE-VERSION=1.0.0` +
    `&SECURITY-APPNAME=${EBAY_APP_ID}` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&keywords=${encodeURIComponent(cardName + ' pokemon card')}` +
    `&sortOrder=PricePlusShippingLowest`
  );

  const data = await response.json();
  // Process sold listings to calculate average
};
```

## Rate Limiting & Caching

**Important!** Implement caching to avoid hitting rate limits:

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const searchCards = async (query) => {
  const cacheKey = `search_${query}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFromAPI(query);
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};
```

## Backend API Option (Advanced)

For production, consider building a backend to:
- Store API keys securely (not in frontend)
- Aggregate data from multiple sources
- Implement robust caching
- Store historical price data
- Handle webhooks and updates

```javascript
// Example backend endpoint
// POST /api/cards/search
{
  "query": "charizard",
  "filters": {
    "set": "base-set",
    "rarity": "rare-holo"
  }
}

// Response
{
  "results": [...],
  "cached": false,
  "sources": ["tcgplayer", "ebay", "cardmarket"]
}
```

## Testing Your Integration

1. **Start with one card**
   ```javascript
   searchCards('pikachu').then(console.log);
   ```

2. **Check data format**
   - Verify all required fields exist
   - Handle missing/null values
   - Transform to app format

3. **Test error cases**
   - No results found
   - API timeout
   - Rate limit exceeded
   - Invalid API key

4. **Monitor console**
   - Look for CORS errors
   - Check network tab
   - Verify response structure

## Recommended Approach for MVP

1. **Week 1**: Use Pokemon TCG API (free, easy)
2. **Week 2**: Apply for TCGPlayer API access
3. **Week 3**: Implement TCGPlayer while waiting for approval
4. **Week 4**: Add eBay as secondary source
5. **Month 2**: Build backend for production

## Common Issues

### CORS Errors
**Problem**: "Access to fetch blocked by CORS policy"

**Solution**: Use backend proxy or enable CORS on API

```javascript
// vite.config.js - Development proxy
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.tcgplayer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### Rate Limits
**Problem**: Too many requests

**Solution**: 
- Implement caching
- Debounce search (already done!)
- Add loading states
- Use backend for aggregation

### Missing Data
**Problem**: Some cards don't have prices

**Solution**:
```javascript
const safePrice = card.prices?.tcgplayer?.market || 0;

// Or show "Price unavailable"
{safePrice === 0 ? (
  <span className="text-slate-500">Price unavailable</span>
) : (
  <span>{formatPrice(safePrice)}</span>
)}
```

## Next Steps

1. Choose your API (Pokemon TCG recommended for MVP)
2. Sign up and get credentials
3. Update `cardService.js` with real implementation
4. Test thoroughly
5. Add error handling and loading states
6. Deploy!

Good luck! 🚀
