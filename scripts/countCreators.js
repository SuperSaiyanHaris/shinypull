import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function countCreators() {
  // Count YouTube creators
  const { count: youtubeCount, error: youtubeError } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube');

  if (youtubeError) {
    console.error('Error counting YouTube creators:', youtubeError);
    return;
  }

  // Count all platforms
  const { count: twitchCount } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'twitch');

  const { count: kickCount } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'kick');

  const { count: totalCount } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Creator Counts:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`YouTube:  ${youtubeCount}`);
  console.log(`Twitch:   ${twitchCount}`);
  console.log(`Kick:     ${kickCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total:    ${totalCount}\n`);
}

countCreators();
