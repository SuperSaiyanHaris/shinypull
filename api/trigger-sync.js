// Vercel Serverless Function: Trigger Supabase Edge Function for data sync
// This allows manual triggering of the sync from your admin panel

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({ error: 'SUPABASE_URL not configured' });
    }

    // Get sync mode from query params or body
    const mode = req.query.mode || req.body?.mode || 'prices';
    const setId = req.query.setId || req.body?.setId;

    // Build the Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/sync-pokemon-data`;

    // Call the Edge Function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ mode, setId }),
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
