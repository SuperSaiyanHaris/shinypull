// Vercel Serverless Function for Blog Admin Operations
// Requires JWT authentication + admin email verification

import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  if (!ADMIN_EMAILS.includes(user.email.trim().toLowerCase())) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { user, supabase };
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: 30 requests per minute
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, 30, 60000);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Verify admin
  const auth = await verifyAdmin(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { supabase } = auth;
  const { action, id, data: postData } = req.body;

  try {
    switch (action) {
      case 'create': {
        if (!postData) return res.status(400).json({ error: 'Missing post data' });
        const safePost = {
          slug: postData.slug,
          title: postData.title,
          description: postData.description,
          content: postData.content,
          category: postData.category,
          author: postData.author,
          image: postData.image,
          read_time: postData.read_time,
          is_published: postData.is_published ?? false,
        };
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(safePost)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json({ data });
      }

      case 'update': {
        if (!id || !postData) return res.status(400).json({ error: 'Missing id or post data' });
        const safeUpdate = {};
        const allowedFields = ['slug', 'title', 'description', 'content', 'category', 'author', 'image', 'read_time', 'is_published'];
        for (const key of allowedFields) {
          if (postData[key] !== undefined) safeUpdate[key] = postData[key];
        }
        safeUpdate.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('blog_posts')
          .update(safeUpdate)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json({ data });
      }

      case 'delete': {
        if (!id) return res.status(400).json({ error: 'Missing id' });
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'togglePublish': {
        if (!id || postData?.is_published === undefined) {
          return res.status(400).json({ error: 'Missing id or is_published' });
        }
        const { data, error } = await supabase
          .from('blog_posts')
          .update({ is_published: postData.is_published })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json({ data });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Blog admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
