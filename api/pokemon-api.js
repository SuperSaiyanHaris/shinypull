// Vercel Serverless Function - Pokemon TCG API Proxy
// Proxies ALL requests to Pokemon TCG API to avoid CORS issues
// This is used by the comprehensive sync service for bulk operations

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

  // Get the endpoint path from query params
  // e.g., /api/pokemon-api?endpoint=/sets or /api/pokemon-api?endpoint=/cards?q=set.id:base1
  const { endpoint } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  try {
    // Validate endpoint starts with / and doesn't try path traversal
    if (!endpoint.startsWith('/') || endpoint.includes('..')) {
      return res.status(400).json({ error: 'Invalid endpoint format' });
    }

    console.log(`Pokemon API Proxy: ${endpoint}`);

    // Get API key from environment (Vercel uses non-VITE_ prefix)
    const apiKey = process.env.POKEMON_API_KEY || process.env.VITE_POKEMON_API_KEY;

    // Build headers - API key is crucial for 20k/day rate limit
    const headers = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
      console.log('Using Pokemon API key for enhanced rate limits (20k/day)');
    } else {
      console.warn('WARNING: No POKEMON_API_KEY configured - limited to 100 requests/day!');
    }

    // Fetch from Pokemon TCG API
    const apiUrl = `https://api.pokemontcg.io/v2${endpoint}`;
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      console.error(`Pokemon TCG API error: ${response.status} for ${endpoint}`);
      return res.status(response.status).json({
        error: `Pokemon API error: ${response.statusText}`,
        endpoint
      });
    }

    const data = await response.json();

    // Return the raw API response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Pokemon API Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from Pokemon API',
      message: error.message
    });
  }
}
