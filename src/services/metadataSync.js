import { supabase } from '../lib/supabase';

const POKEMON_API = 'https://api.pokemontcg.io/v2';

/**
 * Sync metadata (types, supertype) for all sets that need it
 * Runs in the browser - NO TIMEOUT ISSUES!
 */
export const syncAllCardMetadata = async (onProgress) => {
  try {
    console.log('🎴 Starting complete metadata sync...');

    // Get all sets that haven't been synced yet (or oldest sync)
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, name, last_metadata_sync')
      .order('last_metadata_sync', { ascending: true, nullsFirst: true });

    if (setsError) throw setsError;

    if (!sets || sets.length === 0) {
      return {
        success: true,
        message: 'All sets already synced!',
        setsProcessed: 0,
        cardsUpdated: 0
      };
    }

    // Filter sets that actually need syncing (no last_metadata_sync)
    const setsToSync = sets.filter(s => !s.last_metadata_sync);
    
    if (setsToSync.length === 0) {
      return {
        success: true,
        message: 'All sets already synced!',
        setsProcessed: 0,
        cardsUpdated: 0
      };
    }

    console.log(`📊 Found ${setsToSync.length} sets needing metadata sync`);

    let totalCardsUpdated = 0;
    let setsProcessed = 0;

    // Process each set
    for (let i = 0; i < setsToSync.length; i++) {
      const set = setsToSync[i];
      
      try {
        // Progress callback
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: setsToSync.length,
            setName: set.name,
            cardsUpdated: totalCardsUpdated
          });
        }

        console.log(`\n📦 [${i + 1}/${setsToSync.length}] Syncing ${set.name}...`);

        // Fetch cards from Pokemon API
        const response = await fetch(
          `${POKEMON_API}/cards?q=set.id:${set.id}&orderBy=number&pageSize=250`,
          {
            headers: {
              'X-Api-Key': import.meta.env.VITE_POKEMON_API_KEY || ''
            }
          }
        );

        if (!response.ok) {
          console.error(`❌ Failed to fetch cards for ${set.name}`);
          continue;
        }

        const data = await response.json();
        const cards = data.data;

        console.log(`✓ Fetched ${cards.length} cards`);

        // Update cards in batches of 50 to avoid overwhelming the database
        const BATCH_SIZE = 50;
        for (let j = 0; j < cards.length; j += BATCH_SIZE) {
          const cardBatch = cards.slice(j, j + BATCH_SIZE);
          
          const updates = cardBatch.map(card => ({
            id: card.id,
            types: card.types || null,
            supertype: card.supertype || null,
          }));

          const { error: updateError } = await supabase
            .from('cards')
            .upsert(updates, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (updateError) {
            console.error(`Error updating batch:`, updateError);
          } else {
            totalCardsUpdated += cardBatch.length;
          }
        }

        // Mark this set as synced
        await supabase
          .from('sets')
          .update({ last_metadata_sync: new Date().toISOString() })
          .eq('id', set.id);

        setsProcessed++;
        console.log(`✅ Completed ${set.name} (${cards.length} cards)`);

        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`Error processing ${set.name}:`, error);
      }
    }

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        entity_type: 'card_metadata',
        status: 'success',
        message: `Updated metadata for ${totalCardsUpdated} cards from ${setsProcessed} sets`,
        last_sync: new Date().toISOString(),
      }, { onConflict: 'entity_type' });

    console.log(`\n🎉 Metadata sync complete!`);
    console.log(`   Sets: ${setsProcessed}/${setsToSync.length}`);
    console.log(`   Cards: ${totalCardsUpdated}`);

    return {
      success: true,
      message: `Complete! Synced ${setsProcessed} sets (${totalCardsUpdated} cards)`,
      setsProcessed,
      totalSets: setsToSync.length,
      cardsUpdated: totalCardsUpdated
    };

  } catch (error) {
    console.error('❌ Metadata sync failed:', error);
    
    await supabase
      .from('sync_metadata')
      .upsert({
        entity_type: 'card_metadata',
        status: 'failed',
        message: error.message,
        last_sync: new Date().toISOString(),
      }, { onConflict: 'entity_type' });

    return {
      success: false,
      error: error.message
    };
  }
};
