import { supabase } from '../lib/supabase';

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
        market_price, market_low, market_high, price_updated_at,
        normal_market, normal_low, normal_high,
        holofoil_market, holofoil_low, holofoil_high,
        reverse_holofoil_market, reverse_holofoil_low, reverse_holofoil_high,
        first_ed_holofoil_market, first_ed_holofoil_low, first_ed_holofoil_high,
        first_ed_normal_market, first_ed_normal_low, first_ed_normal_high,
        unlimited_market, unlimited_low, unlimited_high,
        unlimited_holofoil_market, unlimited_holofoil_low, unlimited_holofoil_high,
        psa10_market, psa10_low, psa10_high
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
 * Format database price row into API response format
 */
function formatPriceResponse(dbRow, cached = false) {
  return {
    market: dbRow.market_price,
    low: dbRow.market_low,
    high: dbRow.market_high,
    psa10Avg: dbRow.psa10_market,
    psa10Low: dbRow.psa10_low,
    psa10High: dbRow.psa10_high,
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
    lastUpdated: dbRow.price_updated_at,
    cached
  };
}
