// Vercel Serverless Function - eBay Price Fetcher
// This acts as a backend proxy to avoid CORS issues

export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardName, cardSet, cardNumber } = req.query;

    if (!cardName) {
      return res.status(400).json({ error: 'cardName is required' });
    }

    // Get eBay credentials from environment variables
    const APP_ID = process.env.EBAY_APP_ID;

    if (!APP_ID) {
      return res.status(500).json({ error: 'eBay API not configured' });
    }

    // Build search terms - keep it simple for better match rates
    // Don't include card number or set as they're too restrictive
    let searchTerms = `${cardName} pokemon card`;

    // Only add set name if the card name is very common (like "Pikachu")
    // to help narrow down results
    const commonNames = ['pikachu', 'charizard', 'mewtwo', 'mew', 'eevee'];
    if (cardSet && commonNames.some(name => cardName.toLowerCase().includes(name))) {
      searchTerms += ` ${cardSet}`;
    }

    const keywords = encodeURIComponent(searchTerms);

    // eBay Production API endpoint
    const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';

    const url = `${baseUrl}` +
      `?OPERATION-NAME=findCompletedItems` +
      `&SERVICE-VERSION=1.0.0` +
      `&SECURITY-APPNAME=${APP_ID}` +
      `&RESPONSE-DATA-FORMAT=JSON` +
      `&REST-PAYLOAD` +
      `&keywords=${keywords}` +
      `&categoryId=183454` + // Pokemon TCG category
      `&itemFilter(0).name=SoldItemsOnly` +
      `&itemFilter(0).value=true` +
      `&itemFilter(1).name=MinPrice` +
      `&itemFilter(1).value=0.50` +
      `&sortOrder=EndTimeSoonest` +
      `&paginationInput.entriesPerPage=100`;

    console.log(`🔍 Fetching eBay prices for: ${searchTerms}`);

    const response = await fetch(url);
    const data = await response.json();

    const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    const resultCount = parseInt(searchResult?.['@count'] || '0');

    if (!searchResult || resultCount === 0) {
      console.log(`❌ No eBay results found for: ${searchTerms}`);
      return res.status(200).json({ found: false, searchTerms });
    }

    const items = searchResult.item || [];
    const prices = items
      .map(item => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0))
      .filter(price => price > 0);

    if (prices.length === 0) {
      console.log(`⚠️ eBay returned ${resultCount} items but no valid prices`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Calculate statistics
    prices.sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const recent = prices.slice(-5);

    const result = {
      found: true,
      avg: parseFloat(avg.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      recent,
      count: prices.length,
      searchTerms,
      timestamp: Date.now()
    };

    console.log(`✅ Found ${prices.length} eBay sales: $${avg.toFixed(2)} avg`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return res.status(500).json({
      error: 'Failed to fetch eBay data',
      message: error.message
    });
  }
}
