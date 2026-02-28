/**
 * Create a Stripe Checkout session for a subscription upgrade.
 *
 * POST /api/stripe-checkout
 * Body: { priceKey: 'sub' | 'mod', returnUrl: string }
 * Headers: Authorization: Bearer <supabase-jwt>
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const PRICE_IDS = {
  sub: process.env.STRIPE_SUB_PRICE_ID,
  mod: process.env.STRIPE_MOD_PRICE_ID,
};

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

    // Verify token and get user
    const supabaseAuth = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { priceKey, returnUrl } = req.body;
    if (!priceKey || !PRICE_IDS[priceKey]) {
      return res.status(400).json({ error: 'Invalid price key' });
    }

    // Get or create stripe_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email, display_name')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        name: userData?.display_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[priceKey], quantity: 1 }],
      success_url: (returnUrl || `${req.headers.origin || 'https://shinypull.com'}/account`) + '?upgrade=success',
      cancel_url: `${req.headers.origin || 'https://shinypull.com'}/pricing`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}
