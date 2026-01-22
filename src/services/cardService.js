// Pokemon TCG API Integration
// API Docs: https://pokemontcg.io/

import { getEbayPriceAPI, estimateEbayPrice, getEbayPSA10Price, estimatePSA10Price } from './ebayService.js';

const POKEMON_API = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased for better performance)

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map();

/**
 * Search for Pokemon cards
 * @param {string} query - Search query (card name, set, etc.)
 * @returns {Promise<Array>} Array of card objects
 */
export const searchCards = async (query) => {
  try {
    // Check cache first
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✓ Cached results for:', query);
      return cached.data;
    }

    // Request deduplication - if same request is already in flight, wait for it
    if (pendingRequests.has(cacheKey)) {
      console.log('⟳ Waiting for in-flight request:', query);
      return await pendingRequests.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = (async () => {
      // If empty query, get some popular cards
      let url;
      if (!query || query.trim() === '') {
        // Get some popular/recent cards
        url = `${POKEMON_API}/cards?orderBy=-set.releaseDate&pageSize=12`;
      } else {
        // Extract the main Pokemon name from the query
        // Remove common prefixes like "Team Rocket's", keep the Pokemon name
        const cleanQuery = query
          .replace(/['"]/g, '')
          .replace(/^(team rocket'?s?|giovanni'?s?|lt\.? surge'?s?|mistys?|brocks?)\s+/i, '')
          .trim()
          .toLowerCase();

        // Use wildcard search for better matching - supports partial names
        const encodedQuery = encodeURIComponent(`*${cleanQuery}*`);
        url = `${POKEMON_API}/cards?q=name:${encodedQuery}&orderBy=-set.releaseDate&pageSize=100`;
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add API key if available
      if (API_KEY) {
        headers['X-Api-Key'] = API_KEY;
      }

      console.log('⚡ Fetching from API:', query || '(recent cards)');
      const startTime = Date.now();

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✓ API response in ${Date.now() - startTime}ms`);

      // Transform API data to our app format
      const transformedCards = transformCards(data.data || []);

      // Cache the results
      cache.set(cacheKey, {
        data: transformedCards,
        timestamp: Date.now()
      });

      return transformedCards;
    })();

    // Store the pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      pendingRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error('Error fetching cards:', error);
    // Return empty array on error instead of crashing
    return [];
  }
};

/**
 * Get a single card by ID
 * @param {string} id - Card ID
 * @returns {Promise<Object>} Card object
 */
export const getCardById = async (id) => {
  try {
    const cacheKey = `card_${id}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    const response = await fetch(`${POKEMON_API}/cards/${id}`, { headers });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const transformedCard = transformCards([data.data])[0];

    cache.set(cacheKey, {
      data: transformedCard,
      timestamp: Date.now()
    });

    return transformedCard;

  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
};

/**
 * Get trending/recent cards
 * @returns {Promise<Array>} Array of trending cards
 */
export const getTrendingCards = async () => {
  try {
    const cacheKey = 'trending_cards';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    // Get recent high-value cards
    const response = await fetch(
      `${POKEMON_API}/cards?orderBy=-set.releaseDate&pageSize=6`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const transformedCards = transformCards(data.data || []);

    cache.set(cacheKey, {
      data: transformedCards,
      timestamp: Date.now()
    });

    return transformedCards;

  } catch (error) {
    console.error('Error fetching trending cards:', error);
    return [];
  }
};

/**
 * Transform Pokemon TCG API data to our app format
 * @param {Array} cards - Raw API card data
 * @returns {Promise<Array>} Transformed cards with eBay prices
 */
async function transformCards(cards) {
  // Transform all cards with eBay API calls in parallel
  const transformedCards = await Promise.all(cards.map(async card => {
    // Get the best available price data
    const prices = card.tcgplayer?.prices || {};

    // Try to find the best price variant (holofoil, reverse holofoil, normal, etc.)
    const priceVariants = ['holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'normal'];
    let priceData = null;

    for (const variant of priceVariants) {
      if (prices[variant] && prices[variant].market) {
        priceData = prices[variant];
        break;
      }
    }

    // Fallback to first available price
    if (!priceData) {
      const firstVariant = Object.keys(prices)[0];
      priceData = firstVariant ? prices[firstVariant] : {};
    }

    const marketPrice = priceData?.market || 0;
    const lowPrice = priceData?.low || marketPrice * 0.8;
    const highPrice = priceData?.high || marketPrice * 1.3;

    // Generate mock price history based on current price
    const priceHistory = generateMockHistory(marketPrice);

    // Try to fetch real eBay prices (async)
    let ebayData = null;
    try {
      // Pass card number and rarity for more accurate eBay searches
      ebayData = await getEbayPriceAPI(card.name, card.set?.name || '', card.number || '', card.rarity || '');
    } catch (error) {
      console.warn('eBay API error for', card.name, error);
    }

    // Use real eBay data if available, otherwise estimate
    const ebayAvg = ebayData?.avg || estimateEbayPrice(marketPrice);
    const ebayRecent = ebayData?.recent || (marketPrice > 0 ? [
      marketPrice * 1.02,
      marketPrice * 1.08,
      marketPrice * 1.04
    ] : []);

    // Try to fetch PSA 10 graded prices from eBay
    let psa10Data = null;
    try {
      psa10Data = await getEbayPSA10Price(card.name, card.set?.name || '', card.number || '', card.rarity || '');
    } catch (error) {
      console.warn('PSA 10 eBay API error for', card.name, error);
    }

    // Use real PSA 10 data if available, otherwise estimate
    const psa10Avg = psa10Data?.avg || estimatePSA10Price(marketPrice);
    const psa10Verified = !!psa10Data;

    return {
      id: card.id,
      name: card.name,
      set: card.set?.name || 'Unknown Set',
      number: card.number || 'N/A',
      rarity: card.rarity || 'Common',
      image: card.images?.large || card.images?.small || 'https://via.placeholder.com/400x560?text=No+Image',
      tcgplayerUrl: card.tcgplayer?.url || null,
      prices: {
        tcgplayer: {
          market: marketPrice,
          low: lowPrice,
          high: highPrice,
        },
        ebay: {
          avg: parseFloat(ebayAvg.toFixed(2)),
          recent: ebayRecent,
          recentListings: ebayData?.recentListings || [],
          searchTerms: ebayData?.searchTerms || '',
          searchUrl: ebayData?.searchUrl || '',
          verified: !!ebayData, // True if we got real data from eBay API
        },
        psa10: {
          avg: parseFloat(psa10Avg.toFixed(2)),
          recentListings: psa10Data?.recentListings || [],
          searchTerms: psa10Data?.searchTerms || '',
          searchUrl: psa10Data?.searchUrl || '',
          verified: psa10Verified, // True if we got real PSA 10 data from eBay
        }
      },
      priceHistory
    };
  }));

  return transformedCards;
}

/**
 * Generate mock price history for demonstration
 * In a real app, you'd store actual historical data in a database
 * @param {number} currentPrice - Current market price
 * @returns {Array} Array of price history objects
 */
function generateMockHistory(currentPrice) {
  if (currentPrice === 0) return [];

  const history = [];
  const days = 90; // 90 days of history for better charts
  const today = new Date();

  // Start with a base price (randomly higher or lower than current)
  const trend = Math.random() > 0.5 ? 'up' : 'down';
  let basePrice = trend === 'up' ? currentPrice * 0.7 : currentPrice * 1.3;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Calculate progress through the period (0 to 1)
    const progress = (days - i) / days;

    // Gradually trend toward current price
    const trendPrice = basePrice + (currentPrice - basePrice) * progress;

    // Add realistic daily variance (±5%)
    const dailyVariance = 0.95 + Math.random() * 0.1;

    // Add some weekly volatility
    const weeklyFactor = 1 + Math.sin(progress * Math.PI * 4) * 0.05;

    const price = trendPrice * dailyVariance * weeklyFactor;

    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(Math.max(price, 0.01).toFixed(2)) // Ensure no negative prices
    });
  }

  // Ensure the last price is close to current price
  if (history.length > 0) {
    history[history.length - 1].price = currentPrice;
  }

  return history;
}

/**
 * Format price as currency
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  if (price === 0 || price === null || price === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Determine price trend from history
 * @param {Array} history - Price history array
 * @returns {string} Trend direction: 'up', 'down', or 'stable'
 */
export const getPriceTrend = (history) => {
  if (!history || history.length < 2) return 'stable';

  const latest = history[history.length - 1]?.price || 0;
  const previous = history[history.length - 2]?.price || 0;

  if (previous === 0) return 'stable';

  const change = ((latest - previous) / previous) * 100;

  if (change > 2) return 'up';
  if (change < -2) return 'down';
  return 'stable';
};

/**
 * Clear the cache (useful for testing)
 */
export const clearCache = () => {
  cache.clear();
  pendingRequests.clear();
  console.log('Cache cleared');
};

/**
 * Preload popular searches in the background for faster UX
 * Call this on app startup
 */
export const preloadPopularSearches = async () => {
  const popularSearches = ['Charizard', 'Pikachu', 'Mewtwo'];

  console.log('🚀 Preloading popular searches...');

  // Preload in background without blocking
  Promise.all(
    popularSearches.map(query =>
      searchCards(query).catch(err => console.warn('Preload failed for:', query, err))
    )
  ).then(() => {
    console.log('✓ Popular searches preloaded');
  });
};
