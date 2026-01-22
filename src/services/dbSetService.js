import { supabase } from '../lib/supabase';
import { getAllSets as getApiSets, getSetCards as getApiCards } from './setService';

/**
 * Get all Pokemon sets from the database
 * Falls back to API if database is empty
 */
export const getAllSets = async () => {
  try {
    // Add timeout to prevent infinite loading (15s to allow for cold start)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 15000)
    );

    const queryPromise = supabase
      .from('sets')
      .select('*')
      .order('release_date', { ascending: false });

    let result;
    try {
      result = await Promise.race([queryPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn('Database timeout, falling back to API');
      return await getApiSets();
    }

    const { data, error } = result;

    if (error) {
      console.warn('Database error, falling back to API:', error.message);
      return await getApiSets();
    }

    // If no data in database, fall back to API
    if (!data || data.length === 0) {
      console.log('No sets in database, fetching from API...');
      return await getApiSets();
    }

    console.log(`Loaded ${data.length} sets from database`);

    // Transform to match app format
    return data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      releaseDate: set.release_date,
      totalCards: set.total_cards,
      logo: set.logo,
      symbol: set.symbol
    }));
  } catch (error) {
    console.error('Error fetching sets from database:', error);
    // Fall back to API on any error
    return await getApiSets();
  }
};

/**
 * Get all cards for a specific set from the database
 * Falls back to API if database has no cards for this set
 */
export const getSetCards = async (setId) => {
  try {
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
      console.warn('Database error fetching cards, falling back to API:', error.message);
      return await getApiCards(setId);
    }

    // If no cards in database for this set, fall back to API
    if (!data || data.length === 0) {
      console.log(`No cards in database for set ${setId}, fetching from API...`);
      return await getApiCards(setId);
    }

    console.log(`Loaded ${data.length} cards from database for set ${setId}`);

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
            verified: price.ebay_verified ?? false
          },
          psa10: {
            avg: price.psa10_avg ?? 0,
            verified: price.psa10_verified ?? false
          }
        },
        priceHistory: []
      };
    });
  } catch (error) {
    console.error('Error fetching cards from database:', error);
    // Fall back to API on any error
    return await getApiCards(setId);
  }
};

/**
 * Search cards by name across all sets
 */
export const searchCards = async (query) => {
  try {
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
            verified: price.ebay_verified ?? false
          },
          psa10: {
            avg: price.psa10_avg ?? 0,
            verified: price.psa10_verified ?? false
          }
        },
        priceHistory: []
      };
    });
  } catch (error) {
    console.error('Error searching cards:', error);
    return [];
  }
};
