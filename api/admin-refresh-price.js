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

    // Fetch fresh prices from Pokemon TCG API via our tcg-prices endpoint
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiUrl = `${protocol}://${host}/api/tcg-prices?cardId=${cardId}`;
    
    console.log(`📡 Fetching prices from: ${apiUrl}`);
    
    const tcgResponse = await fetch(apiUrl);
    
    if (!tcgResponse.ok) {
      return res.status(500).json({ 
        error: 'Failed to fetch prices from TCG API',
        details: await tcgResponse.text()
      });
    }

    const tcgData = await tcgResponse.json();
    
    if (!tcgData.success || !tcgData.prices) {
      return res.status(500).json({ 
        error: 'No price data returned from TCG API' 
      });
    }

    const { prices } = tcgData;

    // Use service role to update the database (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Build the update object with all available variants
    const dbUpdate = {
      card_id: cardId,
      tcgplayer_market: prices.market,
      tcgplayer_low: prices.low,
      tcgplayer_high: prices.high,
      last_updated: new Date().toISOString()
    };

    // Add variant prices if available
    if (prices.normal) {
      dbUpdate.normal_market = prices.normal.market;
      dbUpdate.normal_low = prices.normal.low;
      dbUpdate.normal_high = prices.normal.high;
    }
    if (prices.holofoil) {
      dbUpdate.holofoil_market = prices.holofoil.market;
      dbUpdate.holofoil_low = prices.holofoil.low;
      dbUpdate.holofoil_high = prices.holofoil.high;
    }
    if (prices.reverseHolofoil) {
      dbUpdate.reverse_holofoil_market = prices.reverseHolofoil.market;
      dbUpdate.reverse_holofoil_low = prices.reverseHolofoil.low;
      dbUpdate.reverse_holofoil_high = prices.reverseHolofoil.high;
    }
    if (prices.firstEditionHolofoil) {
      dbUpdate.first_ed_holofoil_market = prices.firstEditionHolofoil.market;
      dbUpdate.first_ed_holofoil_low = prices.firstEditionHolofoil.low;
      dbUpdate.first_ed_holofoil_high = prices.firstEditionHolofoil.high;
    }
    if (prices.firstEditionNormal) {
      dbUpdate.first_ed_normal_market = prices.firstEditionNormal.market;
      dbUpdate.first_ed_normal_low = prices.firstEditionNormal.low;
      dbUpdate.first_ed_normal_high = prices.firstEditionNormal.high;
    }
    if (prices.unlimited) {
      dbUpdate.unlimited_market = prices.unlimited.market;
      dbUpdate.unlimited_low = prices.unlimited.low;
      dbUpdate.unlimited_high = prices.unlimited.high;
    }
    if (prices.unlimitedHolofoil) {
      dbUpdate.unlimited_holofoil_market = prices.unlimitedHolofoil.market;
      dbUpdate.unlimited_holofoil_low = prices.unlimitedHolofoil.low;
      dbUpdate.unlimited_holofoil_high = prices.unlimitedHolofoil.high;
    }

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
        normal: prices.normal,
        holofoil: prices.holofoil,
        reverseHolofoil: prices.reverseHolofoil,
        firstEditionHolofoil: prices.firstEditionHolofoil,
        firstEditionNormal: prices.firstEditionNormal,
        unlimited: prices.unlimited,
        unlimitedHolofoil: prices.unlimitedHolofoil,
        lastUpdated: new Date().toISOString(),
        cached: false
      }
    });

  } catch (error) {
    console.error('Error in admin price refresh:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
