// Pokemon TCG Sets API Integration

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
 * Get all cards from a specific set
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
    const cards = data.data || [];

    cache.set(cacheKey, {
      data: cards,
      timestamp: Date.now()
    });

    console.log(`✓ Loaded ${cards.length} cards from set ${setId}`);
    return cards;

  } catch (error) {
    console.error('Error fetching set cards:', error);
    return [];
  }
};
