/**
 * Bulk Import from Pokemon TCG GitHub Repository
 * 
 * This script downloads the entire Pokemon TCG dataset from GitHub
 * and imports it directly into Supabase - no API rate limits!
 * 
 * Data source: https://github.com/PokemonTCG/pokemon-tcg-data
 * 
 * Usage: node scripts/bulk-import-from-github.js
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key for bulk import (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

// Warn if using anon key (won't work with RLS enabled)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: Using anon key. Add SUPABASE_SERVICE_ROLE_KEY to .env for bulk imports.');
  console.warn('⚠️  This will fail if Row Level Security is enabled on sets/cards tables.\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GitHub raw content URLs
const GITHUB_BASE = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';
const SETS_URL = `${GITHUB_BASE}/sets/en.json`;
const CARDS_BASE_URL = `${GITHUB_BASE}/cards/en`;

/**
 * Download and parse JSON from URL
 */
async function fetchJSON(url) {
  console.log(`📥 Fetching: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Transform GitHub set format to our database format
 */
function transformSet(githubSet) {
  return {
    id: githubSet.id,
    name: githubSet.name,
    series: githubSet.series,
    release_date: githubSet.releaseDate,
    total_cards: githubSet.total || githubSet.printedTotal || 0,
    logo: githubSet.images?.logo,
    symbol: githubSet.images?.symbol,
    tcgplayer_url: githubSet.tcgplayer?.url,
    ptcgo_code: githubSet.ptcgoCode,
    last_full_sync: new Date().toISOString()
  };
}

/**
 * Transform GitHub card format to our database format (cards table only)
 */
function transformCard(githubCard, setId) {
  return {
    id: githubCard.id,
    set_id: setId,
    name: githubCard.name,
    number: githubCard.number,
    supertype: githubCard.supertype,
    subtypes: githubCard.subtypes || null,
    types: githubCard.types || null,
    hp: githubCard.hp || null,
    rarity: githubCard.rarity || null,
    image_small: githubCard.images?.small,
    image_large: githubCard.images?.large,
    
    // Complete card metadata
    evolves_from: githubCard.evolvesFrom || null,
    evolves_to: githubCard.evolvesTo || null,
    rules: githubCard.rules || null,
    abilities: githubCard.abilities || null,
    attacks: githubCard.attacks || null,
    weaknesses: githubCard.weaknesses || null,
    resistances: githubCard.resistances || null,
    retreat_cost: githubCard.retreatCost || null,
    converted_retreat_cost: githubCard.convertedRetreatCost || null,
    artist: githubCard.artist || null,
    flavor_text: githubCard.flavorText || null,
    national_pokedex_numbers: githubCard.nationalPokedexNumbers || null,
    legalities: githubCard.legalities || null,
    regulation_mark: githubCard.regulationMark || null,
    ancient_trait: githubCard.ancientTrait || null,
    set_printed_total: null, // Not available in individual card files
    set_total: null, // Not available in individual card files
    
    tcgplayer_url: githubCard.tcgplayer?.url || null,
    cardmarket_url: githubCard.cardmarket?.url || null
  };
}

/**
 * Transform GitHub card price data to our prices table format
 */
function transformCardPrice(githubCard) {
  const prices = githubCard.tcgplayer?.prices || {};
  
  // Only create price record if there are actual prices
  if (!prices || Object.keys(prices).length === 0) {
    return null;
  }
  
  const normal = prices.normal || {};
  const holofoil = prices.holofoil || {};
  const reverseHolofoil = prices.reverseHolofoil || {};
  const firstEdHolo = prices['1stEditionHolofoil'] || {};
  const firstEdNormal = prices['1stEditionNormal'] || {};
  const unlimited = prices.unlimited || {};
  const unlimitedHolo = prices.unlimitedHolofoil || {};
  
  return {
    card_id: githubCard.id,
    
    // Market price columns (best available)
    market_price: holofoil.market || reverseHolofoil.market || normal.market || unlimited.market || firstEdHolo.market || null,
    market_low: holofoil.low || reverseHolofoil.low || normal.low || null,
    market_high: holofoil.high || reverseHolofoil.high || normal.high || null,
    
    // Normal variant
    normal_market: normal.market || null,
    normal_low: normal.low || null,
    normal_high: normal.high || null,
    normal_mid: normal.mid || null,
    normal_direct_low: normal.directLow || null,
    
    // Holofoil variant
    holofoil_market: holofoil.market || null,
    holofoil_low: holofoil.low || null,
    holofoil_high: holofoil.high || null,
    holofoil_mid: holofoil.mid || null,
    holofoil_direct_low: holofoil.directLow || null,
    
    // Reverse holofoil variant
    reverse_holofoil_market: reverseHolofoil.market || null,
    reverse_holofoil_low: reverseHolofoil.low || null,
    reverse_holofoil_high: reverseHolofoil.high || null,
    reverse_holofoil_mid: reverseHolofoil.mid || null,
    reverse_holofoil_direct_low: reverseHolofoil.directLow || null,
    
    // 1st Edition Holofoil
    first_ed_holofoil_market: firstEdHolo.market || null,
    first_ed_holofoil_low: firstEdHolo.low || null,
    first_ed_holofoil_high: firstEdHolo.high || null,
    first_ed_holofoil_mid: firstEdHolo.mid || null,
    first_ed_holofoil_direct_low: firstEdHolo.directLow || null,
    
    // 1st Edition Normal
    first_ed_normal_market: firstEdNormal.market || null,
    first_ed_normal_low: firstEdNormal.low || null,
    first_ed_normal_high: firstEdNormal.high || null,
    first_ed_normal_mid: firstEdNormal.mid || null,
    first_ed_normal_direct_low: firstEdNormal.directLow || null,
    
    // Unlimited
    unlimited_market: unlimited.market || null,
    unlimited_low: unlimited.low || null,
    unlimited_high: unlimited.high || null,
    unlimited_mid: unlimited.mid || null,
    unlimited_direct_low: unlimited.directLow || null,
    
    // Unlimited Holofoil
    unlimited_holofoil_market: unlimitedHolo.market || null,
    unlimited_holofoil_low: unlimitedHolo.low || null,
    unlimited_holofoil_high: unlimitedHolo.high || null,
    unlimited_holofoil_mid: unlimitedHolo.mid || null,
    unlimited_holofoil_direct_low: unlimitedHolo.directLow || null,
    
    last_updated: new Date().toISOString(),
    price_updated_at: new Date().toISOString()
  };
}

/**
 * Import all sets from GitHub
 */
async function importSets() {
  console.log('\n🎴 STEP 1: Importing Sets from GitHub...\n');
  
  try {
    // Fetch sets data from GitHub
    const githubSets = await fetchJSON(SETS_URL);
    console.log(`✅ Downloaded ${githubSets.length} sets from GitHub`);
    
    // Transform to database format
    const sets = githubSets.map(transformSet);
    
    // Batch upsert to Supabase (1000 at a time)
    const batchSize = 1000;
    let imported = 0;
    
    for (let i = 0; i < sets.length; i += batchSize) {
      const batch = sets.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('sets')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error importing sets batch ${i}-${i + batch.length}:`, error);
        throw error;
      }
      
      imported += batch.length;
      console.log(`  ✓ Imported ${imported}/${sets.length} sets`);
    }
    
    console.log(`\n✅ Successfully imported ${imported} sets!\n`);
    return sets.map(s => s.id);
    
  } catch (error) {
    console.error('❌ Failed to import sets:', error);
    throw error;
  }
}

/**
 * Import all cards for a specific set
 */
async function importSetCards(setId) {
  try {
    // Fetch cards for this set from GitHub
    const url = `${CARDS_BASE_URL}/${setId}.json`;
    const githubCards = await fetchJSON(url);
    
    // Transform cards to database format (pass setId since cards don't have it)
    const cards = githubCards.map(card => transformCard(card, setId));
    
    // Transform prices to database format
    const prices = githubCards
      .map(transformCardPrice)
      .filter(p => p !== null); // Only include cards with prices
    
    // Batch upsert cards to Supabase (500 at a time - cards are larger)
    const batchSize = 500;
    let imported = 0;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('cards')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`  ❌ Error importing cards batch for ${setId}:`, error);
        throw error;
      }
      
      imported += batch.length;
    }
    
    // Batch upsert prices to Supabase
    if (prices.length > 0) {
      for (let i = 0; i < prices.length; i += batchSize) {
        const batch = prices.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('prices')
          .upsert(batch, { onConflict: 'card_id' });
        
        if (error) {
          console.warn(`  ⚠️  Warning: Error importing prices for ${setId}:`, error.message);
          // Don't throw - prices are optional
        }
      }
    }
    
    return imported;
    
  } catch (error) {
    console.error(`  ❌ Failed to import cards for set ${setId}:`, error.message);
    throw error;
  }
}

/**
 * Import all cards from GitHub
 */
async function importCards(setIds) {
  console.log('🃏 STEP 2: Importing Cards from GitHub...\n');
  
  let totalCards = 0;
  let successfulSets = 0;
  let failedSets = [];
  
  for (let i = 0; i < setIds.length; i++) {
    const setId = setIds[i];
    
    try {
      console.log(`[${i + 1}/${setIds.length}] Importing cards for set: ${setId}`);
      
      const cardCount = await importSetCards(setId);
      totalCards += cardCount;
      successfulSets++;
      
      console.log(`  ✓ Imported ${cardCount} cards from ${setId}`);
      
      // Small delay to be respectful to GitHub
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      failedSets.push(setId);
      console.error(`  ❌ Failed to import ${setId}`);
    }
  }
  
  console.log(`\n✅ Card Import Complete!`);
  console.log(`   Total cards imported: ${totalCards}`);
  console.log(`   Successful sets: ${successfulSets}/${setIds.length}`);
  
  if (failedSets.length > 0) {
    console.log(`   Failed sets: ${failedSets.join(', ')}`);
  }
  
  return { totalCards, successfulSets, failedSets };
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Pokemon TCG Bulk Import from GitHub                  ║');
  console.log('║  Source: PokemonTCG/pokemon-tcg-data                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Import all sets
    const setIds = await importSets();
    
    // Step 2: Import all cards
    const { totalCards, successfulSets, failedSets } = await importCards(setIds);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🎉 IMPORT COMPLETE!                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`Total time: ${duration} seconds`);
    console.log(`Sets imported: ${successfulSets}`);
    console.log(`Cards imported: ${totalCards}`);
    
    if (failedSets.length > 0) {
      console.log(`\n⚠️  Some sets failed to import. You can retry them later.`);
      console.log(`Failed sets: ${failedSets.join(', ')}`);
    } else {
      console.log('\n✨ All data successfully imported!');
    }
    
    console.log('\n📝 Next steps:');
    console.log('   1. Your database now has all Pokemon TCG cards with static data');
    console.log('   2. Use the Pokemon API only for incremental price updates');
    console.log('   3. Cards are ready to browse in your app!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();
