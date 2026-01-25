// Vercel Serverless Function - Pokemon TCG API Price Fetcher
// Proxies requests to Pokemon TCG API to avoid CORS issues

export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    // Fetch from Pokemon TCG API
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`);

    if (!response.ok) {
      console.error(`Pokemon TCG API error: ${response.status}`);
      return res.status(response.status).json({ 
        error: `Failed to fetch card data: ${response.statusText}` 
      });
    }

    const data = await response.json();
    const card = data.data;

    // Extract both normal and holofoil prices
    const prices = card.tcgplayer?.prices || {};
    const normalPrice = prices.normal?.market || 0;
    const holofoilPrice = prices.holofoil?.market || prices.reverseHolofoil?.market || prices['1stEditionHolofoil']?.market || 0;
    
    // Use holofoil as primary if available
    const marketPrice = holofoilPrice || normalPrice;
    const lowPrice = holofoilPrice 
      ? (prices.holofoil?.low || prices.reverseHolofoil?.low || marketPrice * 0.8)
      : (prices.normal?.low || marketPrice * 0.8);
    const highPrice = holofoilPrice
      ? (prices.holofoil?.high || prices.reverseHolofoil?.high || marketPrice * 1.3)
      : (prices.normal?.high || marketPrice * 1.3);
    const updatedAt = card.tcgplayer?.updatedAt || new Date().toISOString();

    // Return formatted price data
    return res.status(200).json({
      success: true,
      cardId,
      prices: {
        market: marketPrice,
        low: lowPrice,
        high: highPrice,
        normal: normalPrice,
        holofoil: holofoilPrice,
        updatedAt
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
