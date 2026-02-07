import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkGrowth() {
  // Get one YouTube creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id, username')
    .eq('platform', 'youtube')
    .limit(1)
    .single();

  console.log('Checking creator:', creator.username);

  // Get their stats history
  const { data: stats } = await supabase
    .from('creator_stats')
    .select('recorded_at, total_views, views_gained_month')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false })
    .limit(10);

  console.log('\nStats history:');
  stats.forEach(s => {
    console.log(`  ${s.recorded_at}: Views: ${s.total_views}, Gained: ${s.views_gained_month}`);
  });
}

checkGrowth();
