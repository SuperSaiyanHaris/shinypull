/**
 * Check actual database schema from Supabase
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('📋 Checking actual database schema from Supabase...\n');
  
  // Get one card to see what columns exist
  const { data: sampleCard, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .limit(1);
  
  if (sampleCard && sampleCard.length > 0) {
    console.log('🃏 CARDS TABLE - Existing columns:');
    Object.keys(sampleCard[0]).forEach(col => {
      console.log(`  ✓ ${col}`);
    });
  } else {
    console.log('🃏 CARDS TABLE - No data yet or error:', cardError?.message);
  }
  
  // Get one price to see what columns exist
  const { data: samplePrice, error: priceError } = await supabase
    .from('prices')
    .select('*')
    .limit(1);
  
  if (samplePrice && samplePrice.length > 0) {
    console.log('\n💰 PRICES TABLE - Existing columns:');
    Object.keys(samplePrice[0]).forEach(col => {
      console.log(`  ✓ ${col}`);
    });
  } else {
    console.log('\n💰 PRICES TABLE - No data yet or error:', priceError?.message);
  }
  
  // Get one set to see what columns exist
  const { data: sampleSet, error: setError } = await supabase
    .from('sets')
    .select('*')
    .limit(1);
  
  if (sampleSet && sampleSet.length > 0) {
    console.log('\n📦 SETS TABLE - Existing columns:');
    Object.keys(sampleSet[0]).forEach(col => {
      console.log(`  ✓ ${col}`);
    });
  } else {
    console.log('\n📦 SETS TABLE - No data yet or error:', setError?.message);
  }
}

checkSchema();
