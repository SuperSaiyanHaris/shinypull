// Supabase Edge Function: sync-pokemon-data
// Syncs Pokemon TCG data from the API to Supabase database
// Can be triggered manually via HTTP or scheduled via cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const POKEMON_API = "https://api.pokemontcg.io/v2";

// CORS headers for manual HTTP triggers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncOptions {
  mode: "full" | "prices" | "sets" | "single-set" | "card-metadata" | "card-metadata-all";
  setId?: string;
  limit?: number; // Max number of sets to process (prevents timeout)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pokemonApiKey = Deno.env.get("POKEMON_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options: SyncOptions = { mode: "prices" }; // Default to prices-only sync

    if (req.method === "POST") {
      try {
        const body = await req.json();
        options = { ...options, ...body };
      } catch {
        // Use defaults if no body
      }
    }

    // Check URL params for mode
    const url = new URL(req.url);
    const modeParam = url.searchParams.get("mode");
    if (modeParam) {
      options.mode = modeParam as SyncOptions["mode"];
    }
    const setIdParam = url.searchParams.get("setId");
    if (setIdParam) {
      options.setId = setIdParam;
    }

    console.log(`Starting sync with mode: ${options.mode}`);

    const headers = {
      "Content-Type": "application/json",
      ...(pokemonApiKey && { "X-Api-Key": pokemonApiKey }),
    };

    let result: Record<string, unknown> = {};

    switch (options.mode) {
      case "full":
        result = await performFullSync(supabase, headers);
        break;
      case "sets":
        result = await syncSets(supabase, headers);
        break;
      case "single-set":
        if (!options.setId) {
          throw new Error("setId is required for single-set mode");
        }
        result = await syncSetCards(supabase, headers, options.setId);
        break;
      case "card-metadata":
        result = await syncCardMetadataBatch(supabase, headers, options.limit);
        break;
      case "card-metadata-all":
        result = await syncAllCardMetadata(supabase, headers);
        break;
      case "prices":
      default:
        result = await syncPricesOnly(supabase, headers, options.limit);
        break;
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Full sync - sets and all cards
async function performFullSync(supabase: any, headers: Record<string, string>) {
  console.log("Performing full sync...");

  const setsResult = await syncSets(supabase, headers);
  if (!setsResult.success) {
    return { success: false, error: "Failed to sync sets", details: setsResult };
  }

  // Get all sets from database
  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select("id")
    .order("release_date", { ascending: false });

  if (setsError) throw setsError;

  let totalCards = 0;
  let successCount = 0;
  let failCount = 0;

  // Sync cards for each set with concurrency limit
  const BATCH_SIZE = 5; // Process 5 sets at a time
  for (let i = 0; i < sets.length; i += BATCH_SIZE) {
    const batch = sets.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((set: { id: string }) => syncSetCards(supabase, headers, set.id))
    );

    for (const result of results) {
      if (result.success) {
        totalCards += result.count || 0;
        successCount++;
      } else {
        failCount++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < sets.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Update sync metadata
  await supabase
    .from("sync_metadata")
    .upsert({
      entity_type: "full",
      status: "success",
      message: `Synced ${totalCards} cards from ${successCount} sets`,
      last_sync: new Date().toISOString(),
    }, { onConflict: "entity_type" });

  return {
    success: true,
    sets: setsResult.count,
    cards: totalCards,
    setsProcessed: successCount,
    setsFailed: failCount,
  };
}

// Sync sets only
async function syncSets(supabase: any, headers: Record<string, string>) {
  console.log("Syncing sets...");

  const response = await fetch(`${POKEMON_API}/sets?orderBy=-releaseDate`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch sets: ${response.statusText}`);
  }

  const data = await response.json();
  const sets = data.data;

  const transformedSets = sets.map((set: any) => ({
    id: set.id,
    name: set.name,
    series: set.series,
    release_date: set.releaseDate,
    total_cards: set.total || set.printedTotal || 0,
    logo: set.images?.logo,
    symbol: set.images?.symbol,
  }));

  const { error } = await supabase
    .from("sets")
    .upsert(transformedSets, { onConflict: "id" });

  if (error) throw error;

  // Update sync metadata
  await supabase
    .from("sync_metadata")
    .upsert({
      entity_type: "sets",
      status: "success",
      message: `Synced ${sets.length} sets`,
      last_sync: new Date().toISOString(),
    }, { onConflict: "entity_type" });

  console.log(`Synced ${sets.length} sets`);
  return { success: true, count: sets.length };
}

// Sync cards for a single set
async function syncSetCards(supabase: any, headers: Record<string, string>, setId: string) {
  console.log(`Syncing cards for set ${setId}...`);

  const response = await fetch(
    `${POKEMON_API}/cards?q=set.id:${setId}&orderBy=number&pageSize=250`,
    { headers }
  );

  if (!response.ok) {
    console.error(`Failed to fetch cards for ${setId}: ${response.statusText}`);
    return { success: false, error: response.statusText };
  }

  const data = await response.json();
  const cards = data.data;

  // Transform cards
  const transformedCards = cards.map((card: any) => ({
    id: card.id,
    set_id: setId,
    name: card.name,
    number: card.number || "N/A",
    rarity: card.rarity || "Common",
    types: card.types || null, // Array of Pokemon types (e.g., ['Fire', 'Dragon'])
    supertype: card.supertype || null, // 'Pokémon', 'Trainer', or 'Energy'
    image_small: card.images?.small,
    image_large: card.images?.large,
    tcgplayer_url: card.tcgplayer?.url || null,
  }));

  // Upsert cards
  const { error: cardsError } = await supabase
    .from("cards")
    .upsert(transformedCards, { onConflict: "id" });

  if (cardsError) {
    console.error(`Error upserting cards for ${setId}:`, cardsError);
    return { success: false, error: cardsError.message };
  }

  // Transform and upsert prices
  const transformedPrices = cards.map((card: any) => {
    const prices = card.tcgplayer?.prices || {};
    const priceVariants = ["holofoil", "reverseHolofoil", "1stEditionHolofoil", "unlimitedHolofoil", "normal"];
    let priceData: any = null;

    for (const variant of priceVariants) {
      if (prices[variant]?.market) {
        priceData = prices[variant];
        break;
      }
    }

    if (!priceData) {
      const firstVariant = Object.keys(prices)[0];
      priceData = firstVariant ? prices[firstVariant] : {};
    }

    const marketPrice = priceData?.market || 0;

    return {
      card_id: card.id,
      tcgplayer_market: marketPrice,
      tcgplayer_low: priceData?.low || marketPrice * 0.8,
      tcgplayer_high: priceData?.high || marketPrice * 1.3,
      last_updated: new Date().toISOString(),
    };
  });

  const { error: pricesError } = await supabase
    .from("prices")
    .upsert(transformedPrices, { onConflict: "card_id" });

  if (pricesError) {
    console.error(`Error upserting prices for ${setId}:`, pricesError);
    return { success: false, error: pricesError.message };
  }

  console.log(`Synced ${cards.length} cards for set ${setId}`);
  return { success: true, count: cards.length };
}

// Prices-only sync - faster, updates only price data
async function syncPricesOnly(supabase: any, headers: Record<string, string>, limit: number = 3) {
  console.log(`Syncing prices only (limit: ${limit} sets)...`);

  // Simple rotation: Get the sets that haven't been synced in the longest time
  // This ensures ALL sets get updated in order, rotating through the entire database
  const { data: setsToSync } = await supabase
    .from("sets")
    .select("id, name, last_price_sync")
    .order("last_price_sync", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (!setsToSync || setsToSync.length === 0) {
    return {
      success: true,
      cardsUpdated: 0,
      setsProcessed: 0,
      message: "No sets to sync"
    };
  }

  console.log(`Processing sets: ${setsToSync.map(s => s.name || s.id).join(", ")}`);

  return await processPriceSync(supabase, headers, setsToSync);
}

// Separate function to process the actual price sync
async function processPriceSync(supabase: any, headers: Record<string, string>, setsToSync: any[]) {

  let totalCards = 0;
  let successCount = 0;

  // Process sets in parallel batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < setsToSync.length; i += BATCH_SIZE) {
    const batch = setsToSync.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (set: { id: string }) => {
        try {
          const response = await fetch(
            `${POKEMON_API}/cards?q=set.id:${set.id}&select=id,tcgplayer&pageSize=250`,
            { headers }
          );

          if (!response.ok) return { success: false };

          const data = await response.json();
          const cards = data.data;

          // Update tcgplayer_url in cards table using individual updates
          let updateCount = 0;
          for (const card of cards) {
            const { error: cardUpdateError } = await supabase
              .from("cards")
              .update({ tcgplayer_url: card.tcgplayer?.url || null })
              .eq("id", card.id);
            
            if (cardUpdateError) {
              console.error(`Error updating tcgplayer_url for card ${card.id}:`, cardUpdateError);
            } else {
              updateCount++;
            }
          }
          console.log(`Updated tcgplayer_url for ${updateCount}/${cards.length} cards in set ${set.id}`);

          // Update prices
          const priceUpdates = cards.map((card: any) => {
            const prices = card.tcgplayer?.prices || {};
            const priceVariants = ["holofoil", "reverseHolofoil", "1stEditionHolofoil", "unlimitedHolofoil", "normal"];
            let priceData: any = null;

            for (const variant of priceVariants) {
              if (prices[variant]?.market) {
                priceData = prices[variant];
                break;
              }
            }

            if (!priceData) {
              const firstVariant = Object.keys(prices)[0];
              priceData = firstVariant ? prices[firstVariant] : {};
            }

            const marketPrice = priceData?.market || 0;

            return {
              card_id: card.id,
              tcgplayer_market: marketPrice,
              tcgplayer_low: priceData?.low || marketPrice * 0.8,
              tcgplayer_high: priceData?.high || marketPrice * 1.3,
              last_updated: new Date().toISOString(),
            };
          });

          await supabase
            .from("prices")
            .upsert(priceUpdates, { onConflict: "card_id" });

          // Update last_price_sync timestamp for this set
          await supabase
            .from("sets")
            .update({ last_price_sync: new Date().toISOString() })
            .eq("id", set.id);

          return { success: true, count: cards.length };
        } catch {
          return { success: false, count: 0 };
        }
      })
    );

    for (const result of results) {
      if (result.success) {
        totalCards += result.count || 0;
        successCount++;
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < setsToSync.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Update sync metadata
  await supabase
    .from("sync_metadata")
    .upsert({
      entity_type: "prices",
      status: "success",
      message: `Updated prices for ${totalCards} cards from ${successCount} sets`,
      last_sync: new Date().toISOString(),
    }, { onConflict: "entity_type" });

  console.log(`Price sync complete: ${totalCards} cards from ${successCount} sets`);
  return {
    success: true,
    cardsUpdated: totalCards,
    setsProcessed: successCount,
  };
}

// Card metadata sync - updates static fields (types, supertype, etc.) in batches
// This is for one-time updates of card metadata that doesn't change
async function syncCardMetadataBatch(supabase: any, headers: Record<string, string>, limit: number = 1) {
  console.log(`Syncing card metadata (limit: ${limit} sets)...`);

  // Get sets that haven't had metadata synced yet (or oldest sync)
  const { data: setsToSync, error: setsError } = await supabase
    .from("sets")
    .select("id, name, last_metadata_sync")
    .order("last_metadata_sync", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (setsError) {
    console.error("Error fetching sets:", setsError);
    throw setsError;
  }

  if (!setsToSync || setsToSync.length === 0) {
    return {
      success: true,
      cardsUpdated: 0,
      setsProcessed: 0,
      message: "No sets to sync - all metadata up to date!"
    };
  }

  console.log(`Processing metadata for sets: ${setsToSync.map((s: any) => s.name || s.id).join(", ")}`);

  let totalCardsUpdated = 0;
  let successCount = 0;

  // Process each set
  for (const set of setsToSync) {
    try {
      console.log(`Fetching cards for set ${set.id}...`);
      
      const response = await fetch(
        `${POKEMON_API}/cards?q=set.id:${set.id}&orderBy=number&pageSize=250`,
        { headers }
      );

      if (!response.ok) {
        console.error(`Failed to fetch cards for ${set.id}: ${response.statusText}`);
        // DON'T mark as synced - let it retry next time
        continue;
      }

      const data = await response.json();
      const cards = data.data;

      if (!cards || cards.length === 0) {
        console.log(`No cards found for set ${set.id}`);
        // Empty set is considered synced
        await supabase
          .from("sets")
          .update({ last_metadata_sync: new Date().toISOString() })
          .eq("id", set.id);
        successCount++;
        continue;
      }

      console.log(`Updating metadata for ${cards.length} cards in set ${set.id}...`);

      // Prepare all updates
      const updates = cards.map((card: any) => ({
        id: card.id,
        set_id: set.id, // Required for upsert
        name: card.name || "Unknown", // Required fields
        number: card.number || "N/A",
        rarity: card.rarity || "Common",
        image_small: card.images?.small,
        image_large: card.images?.large,
        tcgplayer_url: card.tcgplayer?.url || null,
        types: card.types || null,
        supertype: card.supertype || null,
      }));

      // Batch upsert - MUCH faster than individual updates
      const { error: updateError } = await supabase
        .from("cards")
        .upsert(updates, { 
          onConflict: "id",
          ignoreDuplicates: false 
        });

      if (updateError) {
        console.error(`Error updating cards for ${set.id}:`, updateError);
        throw updateError; // Throw to prevent marking set as synced
      }
      
      totalCardsUpdated += cards.length;

      // ONLY mark as synced if everything succeeded
      await supabase
        .from("sets")
        .update({ last_metadata_sync: new Date().toISOString() })
        .eq("id", set.id);

      successCount++;
      console.log(`✓ Completed metadata sync for ${set.name} (${cards.length} cards)`);

    } catch (error) {
      console.error(`Error processing set ${set.id}:`, error);
      // DON'T mark as synced - it will retry next time
      throw error; // Throw to stop processing and report failure
    }
  }

  // Update sync metadata
  await supabase
    .from("sync_metadata")
    .upsert({
      entity_type: "card_metadata",
      status: "success",
      message: `Updated metadata for ${totalCardsUpdated} cards from ${successCount}/${setsToSync.length} sets`,
      last_sync: new Date().toISOString(),
    }, { onConflict: "entity_type" });

  console.log(`Card metadata sync complete: ${totalCardsUpdated} cards from ${successCount} sets`);
  
  return {
    success: true,
    cardsUpdated: totalCardsUpdated,
    setsProcessed: successCount,
    totalSets: setsToSync.length,
    message: successCount === setsToSync.length 
      ? `All ${successCount} sets synced successfully!` 
      : `${successCount}/${setsToSync.length} sets synced successfully`
  };
}

// Sync ALL card metadata in batches - runs until complete
// This is a wrapper that calls syncCardMetadataBatch repeatedly
async function syncAllCardMetadata(supabase: any, headers: Record<string, string>) {
  console.log("Starting complete card metadata sync (all sets)...");
  
  const BATCH_SIZE = 1;
  let totalCardsUpdated = 0;
  let totalSetsProcessed = 0;
  let batchNumber = 0;
  
  while (true) {
    batchNumber++;
    console.log(`\n--- Batch ${batchNumber} ---`);
    
    // Check if there are any sets left to sync
    const { data: remainingSets, error: checkError } = await supabase
      .from("sets")
      .select("id")
      .order("last_metadata_sync", { ascending: true, nullsFirst: true })
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (!remainingSets || remainingSets.length === 0) {
      console.log("✅ All sets have been synced!");
      break;
    }
    
    // Process one batch
    const result = await syncCardMetadataBatch(supabase, headers, BATCH_SIZE);
    
    if (!result.success) {
      console.error("Batch failed:", result);
      break;
    }
    
    totalCardsUpdated += result.cardsUpdated || 0;
    totalSetsProcessed += result.setsProcessed || 0;
    
    console.log(`Batch ${batchNumber} complete: ${result.cardsUpdated} cards, ${result.setsProcessed} sets`);
    
    // Check if we're done (no more sets processed means we're complete)
    if (result.setsProcessed === 0 || result.message?.includes("No sets to sync")) {
      console.log("✅ All sets synced - metadata sync complete!");
      break;
    }
    
    // Small delay between batches to avoid overwhelming the system
    console.log("Waiting 2 seconds before next batch...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  // Final update to sync metadata
  await supabase
    .from("sync_metadata")
    .upsert({
      entity_type: "card_metadata",
      status: "success",
      message: `Complete sync: Updated metadata for ${totalCardsUpdated} cards from ${totalSetsProcessed} sets in ${batchNumber} batches`,
      last_sync: new Date().toISOString(),
    }, { onConflict: "entity_type" });
  
  return {
    success: true,
    cardsUpdated: totalCardsUpdated,
    setsProcessed: totalSetsProcessed,
    totalBatches: batchNumber,
    message: `Complete! Synced ${totalSetsProcessed} sets (${totalCardsUpdated} cards) in ${batchNumber} batches`
  };
}
