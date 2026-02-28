/**
 * Quickly set subscription tier for testing.
 * Usage: node scripts/set-tier.js <lurker|sub|mod>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = 'shinypull@proton.me';
const tier = process.argv[2];

if (!['lurker', 'sub', 'mod'].includes(tier)) {
  console.error('Usage: node scripts/set-tier.js <lurker|sub|mod>');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('users')
  .update({ subscription_tier: tier, subscription_status: 'active' })
  .eq('email', EMAIL)
  .select('email, subscription_tier')
  .single();

if (error) {
  console.error('Error:', error.message);
} else {
  console.log(`✓ ${data.email} → ${data.subscription_tier}`);
}
