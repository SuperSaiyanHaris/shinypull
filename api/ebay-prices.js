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
 */
function buildSearchTerms(cardName, cardNumber, graded) {
  const parts = [cardName];

  if (graded === 'psa10') {
    parts.push('PSA 10');
  } else if (cardNumber) {
    // Add card number for raw cards to narrow results
    const num = cardNumber.split('/')[0];
    parts.push(num);
  }

  parts.push('pokemon card');
  return parts.join(' ');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardName, cardNumber, graded } = req.query;

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
    const searchTerms = buildSearchTerms(cardName, cardNumber, graded);
    const encodedQuery = encodeURIComponent(searchTerms);

    // eBay Browse API endpoint
    // Category 183454 = Pokemon TCG
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&category_ids=183454&limit=50&sort=price`;

    console.log(`🔍 Fetching eBay active listings for: ${searchTerms}`);

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

    if (items.length === 0) {
      console.log(`❌ No eBay listings found for: ${searchTerms}`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Extract prices from active listings
    const listings = items
      .map(item => ({
        price: parseFloat(item.price?.value || 0),
        title: item.title || '',
        url: item.itemWebUrl || '',
        condition: item.condition || 'Unknown'
      }))
      .filter(item => item.price > 0);

    if (listings.length === 0) {
      console.log(`⚠️ eBay returned items but no valid prices`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Calculate statistics
    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const low = prices[0];
    const high = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];

    // Get cheapest listing for "Buy Now" link
    const cheapestListing = listings[0];

    // Build eBay search URL for users to view more
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=183454`;

    const result = {
      found: true,
      avg: parseFloat(avg.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      count: listings.length,
      cheapestListing: {
        price: cheapestListing.price,
        title: cheapestListing.title,
        url: cheapestListing.url
      },
      searchTerms,
      searchUrl: ebaySearchUrl,
      timestamp: Date.now()
    };

    console.log(`✅ Found ${listings.length} active eBay listings: $${low.toFixed(2)} - $${high.toFixed(2)}`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return res.status(500).json({
      error: 'Failed to fetch eBay data',
      message: error.message
    });
  }
}
