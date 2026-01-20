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

// Use eBay Finding API via backend proxy (avoids CORS issues)
export async function getEbayPriceAPI(cardName, cardSet, cardNumber = '') {
  const cacheKey = `${cardName}_${cardSet}_${cardNumber}`;
  const cached = EBAY_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached eBay data for: ${cardName} (${cached.data.count} sales)`);
    return cached.data;
  }

  try {
    await rateLimit();

    // Build API endpoint URL (use Vercel function in production, local in dev)
    const isProduction = window.location.hostname !== 'localhost';
    const apiBase = isProduction
      ? window.location.origin
      : 'http://localhost:3000';

    const params = new URLSearchParams({
      cardName,
      ...(cardSet && { cardSet }),
      ...(cardNumber && { cardNumber })
    });

    const url = `${apiBase}/api/ebay-prices?${params}`;

    console.log(`🔍 Fetching eBay prices via backend:`, cardName);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.found) {
      console.log(`❌ No eBay results found for: ${data.searchTerms || cardName}`);
      return null;
    }

    const result = {
      avg: data.avg,
      median: data.median,
      recent: data.recent,
      count: data.count,
      lastUpdated: Date.now()
    };

    console.log(`✅ Found ${data.count} eBay sales for "${cardName}": $${data.avg} avg`);

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
