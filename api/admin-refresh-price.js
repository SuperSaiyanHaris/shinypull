// Vercel Serverless Function: Admin Price Refresh
// Allows admins to force refresh prices for a card, bypassing cache

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Restrict CORS to your domains only
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'https://shinypull.vercel.app',
    // Allow localhost for development
    ...(process.env.NODE_ENV === 'development' || req.headers.host?.includes('localhost') ? 
      ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'] : [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // AUTHENTICATION CHECK - Verify user is authenticated and is admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        hint: 'Authentication token required. Please sign in.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured'
      });
    }

    if (!supabaseServiceKey) {
      return res.status(500).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured'
      });
    }

    // Verify the user's authentication token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        hint: 'Please sign in again'
      });
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'haris.lilic@gmail.com,shinypull@proton.me').split(',').map(e => e.trim()).filter(e => e);
    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        hint: 'Admin access required.'
      });
    }

    console.log(`✅ Admin price refresh request from: ${user.email}`);

    // Get card ID from request body
    const { cardId } = req.body;
    
    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    // Use service role to query database (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get card details from database to fetch eBay prices
    const { data: card, error: cardError } = await supabaseService
      .from('cards')
      .select('name, sets!inner(name)')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Fetch fresh prices from eBay API using the WORKING ebay-prices endpoint
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    
    const params = new URLSearchParams({
      cardName: card.name,
      setName: card.sets.name
    });
    
    const ebayUrl = `${protocol}://${host}/api/ebay-prices?${params}`;
    console.log(`📡 Fetching eBay prices from: ${ebayUrl}`);
    
    const ebayResponse = await fetch(ebayUrl);
    
    if (!ebayResponse.ok) {
      return res.status(500).json({ 
        error: 'Failed to fetch prices from eBay API',
        details: await ebayResponse.text()
      });
    }

    const ebayData = await ebayResponse.json();
    
    if (!ebayData.found) {
      return res.status(500).json({ 
        error: 'No eBay listings found for this card'
      });
    }

    const prices = {
      market: ebayData.median || ebayData.avg,
      low: ebayData.low,
      high: ebayData.high,
      average: ebayData.avg,
      updatedAt: new Date().toISOString()
    };

    // Update database with eBay prices
    const dbUpdate = {
      card_id: cardId,
      tcgplayer_market: prices.market,
      tcgplayer_low: prices.low,
      tcgplayer_high: prices.high,
      normal_market: prices.market,
      normal_low: prices.low,
      normal_high: prices.high,
      normal_mid: prices.average,
      last_updated: new Date().toISOString(),
      tcgplayer_updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseService
      .from('prices')
      .upsert(dbUpdate, { onConflict: 'card_id' });

    if (updateError) {
      console.error('Error updating price:', updateError);
      return res.status(500).json({
        error: 'Failed to update price in database',
        details: updateError.message
      });
    }

    console.log(`✅ Admin refreshed prices for card ${cardId}`);

    return res.status(200).json({
      success: true,
      prices: {
        market: prices.market,
        low: prices.low,
        high: prices.high,
        average: prices.average,
        lastUpdated: new Date().toISOString(),
        cached: false,
        source: 'ebay'
      }
    });

  } catch (error) {
    console.error('Error in admin price refresh:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
