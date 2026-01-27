/**
 * eBay Price Service
 * Fetches real market prices from completed eBay listings
 */

/**
 * Get eBay OAuth token
 */
export async function getEbayToken() {
  const appId = process.env.EBAY_APP_ID || process.env.VITE_EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID || process.env.VITE_EBAY_CERT_ID;
  
  if (!appId || !certId) {
    throw new Error('Missing eBay credentials');
  }
  
  const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
  
  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
  });
  
  if (!response.ok) {
    throw new Error(`eBay auth failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Search eBay for sold Pokemon card listings
 */
export async function searchEbaySoldListings(cardName, setName, limit = 20) {
  const token = await getEbayToken();
  
  // Build search query - Be very specific for Pokemon cards
  // Include "card" and "TCG" to avoid getting toys, plushies, etc.
  const query = `"${cardName}" Pokemon Card ${setName} -lot -bulk -pack -booster`;
  
  // Search for SOLD completed listings only with minimum price filter
  const searchParams = new URLSearchParams({
    q: query,
    filter: 'buyingOptions:{FIXED_PRICE},itemLocationCountry:US,priceCurrency:USD,conditions:{NEW|LIKE_NEW|EXCELLENT|VERY_GOOD|GOOD},price:[5..],soldItems',
    limit: limit.toString(),
    sort: 'price',
    fieldgroups: 'MATCHING_ITEMS'
  });
  
  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`eBay search failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.itemSummaries || [];
}

/**
 * Calculate market price from eBay listings
 */
export function calculateMarketPrice(listings) {
  if (!listings || listings.length === 0) {
    return {
      market: null,
      low: null,
      high: null,
      average: null,
      sampleSize: 0
    };
  }
  
  // Extract prices (convert from string to number)
  const prices = listings
    .map(item => {
      const price = item.price?.value;
      return price ? parseFloat(price) : null;
    })
    .filter(p => p !== null && p > 0);
  
  if (prices.length === 0) {
    return {
      market: null,
      low: null,
      high: null,
      average: null,
      sampleSize: 0
    };
  }
  
  // Sort prices
  prices.sort((a, b) => a - b);
  
  // Calculate stats
  const low = prices[0];
  const high = prices[prices.length - 1];
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Market price = median (more stable than average)
  const mid = Math.floor(prices.length / 2);
  const market = prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];
  
  return {
    market: Math.round(market * 100) / 100,
    low: Math.round(low * 100) / 100,
    high: Math.round(high * 100) / 100,
    average: Math.round(average * 100) / 100,
    sampleSize: prices.length
  };
}

/**
 * Get eBay price for a Pokemon card
 */
export async function getEbayCardPrice(cardName, setName) {
  try {
    const listings = await searchEbaySoldListings(cardName, setName, 30);
    const priceData = calculateMarketPrice(listings);
    
    return {
      success: true,
      ...priceData,
      source: 'ebay',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to get eBay price for ${cardName}:`, error.message);
    return {
      success: false,
      error: error.message,
      market: null,
      low: null,
      high: null,
      average: null,
      sampleSize: 0
    };
  }
}
