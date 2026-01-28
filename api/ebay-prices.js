// Vercel Serverless Function - eBay Price Fetcher
// Uses eBay Browse API for active listings (Finding API was decommissioned Feb 2025)

// Cache for OAuth tokens (reuse while valid)
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get OAuth access token using client credentials grant
 */
async function getAccessToken(clientId, clientSecret) {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}

/**
 * Build eBay search terms for a Pokemon card
 * CRITICAL: Card numbers are NOT unique across sets - must include identifying info
 * Example: Multiple sets have a #125, so we need Name + Number + Set
 */
function buildSearchTerms(cardName, cardNumber, rarity, setName, graded) {
  const parts = ['Pokemon'];
  
  // Clean up card name (remove ex, EX, etc. as they can cause matching issues)
  const cleanName = cardName
    .replace(/\s+ex$/i, '')
    .replace(/\s+EX$/i, '')
    .replace(/\s+gx$/i, '')
    .replace(/\s+GX$/i, '')
    .trim();
  
  parts.push(cleanName);

  // Add card number if available
  // Use full format (e.g., "125/094") as eBay will match both "125" and "125/094"
  // Some sellers use just "125", others use "125/094", eBay search handles both
  if (cardNumber) {
    parts.push(cardNumber);
  }

  // ALWAYS include set name for specificity - even if sellers abbreviate,
  // eBay's search will still match (e.g., searching "Phantasmal Flames" 
  // will find listings with "PFL" or "Phantasmal Flames")
  if (setName) {
    parts.push(setName);
  }

  // Add PSA 10 for graded cards
  if (graded === 'psa10') {
    parts.push('PSA 10');
  }

  const searchString = parts.join(' ');
  console.log(`🔍 Built search string: "${searchString}"`);
  console.log(`📋 Strategy: Name + Number + Set = Unique identifier (sellers may abbreviate set but eBay matches)`);
  return searchString;
}

/**
 * Check if a listing title contains PSA 10 indicators
 */
function isPSA10Listing(title) {
  const lowerTitle = title.toLowerCase();
  return lowerTitle.includes('psa 10') || 
         lowerTitle.includes('psa10') || 
         lowerTitle.includes('psa-10');
}

export default async function handler(req, res) {
  // Restrict CORS to your domains only
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'https://shinypull.vercel.app',
    // Allow localhost for development
    ...(process.env.NODE_ENV === 'development' || req.headers.host?.includes('localhost') ? 
      ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'] : [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardName, cardNumber, rarity, setName, graded } = req.query;

    console.log(`📥 Received params:`, { cardName, cardNumber, rarity, setName, graded });

    if (!cardName) {
      return res.status(400).json({ error: 'cardName is required' });
    }

    // Get eBay credentials
    const clientId = process.env.EBAY_APP_ID;
    const clientSecret = process.env.EBAY_CERT_ID;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'eBay API credentials not configured' });
    }

    // Get OAuth token
    const accessToken = await getAccessToken(clientId, clientSecret);

    // Build search terms
    const searchTerms = buildSearchTerms(cardName, cardNumber, rarity, setName, graded);
    const encodedQuery = encodeURIComponent(searchTerms);

    // eBay Browse API endpoint
    // Category 183454 = Pokemon TCG
    // CRITICAL: Use buyingOptions:{FIXED_PRICE} to exclude auctions with low starting bids
    // Auctions starting at $0.99-$5 would skew prices down - we want actual Buy It Now prices
    // Add minimum price filter to exclude cheap bulk/damaged cards
    // Fetch up to 50 listings (will use 10-15 for pricing, but get more for better selection)
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&category_ids=183454&filter=buyingOptions:{FIXED_PRICE},price:%5B10..%5D&limit=50&sort=price`;

    console.log(`🔍 Fetching eBay active listings for: ${searchTerms}`);
    console.log(`🌐 Encoded query: ${encodedQuery}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay API error:', response.status, errorText);
      return res.status(200).json({ found: false, searchTerms, error: `API error: ${response.status}` });
    }

    const data = await response.json();
    const items = data.itemSummaries || [];

    console.log(`📦 eBay returned ${items.length} total items`);

    if (items.length === 0) {
      console.log(`❌ No eBay listings found for: ${searchTerms}`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Extract prices from active listings and filter based on search type
    const allListings = items.map(item => ({
      price: parseFloat(item.price?.value || 0),
      title: item.title || '',
      url: item.itemWebUrl || '',
      condition: item.condition || 'Unknown'
    }));

    const listings = allListings.filter(item => {
      if (item.price <= 0) return false;
      
      const hasPSA = isPSA10Listing(item.title);
      
      // For PSA 10 searches, ONLY include listings with PSA 10 in title
      if (graded === 'psa10') {
        if (hasPSA) {
          console.log(`✅ PSA 10 listing: "${item.title}" - $${item.price}`);
        }
        return hasPSA;
      }
      
      // For raw card searches, EXCLUDE listings with PSA 10 in title
      if (hasPSA) {
        console.log(`⏭️  Skipping PSA listing in raw search: "${item.title}"`);
        return false;
      }
      console.log(`✅ Raw card listing: "${item.title}" - $${item.price}`);
      return true;
    });

    console.log(`🎯 After filtering: ${listings.length} valid listings (${graded === 'psa10' ? 'PSA 10' : 'raw'})`);

    if (listings.length === 0) {
      console.log(`⚠️ eBay returned items but no valid listings after filtering (${graded === 'psa10' ? 'no PSA 10 found' : 'all were PSA graded'})`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Use first 10-15 listings for pricing calculation (already sorted by price)
    // This gives us a good sample size while avoiding outliers from high-priced listings
    const targetSampleSize = Math.min(listings.length, 15);
    const pricingListings = listings.slice(0, targetSampleSize);
    
    console.log(`📊 Using ${pricingListings.length} listings for price calculation (target: 10-15)`);

    // Calculate statistics from the pricing sample
    const prices = pricingListings.map(l => l.price).sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const low = prices[0];
    const high = prices[prices.length - 1];
    
    // Calculate median (more stable than average for market price)
    const median = prices.length % 2 === 0
      ? (prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2
      : prices[Math.floor(prices.length / 2)];

    // Get top 5 listings for display
    const topListings = pricingListings.slice(0, 5).map(l => ({
      price: l.price,
      title: l.title,
      url: l.url,
      condition: l.condition
    }));

    // Get cheapest listing for "Buy Now" link
    const cheapestListing = listings[0];

    // Build eBay search URL for users to view more
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`;

    const result = {
      found: true,
      avg: parseFloat(avg.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      market: parseFloat(median.toFixed(2)), // Use median as the primary market price
      count: pricingListings.length,
      totalListings: listings.length, // Total found vs used for calculation
      topListings,
      cheapestListing: {
        price: pricingListings[0].price,
        title: pricingListings[0].title,
        url: pricingListings[0].url
      },
      searchTerms,
      searchUrl: ebaySearchUrl,
      timestamp: Date.now()
    };

    console.log(`✅ Found ${listings.length} listings, used ${pricingListings.length} for pricing`);
    console.log(`💰 Market Price (median): $${median.toFixed(2)} | Range: $${low.toFixed(2)} - $${high.toFixed(2)}`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return res.status(500).json({
      error: 'Failed to fetch eBay data',
      message: error.message
    });
  }
}
