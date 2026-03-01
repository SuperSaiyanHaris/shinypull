/**
 * Create a Stripe Checkout session.
 *
 * POST /api/stripe-checkout
 * Headers: Authorization: Bearer <supabase-jwt>
 *
 * Plan upgrade:
 *   Body: { priceKey: 'sub' | 'mod', returnUrl: string }
 *
 * Featured listing ($49/mo):
 *   Body: { priceKey: 'featured', creatorId: string, platform: string, returnUrl: string }
 *   Pre-creates a pending featured_listings row; webhook activates it on payment success.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const PRICE_IDS = {
  sub: process.env.STRIPE_SUB_PRICE_ID,
  mod: process.env.STRIPE_MOD_PRICE_ID,
  featured: process.env.STRIPE_FEATURED_BASIC_PRICE_ID,
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
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const supabaseAuth = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { priceKey, returnUrl, creatorId, platform } = req.body;
    if (!priceKey || !PRICE_IDS[priceKey]) {
      return res.status(400).json({ error: 'Invalid price key' });
    }

    // Get or create Stripe customer
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
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const origin = req.headers.origin || 'https://shinypull.com';
    let sessionMetadata = { supabase_user_id: user.id };
    let successUrl = (returnUrl || `${origin}/account`) + '?upgrade=success';
    let cancelUrl = `${origin}/pricing`;

    // Featured listing: validate creator then pass IDs in metadata.
    // The webhook creates+activates the row only after payment succeeds —
    // no DB row is created here so abandoned checkouts leave no orphan records.
    if (priceKey === 'featured') {
      if (!creatorId || !platform) {
        return res.status(400).json({ error: 'Missing creatorId or platform for featured listing' });
      }

      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('id', creatorId)
        .eq('platform', platform)
        .maybeSingle();
      if (!creator) return res.status(400).json({ error: 'Creator not found' });

      sessionMetadata.featuredCreatorId = creatorId;
      sessionMetadata.featuredPlatform = platform;
      successUrl = (returnUrl || `${origin}/account`) + '?featured=success';
      cancelUrl = `${origin}/account`;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[priceKey], quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: sessionMetadata,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}
