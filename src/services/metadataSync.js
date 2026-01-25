import { supabase } from '../lib/supabase';

/**
 * Sync metadata (types, supertype) for all sets that need it
 * Calls Edge Function in batches to avoid CORS issues and timeouts
 */
export const syncAllCardMetadata = async (onProgress) => {
  try {
    console.log('🎴 Starting complete metadata sync via Edge Function...');

    // Get all sets that haven't been synced yet
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

    // Filter sets that actually need syncing
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
    let totalSetsProcessed = 0;
    let batchNumber = 0;

    // Call Edge Function processing 2 sets at a time (back to what was working)
    const BATCH_SIZE = 2;
    
    while (totalSetsProcessed < setsToSync.length) {
      batchNumber++;
      
      // Progress callback
      if (onProgress) {
        onProgress({
          current: totalSetsProcessed + 1,
          total: setsToSync.length,
          setName: `Batch ${batchNumber}`,
          cardsUpdated: totalCardsUpdated
        });
      }

      console.log(`\n📦 Batch ${batchNumber}: Calling Edge Function for ${BATCH_SIZE} sets...`);

      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Call Edge Function for one batch (2 sets - back to what was working)
        const response = await fetch('/api/trigger-sync?mode=card-metadata&limit=2', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Edge Function failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          totalCardsUpdated += result.cardsUpdated || 0;
          totalSetsProcessed += result.setsProcessed || 0;
          console.log(`✅ Batch ${batchNumber} complete: ${result.cardsUpdated} cards, ${result.setsProcessed} sets`);
        } else {
          console.error(`❌ Batch ${batchNumber} failed:`, result.error);
        }

        // Check if we're done
        if (result.setsProcessed === 0 || result.message?.includes('No sets to sync')) {
          console.log('✅ All sets synced!');
          break;
        }

      } catch (error) {
        console.error(`Error in batch ${batchNumber}:`, error);
        // Continue to next batch even if one fails
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n🎉 Metadata sync complete!`);
    console.log(`   Batches: ${batchNumber}`);
    console.log(`   Sets: ${totalSetsProcessed}/${setsToSync.length}`);
    console.log(`   Cards: ${totalCardsUpdated}`);

    return {
      success: true,
      message: `Complete! Synced ${totalSetsProcessed} sets (${totalCardsUpdated} cards) in ${batchNumber} batches`,
      setsProcessed: totalSetsProcessed,
      totalSets: setsToSync.length,
      cardsUpdated: totalCardsUpdated
    };

  } catch (error) {
    console.error('❌ Metadata sync failed:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};
