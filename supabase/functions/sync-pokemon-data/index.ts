// Supabase Edge Function: sync-pokemon-data
// Syncs Pokemon TCG data from the API to Supabase database
// Can be triggered manually via HTTP or scheduled via cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { transformCardWithEditions, deduplicateEditions, parseEditionsFromCard, generateEditionCardId } from "./edition-utils.ts";

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

// Sync cards for a single set - NOW WITH EDITION SUPPORT
async function syncSetCards(supabase: any, headers: Record<string, string>, setId: string) {
  console.log(`Syncing cards for set ${setId} with edition support...`);

  const response = await fetch(
    `${POKEMON_API}/cards?q=set.id:${setId}&orderBy=number&pageSize=250`,
    { headers }
  );

  if (!response.ok) {
    console.error(`Failed to fetch cards for ${setId}: ${response.statusText}`);
    return { success: false, error: response.statusText };
  }

  const data = await response.json();
  const pokemonCards = data.data;

  console.log(`Fetched ${pokemonCards.length} cards from Pokemon API`);

  // Transform cards with edition support
  const allCardData: Array<{card: any, price: any}> = [];
  
  for (const pokemonCard of pokemonCards) {
    const cardData = transformCardWithEditions(pokemonCard, setId);
    allCardData.push(...cardData);
  }

  console.log(`Transformed into ${allCardData.length} card records (with editions)`);

  // Separate cards and prices
  const transformedCards = allCardData.map(item => item.card);
  const transformedPrices = allCardData.map(item => item.price);

  // Upsert cards
  const { error: cardsError } = await supabase
    .from("cards")
    .upsert(transformedCards, { onConflict: "id" });

  if (cardsError) {
    console.error(`Error upserting cards for ${setId}:`, cardsError);
    return { success: false, error: cardsError.message };
  }

  // Upsert prices
  const { error: pricesError } = await supabase
    .from("prices")
    .upsert(transformedPrices, { onConflict: "card_id" });

  if (pricesError) {
    console.error(`Error upserting prices for ${setId}:`, pricesError);
    return { success: false, error: pricesError.message };
  }

  console.log(`Synced ${transformedCards.length} card editions for set ${setId}`);
  return { success: true, count: transformedCards.length, baseCards: pokemonCards.length };
}

// Prices-only sync - faster, updates only price data
// NEW: Processes 1 set at a time, chunking cards within that set
async function syncPricesOnly(supabase: any, headers: Record<string, string>, limit: number = 1) {
  console.log(`Syncing prices (limit: ${limit} sets)...`);

  // Get 1 set that needs price sync (oldest sync)
  const { data: setsToSync } = await supabase
    .from("sets")
    .select("id, name, total_cards, price_sync_progress, last_price_sync")
    .order("last_price_sync", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (!setsToSync || setsToSync.length === 0) {
    return {
      success: true,
      cardsUpdated: 0,
      setsProcessed: 0,
      message: "No sets to sync - all prices up to date!"
    };
  }

  const set = setsToSync[0];
  const startFrom = set.price_sync_progress || 0;
  const CHUNK_SIZE = 50; // Process 50 cards at a time
  
  console.log(`Processing prices for ${set.name}: cards ${startFrom + 1} to ${startFrom + CHUNK_SIZE}`);

  return await processPriceSync(supabase, headers, set, startFrom, CHUNK_SIZE);
}

// NEW: Process price sync for a CHUNK of cards within a single set
async function processPriceSync(supabase: any, headers: Record<string, string>, set: any, startFrom: number, chunkSize: number) {
  try {
    console.log(`Fetching cards from Pokemon API for set ${set.id}...`);
    
    // Fetch ALL cards for the set (with pagination info)
    const response = await fetch(
      `${POKEMON_API}/cards?q=set.id:${set.id}&select=id,number,tcgplayer&orderBy=number&page=${Math.floor(startFrom / 250) + 1}&pageSize=250`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch cards for ${set.id}: ${response.statusText}`);
      return { success: false, cardsUpdated: 0, setsProcessed: 0 };
    }

    const data = await response.json();
    const allCards = data.data;

    // Get the specific chunk we want to process
    const localStartIndex = startFrom % 250;
    const cardsToProcess = allCards.slice(localStartIndex, localStartIndex + chunkSize);

    if (cardsToProcess.length === 0) {
      console.log(`No more cards to process for ${set.id} - marking as complete`);
      // Reset progress and update timestamp
      await supabase
        .from("sets")
        .update({ 
          price_sync_progress: 0,
          last_price_sync: new Date().toISOString() 
        })
        .eq("id", set.id);

      return { success: true, cardsUpdated: 0, setsProcessed: 1 };
    }

    console.log(`Processing ${cardsToProcess.length} cards with edition support...`);

    // Process price updates with edition support
    const priceUpdates: any[] = [];
    
    for (const pokemonCard of cardsToProcess) {
      const editions = parseEditionsFromCard(pokemonCard);
      const dedupedEditions = deduplicateEditions(editions);
      
      // Create price update for each edition
      for (const editionData of dedupedEditions) {
        const editionCardId = generateEditionCardId(pokemonCard.id, editionData.edition);
        
        priceUpdates.push({
          card_id: editionCardId,
          tcgplayer_market: editionData.prices.market,
          tcgplayer_low: editionData.prices.low,
          tcgplayer_high: editionData.prices.high,
          last_updated: new Date().toISOString(),
        });
      }
    }

    // Batch upsert prices
    const { error: priceError } = await supabase
      .from("prices")
      .upsert(priceUpdates, { onConflict: "card_id" });

    if (priceError) {
      console.error("Error updating prices:", priceError);
      return { success: false, cardsUpdated: 0, setsProcessed: 0 };
    }

    // Update progress
    const newProgress = startFrom + cardsToProcess.length;
    const isComplete = newProgress >= set.total_cards;

    await supabase
      .from("sets")
      .update({ 
        price_sync_progress: isComplete ? 0 : newProgress, // Reset to 0 when complete
        last_price_sync: isComplete ? new Date().toISOString() : set.last_price_sync // Only update timestamp when complete
      })
      .eq("id", set.id);

    console.log(`✓ Updated ${cardsToProcess.length} card prices. Progress: ${newProgress}/${set.total_cards}`);

    return {
      success: true,
      cardsUpdated: cardsToProcess.length,
      setsProcessed: isComplete ? 1 : 0,
      progress: newProgress,
      total: set.total_cards,
      setName: set.name,
      isComplete
    };

  } catch (error) {
    console.error(`Error processing price sync:`, error);
    return { success: false, cardsUpdated: 0, setsProcessed: 0, error: error.message };
  }
}

// NEW: Card metadata sync - processes CHUNKS of cards within a single set
// This avoids timeout by processing 50 cards at a time, tracking progress
async function syncCardMetadataBatch(supabase: any, headers: Record<string, string>, limit: number = 1) {
  console.log(`Syncing card metadata...`);

  // Get 1 set that needs metadata sync (never synced or partially synced)
  const { data: setsToSync, error: setsError } = await supabase
    .from("sets")
    .select("id, name, total_cards, metadata_sync_progress, last_metadata_sync")
    .is("last_metadata_sync", null)
    .order("id")
    .limit(limit);
  
  // If all sets have been synced at least once, get ones with partial progress
  if (!setsToSync || setsToSync.length === 0) {
    const { data: partialSets, error: partialError } = await supabase
      .from("sets")
      .select("id, name, total_cards, metadata_sync_progress, last_metadata_sync")
      .not("metadata_sync_progress", "is", null)
      .gt("metadata_sync_progress", 0)
      .order("last_metadata_sync", { ascending: true })
      .limit(limit);
    
    if (partialError) {
      console.error("Error fetching partial sets:", partialError);
      throw partialError;
    }
    
    if (!partialSets || partialSets.length === 0) {
      return {
        success: true,
        cardsUpdated: 0,
        setsProcessed: 0,
        message: "No sets to sync - all metadata up to date!"
      };
    }
    
    setsToSync = partialSets;
  }

  if (setsError) {
    console.error("Error fetching sets:", setsError);
    throw setsError;
  }

  const set = setsToSync[0];
  const startFrom = set.metadata_sync_progress || 0;
  const CHUNK_SIZE = 50; // Process 50 cards at a time - we have 20k API calls/day now!

  console.log(`Processing metadata for ${set.name}: cards ${startFrom + 1} to ${startFrom + CHUNK_SIZE}`);

  return await processMetadataSync(supabase, headers, set, startFrom, CHUNK_SIZE);
}

// NEW: Process metadata sync for a CHUNK of cards within a single set
async function processMetadataSync(supabase: any, headers: Record<string, string>, set: any, startFrom: number, chunkSize: number) {
  try {
    console.log(`Getting ${chunkSize} cards from database for set ${set.id}...`);
    
    // STEP 1: Get card IDs from OUR database (fast - no external API call)
    const { data: dbCards, error: dbError } = await supabase
      .from("cards")
      .select("id, number")
      .eq("set_id", set.id)
      .order("number")
      .range(startFrom, startFrom + chunkSize - 1);

    if (dbError) {
      console.error(`Database error fetching cards:`, dbError);
      return { success: false, cardsUpdated: 0, setsProcessed: 0 };
    }

    if (!dbCards || dbCards.length === 0) {
      console.log(`No more cards to process for ${set.id} - marking as complete`);
      // Reset progress and update timestamp
      await supabase
        .from("sets")
        .update({ 
          metadata_sync_progress: 0,
          last_metadata_sync: new Date().toISOString() 
        })
        .eq("id", set.id);

      return { success: true, cardsUpdated: 0, setsProcessed: 1 };
    }

    console.log(`Fetching metadata for ${dbCards.length} cards from Pokemon API...`);

    // STEP 2: Fetch these cards from Pokemon API using a query
    // Build proper OR query: (id:card1 OR id:card2 OR id:card3)
    const cardIds = dbCards.map(c => `id:${c.id}`).join(" OR ");
    const response = await fetch(
      `${POKEMON_API}/cards?q=(${cardIds})`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch cards from Pokemon API: ${response.statusText}`);
      return { success: false, cardsUpdated: 0, setsProcessed: 0 };
    }

    const data = await response.json();
    const apiCards = data.data;

    if (!apiCards || apiCards.length === 0) {
      console.error(`No cards returned from Pokemon API`);
      return { success: false, cardsUpdated: 0, setsProcessed: 0 };
    }

    console.log(`Updating ${apiCards.length} cards in database...`);

    // STEP 3: Batch update our database
    for (const card of apiCards) {
      await supabase
        .from("cards")
        .update({
          types: card.types || null,
          supertype: card.supertype || null,
        })
        .eq("id", card.id);
    }

    // Update progress
    const newProgress = startFrom + apiCards.length;
    const isComplete = newProgress >= set.total_cards;

    await supabase
      .from("sets")
      .update({ 
        metadata_sync_progress: isComplete ? 0 : newProgress,
        last_metadata_sync: isComplete ? new Date().toISOString() : set.last_metadata_sync
      })
      .eq("id", set.id);

    console.log(`✓ Updated ${apiCards.length} card metadata. Progress: ${newProgress}/${set.total_cards}`);

    return {
      success: true,
      cardsUpdated: apiCards.length,
      setsProcessed: isComplete ? 1 : 0,
      progress: newProgress,
      total: set.total_cards,
      setName: set.name,
      isComplete
    };

  } catch (error) {
    console.error(`Error processing metadata sync:`, error);
    return { success: false, cardsUpdated: 0, setsProcessed: 0, error: error.message };
  }
}

// Sync ALL card metadata in batches - runs until complete
// This is a wrapper that calls syncCardMetadataBatch repeatedly
async function syncAllCardMetadata(supabase: any, headers: Record<string, string>) {
  console.log("Starting complete card metadata sync (all sets)...");
  
  let totalCardsUpdated = 0;
  let totalSetsProcessed = 0;
  let callNumber = 0;
  
  while (true) {
    callNumber++;
    console.log(`\n--- Call ${callNumber} ---`);
    
    // Check if there are any sets left to sync
    const { data: remainingSets, error: checkError } = await supabase
      .from("sets")
      .select("id")
      .is("last_metadata_sync", null)
      .limit(1);
    
    if (checkError) throw checkError;
    
    if (!remainingSets || remainingSets.length === 0) {
      console.log("✅ All sets have been synced!");
      break;
    }
    
    // Process one chunk (50 cards from 1 set)
    const result = await syncCardMetadataBatch(supabase, headers, 1);
    
    if (!result.success) {
      console.error("Call failed:", result);
      break;
    }
    
    totalCardsUpdated += result.cardsUpdated || 0;
    totalSetsProcessed += result.setsProcessed || 0;
    
    console.log(`Call ${callNumber} complete: ${result.cardsUpdated} cards, ${result.setsProcessed} sets completed`);
    
    // Check if we're done
    if (result.message?.includes("No sets to sync")) {
      console.log("✅ All sets synced - metadata sync complete!");
      break;
    }
    
    // Small delay between calls
    console.log("Waiting 1 second before next chunk...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  return {
    success: true,
    cardsUpdated: totalCardsUpdated,
    setsProcessed: totalSetsProcessed,
    totalCalls: callNumber,
    message: `Complete! Synced ${totalSetsProcessed} sets (${totalCardsUpdated} cards) in ${callNumber} calls`
  };
}
