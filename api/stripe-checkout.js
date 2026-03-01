/**
 * Create a Stripe Checkout session, or activate a Mod free featured listing.
 *
 * POST /api/stripe-checkout
 * Headers: Authorization: Bearer <supabase-jwt>
 *
 * Plan upgrade:
 *   Body: { priceKey: 'sub' | 'mod', returnUrl: string }
 *
 * Featured listing ($49/mo):
 *   Body: { priceKey: 'featured', creatorId: string, platform: string, returnUrl: string }
 *   Webhook creates+activates the row after payment — no pre-created rows.
 *
 * Mod free featured listing (1/month perk, no Stripe payment):
 *   Body: { priceKey: 'featured-free', creatorId: string, platform: string }
 *   Server verifies Mod tier and monthly usage, then inserts active row directly.
 *   Returns { success: true } — no Stripe redirect.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

const PRICE_IDS = {
  sub: process.env.STRIPE_SUB_PRICE_ID,
  mod: process.env.STRIPE_MOD_PRICE_ID,
  featured: process.env.STRIPE_FEATURED_BASIC_PRICE_ID,
};

const VALID_PLATFORMS = new Set(['youtube', 'tiktok', 'twitch', 'kick', 'bluesky']);
const ALLOWED_ORIGINS = new Set(['https://shinypull.com', 'http://localhost:3000']);

function isSafeReturnUrl(url, origin) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    // Must be same host as our site or the request origin
    return parsed.origin === 'https://shinypull.com' || parsed.origin === origin;
  } catch {
    return false; // relative URLs are fine; malformed URLs are rejected
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 10 checkout attempts per IP per minute
  const clientId = getClientIdentifier(req);
  const rateCheck = checkRateLimit(`checkout:${clientId}`, 10, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
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

    const { priceKey, returnUrl, creatorId, platform, listingId } = req.body;
    if (!priceKey || (!PRICE_IDS[priceKey] && priceKey !== 'featured-free' && priceKey !== 'cancel-listing')) {
      return res.status(400).json({ error: 'Invalid price key' });
    }

    // Cancel a featured listing — works for both mod-free (direct DB) and paid (Stripe cancel)
    if (priceKey === 'cancel-listing') {
      if (!listingId) return res.status(400).json({ error: 'Missing listingId' });

      const { data: listing } = await supabase
        .from('featured_listings')
        .select('id, stripe_subscription_id, status, purchased_by_user_id')
        .eq('id', listingId)
        .eq('purchased_by_user_id', user.id)
        .maybeSingle();

      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.status !== 'active') return res.status(400).json({ error: 'Listing is not active' });

      if (listing.stripe_subscription_id) {
        // Paid listing — cancel Stripe subscription; webhook will set status to 'canceled'
        await stripe.subscriptions.cancel(listing.stripe_subscription_id);
      } else {
        // Mod free — no Stripe, update DB directly via service role
        const { error: updateError } = await supabase
          .from('featured_listings')
          .update({ status: 'canceled' })
          .eq('id', listingId);
        if (updateError) throw updateError;
      }

      return res.status(200).json({ success: true });
    }

    // Validate returnUrl to prevent open redirects
    const origin = req.headers.origin || 'https://shinypull.com';
    if (returnUrl && !isSafeReturnUrl(returnUrl, origin)) {
      return res.status(400).json({ error: 'Invalid return URL' });
    }

    // Validate platform is one of our supported values (when provided)
    if (platform && !VALID_PLATFORMS.has(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Mod free featured listing — no Stripe payment, server-side only
    if (priceKey === 'featured-free') {
      if (!creatorId || !platform) {
        return res.status(400).json({ error: 'Missing creatorId or platform' });
      }

      // Verify user is on Mod tier
      const { data: userRecord } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();
      if (userRecord?.subscription_tier !== 'mod') {
        return res.status(403).json({ error: 'Mod plan required for free featured listing' });
      }

      // Verify not already used this calendar month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('featured_listings')
        .select('id', { count: 'exact', head: true })
        .eq('purchased_by_user_id', user.id)
        .eq('is_mod_free', true)
        .gte('created_at', startOfMonth.toISOString());
      if (count > 0) {
        return res.status(400).json({ error: 'Free listing already used this month' });
      }

      // Validate creator exists
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('id', creatorId)
        .eq('platform', platform)
        .maybeSingle();
      if (!creator) return res.status(400).json({ error: 'Creator not found' });

      const activeFrom = new Date();
      const activeUntil = new Date(activeFrom);
      activeUntil.setDate(activeUntil.getDate() + 30);

      const { error: insertError } = await supabase
        .from('featured_listings')
        .insert({
          creator_id: creatorId,
          platform,
          placement_tier: 'basic',
          status: 'active',
          purchased_by_user_id: user.id,
          active_from: activeFrom.toISOString(),
          active_until: activeUntil.toISOString(),
          is_mod_free: true,
        });
      if (insertError) throw insertError;

      return res.status(200).json({ success: true });
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
