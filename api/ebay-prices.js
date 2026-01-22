// Vercel Serverless Function - eBay Price Fetcher
// This acts as a backend proxy to avoid CORS issues

/**
 * Build eBay search terms for a Pokemon card
 * Uses a simpler format that matches how sellers actually title their listings
 * Example: "Mega Charizard X ex 125 Phantasmal Flames"
 * For PSA 10: "Mega Charizard X ex 125 Phantasmal Flames PSA 10"
 */
function buildEbaySearchTerms(cardName, cardSet, cardNumber, rarity, graded) {
  const parts = [];

  // Add card name (most important)
  parts.push(cardName);

  // Add card number without the total (e.g., "125" from "125/094")
  if (cardNumber) {
    const num = cardNumber.split('/')[0];
    parts.push(num);
  }

  // Add set name (simplified - remove special characters)
  if (cardSet) {
    const cleanSet = cardSet
      .replace(/—/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    parts.push(cleanSet);
  }

  // Add PSA 10 for graded searches
  if (graded === 'psa10') {
    parts.push('PSA 10');
  }

  return parts.join(' ');
}

/**
 * Build a display title showing the eBay search format
 * This is what users see in the UI
 */
function buildDisplayTitle(cardName, cardSet, cardNumber, rarity, graded) {
  const parts = [];

  // Year
  const year = new Date().getFullYear();
  parts.push(year);

  parts.push('POKEMON');

  // Set name abbreviated
  if (cardSet) {
    let setCode = cardSet
      .replace(/Scarlet\s*&?\s*Violet/i, 'SV')
      .replace(/Sword\s*&?\s*Shield/i, 'SWSH')
      .replace(/Sun\s*&?\s*Moon/i, 'SM')
      .replace(/—/g, '-')
      .replace(/[^\w\s-]/g, '')
      .toUpperCase()
      .trim();
    if (setCode.length > 25) {
      setCode = setCode.split(/\s+/).slice(0, 3).join(' ');
    }
    parts.push(setCode);
  }

  // Rarity abbreviation
  if (rarity) {
    const r = rarity.toUpperCase();
    if (r.includes('SPECIAL ILLUSTRATION')) parts.push('SIR');
    else if (r.includes('ILLUSTRATION')) parts.push('IR');
    else if (r.includes('ULTRA')) parts.push('UR');
    else if (r.includes('SECRET')) parts.push('SR');
    else if (r.includes('FULL ART')) parts.push('FA');
  }

  // Card number
  if (cardNumber) {
    parts.push(`#${cardNumber}`);
  }

  // Card name
  parts.push(cardName.toUpperCase());

  // PSA 10
  if (graded === 'psa10') {
    parts.push('PSA 10');
  }

  return parts.join(' ');
}

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
    const { cardName, cardSet, cardNumber, rarity, graded } = req.query;

    if (!cardName) {
      return res.status(400).json({ error: 'cardName is required' });
    }

    // Get eBay credentials from environment variables
    const APP_ID = process.env.EBAY_APP_ID;

    if (!APP_ID) {
      return res.status(500).json({ error: 'eBay API not configured' });
    }

    // Build search terms - simpler format that matches actual eBay listings
    const searchTerms = buildEbaySearchTerms(cardName, cardSet, cardNumber, rarity, graded);

    // Build display title for UI (shows the formatted search style)
    const displayTitle = buildDisplayTitle(cardName, cardSet, cardNumber, rarity, graded);

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

    // Extract price and listing details from each item
    const listings = items
      .map(item => {
        const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
        const title = item.title?.[0] || '';
        const itemId = item.itemId?.[0] || '';
        const viewItemURL = item.viewItemURL?.[0] || '';
        const endTime = item.listingInfo?.[0]?.endTime?.[0] || '';

        return {
          price,
          title,
          itemId,
          url: viewItemURL,
          endTime: endTime ? new Date(endTime).toISOString() : null
        };
      })
      .filter(item => item.price > 0);

    if (listings.length === 0) {
      console.log(`⚠️ eBay returned ${resultCount} items but no valid prices`);
      return res.status(200).json({ found: false, searchTerms });
    }

    // Calculate statistics
    const prices = listings.map(l => l.price);
    prices.sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];

    // Get the 3 most recent sold listings with their URLs
    const recentListings = listings
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 3)
      .map(l => ({
        price: l.price,
        title: l.title,
        url: l.url,
        date: l.endTime
      }));

    // Build eBay search URL for users to view more
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${keywords}&LH_Sold=1&LH_Complete=1&_sacat=183454`;

    const result = {
      found: true,
      avg: parseFloat(avg.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      recent: prices.slice(-5),
      recentListings,
      count: listings.length,
      searchTerms: displayTitle, // Show formatted title in UI
      searchUrl: ebaySearchUrl,
      timestamp: Date.now()
    };

    console.log(`✅ Found ${listings.length} eBay sales: $${avg.toFixed(2)} avg`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error fetching eBay data:', error);
    return res.status(500).json({
      error: 'Failed to fetch eBay data',
      message: error.message
    });
  }
}
