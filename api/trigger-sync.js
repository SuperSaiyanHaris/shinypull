// Vercel Serverless Function: Trigger Supabase Edge Function for data sync
// This allows manual triggering of the sync from your admin panel

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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    
    // Try both naming conventions (Vercel uses non-VITE, frontend uses VITE_)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        error: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured',
        hint: 'Add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel environment variables'
      });
    }

    if (!supabaseServiceKey) {
      return res.status(500).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables (Project Settings > Environment Variables)'
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

    // TODO: Add admin role check here when you implement user roles
    // For now, any authenticated user can trigger sync (you can add email whitelist)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);
    if (adminEmails.length > 0 && !adminEmails.includes(user.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        hint: 'Admin access required. Contact support if you need access.'
      });
    }

    console.log(`✅ Authenticated sync request from: ${user.email}`);

    // Get sync mode and parameters from query params or body
    const mode = req.query.mode || req.body?.mode || 'prices';
    const setId = req.query.setId || req.body?.setId;
    const limit = req.query.limit || req.body?.limit;

    // Build the Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/sync-pokemon-data`;

    // Prepare request body
    const requestBody = { mode };
    if (setId) requestBody.setId = setId;
    if (limit) requestBody.limit = parseInt(limit, 10);

    // Call the Edge Function with service role key for authentication
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error triggering sync:', error);
    return res.status(500).json({ error: error.message });
  }
}
