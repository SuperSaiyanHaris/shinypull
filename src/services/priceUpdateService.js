// ⚠️ DEPRECATED - This service used Pokemon TCG API which is no longer functional
// Price updates now use /api/incremental-price-update with eBay API
// Kept for reference only - can be deleted

import { supabase } from '../lib/supabase';
import { getEbayPriceAPI, getEbayPSA10Price, estimateEbayPrice, estimatePSA10Price } from './ebayService';

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2';

// Price cache duration: 6 hours (prices don't update that frequently)
const PRICE_CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

/**
 * Get prices from database ONLY - no API calls
 * Use this for displaying prices on modal open
 * @param {string} cardId - The card ID to get prices for
 */
export const getDBPrices = async (cardId) => {
  try {
    const { data } = await supabase
      .from('prices')
      .select(`
        tcgplayer_market, tcgplayer_low, tcgplayer_high, last_updated,
        normal_market, normal_low, normal_high,
        holofoil_market, holofoil_low, holofoil_high,
        reverse_holofoil_market, reverse_holofoil_low, reverse_holofoil_high,
        first_ed_holofoil_market, first_ed_holofoil_low, first_ed_holofoil_high,
        first_ed_normal_market, first_ed_normal_low, first_ed_normal_high,
        unlimited_market, unlimited_low, unlimited_high,
        unlimited_holofoil_market, unlimited_holofoil_low, unlimited_holofoil_high
      `)
      .eq('card_id', cardId)
      .single();

    if (data) {
      return formatPriceResponse(data, true);
    }
    return null;
  } catch (e) {
    console.warn(`No DB prices for ${cardId}`);
    return null;
  }
};

/**
 * Fetch latest TCG market price from Pokemon API and update database
 * Called when card modal opens to ensure real-time prices
 *
 * NOTE: Pokemon TCG API prices are NOT real-time - they cache TCGPlayer data
 * and update periodically (every few hours). For truly real-time prices,
 * we'd need direct TCGPlayer API access (requires paid partnership).
 *
 * CACHING: Only fetches fresh data if last update was more than 6 hours ago
 * @param {string} cardId - The card ID to fetch prices for
 * @param {boolean} forceRefresh - If true, bypasses cache and fetches fresh data
 */
export const fetchAndUpdateTCGPrice = async (cardId, forceRefresh = false) => {
  // First, get cached price from database (always do this first)
  let cachedPrice = null;
  try {
    const { data } = await supabase
      .from('prices')
      .select(`
        tcgplayer_market, tcgplayer_low, tcgplayer_high, last_updated,
        normal_market, normal_low, normal_high,
        holofoil_market, holofoil_low, holofoil_high,
        reverse_holofoil_market, reverse_holofoil_low, reverse_holofoil_high,
        first_ed_holofoil_market, first_ed_holofoil_low, first_ed_holofoil_high,
        first_ed_normal_market, first_ed_normal_low, first_ed_normal_high,
        unlimited_market, unlimited_low, unlimited_high,
        unlimited_holofoil_market, unlimited_holofoil_low, unlimited_holofoil_high
      `)
      .eq('card_id', cardId)
      .single();
    cachedPrice = data;
  } catch (e) {
    // No cached price exists
  }

  // Check if cached price is fresh enough
  if (!forceRefresh && cachedPrice?.last_updated) {
    const lastUpdated = new Date(cachedPrice.last_updated);
    const timeSinceUpdate = Date.now() - lastUpdated.getTime();

    if (timeSinceUpdate < PRICE_CACHE_DURATION_MS) {
      const hoursAgo = Math.floor(timeSinceUpdate / (60 * 60 * 1000));
      console.log(`✅ Using cached TCG prices for ${cardId} (updated ${hoursAgo}h ago)`);
      return formatPriceResponse(cachedPrice, true);
    }
  }

  // Cache expired or missing - try to fetch fresh prices
  console.log(`🔄 Fetching fresh TCG prices for ${cardId} ${forceRefresh ? '(FORCE REFRESH)' : '(cache expired)'}`);

  try {
    const response = await fetch(`/api/tcg-prices?cardId=${cardId}`);

    if (!response.ok) {
      console.warn(`API error for ${cardId} - falling back to cached data`);
      return cachedPrice ? formatPriceResponse(cachedPrice, true) : null;
    }

    const data = await response.json();

    if (!data.success || !data.prices) {
      console.warn(`No price data for ${cardId} - falling back to cached data`);
      return cachedPrice ? formatPriceResponse(cachedPrice, true) : null;
    }

    const { prices } = data;

    // Build database update object with all variants
    const dbUpdate = {
      card_id: cardId,
      market_price: prices.market,
      market_low: prices.low,
      market_high: prices.high,
      price_updated_at: new Date().toISOString()
    };

    // Add all variant prices if they exist
    if (prices.normal) {
      dbUpdate.normal_market = prices.normal.market;
      dbUpdate.normal_low = prices.normal.low;
      dbUpdate.normal_high = prices.normal.high;
    }
    if (prices.holofoil) {
      dbUpdate.holofoil_market = prices.holofoil.market;
      dbUpdate.holofoil_low = prices.holofoil.low;
      dbUpdate.holofoil_high = prices.holofoil.high;
    }
    if (prices.reverseHolofoil) {
      dbUpdate.reverse_holofoil_market = prices.reverseHolofoil.market;
      dbUpdate.reverse_holofoil_low = prices.reverseHolofoil.low;
      dbUpdate.reverse_holofoil_high = prices.reverseHolofoil.high;
    }
    if (prices.firstEditionHolofoil) {
      dbUpdate.first_ed_holofoil_market = prices.firstEditionHolofoil.market;
      dbUpdate.first_ed_holofoil_low = prices.firstEditionHolofoil.low;
      dbUpdate.first_ed_holofoil_high = prices.firstEditionHolofoil.high;
    }
    if (prices.firstEditionNormal) {
      dbUpdate.first_ed_normal_market = prices.firstEditionNormal.market;
      dbUpdate.first_ed_normal_low = prices.firstEditionNormal.low;
      dbUpdate.first_ed_normal_high = prices.firstEditionNormal.high;
    }
    if (prices.unlimited) {
      dbUpdate.unlimited_market = prices.unlimited.market;
      dbUpdate.unlimited_low = prices.unlimited.low;
      dbUpdate.unlimited_high = prices.unlimited.high;
    }
    if (prices.unlimitedHolofoil) {
      dbUpdate.unlimited_holofoil_market = prices.unlimitedHolofoil.market;
      dbUpdate.unlimited_holofoil_low = prices.unlimitedHolofoil.low;
      dbUpdate.unlimited_holofoil_high = prices.unlimitedHolofoil.high;
    }

    // Update database with fresh prices (don't fail if this errors)
    await supabase
      .from('prices')
      .upsert(dbUpdate, { onConflict: 'card_id' })
      .then(() => console.log(`✅ Updated TCG prices for ${cardId}`))
      .catch(e => console.warn(`Failed to cache prices for ${cardId}:`, e.message));

    // Return formatted response
    return {
      market: prices.market,
      low: prices.low,
      high: prices.high,
      normal: prices.normal,
      holofoil: prices.holofoil,
      reverseHolofoil: prices.reverseHolofoil,
      firstEditionHolofoil: prices.firstEditionHolofoil,
      firstEditionNormal: prices.firstEditionNormal,
      unlimited: prices.unlimited,
      unlimitedHolofoil: prices.unlimitedHolofoil,
      apiUpdatedAt: prices.updatedAt,
      lastUpdated: new Date().toISOString(),
      cached: false
    };

  } catch (error) {
    console.error('Error fetching TCG price:', error);
    // Always fall back to cached data if available
    return cachedPrice ? formatPriceResponse(cachedPrice, true) : null;
  }
};

/**
 * Format database price row into API response format
 */
function formatPriceResponse(dbRow, cached = false) {
  return {
    market: dbRow.market_price,
    low: dbRow.market_low,
    high: dbRow.market_high,
    normal: dbRow.normal_market ? {
      market: dbRow.normal_market,
      low: dbRow.normal_low,
      high: dbRow.normal_high
    } : null,
    holofoil: dbRow.holofoil_market ? {
      market: dbRow.holofoil_market,
      low: dbRow.holofoil_low,
      high: dbRow.holofoil_high
    } : null,
    reverseHolofoil: dbRow.reverse_holofoil_market ? {
      market: dbRow.reverse_holofoil_market,
      low: dbRow.reverse_holofoil_low,
      high: dbRow.reverse_holofoil_high
    } : null,
    firstEditionHolofoil: dbRow.first_ed_holofoil_market ? {
      market: dbRow.first_ed_holofoil_market,
      low: dbRow.first_ed_holofoil_low,
      high: dbRow.first_ed_holofoil_high
    } : null,
    firstEditionNormal: dbRow.first_ed_normal_market ? {
      market: dbRow.first_ed_normal_market,
      low: dbRow.first_ed_normal_low,
      high: dbRow.first_ed_normal_high
    } : null,
    unlimited: dbRow.unlimited_market ? {
      market: dbRow.unlimited_market,
      low: dbRow.unlimited_low,
      high: dbRow.unlimited_high
    } : null,
    unlimitedHolofoil: dbRow.unlimited_holofoil_market ? {
      market: dbRow.unlimited_holofoil_market,
      low: dbRow.unlimited_holofoil_low,
      high: dbRow.unlimited_holofoil_high
    } : null,
    lastUpdated: dbRow.last_updated,
    cached
  };
}

/**
 * Update eBay and PSA10 prices for a specific card
 */
export const updateCardPrices = async (cardId, cardName, setName, cardNumber, rarity = '') => {
  try {
    // Fetch eBay prices in parallel
    const [ebayData, psa10Data] = await Promise.all([
      getEbayPriceAPI(cardName, setName, cardNumber, rarity).catch(() => null),
      getEbayPSA10Price(cardName, setName, cardNumber, rarity).catch(() => null)
    ]);

    // Get current TCGPlayer market price for estimation fallback
    const { data: currentPrice } = await supabase
      .from('prices')
      .select('market_price')
      .eq('card_id', cardId)
      .single();

    const marketPrice = currentPrice?.market_price || 0;

    // Use real data if available, otherwise estimate
    const ebayAvg = ebayData?.avg || estimateEbayPrice(marketPrice);
    const psa10Avg = psa10Data?.avg || estimatePSA10Price(marketPrice);

    // Update prices in database
    const { error } = await supabase
      .from('prices')
      .update({
        psa10_market: parseFloat(psa10Avg.toFixed(2)),
        price_updated_at: new Date().toISOString()
      })
      .eq('card_id', cardId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      ebay: { avg: ebayAvg, verified: !!ebayData },
      psa10: { avg: psa10Avg, verified: !!psa10Data }
    };
  } catch (error) {
    console.error(`Error updating prices for card ${cardId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Update prices for all cards in a set
 */
export const updateSetPrices = async (setId, setName) => {
  try {
    console.log(`Updating prices for set ${setId}...`);

    // Get all cards in the set
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, name, number, rarity')
      .eq('set_id', setId);

    if (cardsError) {
      throw cardsError;
    }

    console.log(`Found ${cards.length} cards to update`);

    let successCount = 0;
    let failCount = 0;

    // Update prices for each card with delay to avoid rate limiting
    for (const card of cards) {
      const result = await updateCardPrices(card.id, card.name, setName, card.number, card.rarity);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay to avoid eBay API rate limiting (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Price update complete: ${successCount} success, ${failCount} failed`);
    return {
      success: true,
      total: cards.length,
      successCount,
      failCount
    };
  } catch (error) {
    console.error(`Error updating prices for set ${setId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Update prices for all cards in database
 */
export const updateAllPrices = async () => {
  try {
    console.log('Starting full price update...');

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .update({ status: 'in_progress', message: 'Updating prices from eBay' })
      .eq('entity_type', 'prices');

    // Get all sets
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, name')
      .order('release_date', { ascending: false });

    if (setsError) {
      throw setsError;
    }

    console.log(`Updating prices for ${sets.length} sets...`);

    let totalCards = 0;
    let totalSuccess = 0;
    let totalFail = 0;

    // Update prices for each set
    for (const set of sets) {
      const result = await updateSetPrices(set.id, set.name);

      if (result.success) {
        totalCards += result.total;
        totalSuccess += result.successCount;
        totalFail += result.failCount;
      }

      // Delay between sets
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .update({
        status: 'success',
        message: `Updated ${totalSuccess}/${totalCards} card prices (${totalFail} failed)`,
        last_sync: new Date().toISOString()
      })
      .eq('entity_type', 'prices');

    console.log(`Full price update complete: ${totalSuccess}/${totalCards} cards updated`);
    return {
      success: true,
      totalCards,
      totalSuccess,
      totalFail
    };
  } catch (error) {
    console.error('Error updating all prices:', error);

    // Update sync metadata with error
    await supabase
      .from('sync_metadata')
      .update({
        status: 'failed',
        message: error.message
      })
      .eq('entity_type', 'prices');

    return { success: false, error: error.message };
  }
};

/**
 * Update prices only for cards that haven't been updated in X hours
 */
export const updateStalePrices = async (hoursThreshold = 24) => {
  try {
    console.log(`Updating prices older than ${hoursThreshold} hours...`);

    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    // Get cards with stale prices
    const { data: stalePrices, error } = await supabase
      .from('prices')
      .select(`
        card_id,
        last_updated,
        cards (
          id,
          name,
          number,
          rarity,
          sets (
            name
          )
        )
      `)
      .lt('last_updated', thresholdDate.toISOString());

    if (error) {
      throw error;
    }

    console.log(`Found ${stalePrices.length} cards with stale prices`);

    let successCount = 0;
    let failCount = 0;

    for (const price of stalePrices) {
      const card = price.cards;
      const setName = card.sets?.name || '';

      const result = await updateCardPrices(card.id, card.name, setName, card.number, card.rarity);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Stale price update complete: ${successCount} success, ${failCount} failed`);
    return {
      success: true,
      total: stalePrices.length,
      successCount,
      failCount
    };
  } catch (error) {
    console.error('Error updating stale prices:', error);
    return { success: false, error: error.message };
  }
};
