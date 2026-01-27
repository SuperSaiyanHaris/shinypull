/**
 * Incremental Price Update API
 * 
 * Updates prices for a small batch of cards at a time using eBay market data.
 * Can be called repeatedly to gradually update all prices.
 * Stays well within Vercel's 10 second timeout.
 * 
 * Query params:
 *   - limit: Number of cards to update (default 5, max 10)
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

    // Parse query params (reduced limits since eBay calls are slower)
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const setId = req.query.setId;

    // Get cards that need price updates (oldest first from prices table)
    // Join with cards to get card names and set info
    let query = supabase
      .from('prices')
      .select('card_id, last_updated, cards!inner(name, set_id, sets!inner(name))')
      .order('last_updated', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (setId) {
      query = query.eq('cards.set_id', setId);
    }

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

    console.log(`Updating prices for ${priceRecords.length} cards using eBay...`);

    // Update each card's price from eBay using the WORKING ebay-prices endpoint
    const priceUpdates = [];
    const errors = [];

    for (const priceRecord of priceRecords) {
      try {
        const card = priceRecord.cards;
        const setName = card.sets?.name || '';
        
        console.log(`Fetching eBay price for: ${card.name} (${setName})`);
        
        // Call the working ebay-prices endpoint
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        
        const params = new URLSearchParams({
          cardName: card.name,
          setName: setName
        });
        
        const ebayUrl = `${protocol}://${host}/api/ebay-prices?${params}`;
        const ebayResponse = await fetch(ebayUrl);
        
        if (!ebayResponse.ok) {
          console.log(`  eBay API error for ${card.name}`);
          continue;
        }
        
        const ebayData = await ebayResponse.json();
        
        if (!ebayData.found) {
          console.log(`  No eBay prices found for ${card.name}`);
          continue;
        }
        
        const marketPrice = ebayData.median || ebayData.avg;
        console.log(`  Found: $${marketPrice} (${ebayData.count} listings)`);

        // Update prices table with eBay data
        priceUpdates.push({
          card_id: priceRecord.card_id,
          
          // Use eBay prices for main fields
          tcgplayer_market: marketPrice,
          tcgplayer_low: ebayData.low,
          tcgplayer_high: ebayData.high,
          
          // Store eBay data in normal variant (most common)
          normal_market: marketPrice,
          normal_low: ebayData.low,
          normal_high: ebayData.high,
          normal_mid: ebayData.avg,
          
          last_updated: new Date().toISOString(),
          tcgplayer_updated_at: new Date().toISOString()
        });

        // Small delay between eBay requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

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
