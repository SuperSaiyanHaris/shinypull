// Vercel Serverless Function - Pokemon TCG API Price Fetcher
// Proxies requests to Pokemon TCG API to avoid CORS issues

// Increase timeout (Hobby: 10s max, Pro: 60s max)
export const config = {
  maxDuration: 60
};

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

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardId } = req.query;

  if (!cardId) {
    return res.status(400).json({ error: 'Missing cardId parameter' });
  }

  try {
    console.log(`Fetching TCG prices for card: ${cardId}`);

    // Get API key from environment (Vercel uses non-VITE_ prefix)
    const apiKey = process.env.POKEMON_API_KEY || process.env.VITE_POKEMON_API_KEY;

    // Build headers - API key is crucial for 20k/day rate limit
    const headers = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
      console.log('Using Pokemon API key for enhanced rate limits');
    } else {
      console.warn('WARNING: No POKEMON_API_KEY configured - limited to 100 requests/day!');
    }

    // Fetch from Pokemon TCG API
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, { headers });

    if (!response.ok) {
      console.error(`Pokemon TCG API error: ${response.status}`);
      return res.status(response.status).json({ 
        error: `Failed to fetch card data: ${response.statusText}` 
      });
    }

    const data = await response.json();
    const card = data.data;

    // Extract ALL price variants from the API
    const prices = card.tcgplayer?.prices || {};
    const updatedAt = card.tcgplayer?.updatedAt || new Date().toISOString();

    // Helper to extract all price points for a variant
    const extractVariant = (variantName) => {
      const v = prices[variantName];
      if (!v) return null;
      return {
        market: v.market || null,
        low: v.low || null,
        high: v.high || null,
        mid: v.mid || null,
        directLow: v.directLow || null
      };
    };

    // Extract all variants
    const normal = extractVariant('normal');
    const holofoil = extractVariant('holofoil');
    const reverseHolofoil = extractVariant('reverseHolofoil');
    const firstEditionHolofoil = extractVariant('1stEditionHolofoil');
    const firstEditionNormal = extractVariant('1stEditionNormal');
    const unlimited = extractVariant('unlimited');
    const unlimitedHolofoil = extractVariant('unlimitedHolofoil');

    // Calculate best market price for legacy support
    const marketPrice = holofoil?.market || reverseHolofoil?.market || normal?.market ||
                        firstEditionHolofoil?.market || firstEditionNormal?.market || 0;
    const lowPrice = holofoil?.low || normal?.low || (marketPrice > 0 ? marketPrice * 0.8 : 0);
    const highPrice = holofoil?.high || normal?.high || (marketPrice > 0 ? marketPrice * 1.3 : 0);

    // Return ALL price variants
    return res.status(200).json({
      success: true,
      cardId,
      prices: {
        // Legacy fields for backwards compatibility
        market: marketPrice,
        low: lowPrice,
        high: highPrice,
        updatedAt,

        // All variants with full price data
        normal,
        holofoil,
        reverseHolofoil,
        firstEditionHolofoil,
        firstEditionNormal,
        unlimited,
        unlimitedHolofoil
      }
    });

  } catch (error) {
    console.error('Error fetching TCG prices:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch TCG prices',
      message: error.message 
    });
  }
}
