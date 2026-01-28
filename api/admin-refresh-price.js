// Vercel Serverless Function: Admin Price Refresh
// Allows admins to force refresh prices for a card using eBay API

import { createClient } from '@supabase/supabase-js';

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

  const listings = items
    .map(item => ({
      price: parseFloat(item.price?.value || 0),
      title: item.title || '',
      url: item.itemWebUrl || ''
    }))
    .filter(item => {
      if (item.price <= 0) return false;
      const hasPSA = isPSA10Listing(item.title);
      return isPSA10 ? hasPSA : !hasPSA;
    });

  if (listings.length === 0) {
    return null;
  }

  const pricingListings = listings.slice(0, 15);
  const prices = pricingListings.map(l => l.price).sort((a, b) => a - b);

  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const low = prices[0];
  const high = prices[prices.length - 1];
  const median = prices.length % 2 === 0
    ? (prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2
    : prices[Math.floor(prices.length / 2)];

  // Build eBay search URL for users
  const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`;

  return {
    market: parseFloat(median.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    count: pricingListings.length,
    searchUrl: ebaySearchUrl,
    searchTerms
  };
}

export default async function handler(req, res) {
  // CORS setup
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'https://shinypull.vercel.app',
    ...(process.env.NODE_ENV === 'development' || req.headers.host?.includes('localhost') ?
      ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'] : [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // AUTHENTICATION CHECK
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        hint: 'Authentication token required. Please sign in.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Verify the user's authentication token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        hint: 'Please sign in again'
      });
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'haris.lilic@gmail.com,shinypull@proton.me').split(',').map(e => e.trim());
    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        hint: 'Admin access required.'
      });
    }

    console.log(`✅ Admin price refresh request from: ${user.email}`);

    // Get card ID from request body
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    // Get card details from database
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: card, error: cardError } = await supabaseService
      .from('cards')
      .select(`
        id, name, number, set_id,
        sets (name)
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get eBay credentials
    const ebayClientId = process.env.EBAY_APP_ID;
    const ebayClientSecret = process.env.EBAY_CERT_ID;

    if (!ebayClientId || !ebayClientSecret) {
      return res.status(500).json({ error: 'eBay API credentials not configured' });
    }

    // Get eBay OAuth token
    const accessToken = await getEbayAccessToken(ebayClientId, ebayClientSecret);

    const setName = card.sets?.name || '';
    console.log(`📡 Fetching eBay prices for: ${card.name} #${card.number} (${setName})`);

    // Fetch raw card prices
    const rawPrices = await fetchEbayPrices(accessToken, card.name, card.number, setName, false);

    // Fetch PSA 10 prices
    const psa10Prices = await fetchEbayPrices(accessToken, card.name, card.number, setName, true);

    if (!rawPrices && !psa10Prices) {
      return res.status(200).json({
        success: true,
        message: 'No eBay listings found for this card',
        prices: null
      });
    }

    // Build database update
    const dbUpdate = {
      card_id: cardId,
      price_updated_at: new Date().toISOString()
    };

    if (rawPrices) {
      dbUpdate.market_price = rawPrices.market;
      dbUpdate.market_low = rawPrices.low;
      dbUpdate.market_high = rawPrices.high;
      dbUpdate.normal_market = rawPrices.market;
      dbUpdate.normal_low = rawPrices.low;
      dbUpdate.normal_high = rawPrices.high;
      dbUpdate.normal_mid = rawPrices.avg;
    }

    if (psa10Prices) {
      dbUpdate.psa10_market = psa10Prices.market;
      dbUpdate.psa10_low = psa10Prices.low;
      dbUpdate.psa10_high = psa10Prices.high;
    }

    // Update database
    const { error: updateError } = await supabaseService
      .from('prices')
      .upsert(dbUpdate, { onConflict: 'card_id' });

    if (updateError) {
      console.error('Error updating price:', updateError);
      return res.status(500).json({
        error: 'Failed to update price in database',
        details: updateError.message
      });
    }

    console.log(`✅ Admin refreshed prices for ${card.name} #${card.number}`);

    // Build eBay search URL
    const searchTerms = buildSearchTerms(card.name, card.number, setName);
    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`;

    return res.status(200).json({
      success: true,
      prices: {
        market: rawPrices?.market || 0,
        low: rawPrices?.low || 0,
        high: rawPrices?.high || 0,
        ebay: rawPrices ? {
          market: rawPrices.market,
          low: rawPrices.low,
          high: rawPrices.high,
          count: rawPrices.count,
          searchUrl: ebaySearchUrl,
          searchTerms
        } : null,
        psa10: psa10Prices ? {
          market: psa10Prices.market,
          low: psa10Prices.low,
          high: psa10Prices.high,
          count: psa10Prices.count,
          searchUrl: psa10Prices.searchUrl
        } : null,
        lastUpdated: new Date().toISOString(),
        cached: false
      }
    });

  } catch (error) {
    console.error('Error in admin price refresh:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
