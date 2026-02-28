/**
 * Stripe webhook handler — updates subscription tier in Supabase.
 *
 * Configured at: https://dashboard.stripe.com/webhooks
 * Endpoint: https://shinypull.com/api/stripe-webhook
 * Events to enable:
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

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
