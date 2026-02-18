/**
 * API endpoint to request a creator to be added to our database
 * Creates a pending request that will be processed by background jobs
 */

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: max 5 requests per minute per IP
  const clientIP = getClientIdentifier(req);
  const rateCheck = checkRateLimit(`creator-req:${clientIP}`, 5, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const { platform, username } = req.body;
    // userId intentionally not accepted from client — prevents spoofing

    // Validate required fields
    if (!platform || !username) {
      return res.status(400).json({ error: 'Platform and username are required' });
    }

    // Validate platform
    const validPlatforms = ['tiktok', 'youtube', 'twitch', 'kick'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Normalize username: strip @, remove spaces/special chars, lowercase
    const normalized = username
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9._]/g, '')
      .replace(/^\.+|\.+$/g, '')
      .toLowerCase()
      .slice(0, 30);

    // Validate normalized username format
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    if (!normalized || !usernameRegex.test(normalized)) {
      return res.status(400).json({
        error: 'Invalid username format. Only letters, numbers, dots, and underscores allowed.'
      });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if creator already exists
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id, username')
      .eq('platform', platform)
      .ilike('username', normalized)
      .single();

    if (existingCreator) {
      return res.status(200).json({
        exists: true,
        message: 'This creator is already in our database!',
        username: existingCreator.username
      });
    }

    // Check if there's already a pending request for this creator
    const { data: existingRequest } = await supabase
      .from('creator_requests')
      .select('id, username, status, created_at')
      .eq('platform', platform)
      .ilike('username', normalized)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      const hoursAgo = Math.floor(
        (Date.now() - new Date(existingRequest.created_at).getTime()) / (1000 * 60 * 60)
      );
      return res.status(200).json({
        exists: true,
        message: `This creator was already requested ${hoursAgo} hours ago and is being processed.`,
        username: existingRequest.username
      });
    }

    // Cap total pending requests to prevent table flooding
    const { count: pendingCount } = await supabase
      .from('creator_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingCount >= 100) {
      return res.status(429).json({
        error: 'We have a lot of requests in the queue right now. Please try again later.'
      });
    }

    // Create new request
    const { data: newRequest, error: insertError } = await supabase
      .from('creator_requests')
      .insert({
        platform,
        username: normalized,
        user_id: null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create creator request:', insertError);
      return res.status(500).json({ error: 'Failed to create request' });
    }

    return res.status(200).json({
      success: true,
      message: `Request submitted! We'll add @${normalized} within 24 hours.`,
      username: newRequest.username
    });

  } catch (error) {
    console.error('Request creator API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
