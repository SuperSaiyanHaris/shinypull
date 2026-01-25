import { supabase } from '../lib/supabase';

/**
 * Sync metadata (types, supertype) for all sets that need it
 * NEW: Uses card-level chunking (50 cards at a time) to avoid timeouts
 */
export const syncAllCardMetadata = async (onProgress) => {
  try {
    console.log('🎴 Starting complete metadata sync via Edge Function...');

    // Get all sets that need syncing (incomplete or never synced)
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, name, total_cards, metadata_sync_progress, last_metadata_sync')
      .or('metadata_sync_progress.is.null,metadata_sync_progress.lt.total_cards')
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

    console.log(`📊 Found ${sets.length} sets needing metadata sync`);

    let totalCardsUpdated = 0;
    let totalSetsProcessed = 0;
    let callNumber = 0;

    // Call Edge Function repeatedly - it processes 50 cards at a time
    // Each call returns progress info
    while (true) {
      callNumber++;
      
      // Get current status for progress display
      const { data: currentSets } = await supabase
        .from('sets')
        .select('id, name, total_cards, metadata_sync_progress')
        .or('metadata_sync_progress.is.null,metadata_sync_progress.lt.total_cards')
        .order('last_metadata_sync', { ascending: true, nullsFirst: true })
        .limit(1);

      if (!currentSets || currentSets.length === 0) {
        console.log('✅ All sets complete!');
        break;
      }

      const currentSet = currentSets[0];
      const progress = currentSet.metadata_sync_progress || 0;

      // Progress callback
      if (onProgress) {
        onProgress({
          current: totalSetsProcessed + 1,
          total: sets.length,
          setName: `${currentSet.name} (${progress}/${currentSet.total_cards} cards)`,
          cardsUpdated: totalCardsUpdated,
          currentProgress: progress,
          currentTotal: currentSet.total_cards
        });
      }

      console.log(`\n📦 Call ${callNumber}: Processing ${currentSet.name}...`);

      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Call Edge Function - it will process 50 cards from current set
        const timestamp = Date.now();
        const response = await fetch(`/api/trigger-sync?mode=card-metadata&limit=1&t=${timestamp}`, {
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
          if (result.isComplete) {
            totalSetsProcessed++;
            console.log(`✅ ${currentSet.name} COMPLETE! Total sets done: ${totalSetsProcessed}`);
          } else {
            console.log(`✅ Call ${callNumber}: ${result.cardsUpdated} cards updated (${result.progress}/${result.total})`);
          }
        } else {
          console.error(`❌ Call ${callNumber} failed:`, result.error);
        }

        // Check if all done
        if (result.message?.includes('No sets to sync')) {
          console.log('✅ All sets synced!');
          break;
        }

      } catch (error) {
        console.error(`Error in call ${callNumber}:`, error);
        // Continue even if one call fails
      }

      // Small delay between calls (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n🎉 Metadata sync complete!`);
    console.log(`   Calls: ${callNumber}`);
    console.log(`   Sets: ${totalSetsProcessed}`);
    console.log(`   Cards: ${totalCardsUpdated}`);

    return {
      success: true,
      message: `Complete! Synced ${totalSetsProcessed} sets (${totalCardsUpdated} cards) in ${callNumber} calls`,
      setsProcessed: totalSetsProcessed,
      totalSets: sets.length,
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
