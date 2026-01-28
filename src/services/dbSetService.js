import { supabase } from '../lib/supabase';

// In-memory cache to avoid refetching sets on every navigation
const setsCache = {
  data: null,
  timestamp: 0
};
const SETS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all Pokemon sets from the database
 */
export const getAllSets = async () => {
  // Return cached sets if fresh
  if (setsCache.data && Date.now() - setsCache.timestamp < SETS_CACHE_TTL) {
    console.log('[dbSetService] Returning cached sets');
    return setsCache.data;
  }

  console.log('[dbSetService] Fetching sets from database...');

  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .order('release_date', { ascending: false });

  if (error) {
    console.error('[dbSetService] DB error:', error);
    throw error;
  }

  console.log('[dbSetService] DB returned', data?.length || 0, 'sets');

  // Transform to match app format
  const transformed = data.map(set => ({
    id: set.id,
    name: set.name,
    series: set.series,
    releaseDate: set.release_date,
    totalCards: set.total_cards,
    logo: set.logo,
    symbol: set.symbol
  }));

  // Update cache
  setsCache.data = transformed;
  setsCache.timestamp = Date.now();

  return transformed;
};

/**
 * Get all cards for a specific set from the database
 */
export const getSetCards = async (setId) => {
  // Fetch cards
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select(`
      *,
      sets (
        name,
        series
      )
    `)
    .eq('set_id', setId)
    .order('number', { ascending: true });

  if (cardsError) {
    console.error('Error fetching cards:', cardsError);
    throw cardsError;
  }

  // Get card IDs
  const cardIds = cards.map(c => c.id);

  // Fetch prices separately (no foreign key relation needed)
  const { data: prices, error: pricesError } = await supabase
    .from('prices')
    .select('*')
    .in('card_id', cardIds);

  if (pricesError) {
    console.error('Error fetching prices:', pricesError);
    // Don't throw - continue without prices
  }

  // Create a map of card_id -> price data
  const priceMap = {};
  if (prices) {
    prices.forEach(p => {
      priceMap[p.card_id] = p;
    });
  }

  console.log(`[dbSetService] Fetched ${cards.length} cards, ${prices?.length || 0} prices for set ${setId}`);

  // Transform to match app format
  return cards.map(card => {
    const price = priceMap[card.id] || {};
    const setData = card.sets || {};

    // Build TCGPlayer search URL as fallback
    const tcgplayerSearchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name + ' ' + card.number)}`;

    return {
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      types: card.types || [],
      supertype: card.supertype || 'Pokémon',
      image: card.image_large || card.image_small,
      images: {
        small: card.image_small,
        large: card.image_large
      },
      set: setData.name,
      setId: card.set_id,
      tcgplayerUrl: card.tcgplayer_url || tcgplayerSearchUrl,
      prices: {
        market: price.market_price ?? 0,
        low: price.market_low ?? 0,
        high: price.market_high ?? 0,
        tcgplayer: {
          market: price.tcg_comparison_price ?? 0,
          url: price.tcg_affiliate_url || card.tcgplayer_url || tcgplayerSearchUrl
        },
        ebay: {
          market: price.market_price ?? 0,
          low: price.market_low ?? 0,
          high: price.market_high ?? 0,
          verified: price.market_price > 0,
          searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.number} ${setData.name}`)}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`,
          searchTerms: `Pokemon ${card.name} ${card.number} ${setData.name}`
        },
        psa10: {
          market: price.psa10_market ?? 0,
          low: price.psa10_low ?? 0,
          high: price.psa10_high ?? 0,
          verified: price.psa10_market > 0,
          searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.number} PSA 10`)}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`,
          searchTerms: `Pokemon ${card.name} ${card.number} PSA 10`
        },
        variants: {
          normal: price.normal_market ? { market: price.normal_market } : null,
          holofoil: price.holofoil_market ? { market: price.holofoil_market } : null,
          reverseHolofoil: price.reverse_holofoil_market ? { market: price.reverse_holofoil_market } : null
        }
      },
      priceHistory: []
    };
  });
};

/**
 * Search cards by name or card number across all sets
 */
export const searchCards = async (query) => {
  if (!query || query.trim() === '') {
    return [];
  }

  const trimmedQuery = query.trim();

  // Check if query contains both text and numbers (e.g., "Charizard 125")
  const parts = trimmedQuery.split(/\s+/);
  const numberPart = parts.find(part => /^\d+$/.test(part));
  const textParts = parts.filter(part => !/^\d+$/.test(part));

  let dbQuery = supabase
    .from('cards')
    .select(`
      *,
      sets (
        name,
        series,
        release_date,
        logo
      )
    `);

  if (numberPart && textParts.length > 0) {
    const nameQuery = textParts.join(' ');
    dbQuery = dbQuery
      .ilike('name', `%${nameQuery}%`)
      .ilike('number', `%${numberPart}%`);
  } else {
    dbQuery = dbQuery.or(`name.ilike.%${trimmedQuery}%,number.ilike.%${trimmedQuery}%`);
  }

  const { data: cards, error } = await dbQuery
    .order('name', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error searching cards:', error);
    throw error;
  }

  // Get card IDs and fetch prices separately
  const cardIds = cards.map(c => c.id);

  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .in('card_id', cardIds);

  // Create price map
  const priceMap = {};
  if (prices) {
    prices.forEach(p => {
      priceMap[p.card_id] = p;
    });
  }

  // Transform to match app format
  return cards.map(card => {
    const price = priceMap[card.id] || {};
    const set = card.sets || {};

    const tcgplayerSearchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name + ' ' + card.number)}`;

    return {
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      image: card.image_large || card.image_small,
      images: {
        small: card.image_small,
        large: card.image_large
      },
      set: set.name,
      setId: card.set_id,
      tcgplayerUrl: card.tcgplayer_url || tcgplayerSearchUrl,
      prices: {
        market: price.market_price ?? 0,
        low: price.market_low ?? 0,
        high: price.market_high ?? 0,
        tcgplayer: {
          market: price.tcg_comparison_price ?? 0,
          url: price.tcg_affiliate_url || card.tcgplayer_url || tcgplayerSearchUrl
        },
        ebay: {
          market: price.market_price ?? 0,
          low: price.market_low ?? 0,
          high: price.market_high ?? 0,
          verified: price.market_price > 0,
          searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.number} ${set.name}`)}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`,
          searchTerms: `Pokemon ${card.name} ${card.number} ${set.name}`
        },
        psa10: {
          market: price.psa10_market ?? 0,
          low: price.psa10_low ?? 0,
          high: price.psa10_high ?? 0,
          verified: price.psa10_market > 0,
          searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.number} PSA 10`)}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`,
          searchTerms: `Pokemon ${card.name} ${card.number} PSA 10`
        },
        variants: {
          normal: price.normal_market ? { market: price.normal_market } : null,
          holofoil: price.holofoil_market ? { market: price.holofoil_market } : null,
          reverseHolofoil: price.reverse_holofoil_market ? { market: price.reverse_holofoil_market } : null
        }
      },
      priceHistory: []
    };
  });
};
