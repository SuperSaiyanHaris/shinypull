/**
 * Create a Stripe Checkout session for a featured listing subscription.
 *
 * POST /api/stripe-featured-checkout
 * Body: { creatorId, platform, returnUrl }
 * Headers: Authorization: Bearer <supabase-jwt>
 *
 * Flow:
 * 1. Validate creator exists in DB
 * 2. Pre-create a pending featured_listings row
 * 3. Create/get Stripe customer
 * 4. Create Checkout session with metadata: { listingId, supabase_user_id }
 * 5. Return { url } — client redirects to Stripe
 *
 * On success, Stripe fires checkout.session.completed → stripe-webhook.js activates the listing.
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
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const supabaseAuth = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { creatorId, platform, returnUrl } = req.body;
    if (!creatorId || !platform) {
      return res.status(400).json({ error: 'Missing creatorId or platform' });
    }

    if (!process.env.STRIPE_FEATURED_BASIC_PRICE_ID) {
      return res.status(500).json({ error: 'Featured listing price not configured' });
    }

    // Validate creator exists
    const { data: creator } = await supabase
      .from('creators')
      .select('id, platform, username')
      .eq('id', creatorId)
      .eq('platform', platform)
      .maybeSingle();

    if (!creator) {
      return res.status(400).json({ error: 'Creator not found' });
    }

    // Pre-create pending listing row — activated by webhook on payment success
    const activeFrom = new Date();
    const activeUntil = new Date(activeFrom);
    activeUntil.setDate(activeUntil.getDate() + 30);

    const { data: listing, error: listingError } = await supabase
      .from('featured_listings')
      .insert({
        creator_id: creatorId,
        platform,
        placement_tier: 'basic',
        status: 'pending',
        purchased_by_user_id: user.id,
        active_from: activeFrom.toISOString(),
        active_until: activeUntil.toISOString(),
        is_mod_free: false,
      })
      .select('id')
      .single();

    if (listingError) throw listingError;

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
    const successUrl = (returnUrl || `${origin}/account`) + '?featured=success';

    // Create Checkout session — metadata carries the listingId for webhook activation
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_FEATURED_BASIC_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: `${origin}/account`,
      allow_promotion_codes: true,
      metadata: {
        listingId: listing.id,
        supabase_user_id: user.id,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Featured listing checkout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}
