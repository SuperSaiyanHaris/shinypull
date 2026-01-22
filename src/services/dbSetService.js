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
        tcgplayer_market,
        tcgplayer_low,
        tcgplayer_high,
        ebay_avg,
        ebay_verified,
        psa10_avg,
        psa10_verified,
        last_updated
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
      set: setData.name,
      setId: card.set_id,
      prices: {
        tcgplayer: {
          market: price.tcgplayer_market ?? 0,
          low: price.tcgplayer_low ?? 0,
          high: price.tcgplayer_high ?? 0
        },
        ebay: {
          avg: price.ebay_avg ?? 0,
          verified: price.ebay_verified ?? false,
          recentListings: [],
          searchTerms: '',
          searchUrl: ''
        },
        psa10: {
          avg: price.psa10_avg ?? 0,
          verified: price.psa10_verified ?? false,
          recentListings: [],
          searchTerms: '',
          searchUrl: ''
        }
      },
      priceHistory: []
    };
  });
};

/**
 * Search cards by name across all sets
 */
export const searchCards = async (query) => {
  // Return empty array for empty queries
  if (!query || query.trim() === '') {
    return [];
  }

  const { data, error } = await supabase
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
        tcgplayer_market,
        tcgplayer_low,
        tcgplayer_high,
        ebay_avg,
        ebay_verified,
        psa10_avg,
        psa10_verified
      )
    `)
    .ilike('name', `%${query}%`)
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
      prices: {
        tcgplayer: {
          market: price.tcgplayer_market ?? 0,
          low: price.tcgplayer_low ?? 0,
          high: price.tcgplayer_high ?? 0
        },
        ebay: {
          avg: price.ebay_avg ?? 0,
          verified: price.ebay_verified ?? false,
          recentListings: [],
          searchTerms: '',
          searchUrl: ''
        },
        psa10: {
          avg: price.psa10_avg ?? 0,
          verified: price.psa10_verified ?? false,
          recentListings: [],
          searchTerms: '',
          searchUrl: ''
        }
      },
      priceHistory: []
    };
  });
};