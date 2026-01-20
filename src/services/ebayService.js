// eBay Price Scraper (Educational/Personal Use)
// This fetches real sold listing data from eBay

const EBAY_CACHE = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

export async function getEbayPrice(cardName, cardSet) {
  const cacheKey = `${cardName}_${cardSet}`;
  
  // Check cache first
  const cached = EBAY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    await rateLimit();
    
    // Use eBay's public RSS feed (doesn't require API key)
    const searchQuery = encodeURIComponent(`${cardName} ${cardSet} pokemon card`);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&LH_Sold=1&LH_Complete=1&_sop=13`;
    
    // In a real implementation, you'd:
    // 1. Use a CORS proxy for browser-based scraping
    // 2. Or implement this on a backend server
    // 3. Or use eBay's Finding API (requires key but has free tier)
    
    // For now, we'll return estimated data
    // To implement real scraping, you need a backend
    console.log('eBay scraping would fetch from:', url);
    
    return null; // Indicates scraping not implemented yet
    
  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return null;
  }
}

// Alternative: Use eBay Finding API (Free tier: 5,000 calls/day)
export async function getEbayPriceAPI(cardName, cardSet) {
  const APP_ID = import.meta.env.VITE_EBAY_APP_ID;
  const IS_SANDBOX = import.meta.env.VITE_EBAY_SANDBOX === 'true';

  if (!APP_ID) {
    console.warn('eBay APP_ID not configured');
    return null;
  }

  const cacheKey = `${cardName}_${cardSet}`;
  const cached = EBAY_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    await rateLimit();

    const keywords = encodeURIComponent(`${cardName} ${cardSet} pokemon card`);

    // Use sandbox or production endpoint
    const baseUrl = IS_SANDBOX
      ? 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.ebay.com/services/search/FindingService/v1';

    const url = `${baseUrl}` +
      `?OPERATION-NAME=findCompletedItems` +
      `&SERVICE-VERSION=1.0.0` +
      `&SECURITY-APPNAME=${APP_ID}` +
      `&RESPONSE-DATA-FORMAT=JSON` +
      `&REST-PAYLOAD` +
      `&keywords=${keywords}` +
      `&itemFilter(0).name=SoldItemsOnly` +
      `&itemFilter(0).value=true` +
      `&itemFilter(1).name=Condition` +
      `&itemFilter(1).value=3000` + // New condition
      `&sortOrder=EndTimeSoonest` +
      `&paginationInput.entriesPerPage=50`;

    console.log(`🔍 Fetching eBay prices (${IS_SANDBOX ? 'SANDBOX' : 'PRODUCTION'}):`, cardName);

    const response = await fetch(url);
    const data = await response.json();
    
    const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    
    if (!searchResult || searchResult['@count'] === '0') {
      return null;
    }
    
    const items = searchResult.item || [];
    const prices = items
      .map(item => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0))
      .filter(price => price > 0);
    
    if (prices.length === 0) return null;
    
    // Calculate statistics
    prices.sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const recent = prices.slice(-5); // Last 5 sales
    
    const result = {
      avg: parseFloat(avg.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      recent,
      count: prices.length,
      lastUpdated: Date.now()
    };
    
    // Cache the result
    EBAY_CACHE.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching eBay API data:', error);
    return null;
  }
}

// Helper to get better eBay price estimates based on TCGPlayer data
export function estimateEbayPrice(tcgPlayerPrice) {
  if (!tcgPlayerPrice || tcgPlayerPrice === 0) return 0;
  
  // eBay typically 5-10% higher due to fees and convenience
  const variance = 1.05 + (Math.random() * 0.05);
  return parseFloat((tcgPlayerPrice * variance).toFixed(2));
}
