import { supabase } from '../lib/supabase';

const POKEMON_API = 'https://api.pokemontcg.io/v2';

/**
 * Sync all Pokemon sets from the API to Supabase
 */
export const syncAllSets = async () => {
  try {
    console.log('Starting sets sync...');

    // Update sync status
    await supabase
      .from('sync_metadata')
      .update({ status: 'in_progress', message: 'Syncing sets from Pokemon TCG API' })
      .eq('entity_type', 'sets');

    // Fetch all sets from Pokemon API
    const response = await fetch(`${POKEMON_API}/sets?orderBy=-releaseDate`, {
      headers: {
        'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sets: ${response.statusText}`);
    }

    const data = await response.json();
    const sets = data.data;

    console.log(`Fetched ${sets.length} sets from Pokemon API`);

    // Transform and insert sets
    const transformedSets = sets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      release_date: set.releaseDate,
      total_cards: set.total || set.printedTotal || 0,
      logo: set.images?.logo,
      symbol: set.images?.symbol
    }));

    // Upsert sets (insert or update if exists)
    const { data: insertedSets, error } = await supabase
      .from('sets')
      .upsert(transformedSets, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    // Update sync status
    await supabase
      .from('sync_metadata')
      .update({
        status: 'success',
        message: `Successfully synced ${sets.length} sets`,
        last_sync: new Date().toISOString()
      })
      .eq('entity_type', 'sets');

    console.log(`Successfully synced ${sets.length} sets to database`);
    return { success: true, count: sets.length };
  } catch (error) {
    console.error('Error syncing sets:', error);

    // Update sync status with error
    await supabase
      .from('sync_metadata')
      .update({
        status: 'failed',
        message: error.message
      })
      .eq('entity_type', 'sets');

    return { success: false, error: error.message };
  }
};

/**
 * Sync all cards for a specific set
 */
export const syncSetCards = async (setId) => {
  try {
    console.log(`Starting cards sync for set ${setId}...`);

    // Fetch cards from Pokemon API
    const response = await fetch(
      `${POKEMON_API}/cards?q=set.id:${setId}&orderBy=number&pageSize=250`,
      {
        headers: {
          'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.statusText}`);
    }

    const data = await response.json();
    const cards = data.data;

    console.log(`Fetched ${cards.length} cards for set ${setId}`);

    // Transform cards
    const transformedCards = cards.map(card => ({
      id: card.id,
      set_id: setId,
      name: card.name,
      number: card.number || 'N/A',
      rarity: card.rarity || 'Common',
      image_small: card.images?.small,
      image_large: card.images?.large,
      tcgplayer_url: card.tcgplayer?.url || null
    }));

    // Upsert cards
    const { error: cardsError } = await supabase
      .from('cards')
      .upsert(transformedCards, { onConflict: 'id' });

    if (cardsError) {
      throw cardsError;
    }

    // Transform and insert initial pricing data
    const transformedPrices = cards.map(card => {
      const prices = card.tcgplayer?.prices || {};
      const priceVariants = ['holofoil', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil', 'normal'];
      let priceData = null;

      for (const variant of priceVariants) {
        if (prices[variant] && prices[variant].market) {
          priceData = prices[variant];
          break;
        }
      }

      if (!priceData) {
        const firstVariant = Object.keys(prices)[0];
        priceData = firstVariant ? prices[firstVariant] : {};
      }

      const marketPrice = priceData?.market || 0;
      const lowPrice = priceData?.low || marketPrice * 0.8;
      const highPrice = priceData?.high || marketPrice * 1.3;

      return {
        card_id: card.id,
        tcgplayer_market: marketPrice,
        tcgplayer_low: lowPrice,
        tcgplayer_high: highPrice,
        ebay_avg: null, // Will be updated by price sync
        ebay_verified: false,
        psa10_avg: null, // Will be updated by price sync
        psa10_verified: false
      };
    });

    // Upsert prices
    const { error: pricesError } = await supabase
      .from('prices')
      .upsert(transformedPrices, { onConflict: 'card_id' });

    if (pricesError) {
      throw pricesError;
    }

    console.log(`Successfully synced ${cards.length} cards for set ${setId}`);
    return { success: true, count: cards.length };
  } catch (error) {
    console.error(`Error syncing cards for set ${setId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync all cards for all sets
 */
export const syncAllCards = async () => {
  try {
    console.log('Starting full cards sync...');

    // Update sync status
    await supabase
      .from('sync_metadata')
      .update({ status: 'in_progress', message: 'Syncing all cards from Pokemon TCG API' })
      .eq('entity_type', 'cards');

    // Get all sets from database
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, name')
      .order('release_date', { ascending: false });

    if (setsError) {
      throw setsError;
    }

    console.log(`Syncing cards for ${sets.length} sets...`);

    let totalCards = 0;
    let successCount = 0;
    let failCount = 0;

    // Sync cards for each set (with delay to avoid rate limiting)
    for (const set of sets) {
      const result = await syncSetCards(set.id);
      if (result.success) {
        totalCards += result.count;
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update sync status
    await supabase
      .from('sync_metadata')
      .update({
        status: 'success',
        message: `Successfully synced ${totalCards} cards from ${successCount} sets (${failCount} failed)`,
        last_sync: new Date().toISOString()
      })
      .eq('entity_type', 'cards');

    console.log(`Cards sync complete: ${totalCards} cards from ${successCount}/${sets.length} sets`);
    return { success: true, totalCards, successCount, failCount };
  } catch (error) {
    console.error('Error syncing all cards:', error);

    // Update sync status with error
    await supabase
      .from('sync_metadata')
      .update({
        status: 'failed',
        message: error.message
      })
      .eq('entity_type', 'cards');

    return { success: false, error: error.message };
  }
};

/**
 * Check if sync is needed based on last sync time
 */
export const checkSyncStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('sync_metadata')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return [];
  }
};

/**
 * Full initial sync - sets and cards
 */
export const performFullSync = async () => {
  console.log('Starting full database sync...');

  // Sync sets first
  const setsResult = await syncAllSets();
  if (!setsResult.success) {
    return { success: false, error: 'Failed to sync sets: ' + setsResult.error };
  }

  // Then sync all cards
  const cardsResult = await syncAllCards();
  if (!cardsResult.success) {
    return { success: false, error: 'Failed to sync cards: ' + cardsResult.error };
  }

  console.log('Full sync complete!');
  return {
    success: true,
    sets: setsResult.count,
    cards: cardsResult.totalCards
  };
};

/**
 * Trigger Supabase Edge Function sync via Vercel endpoint
 * @param {string} mode - Sync mode: 'full', 'sets', 'prices', 'single-set'
 * @param {string} [setId] - Set ID for single-set mode
 */
export const triggerEdgeFunctionSync = async (mode = 'prices', setId = null) => {
  try {
    console.log(`🚀 Triggering Edge Function sync with mode: ${mode}${setId ? `, setId: ${setId}` : ''}`);
    
    const startTime = Date.now();
    
    // Build URL with query params
    const url = new URL('/api/trigger-sync', window.location.origin);
    url.searchParams.set('mode', mode);
    if (setId) {
      url.searchParams.set('setId', setId);
    }

    // Call the Vercel serverless function which triggers the Edge Function
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      console.error('❌ Edge Function sync failed:', result);
      throw new Error(result.error || `Edge Function returned ${response.status}`);
    }

    console.log(`✅ Edge Function sync completed in ${elapsed}s:`, result);
    
    return {
      success: true,
      ...result,
      elapsed: `${elapsed}s`
    };
  } catch (error) {
    console.error('💥 Error triggering Edge Function sync:', error);
    return {
      success: false,
      error: error.message || 'Failed to trigger sync'
    };
  }
};
