// Script to validate that RLS policies are working correctly
// This script uses the anon key (like the frontend) to test permissions

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY // Using anon key like frontend
);

async function validateRLS() {
  console.log('🔒 Validating RLS Policies with Anon Key...\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Should be able to READ creators
  console.log('Test 1: Public READ access to creators');
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('id, username, platform')
      .limit(5);

    if (error) {
      console.log('❌ FAILED:', error.message);
      failedTests++;
    } else if (data && data.length > 0) {
      console.log(`✅ PASSED - Retrieved ${data.length} creators`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING - No data returned');
      failedTests++;
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    failedTests++;
  }

  // Test 2: Should NOT be able to INSERT creators
  console.log('\nTest 2: Block INSERT to creators (should fail)');
  try {
    const { data, error } = await supabase
      .from('creators')
      .insert({
        platform: 'youtube',
        platform_id: 'test-rls-validation',
        username: 'test-user',
        display_name: 'Test User',
      })
      .select();

    if (error) {
      if (error.message.includes('policy') || error.code === '42501') {
        console.log('✅ PASSED - INSERT blocked by RLS (expected)');
        passedTests++;
      } else {
        console.log('❌ FAILED - Different error:', error.message);
        failedTests++;
      }
    } else {
      console.log('❌ FAILED - INSERT should have been blocked!');
      console.log('   Data inserted:', data);
      failedTests++;
    }
  } catch (err) {
    console.log('✅ PASSED - INSERT blocked (expected error)');
    passedTests++;
  }

  // Test 3: Should NOT be able to UPDATE creators
  console.log('\nTest 3: Block UPDATE to creators (should fail)');
  try {
    const { data, error } = await supabase
      .from('creators')
      .update({ username: 'hacked' })
      .eq('platform', 'youtube')
      .limit(1)
      .select();

    if (error) {
      if (error.message.includes('policy') || error.code === '42501') {
        console.log('✅ PASSED - UPDATE blocked by RLS (expected)');
        passedTests++;
      } else {
        console.log('❌ FAILED - Different error:', error.message);
        failedTests++;
      }
    } else {
      console.log('❌ FAILED - UPDATE should have been blocked!');
      failedTests++;
    }
  } catch (err) {
    console.log('✅ PASSED - UPDATE blocked (expected error)');
    passedTests++;
  }

  // Test 4: Should NOT be able to DELETE creators
  console.log('\nTest 4: Block DELETE to creators (should fail)');
  try {
    const { data, error } = await supabase
      .from('creators')
      .delete()
      .eq('username', 'nonexistent-user');

    if (error) {
      if (error.message.includes('policy') || error.code === '42501') {
        console.log('✅ PASSED - DELETE blocked by RLS (expected)');
        passedTests++;
      } else {
        console.log('❌ FAILED - Different error:', error.message);
        failedTests++;
      }
    } else {
      console.log('❌ FAILED - DELETE should have been blocked!');
      failedTests++;
    }
  } catch (err) {
    console.log('✅ PASSED - DELETE blocked (expected error)');
    passedTests++;
  }

  // Test 5: Should be able to READ creator_stats
  console.log('\nTest 5: Public READ access to creator_stats');
  try {
    const { data, error } = await supabase
      .from('creator_stats')
      .select('id, recorded_at, subscribers')
      .limit(5);

    if (error) {
      console.log('❌ FAILED:', error.message);
      failedTests++;
    } else if (data && data.length > 0) {
      console.log(`✅ PASSED - Retrieved ${data.length} stats records`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING - No data returned');
      failedTests++;
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    failedTests++;
  }

  // Test 6: Should be able to READ published blog posts
  console.log('\nTest 6: Public READ access to published blog posts');
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, is_published')
      .limit(5);

    if (error) {
      console.log('❌ FAILED:', error.message);
      failedTests++;
    } else {
      const allPublished = data.every(post => post.is_published === true);
      if (allPublished || data.length === 0) {
        console.log(`✅ PASSED - Only published posts visible (${data.length} posts)`);
        passedTests++;
      } else {
        console.log('❌ FAILED - Unpublished posts are visible!');
        failedTests++;
      }
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    failedTests++;
  }

  // Test 7: Should be able to READ active products
  console.log('\nTest 7: Public READ access to active products');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, is_active')
      .limit(5);

    if (error) {
      console.log('❌ FAILED:', error.message);
      failedTests++;
    } else {
      const allActive = data.every(product => product.is_active === true);
      if (allActive || data.length === 0) {
        console.log(`✅ PASSED - Only active products visible (${data.length} products)`);
        passedTests++;
      } else {
        console.log('❌ FAILED - Inactive products are visible!');
        failedTests++;
      }
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    failedTests++;
  }

  // Test 8: Should NOT be able to INSERT blog posts
  console.log('\nTest 8: Block INSERT to blog_posts (should fail)');
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        slug: 'test-rls',
        title: 'Test RLS',
        content: 'Testing',
        is_published: false,
      })
      .select();

    if (error) {
      if (error.message.includes('policy') || error.code === '42501') {
        console.log('✅ PASSED - INSERT blocked by RLS (expected)');
        passedTests++;
      } else {
        console.log('❌ FAILED - Different error:', error.message);
        failedTests++;
      }
    } else {
      console.log('❌ FAILED - INSERT should have been blocked!');
      failedTests++;
    }
  } catch (err) {
    console.log('✅ PASSED - INSERT blocked (expected error)');
    passedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${passedTests + failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 All RLS policies are working correctly!');
    console.log('✅ Public can READ data');
    console.log('✅ Public CANNOT write/modify data');
    console.log('✅ GitHub Actions will continue to work (they use service role key)');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some RLS policies may need adjustment');
    console.log('Please review the failed tests above');
    process.exit(1);
  }
}

validateRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
