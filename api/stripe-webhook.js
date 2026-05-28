/**
 * Stripe webhook handler — manages Featured Listings activations/cancellations.
 *
 * Subscription tiers (Lurker/Sub/Mod) were deprecated. Featured Listings is the only paid product.
 *
 * Configured at: https://dashboard.stripe.com/webhooks
 * Endpoint: https://shinypull.com/api/stripe-webhook
 * Events to enable:
 *   - checkout.session.completed      (activates featured listings)
 *   - customer.subscription.deleted   (cancels featured listings)
 *   - invoice.payment_failed          (cancels listing on failed renewal)
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

const FEATURED_PRICE_IDS = new Set([
  process.env.STRIPE_FEATURED_BASIC_PRICE_ID,
  process.env.STRIPE_FEATURED_PREMIUM_PRICE_ID,
].filter(Boolean));

function isFeaturedSubscription(subscription) {
  return subscription.items.data.some(item => FEATURED_PRICE_IDS.has(item.price.id));
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
        if (!creatorId || !platform || !userId) break;

        // Idempotency guard: Stripe retries events on 5xx
        if (session.subscription) {
          const { count: existing } = await supabase
            .from('featured_listings')
            .select('id', { count: 'exact', head: true })
            .eq('stripe_subscription_id', session.subscription);
          if (existing > 0) {
            console.log(`Skipping duplicate checkout.session.completed for subscription ${session.subscription}`);
            break;
          }
        }

        const rawTier = session.metadata?.featuredPlacementTier;
        const placementTier = (rawTier === 'basic' || rawTier === 'premium') ? rawTier : 'basic';
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

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        if (!isFeaturedSubscription(subscription)) break;

        await supabase
          .from('featured_listings')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        console.log(`Canceled featured listing for subscription ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const failedSubscriptionId = invoice.subscription;
        if (!failedSubscriptionId) break;

        // If the failed invoice belongs to a featured listing subscription, cancel the listing
        const { count: featuredCount } = await supabase
          .from('featured_listings')
          .select('id', { count: 'exact', head: true })
          .eq('stripe_subscription_id', failedSubscriptionId)
          .eq('status', 'active');
        if (featuredCount > 0) {
          await supabase
            .from('featured_listings')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', failedSubscriptionId);
          console.log(`Canceled featured listing for failed payment on subscription ${failedSubscriptionId}`);
        }
        break;
      }

      default:
        // Ignore other events (Lurker/Sub/Mod tier events no longer processed)
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
