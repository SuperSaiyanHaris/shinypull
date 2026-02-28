/**
 * Create a Stripe Customer Portal session.
 *
 * POST /api/stripe-portal
 * Body: { returnUrl?: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Authenticate user from Bearer token
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseAuth = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Look up stripe_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const { returnUrl } = req.body;
    const origin = req.headers.origin || 'https://shinypull.com';

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: returnUrl || `${origin}/account`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create portal session' });
  }
}
