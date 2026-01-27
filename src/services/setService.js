// ⚠️ DEPRECATED - Pokemon TCG Sets API Integration
// Pokemon TCG API is no longer functional
// Sets data now comes from Supabase (populated via GitHub bulk import)
// This file is kept for reference only - can be deleted

const POKEMON_API = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get all Pokemon TCG sets
 */
export const getAllSets = async () => {
  try {
    const cacheKey = 'all_sets';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✓ Cached sets');
      return cached.data;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    console.log('⚡ Fetching all sets from API');
    const response = await fetch(`${POKEMON_API}/sets?orderBy=-releaseDate`, { headers });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const sets = data.data || [];

    // Transform to our format
    const transformedSets = sets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series || 'Unknown',
      releaseDate: set.releaseDate,
      totalCards: set.total || set.printedTotal || 0,
      logo: set.images?.logo,
      symbol: set.images?.symbol,
    }));

    cache.set(cacheKey, {
      data: transformedSets,
      timestamp: Date.now()
    });

    console.log(`✓ Loaded ${transformedSets.length} sets`);
    return transformedSets;

  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
};

/**
 * Get all cards from a specific set (transformed to app format)
 */
export const getSetCards = async (setId) => {
  try {
    const cacheKey = `set_cards_${setId}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✓ Cached cards for set: ${setId}`);
      return cached.data;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    console.log(`⚡ Fetching cards for set: ${setId}`);
    const response = await fetch(
      `${POKEMON_API}/cards?q=set.id:${setId}&orderBy=number&pageSize=250`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawCards = data.data || [];

    // Transform cards to app format
    const transformedCards = rawCards.map(card => {
      const prices = card.tcgplayer?.prices || {};
      const priceVariants = ['holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'normal'];
      let priceData = null;

      for (const variant of priceVariants) {
        if (prices[variant] && prices[variant].market) {
          priceData = prices[variant];
          break;
        }
      }

      if (!priceData) {
        const firstVariant = Object.keys(prices)[0];
        priceData = firstVariant ? prices[firstVariant] : {};
      }

      const marketPrice = priceData?.market || 0;
      const lowPrice = priceData?.low || marketPrice * 0.8;
      const highPrice = priceData?.high || marketPrice * 1.3;

      return {
        id: card.id,
        name: card.name,
        number: card.number || 'N/A',
        rarity: card.rarity || 'Common',
        image: card.images?.large || card.images?.small,
        images: {
          small: card.images?.small,
          large: card.images?.large
        },
        prices: {
          tcgplayer: {
            market: marketPrice,
            low: lowPrice,
            high: highPrice
          },
          ebay: {
            avg: 0,
            verified: false
          },
          psa10: {
            avg: 0,
            verified: false
          }
        },
        priceHistory: []
      };
    });

    cache.set(cacheKey, {
      data: transformedCards,
      timestamp: Date.now()
    });

    console.log(`✓ Loaded ${transformedCards.length} cards from set ${setId}`);
    return transformedCards;

  } catch (error) {
    console.error('Error fetching set cards:', error);
    return [];
  }
};
