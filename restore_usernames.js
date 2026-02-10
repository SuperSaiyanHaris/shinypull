import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreUsernames() {
  console.log('🔧 Starting username restoration...\n');

  // Get all compromised creators (username = 'hacked')
  const { data: compromised, error } = await supabase
    .from('creators')
    .select('id, platform_id, display_name, platform')
    .eq('username', 'hacked');

  if (error) {
    console.error('Error fetching compromised creators:', error);
    return;
  }

  console.log(`Found ${compromised.length} compromised creators\n`);

  let restored = 0;
  let failed = 0;

  for (const creator of compromised) {
    // Generate username from display_name
    let username = creator.display_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special chars
      .substring(0, 50); // Limit length

    // If username is empty, use platform_id
    if (!username) {
      username = creator.platform_id.substring(0, 24);
    }

    // Update the creator
    const { error: updateError } = await supabase
      .from('creators')
      .update({ username })
      .eq('id', creator.id);

    if (updateError) {
      console.log(`❌ Failed: ${creator.display_name} - ${updateError.message}`);
      failed++;
    } else {
      console.log(`✅ Restored: ${creator.display_name} → @${username}`);
      restored++;
    }

    // Rate limit to avoid overwhelming database
    if (restored % 100 === 0) {
      console.log(`\n--- Progress: ${restored}/${compromised.length} ---\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Restored: ${restored}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));
}

restoreUsernames().catch(console.error);
