// Check MrBeast data issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMrBeastData() {
  console.log('🔍 Checking MrBeast data issues...\n');

  // Get MrBeast
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('platform', 'youtube')
    .eq('platform_id', 'UCX6OQ3DkcsbYNE6H8uQQuVA')
    .single();

  console.log('MrBeast creator record:');
  console.log('  Display name:', creator.display_name);
  console.log('  Username:', creator.username);
  console.log('  Updated at:', creator.updated_at);

  // Get recent stats
  const { data: stats } = await supabase
    .from('creator_stats')
    .select('recorded_at, subscribers, total_views, total_posts')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false })
    .limit(10);

  console.log('\nRecent stats entries:');
  stats.forEach(s => {
    const date = s.recorded_at.substring(0, 10);
    const videos = s.total_posts || 'N/A';
    const views = s.total_views ? (s.total_views / 1e9).toFixed(1) + 'B' : 'N/A';
    const subs = s.subscribers ? (s.subscribers / 1e6).toFixed(0) + 'M' : 'N/A';
    console.log(`  ${date}: ${videos} videos, ${views} views, ${subs} subs`);
  });

  // Check timezone
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const utcToday = new Date().toISOString().split('T')[0];

  console.log('\nTimezone check:');
  console.log('  America/New_York date:', today);
  console.log('  UTC date:', utcToday);
  console.log('  Current time:', new Date().toISOString());

  // Check if tomorrow's date exists
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: futureStats } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .gte('recorded_at', tomorrowStr);

  if (futureStats && futureStats.length > 0) {
    console.log('\n🚨 FOUND FUTURE-DATED ENTRIES:');
    futureStats.forEach(s => {
      console.log(`  ${s.recorded_at}: ${s.total_posts} videos`);
    });
  } else {
    console.log('\n✅ No future-dated entries found');
  }
}

checkMrBeastData().catch(console.error);
