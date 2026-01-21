import { supabase } from '../lib/supabase';

/**
 * Get all Pokemon sets from the database
 */
export const getAllSets = async () => {
  try {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) {
      throw error;
    }

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
    return [];
  }
};

/**
 * Get all cards for a specific set from the database
 */
export const getSetCards = async (setId) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
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
      throw error;
    }

    // Transform to match app format
    return data.map(card => {
      const price = card.prices?.[0] || {};

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
        prices: {
          tcgplayer: {
            market: price.tcgplayer_market || 0,
            low: price.tcgplayer_low || 0,
            high: price.tcgplayer_high || 0
          },
          ebay: {
            avg: price.ebay_avg || 0,
            verified: price.ebay_verified || false
          },
          psa10: {
            avg: price.psa10_avg || 0,
            verified: price.psa10_verified || false
          }
        },
        priceHistory: []
      };
    });
  } catch (error) {
    console.error('Error fetching cards from database:', error);
    return [];
  }
};

/**
 * Search cards by name across all sets
 */
export const searchCards = async (query) => {
  try {
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
      const price = card.prices?.[0] || {};
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
        prices: {
          tcgplayer: {
            market: price.tcgplayer_market || 0,
            low: price.tcgplayer_low || 0,
            high: price.tcgplayer_high || 0
          },
          ebay: {
            avg: price.ebay_avg || 0,
            verified: price.ebay_verified || false
          },
          psa10: {
            avg: price.psa10_avg || 0,
            verified: price.psa10_verified || false
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
