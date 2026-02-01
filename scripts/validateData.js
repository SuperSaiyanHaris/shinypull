import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function validateTSeriesData() {
  console.log('🔍 Validating T-Series historical data...\n');

  // Get T-Series creator
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('platform_id', 'UCq-Fj5jknLsUf-MWSy4_brA')
    .single();

  if (!creator) {
    console.error('❌ T-Series not found in database');
    return;
  }

  console.log(`Found: ${creator.name} (${creator.platform})`);

  // Get all stats ordered by date
  const { data: stats } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('creator_id', creator.id)
    .order('recorded_at', { ascending: false });

  console.log(`\n📊 Total data points: ${stats.length}\n`);

  // Analyze daily changes
  console.log('Daily Changes Analysis:');
  console.log('='.repeat(80));
  console.log('Date\t\t\tSubs\t\tΔSubs\t\tViews\t\tΔViews');
  console.log('='.repeat(80));

  let negativeSubsDays = 0;
  let negativeViewsDays = 0;
  let largeSwings = [];

  for (let i = 0; i < Math.min(15, stats.length); i++) {
    const current = stats[i];
    const previous = stats[i + 1];

    if (previous) {
      const subsDelta = current.subscribers - previous.subscribers;
      const viewsDelta = current.total_views - previous.total_views;

      if (subsDelta < 0) negativeSubsDays++;
      if (viewsDelta < 0) negativeViewsDays++;

      // Flag large swings (>500K subs)
      if (Math.abs(subsDelta) > 500000) {
        largeSwings.push({
          date: new Date(current.recorded_at).toLocaleDateString(),
          delta: subsDelta,
        });
      }

      const date = new Date(current.recorded_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: '2-digit',
        day: '2-digit',
      });

      const subsStr = (current.subscribers / 1000000).toFixed(1) + 'M';
      const deltaSubsStr =
        (subsDelta >= 0 ? '+' : '') + (subsDelta / 1000).toFixed(1) + 'K';
      const viewsStr = (current.total_views / 1000000000).toFixed(2) + 'B';
      const deltaViewsStr =
        (viewsDelta >= 0 ? '+' : '') + (viewsDelta / 1000000).toFixed(1) + 'M';

      console.log(
        `${date}\t\t${subsStr}\t\t${deltaSubsStr}\t\t${viewsStr}\t${deltaViewsStr}`
      );
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Data Quality Report:');
  console.log(`   Negative subscriber days: ${negativeSubsDays}`);
  console.log(`   Negative view days: ${negativeViewsDays}`);
  console.log(`   Large swings (>500K): ${largeSwings.length}`);

  if (largeSwings.length > 0) {
    console.log('\n   ⚠️  Large subscriber swings detected:');
    largeSwings.forEach((swing) => {
      console.log(
        `      ${swing.date}: ${swing.delta >= 0 ? '+' : ''}${(swing.delta / 1000).toFixed(1)}K`
      );
    });
  }

  // Calculate growth consistency
  const deltas = [];
  for (let i = 0; i < stats.length - 1; i++) {
    const delta = stats[i].subscribers - stats[i + 1].subscribers;
    deltas.push(delta);
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const variance =
    deltas.reduce((a, b) => a + Math.pow(b - avgDelta, 2), 0) / deltas.length;
  const stdDev = Math.sqrt(variance);

  console.log(`\n   Average daily growth: ${(avgDelta / 1000).toFixed(1)}K`);
  console.log(`   Standard deviation: ${(stdDev / 1000).toFixed(1)}K`);
  console.log(
    `   Coefficient of variation: ${((stdDev / avgDelta) * 100).toFixed(1)}%`
  );

  // QA Assessment
  console.log('\n🎯 QA Assessment:');
  if (negativeSubsDays > 0) {
    console.log(
      '   ❌ FAIL: Negative subscriber days detected (unrealistic for major channels)'
    );
  }
  if (negativeViewsDays > 0) {
    console.log('   ⚠️  WARNING: Negative view days (can happen but rare)');
  }
  if (largeSwings.length > 5) {
    console.log(
      '   ❌ FAIL: Too many large swings (should be smooth growth for 300M+ channel)'
    );
  }
  if (stdDev / avgDelta > 2) {
    console.log(
      '   ⚠️  WARNING: High variability (real channels are more consistent)'
    );
  }

  if (
    negativeSubsDays === 0 &&
    largeSwings.length <= 5 &&
    stdDev / avgDelta < 2
  ) {
    console.log('   ✅ PASS: Data looks realistic and consistent');
  }
}

validateTSeriesData().catch(console.error);
