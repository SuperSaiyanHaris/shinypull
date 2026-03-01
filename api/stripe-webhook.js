/**
 * Stripe webhook handler — updates subscription tier in Supabase
 * and manages featured listing activations.
 *
 * Configured at: https://dashboard.stripe.com/webhooks
 * Endpoint: https://shinypull.com/api/stripe-webhook
 * Events to enable:
 *   - checkout.session.completed      (activates featured listings)
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted   (also cancels featured listings)
 *   - invoice.payment_failed
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Disable body parser so we can verify Stripe signature against raw body
export const config = { api: { bodyParser: false } };

const PRICE_TIER_MAP = {
  [process.env.STRIPE_SUB_PRICE_ID]: 'sub',
  [process.env.STRIPE_MOD_PRICE_ID]: 'mod',
};

const FEATURED_PRICE_IDS = new Set([
  process.env.STRIPE_FEATURED_BASIC_PRICE_ID,
  process.env.STRIPE_FEATURED_PREMIUM_PRICE_ID,
].filter(Boolean));

function isFeaturedSubscription(subscription) {
  return subscription.items.data.some(item => FEATURED_PRICE_IDS.has(item.price.id));
}

function getTierFromSubscription(subscription) {
  for (const item of subscription.items.data) {
    const tier = PRICE_TIER_MAP[item.price.id];
    if (tier) return tier;
  }
  return 'lurker';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let event;

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      // Featured listing: create and activate the row only after payment succeeds.
      // Creator info is passed via checkout session metadata — no pre-created pending rows.
      case 'checkout.session.completed': {
        const session = event.data.object;
        const creatorId = session.metadata?.featuredCreatorId;
        const platform = session.metadata?.featuredPlatform;
        const userId = session.metadata?.supabase_user_id;
        if (!creatorId || !platform || !userId) break; // not a featured listing checkout

        const placementTier = session.metadata?.featuredPlacementTier || 'basic';
        const activeFrom = new Date();
        const activeUntil = new Date(activeFrom);
        activeUntil.setDate(activeUntil.getDate() + 30);

        const { data: listing } = await supabase
          .from('featured_listings')
          .insert({
            creator_id: creatorId,
            platform,
            placement_tier: placementTier,
            status: 'active',
            purchased_by_user_id: userId,
            active_from: activeFrom.toISOString(),
            active_until: activeUntil.toISOString(),
            stripe_payment_id: session.payment_intent || null,
            stripe_subscription_id: session.subscription || null,
            is_mod_free: false,
          })
          .select('id')
          .single();

        console.log(`Created and activated featured listing ${listing?.id} for user ${userId}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Featured listing subscriptions are handled via checkout.session.completed.
        // Skip tier updates for featured listing price IDs.
        if (isFeaturedSubscription(subscription)) break;

        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!user) {
          console.warn('No user found for Stripe customer:', customerId);
          break;
        }

        const tier = getTierFromSubscription(subscription);
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'canceled'
          : subscription.status;

        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', user.id);

        console.log(`Updated user ${user.id} to tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // If this is a featured listing subscription, cancel the listing
        if (isFeaturedSubscription(subscription)) {
          await supabase
            .from('featured_listings')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', subscription.id);
          console.log(`Canceled featured listing for subscription ${subscription.id}`);
          break;
        }

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!user) break;

        await supabase
          .from('users')
          .update({
            subscription_tier: 'lurker',
            subscription_status: 'active',
            stripe_subscription_id: null,
          })
          .eq('id', user.id);

        // Cancel any active mod-free featured listings — perk no longer valid
        await supabase
          .from('featured_listings')
          .update({ status: 'canceled' })
          .eq('purchased_by_user_id', user.id)
          .eq('is_mod_free', true)
          .eq('status', 'active');

        console.log(`Reverted user ${user.id} to Lurker (subscription canceled)`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!user) break;

        await supabase
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', user.id);

        console.log(`Marked user ${user.id} as past_due`);
        break;
      }

      default:
        // Ignore other events
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
