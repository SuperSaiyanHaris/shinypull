/**
 * Comprehensive Sync Service
 *
 * Philosophy: Sync ALL static data ONCE, then only update prices.
 * Pokemon TCG data is static - cards don't change once released.
 *
 * API Rate Limits with key: 20,000 requests/day
 * Without key: 100 requests/day (!)
 */

import { supabase } from '../lib/supabase';

const POKEMON_API = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

// Delay between API calls to respect rate limits (300ms = ~12k calls/hour max)
const API_DELAY_MS = 300;

/**
 * Helper to make API requests with proper headers and rate limiting
 */
const fetchFromPokemonAPI = async (endpoint) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  } else {
    console.warn('WARNING: No POKEMON_API_KEY - limited to 100 requests/day!');
  }

  const response = await fetch(`${POKEMON_API}${endpoint}`, { headers });

  if (!response.ok) {
    throw new Error(`Pokemon API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Sleep helper for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sync ALL sets from the Pokemon TCG API
 * Sets are the foundation - must be synced first
 */
export const syncAllSetsComplete = async (onProgress) => {
  console.log('🎴 Starting complete sets sync...');

  try {
    const data = await fetchFromPokemonAPI('/sets?orderBy=-releaseDate');
    const sets = data.data;

    console.log(`📦 Fetched ${sets.length} sets from Pokemon API`);

    // Transform to database format with ALL fields
    const transformedSets = sets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      release_date: set.releaseDate,
      total_cards: set.total || 0,
      logo: set.images?.logo,
      symbol: set.images?.symbol,
      tcgplayer_url: set.tcgplayer?.url,
      ptcgo_code: set.ptcgoCode
      // last_full_sync will be set when cards are synced
    }));

    // Upsert all sets
    const { error } = await supabase
      .from('sets')
      .upsert(transformedSets, { onConflict: 'id' });

    if (error) throw error;

    if (onProgress) {
      onProgress({ type: 'sets', completed: sets.length, message: `Synced ${sets.length} sets` });
    }

    console.log(`✅ Synced ${sets.length} sets to database`);
    return { success: true, count: sets.length, sets: transformedSets };

  } catch (error) {
    console.error('❌ Sets sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transform a single card from API format to database format
 * Captures ALL useful fields from the Pokemon TCG API
 */
const transformCard = (card, setId) => {
  const prices = card.tcgplayer?.prices || {};

  // Get best available price
  const priceVariants = ['holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'normal', 'unlimited'];
  let primaryPrice = null;

  for (const variant of priceVariants) {
    if (prices[variant]?.market) {
      primaryPrice = prices[variant];
      break;
    }
  }

  if (!primaryPrice) {
    const firstVariant = Object.keys(prices)[0];
    primaryPrice = firstVariant ? prices[firstVariant] : {};
  }

  return {
    // Core identifiers
    id: card.id,
    set_id: setId,
    name: card.name,
    number: card.number || 'N/A',

    // Classification
    supertype: card.supertype || null,
    types: card.types || null,
    subtypes: card.subtypes || null,
    rarity: card.rarity || 'Common',

    // Pokemon stats
    hp: card.hp || null,
    evolves_from: card.evolvesFrom || null,
    evolves_to: card.evolvesTo || null,

    // Card content (JSONB fields)
    rules: card.rules || null,
    abilities: card.abilities || null,
    attacks: card.attacks || null,
    weaknesses: card.weaknesses || null,
    resistances: card.resistances || null,

    // Retreat
    retreat_cost: card.retreatCost || null,
    converted_retreat_cost: card.convertedRetreatCost || null,

    // Metadata
    artist: card.artist || null,
    flavor_text: card.flavorText || null,
    national_pokedex_numbers: card.nationalPokedexNumbers || null,
    regulation_mark: card.regulationMark || null,
    ancient_trait: card.ancientTrait || null,

    // Legality
    legalities: card.legalities || null,

    // Images & URLs
    image_small: card.images?.small || null,
    image_large: card.images?.large || null,
    tcgplayer_url: card.tcgplayer?.url || null,

    // Set info cached on card
    set_printed_total: card.set?.printedTotal || null,
    set_total: card.set?.total || null
  };
};

/**
 * Transform card to price record with ALL price variants
 * Each variant has: market, low, high, mid, directLow
 */
const transformCardPrice = (card) => {
  const prices = card.tcgplayer?.prices || {};
  const tcgplayerUpdatedAt = card.tcgplayer?.updatedAt || null;

  // Helper to extract all price points for a variant
  const extractVariantPrices = (variant) => {
    const v = prices[variant];
    if (!v) return {};
    return {
      market: v.market || null,
      low: v.low || null,
      high: v.high || null,
      mid: v.mid || null,
      direct_low: v.directLow || null
    };
  };

  // Extract all variants
  const normal = extractVariantPrices('normal');
  const holofoil = extractVariantPrices('holofoil');
  const reverseHolofoil = extractVariantPrices('reverseHolofoil');
  const firstEdHolofoil = extractVariantPrices('1stEditionHolofoil');
  const firstEdNormal = extractVariantPrices('1stEditionNormal');
  const unlimited = extractVariantPrices('unlimited');
  const unlimitedHolofoil = extractVariantPrices('unlimitedHolofoil');

  // Calculate best available market price for the legacy tcgplayer_market field
  const marketPrice = holofoil.market || reverseHolofoil.market || normal.market ||
                      firstEdHolofoil.market || firstEdNormal.market || unlimited.market || 0;

  return {
    card_id: card.id,

    // Legacy fields (keeping for backwards compatibility)
    tcgplayer_market: marketPrice,
    tcgplayer_low: holofoil.low || normal.low || (marketPrice > 0 ? marketPrice * 0.8 : null),
    tcgplayer_high: holofoil.high || normal.high || (marketPrice > 0 ? marketPrice * 1.3 : null),

    // Normal variant (non-holo)
    normal_market: normal.market,
    normal_low: normal.low,
    normal_high: normal.high,
    normal_mid: normal.mid,
    normal_direct_low: normal.direct_low,

    // Holofoil variant
    holofoil_market: holofoil.market,
    holofoil_low: holofoil.low,
    holofoil_high: holofoil.high,
    holofoil_mid: holofoil.mid,
    holofoil_direct_low: holofoil.direct_low,

    // Reverse Holofoil variant
    reverse_holofoil_market: reverseHolofoil.market,
    reverse_holofoil_low: reverseHolofoil.low,
    reverse_holofoil_high: reverseHolofoil.high,
    reverse_holofoil_mid: reverseHolofoil.mid,
    reverse_holofoil_direct_low: reverseHolofoil.direct_low,

    // 1st Edition Holofoil (older sets like Base Set)
    first_ed_holofoil_market: firstEdHolofoil.market,
    first_ed_holofoil_low: firstEdHolofoil.low,
    first_ed_holofoil_high: firstEdHolofoil.high,
    first_ed_holofoil_mid: firstEdHolofoil.mid,
    first_ed_holofoil_direct_low: firstEdHolofoil.direct_low,

    // 1st Edition Normal (older sets)
    first_ed_normal_market: firstEdNormal.market,
    first_ed_normal_low: firstEdNormal.low,
    first_ed_normal_high: firstEdNormal.high,
    first_ed_normal_mid: firstEdNormal.mid,
    first_ed_normal_direct_low: firstEdNormal.direct_low,

    // Unlimited variant
    unlimited_market: unlimited.market,
    unlimited_low: unlimited.low,
    unlimited_high: unlimited.high,
    unlimited_mid: unlimited.mid,
    unlimited_direct_low: unlimited.direct_low,

    // Unlimited Holofoil variant
    unlimited_holofoil_market: unlimitedHolofoil.market,
    unlimited_holofoil_low: unlimitedHolofoil.low,
    unlimited_holofoil_high: unlimitedHolofoil.high,
    unlimited_holofoil_mid: unlimitedHolofoil.mid,
    unlimited_holofoil_direct_low: unlimitedHolofoil.direct_low,

    // TCGPlayer metadata
    tcgplayer_updated_at: tcgplayerUpdatedAt,

    // eBay fields (populated separately)
    ebay_avg: null,
    ebay_verified: false,
    psa10_avg: null,
    psa10_verified: false
  };
};

/**
 * Sync ALL cards for a single set
 * Pulls complete card data including all fields
 */
export const syncSetCardsComplete = async (setId, setName, onProgress) => {
  console.log(`📦 Syncing complete card data for: ${setName} (${setId})`);

  try {
    // Pokemon TCG API returns max 250 cards per page
    let page = 1;
    let allCards = [];
    let hasMore = true;

    while (hasMore) {
      const endpoint = `/cards?q=set.id:${setId}&pageSize=250&page=${page}`;
      const data = await fetchFromPokemonAPI(endpoint);

      allCards = allCards.concat(data.data || []);
      hasMore = data.data?.length === 250;
      page++;

      if (hasMore) {
        await sleep(API_DELAY_MS);
      }
    }

    console.log(`   Fetched ${allCards.length} cards for ${setName}`);

    if (allCards.length === 0) {
      return { success: true, count: 0 };
    }

    // Transform cards with ALL fields
    const transformedCards = allCards.map(card => transformCard(card, setId));

    // Transform prices
    const transformedPrices = allCards.map(transformCardPrice);

    // Upsert cards
    const { error: cardsError } = await supabase
      .from('cards')
      .upsert(transformedCards, { onConflict: 'id' });

    if (cardsError) {
      console.error('Cards upsert error:', cardsError);
      throw cardsError;
    }

    // Upsert prices
    const { error: pricesError } = await supabase
      .from('prices')
      .upsert(transformedPrices, { onConflict: 'card_id' });

    if (pricesError) {
      console.error('Prices upsert error:', pricesError);
      throw pricesError;
    }

    // Mark set as fully synced
    await supabase
      .from('sets')
      .update({ last_full_sync: new Date().toISOString() })
      .eq('id', setId);

    if (onProgress) {
      onProgress({
        type: 'set_complete',
        setId,
        setName,
        cardCount: allCards.length
      });
    }

    console.log(`   ✅ Synced ${allCards.length} cards for ${setName}`);
    return { success: true, count: allCards.length };

  } catch (error) {
    console.error(`   ❌ Failed to sync ${setName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Perform COMPLETE initial sync of all data
 * This is designed to run ONCE to populate the entire database
 */
export const performCompleteInitialSync = async (onProgress) => {
  console.log('🚀 Starting COMPLETE initial sync...');
  console.log('   This will sync ALL sets and ALL cards with COMPLETE data.');
  console.log('   This only needs to be done ONCE.');

  const startTime = Date.now();

  try {
    // Step 1: Sync all sets
    if (onProgress) {
      onProgress({ phase: 'sets', message: 'Syncing all sets...' });
    }

    const setsResult = await syncAllSetsComplete(onProgress);
    if (!setsResult.success) {
      throw new Error('Failed to sync sets: ' + setsResult.error);
    }

    // Step 2: Get sets that haven't been fully synced
    const { data: setsToSync, error: fetchError } = await supabase
      .from('sets')
      .select('id, name, total_cards')
      .is('last_full_sync', null)
      .order('release_date', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`\n📊 ${setsToSync.length} sets need card sync`);

    // Step 3: Sync cards for each set
    let totalCards = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < setsToSync.length; i++) {
      const set = setsToSync[i];

      if (onProgress) {
        onProgress({
          phase: 'cards',
          current: i + 1,
          total: setsToSync.length,
          setName: set.name,
          totalCards
        });
      }

      const result = await syncSetCardsComplete(set.id, set.name, onProgress);

      if (result.success) {
        totalCards += result.count;
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting delay between sets
      if (i < setsToSync.length - 1) {
        await sleep(API_DELAY_MS);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 COMPLETE INITIAL SYNC FINISHED!');
    console.log(`   Time: ${elapsed} minutes`);
    console.log(`   Sets: ${successCount} success, ${failCount} failed`);
    console.log(`   Cards: ${totalCards} total`);
    console.log('='.repeat(50));

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert([
        { entity_type: 'sets', status: 'success', message: `Synced ${setsResult.count} sets`, last_sync: new Date().toISOString() },
        { entity_type: 'cards', status: 'success', message: `Synced ${totalCards} cards from ${successCount} sets`, last_sync: new Date().toISOString() }
      ], { onConflict: 'entity_type' });

    return {
      success: true,
      sets: setsResult.count,
      cards: totalCards,
      setsProcessed: successCount,
      setsFailed: failCount,
      elapsed: `${elapsed} minutes`
    };

  } catch (error) {
    console.error('❌ Complete initial sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync ONLY new sets (released after last sync)
 * Use this when new Pokemon sets are released (every 3-4 months)
 */
export const syncNewSetsOnly = async (onProgress) => {
  console.log('🆕 Checking for new sets to sync...');

  try {
    // Get the latest release date we have
    const { data: latestSet } = await supabase
      .from('sets')
      .select('release_date')
      .order('release_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch all sets from API
    const data = await fetchFromPokemonAPI('/sets?orderBy=-releaseDate');
    const allSets = data.data;

    // Filter to sets released after our latest, or not in our DB
    const { data: existingSets } = await supabase
      .from('sets')
      .select('id');

    const existingIds = new Set(existingSets?.map(s => s.id) || []);
    const newSets = allSets.filter(set => !existingIds.has(set.id));

    if (newSets.length === 0) {
      console.log('✅ No new sets to sync');
      return { success: true, message: 'No new sets', sets: 0, cards: 0 };
    }

    console.log(`📦 Found ${newSets.length} new set(s) to sync`);

    // Sync the new sets
    const transformedSets = newSets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      release_date: set.releaseDate,
      total_cards: set.total || 0,
      logo: set.images?.logo,
      symbol: set.images?.symbol,
      tcgplayer_url: set.tcgplayer?.url,
      ptcgo_code: set.ptcgoCode
    }));

    const { error } = await supabase
      .from('sets')
      .upsert(transformedSets, { onConflict: 'id' });

    if (error) throw error;

    // Sync cards for new sets
    let totalCards = 0;

    for (let i = 0; i < newSets.length; i++) {
      const set = newSets[i];

      if (onProgress) {
        onProgress({
          phase: 'new_sets',
          current: i + 1,
          total: newSets.length,
          setName: set.name
        });
      }

      const result = await syncSetCardsComplete(set.id, set.name, onProgress);
      if (result.success) {
        totalCards += result.count;
      }

      await sleep(API_DELAY_MS);
    }

    console.log(`✅ Synced ${newSets.length} new sets with ${totalCards} cards`);

    return {
      success: true,
      sets: newSets.length,
      setNames: newSets.map(s => s.name),
      cards: totalCards
    };

  } catch (error) {
    console.error('❌ New sets sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update prices ONLY - no card data changes
 * This is what should run daily
 */
export const updatePricesOnly = async (hoursThreshold = 24, onProgress) => {
  console.log(`💰 Updating prices older than ${hoursThreshold} hours...`);

  try {
    // Get cards with stale prices
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursThreshold);

    const { data: staleCards, error: fetchError } = await supabase
      .from('prices')
      .select('card_id')
      .or(`last_updated.is.null,last_updated.lt.${threshold.toISOString()}`)
      .limit(500); // Process in batches

    if (fetchError) throw fetchError;

    if (!staleCards || staleCards.length === 0) {
      console.log('✅ All prices are up to date');
      return { success: true, updated: 0 };
    }

    console.log(`📊 Found ${staleCards.length} cards with stale prices`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < staleCards.length; i++) {
      const { card_id } = staleCards[i];

      if (onProgress && i % 10 === 0) {
        onProgress({
          phase: 'prices',
          current: i + 1,
          total: staleCards.length,
          updated
        });
      }

      try {
        // Fetch fresh price from API
        const data = await fetchFromPokemonAPI(`/cards/${card_id}`);
        const card = data.data;

        const priceData = transformCardPrice(card);
        priceData.last_updated = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('prices')
          .upsert(priceData, { onConflict: 'card_id' });

        if (updateError) throw updateError;

        updated++;

      } catch (err) {
        console.warn(`Failed to update price for ${card_id}:`, err.message);
        failed++;
      }

      // Rate limiting
      await sleep(API_DELAY_MS);
    }

    console.log(`✅ Updated ${updated} prices (${failed} failed)`);

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        entity_type: 'prices',
        status: 'success',
        message: `Updated ${updated} prices`,
        last_sync: new Date().toISOString()
      }, { onConflict: 'entity_type' });

    return { success: true, updated, failed };

  } catch (error) {
    console.error('❌ Price update failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sync status summary
 */
export const getSyncStatus = async () => {
  try {
    // Get sync metadata
    const { data: syncMeta } = await supabase
      .from('sync_metadata')
      .select('*');

    // Count sets synced vs total
    const { count: totalSets } = await supabase
      .from('sets')
      .select('*', { count: 'exact', head: true });

    const { count: syncedSets } = await supabase
      .from('sets')
      .select('*', { count: 'exact', head: true })
      .not('last_full_sync', 'is', null);

    // Count cards
    const { count: totalCards } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true });

    // Count cards with types (to check if complete data was synced)
    const { count: cardsWithTypes } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .not('supertype', 'is', null);

    return {
      syncMetadata: syncMeta,
      sets: { total: totalSets, synced: syncedSets },
      cards: { total: totalCards, withCompleteData: cardsWithTypes },
      isComplete: syncedSets === totalSets && cardsWithTypes === totalCards
    };

  } catch (error) {
    console.error('Error getting sync status:', error);
    return null;
  }
};
