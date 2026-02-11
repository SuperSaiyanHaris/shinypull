// Emergency restoration script - run immediately
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function emergencyRestore() {
  console.log('🚨 EMERGENCY RESTORATION STARTING...\n');

  const { data: compromised, count } = await supabase
    .from('creators')
    .select('id, platform_id, display_name, platform', { count: 'exact' })
    .eq('username', 'hacked');

  console.log(`Found ${count} hacked usernames\n`);

  let restored = 0;
  let failed = 0;

  for (const creator of compromised) {
    let username = creator.display_name
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    if (!username) {
      username = creator.platform_id.substring(0, 24);
    }

    const { error } = await supabase
      .from('creators')
      .update({ username })
      .eq('id', creator.id);

    if (error) {
      console.log(`❌ Failed: ${creator.display_name}`);
      failed++;
    } else {
      restored++;
      if (restored % 100 === 0) {
        console.log(`Progress: ${restored}/${count}`);
      }
    }
  }

  console.log(`\n✅ Restored: ${restored}`);
  console.log(`❌ Failed: ${failed}`);

  // Verify
  const { count: remaining } = await supabase
    .from('creators')
    .select('id', { count: 'exact', head: true })
    .eq('username', 'hacked');

  console.log(`\n⚠️  Remaining hacked: ${remaining || 0}`);

  if (remaining === 0) {
    console.log('\n🎉 ALL USERNAMES RESTORED!');
  }
}

emergencyRestore().catch(console.error);
