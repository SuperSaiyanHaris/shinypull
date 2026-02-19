/**
 * One-time cleanup: delete ALL creator_stats rows where subscribers is NULL or 0.
 *
 * These rows are corrupt and unrecoverable — they cause the subscriber chart
 * and daily metrics table to show wild swings between 0 and real values.
 *
 * Run once: node scripts/deleteZeroSubscriberRows.js
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function deleteZeroRows() {
  console.log('🗑️  Deleting zero/null subscriber rows from creator_stats...\n');

  let totalDeleted = 0;
  let round = 0;

  // Paginate: repeatedly delete batches of 1000 until none remain.
  // We can't use range() on DELETE, so we fetch IDs first then delete them.
  while (true) {
    round++;
    console.log(`  Round ${round}: fetching next batch of bad rows...`);

    // Fetch up to 1000 row IDs with NULL or 0 subscribers
    const { data: badRows, error: fetchError } = await supabase
      .from('creator_stats')
      .select('id')
      .or('subscribers.is.null,subscribers.eq.0')
      .limit(1000);

    if (fetchError) {
      console.error(`❌ Fetch error: ${fetchError.message}`);
      process.exit(1);
    }

    if (!badRows || badRows.length === 0) {
      console.log('  No more bad rows found.\n');
      break;
    }

    console.log(`  Found ${badRows.length} bad rows — deleting...`);

    const ids = badRows.map(r => r.id);

    // Delete in sub-batches of 50 to avoid URL length limits in PostgREST
    const BATCH = 50;
    let batchDeleted = 0;
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const { error: deleteError, count } = await supabase
        .from('creator_stats')
        .delete({ count: 'exact' })
        .in('id', chunk);

      if (deleteError) {
        console.error(`❌ Delete error: ${deleteError.message}`);
        process.exit(1);
      }
      batchDeleted += count ?? chunk.length;
    }

    totalDeleted += batchDeleted;
    console.log(`  ✅ Deleted ${batchDeleted} rows (total so far: ${totalDeleted})\n`);

    // If we got fewer than 1000 rows, we're done
    if (badRows.length < 1000) break;
  }

  console.log('='.repeat(60));
  console.log(`✅ Done. Deleted ${totalDeleted} bad rows total.`);
  console.log('   Historical charts will now show clean data.');
}

deleteZeroRows().catch(console.error);
