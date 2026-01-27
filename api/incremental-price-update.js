/**
 * Incremental Price Update API
 * 
 * Updates prices for a small batch of cards at a time.
 * Can be called repeatedly to gradually update all prices.
 * Stays well within Vercel's 10 second timeout.
 * 
 * Query params:
 *   - limit: Number of cards to update (default 20, max 50)
 *   - setId: Optional - only update cards from this set
 */

import { createClient } from '@supabase/supabase-js';

// Vercel timeout: 10 seconds on hobby, 60 on pro
export const config = {
  maxDuration: 10
};

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'https://shinypull.vercel.app',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Parse query params
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const setId = req.query.setId;

    // Get cards that need price updates (oldest first from prices table)
    // Join with cards to get card IDs that exist
    let query = supabase
      .from('prices')
      .select('card_id, last_updated')
      .order('last_updated', { ascending: true, nullsFirst: true })
      .limit(limit);

    const { data: priceRecords, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!priceRecords || priceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No prices need updating',
        updated: 0
      });
    }

    console.log(`Updating prices for ${priceRecords.length} cards...`);

    // Get Pokemon API key
    const apiKey = process.env.POKEMON_API_KEY || process.env.VITE_POKEMON_API_KEY;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    // Update each card's price
    const priceUpdates = [];
    const errors = [];

    for (const priceRecord of priceRecords) {
      try {
        const response = await fetch(
          `https://api.pokemontcg.io/v2/cards/${priceRecord.card_id}`,
          { headers, signal: AbortSignal.timeout(3000) }
        );

        // Skip 404s - card doesn't exist in API (old/removed cards)
        if (response.status === 404) {
          console.log(`Card ${priceRecord.card_id} not found in API (likely removed/old card)`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const apiCard = data.data;
        const prices = apiCard.tcgplayer?.prices || {};

        // Skip if no prices available
        if (!prices || Object.keys(prices).length === 0) {
          console.log(`No prices available for ${priceRecord.card_id}`);
          continue;
        }

        const normal = prices.normal || {};
        const holofoil = prices.holofoil || {};
        const reverseHolofoil = prices.reverseHolofoil || {};
        const firstEdHolo = prices['1stEditionHolofoil'] || {};
        const firstEdNormal = prices['1stEditionNormal'] || {};
        const unlimited = prices.unlimited || {};
        const unlimitedHolo = prices.unlimitedHolofoil || {};

        priceUpdates.push({
          card_id: priceRecord.card_id,
          
          // Legacy columns (best available)
          tcgplayer_market: holofoil.market || reverseHolofoil.market || normal.market || unlimited.market || firstEdHolo.market || null,
          tcgplayer_low: holofoil.low || reverseHolofoil.low || normal.low || null,
          tcgplayer_high: holofoil.high || reverseHolofoil.high || normal.high || null,
          
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
          tcgplayer_updated_at: new Date().toISOString()
        });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to update ${priceRecord.card_id}:`, error.message);
        errors.push({ card_id: priceRecord.card_id, error: error.message });
      }
    }

    // Batch update Supabase prices table
    if (priceUpdates.length > 0) {
      const { error: updateError } = await supabase
        .from('prices')
        .upsert(priceUpdates, { onConflict: 'card_id' });

      if (updateError) {
        throw updateError;
      }
    }

    return res.status(200).json({
      success: true,
      updated: priceUpdates.length,
      failed: errors.length,
      total: priceRecords.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Price update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
