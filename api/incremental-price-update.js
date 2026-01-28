/**
 * Incremental Price Update API
 *
 * Updates prices for a small batch of cards at a time using eBay Browse API.
 * Can be called repeatedly to gradually update all prices.
 * Stays well within Vercel's 10 second timeout.
 *
 * Query params:
 *   - limit: Number of cards to update (default 10, max 20)
 */

import { createClient } from '@supabase/supabase-js';

// Vercel timeout: 10 seconds on hobby, 60 on pro
export const config = {
  maxDuration: 60
};

// eBay OAuth token cache
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get OAuth access token using client credentials grant
 */
async function getEbayAccessToken(clientId, clientSecret) {
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
    throw new Error(`eBay OAuth failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}

/**
 * Build eBay search terms for a Pokemon card
 */
function buildSearchTerms(cardName, cardNumber, setName) {
  const parts = ['Pokemon'];

  // Clean up card name
  const cleanName = cardName
    .replace(/\s+ex$/i, '')
    .replace(/\s+EX$/i, '')
    .replace(/\s+gx$/i, '')
    .replace(/\s+GX$/i, '')
    .trim();

  parts.push(cleanName);
  if (cardNumber) parts.push(cardNumber);
  if (setName) parts.push(setName);

  return parts.join(' ');
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

/**
 * Fetch eBay prices for a card
 */
async function fetchEbayPrices(accessToken, cardName, cardNumber, setName, isPSA10 = false) {
  const searchTerms = buildSearchTerms(cardName, cardNumber, setName) + (isPSA10 ? ' PSA 10' : '');
  const encodedQuery = encodeURIComponent(searchTerms);

  // eBay Browse API - Category 183454 = Pokemon TCG, min price $10 to filter junk
  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodedQuery}&category_ids=183454&filter=price:%5B10..%5D&limit=50&sort=price`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const items = data.itemSummaries || [];

  if (items.length === 0) {
    return null;
  }

  // Filter listings based on search type (PSA vs raw)
  const listings = items
    .map(item => ({
      price: parseFloat(item.price?.value || 0),
      title: item.title || ''
    }))
    .filter(item => {
      if (item.price <= 0) return false;
      const hasPSA = isPSA10Listing(item.title);
      return isPSA10 ? hasPSA : !hasPSA;
    });

  if (listings.length === 0) {
    return null;
  }

  // Use 10-15 listings for pricing
  const pricingListings = listings.slice(0, 15);
  const prices = pricingListings.map(l => l.price).sort((a, b) => a - b);

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const low = prices[0];
  const high = prices[prices.length - 1];
  const median = prices.length % 2 === 0
    ? (prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2
    : prices[Math.floor(prices.length / 2)];

  return {
    market: parseFloat(median.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    count: pricingListings.length
  };
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'https://shinypull.vercel.app',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get eBay credentials
    const ebayClientId = process.env.EBAY_APP_ID;
    const ebayClientSecret = process.env.EBAY_CERT_ID;

    if (!ebayClientId || !ebayClientSecret) {
      return res.status(500).json({ error: 'eBay API credentials not configured' });
    }

    // Parse query params
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Get cards that need price updates (oldest first)
    // Join with cards table to get name/number/set for eBay search
    const { data: cardsToUpdate, error: fetchError } = await supabase
      .from('prices')
      .select(`
        card_id,
        price_updated_at,
        cards!inner (
          name,
          number,
          set_id,
          sets (
            name
          )
        )
      `)
      .order('price_updated_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!cardsToUpdate || cardsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No prices need updating',
        updated: 0
      });
    }

    console.log(`Updating prices for ${cardsToUpdate.length} cards via eBay API...`);

    // Get eBay OAuth token
    const accessToken = await getEbayAccessToken(ebayClientId, ebayClientSecret);

    // Update each card's price
    const priceUpdates = [];
    const errors = [];

    for (const record of cardsToUpdate) {
      try {
        const card = record.cards;
        const setName = card.sets?.name || '';

        // Fetch raw card prices from eBay
        const rawPrices = await fetchEbayPrices(
          accessToken,
          card.name,
          card.number,
          setName,
          false // raw cards
        );

        // Fetch PSA 10 prices from eBay
        const psa10Prices = await fetchEbayPrices(
          accessToken,
          card.name,
          card.number,
          setName,
          true // PSA 10
        );

        const update = {
          card_id: record.card_id,
          price_updated_at: new Date().toISOString()
        };

        if (rawPrices) {
          update.market_price = rawPrices.market;
          update.market_low = rawPrices.low;
          update.market_high = rawPrices.high;
          update.normal_market = rawPrices.market;
          update.normal_low = rawPrices.low;
          update.normal_high = rawPrices.high;
          update.normal_mid = rawPrices.avg;
          console.log(`✅ ${card.name} #${card.number}: $${rawPrices.market} (${rawPrices.count} listings)`);
        } else {
          console.log(`⚠️ ${card.name} #${card.number}: No eBay listings found`);
        }

        if (psa10Prices) {
          update.psa10_market = psa10Prices.market;
          update.psa10_low = psa10Prices.low;
          update.psa10_high = psa10Prices.high;
        }

        priceUpdates.push(update);

        // Rate limiting - 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to update ${record.card_id}:`, error.message);
        errors.push({ card_id: record.card_id, error: error.message });
      }
    }

    // Batch update Supabase prices table
    if (priceUpdates.length > 0) {
      const { error: updateError } = await supabase
        .from('prices')
        .upsert(priceUpdates, { onConflict: 'card_id' });

      if (updateError) {
        throw updateError;
      }
    }

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        entity_type: 'prices',
        status: 'success',
        message: `Updated ${priceUpdates.length} prices via eBay API`,
        last_sync: new Date().toISOString()
      }, { onConflict: 'entity_type' });

    return res.status(200).json({
      success: true,
      updated: priceUpdates.length,
      failed: errors.length,
      total: cardsToUpdate.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Price update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
