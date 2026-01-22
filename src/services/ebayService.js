// eBay Price Service
// Uses eBay Browse API for active listings (Finding API was decommissioned Feb 2025)

const EBAY_CACHE = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

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

/**
 * Fetch eBay active listing prices for a raw card
 */
export async function getEbayPriceAPI(cardName, cardSet = '', cardNumber = '') {
  const cacheKey = `ebay_${cardName}_${cardNumber}`;
  const cached = EBAY_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached eBay data for: ${cardName}`);
    return cached.data;
  }

  try {
    await rateLimit();

    const isProduction = window.location.hostname !== 'localhost';
    const apiBase = isProduction ? window.location.origin : 'http://localhost:3000';

    const params = new URLSearchParams({
      cardName,
      ...(cardNumber && { cardNumber })
    });

    const url = `${apiBase}/api/ebay-prices?${params}`;
    console.log(`🔍 Fetching eBay active listings for: ${cardName}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.found) {
      console.log(`❌ No eBay listings found for: ${data.searchTerms || cardName}`);
      return null;
    }

    const result = {
      low: data.low,
      high: data.high,
      avg: data.avg,
      median: data.median,
      count: data.count,
      cheapestListing: data.cheapestListing,
      searchTerms: data.searchTerms,
      searchUrl: data.searchUrl,
      lastUpdated: Date.now()
    };

    console.log(`✅ Found ${data.count} eBay listings for "${cardName}": $${data.low} - $${data.high}`);

    EBAY_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return null;
  }
}

/**
 * Fetch eBay active listing prices for PSA 10 graded cards
 */
export async function getEbayPSA10Price(cardName, cardSet = '', cardNumber = '') {
  const cacheKey = `psa10_${cardName}_${cardNumber}`;
  const cached = EBAY_CACHE.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Using cached PSA 10 eBay data for: ${cardName}`);
    return cached.data;
  }

  try {
    await rateLimit();

    const isProduction = window.location.hostname !== 'localhost';
    const apiBase = isProduction ? window.location.origin : 'http://localhost:3000';

    const params = new URLSearchParams({
      cardName,
      graded: 'psa10',
      ...(cardNumber && { cardNumber })
    });

    const url = `${apiBase}/api/ebay-prices?${params}`;
    console.log(`🔍 Fetching PSA 10 eBay listings for: ${cardName}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.found) {
      console.log(`❌ No PSA 10 eBay listings found for: ${data.searchTerms || cardName}`);
      return null;
    }

    const result = {
      low: data.low,
      high: data.high,
      avg: data.avg,
      median: data.median,
      count: data.count,
      cheapestListing: data.cheapestListing,
      searchTerms: data.searchTerms,
      searchUrl: data.searchUrl,
      lastUpdated: Date.now()
    };

    console.log(`✅ Found ${data.count} PSA 10 listings for "${cardName}": $${data.low} - $${data.high}`);

    EBAY_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error('Error fetching PSA 10 eBay data:', error);
    return null;
  }
}

/**
 * Estimate eBay price based on TCGPlayer price (fallback)
 */
export function estimateEbayPrice(tcgPlayerPrice) {
  if (!tcgPlayerPrice || tcgPlayerPrice === 0) return 0;
  // eBay listings typically 5-15% higher due to fees
  const variance = 1.05 + (Math.random() * 0.10);
  return parseFloat((tcgPlayerPrice * variance).toFixed(2));
}

/**
 * Estimate PSA 10 price based on raw card price (fallback)
 */
export function estimatePSA10Price(tcgPlayerPrice) {
  if (!tcgPlayerPrice || tcgPlayerPrice === 0) return 0;
  // PSA 10 graded cards typically 2-4x raw card price
  const multiplier = 2.5 + (Math.random() * 1.5);
  return parseFloat((tcgPlayerPrice * multiplier).toFixed(2));
}
