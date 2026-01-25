import { supabase } from '../lib/supabase';
import { getEbayPriceAPI, getEbayPSA10Price, estimateEbayPrice, estimatePSA10Price } from './ebayService';

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2';

/**
 * Fetch latest TCG market price from Pokemon API and update database
 * Called when card modal opens to ensure real-time prices
 * 
 * NOTE: Pokemon TCG API prices are NOT real-time - they cache TCGPlayer data
 * and update periodically (every few hours). For truly real-time prices, 
 * we'd need direct TCGPlayer API access (requires paid partnership).
 */
export const fetchAndUpdateTCGPrice = async (cardId) => {
  try {
    // Fetch card data from Pokemon TCG API
    const response = await fetch(`${POKEMON_TCG_API}/cards/${cardId}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch price for card ${cardId}`);
      return null;
    }

    const data = await response.json();
    const card = data.data;

    // Extract price data (same logic as Edge Function)
    const prices = card.tcgplayer?.prices || {};
    const priceVariants = ['holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'normal'];
    let priceData = null;
    let variantUsed = null;

    for (const variant of priceVariants) {
      if (prices[variant]?.market) {
        priceData = prices[variant];
        variantUsed = variant;
        break;
      }
    }

    if (!priceData) {
      const firstVariant = Object.keys(prices)[0];
      priceData = firstVariant ? prices[firstVariant] : {};
      variantUsed = firstVariant;
    }

    const marketPrice = priceData?.market || 0;
    const lowPrice = priceData?.low || marketPrice * 0.8;
    const highPrice = priceData?.high || marketPrice * 1.3;
    const updatedAt = card.tcgplayer?.updatedAt || new Date().toISOString();

    console.log(`📊 TCG API Data for ${cardId}:`, {
      variant: variantUsed,
      market: marketPrice,
      low: lowPrice,
      high: highPrice,
      apiUpdatedAt: updatedAt,
      note: 'Pokemon TCG API may have cached/delayed prices from TCGPlayer'
    });

    // Update database with fresh prices
    const { error } = await supabase
      .from('prices')
      .upsert({
        card_id: cardId,
        tcgplayer_market: marketPrice,
        tcgplayer_low: lowPrice,
        tcgplayer_high: highPrice,
        last_updated: new Date().toISOString()
      }, { onConflict: 'card_id' });

    if (error) {
      console.error('Error updating price in database:', error);
      return null;
    }

    console.log(`✅ Updated TCG price for ${cardId}: $${marketPrice} (${variantUsed})`);

    // Return fresh price data
    return {
      market: marketPrice,
      low: lowPrice,
      high: highPrice,
      variant: variantUsed,
      apiUpdatedAt: updatedAt,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching/updating TCG price:', error);
    return null;
  }
};

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
      .select('tcgplayer_market')
      .eq('card_id', cardId)
      .single();

    const marketPrice = currentPrice?.tcgplayer_market || 0;

    // Use real data if available, otherwise estimate
    const ebayAvg = ebayData?.avg || estimateEbayPrice(marketPrice);
    const psa10Avg = psa10Data?.avg || estimatePSA10Price(marketPrice);

    // Update prices in database
    const { error } = await supabase
      .from('prices')
      .update({
        ebay_avg: parseFloat(ebayAvg.toFixed(2)),
        ebay_verified: !!ebayData,
        psa10_avg: parseFloat(psa10Avg.toFixed(2)),
        psa10_verified: !!psa10Data,
        last_updated: new Date().toISOString()
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
