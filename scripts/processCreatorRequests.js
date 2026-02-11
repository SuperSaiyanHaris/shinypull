/**
 * Process Pending Creator Requests
 *
 * Fetches pending requests from creator_requests table and processes them:
 * 1. Scrapes Instagram profile data using Puppeteer
 * 2. Inserts creator into creators table
 * 3. Creates initial stats entry
 * 4. Updates request status to completed/failed
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramPuppeteer.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get today's date in America/New_York timezone
 */
function getTodayLocal() {
  const now = new Date();
  const nyDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const year = nyDate.getFullYear();
  const month = String(nyDate.getMonth() + 1).padStart(2, '0');
  const day = String(nyDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Process a single creator request
 */
async function processRequest(request) {
  console.log(`\n[${request.username}] Processing request...`);

  try {
    // Mark as processing
    await supabase
      .from('creator_requests')
      .update({ status: 'processing' })
      .eq('id', request.id);

    // Scrape profile data
    console.log(`[${request.username}] Scraping profile...`);
    const profileData = await scrapeInstagramProfile(request.username);
    console.log(`[${request.username}] ✓ Scraped: ${profileData.displayName} (${profileData.followers.toLocaleString()} followers)`);

    // Check if creator already exists (in case it was added elsewhere)
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('platform', 'instagram')
      .ilike('username', request.username)
      .single();

    let creatorId;

    if (existingCreator) {
      console.log(`[${request.username}] Creator already exists, using existing ID`);
      creatorId = existingCreator.id;
    } else {
      // Insert new creator
      const { data: newCreator, error: creatorError } = await supabase
        .from('creators')
        .insert({
          platform: profileData.platform,
          platform_id: profileData.platformId,
          username: profileData.username,
          display_name: profileData.displayName,
          profile_image: profileData.profileImage,
          description: profileData.description,
          category: profileData.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (creatorError) {
        throw new Error(`Failed to insert creator: ${creatorError.message}`);
      }

      creatorId = newCreator.id;
      console.log(`[${request.username}] ✓ Creator inserted into database`);
    }

    // Create initial stats entry
    const today = getTodayLocal();
    const { error: statsError } = await supabase
      .from('creator_stats')
      .insert({
        creator_id: creatorId,
        recorded_at: today,
        followers: profileData.followers,
        total_posts: profileData.totalPosts,
        created_at: new Date().toISOString()
      });

    if (statsError && !statsError.message.includes('duplicate key')) {
      console.warn(`[${request.username}] Warning: Failed to create stats entry: ${statsError.message}`);
    } else {
      console.log(`[${request.username}] ✓ Initial stats created`);
    }

    // Mark request as completed
    await supabase
      .from('creator_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    console.log(`[${request.username}] ✅ Request completed successfully`);
    return { success: true, username: request.username };

  } catch (error) {
    console.error(`[${request.username}] ❌ Error:`, error.message);

    // Mark request as failed
    await supabase
      .from('creator_requests')
      .update({
        status: 'failed',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    return { success: false, username: request.username, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('==========================================');
  console.log('Processing Creator Requests');
  console.log('==========================================\n');

  try {
    // Fetch pending requests
    console.log('Fetching pending requests...');
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('creator_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch requests: ${fetchError.message}`);
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('No pending requests found.\n');
      return;
    }

    console.log(`Found ${pendingRequests.length} pending request(s)\n`);

    // Process requests one by one with delays
    const results = [];
    for (let i = 0; i < pendingRequests.length; i++) {
      const request = pendingRequests[i];
      const result = await processRequest(request);
      results.push(result);

      // Delay between requests (5-8 seconds randomized)
      if (i < pendingRequests.length - 1) {
        const delay = 5000 + Math.random() * 3000;
        console.log(`\nWaiting ${(delay / 1000).toFixed(1)}s before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Summary
    console.log('\n==========================================');
    console.log('Summary');
    console.log('==========================================');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Total: ${results.length}`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed requests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.username}: ${r.error}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    // Close browser
    await closeBrowser();
  }
}

main();
