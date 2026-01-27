import { supabase } from '../lib/supabase';
import { getAllSets as getApiSets, getSetCards as getApiCards } from './setService';

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

  console.log('[dbSetService] Query completed. Error:', error, 'Data length:', data?.length);

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
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      sets (
        name,
        series
      ),
      prices (
        market_price,
        market_low,
        market_high,
        tcg_comparison_price,
        tcg_affiliate_url,
        psa10_market,
        psa10_low,
        psa10_high,
        price_updated_at,
        normal_market,
        holofoil_market,
        reverse_holofoil_market
      )
    `)
    .eq('set_id', setId)
    .order('number', { ascending: true });

  if (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }

  // Transform to match app format
  return data.map(card => {
    // prices comes as an array from the relation - get first element or empty object
    const priceData = Array.isArray(card.prices) ? card.prices[0] : card.prices;
    const price = priceData || {};
    const setData = card.sets || {};

    // Build TCGPlayer search URL as fallback
    const tcgplayerSearchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name + ' ' + card.number)}`;

    return {
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      types: card.types || [], // Pokemon types array
      supertype: card.supertype || 'Pokémon', // Default to Pokemon if not set
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
          high: price.market_high ?? 0
        },
        psa10: {
          market: price.psa10_market ?? 0,
          low: price.psa10_low ?? 0,
          high: price.psa10_high ?? 0
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
  // Return empty array for empty queries
  if (!query || query.trim() === '') {
    return [];
  }

  const trimmedQuery = query.trim();
  
  // Check if query contains both text and numbers (e.g., "Charizard 125")
  // Split by spaces and check if we have both text and number parts
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
      ),
      prices (
        market_price,
        market_low,
        market_high,
        tcg_comparison_price,
        tcg_affiliate_url,
        psa10_market,
        psa10_low,
        psa10_high,
        price_updated_at,
        normal_market,
        holofoil_market,
        reverse_holofoil_market
      )
    `);
  
  // If we have both text and number, search for cards matching both conditions
  if (numberPart && textParts.length > 0) {
    const nameQuery = textParts.join(' ');
    console.log(`Searching for name containing "${nameQuery}" AND number containing "${numberPart}"`);
    dbQuery = dbQuery
      .ilike('name', `%${nameQuery}%`)
      .ilike('number', `%${numberPart}%`);
  } else {
    // Otherwise, search either name OR number
    dbQuery = dbQuery.or(`name.ilike.%${trimmedQuery}%,number.ilike.%${trimmedQuery}%`);
  }
  
  const { data, error } = await dbQuery
    .order('name', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error searching cards:', error);
    throw error;
  }

  // Transform to match app format
  return data.map(card => {
    // prices comes as an array from the relation - get first element or empty object
    const priceData = Array.isArray(card.prices) ? card.prices[0] : card.prices;
    const price = priceData || {};
    const set = card.sets || {};

    // Build TCGPlayer search URL as fallback
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
          high: price.market_high ?? 0
        },
        psa10: {
          market: price.psa10_market ?? 0,
          low: price.psa10_low ?? 0,
          high: price.psa10_high ?? 0
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