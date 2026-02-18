/**
 * Process Pending Creator Requests
 *
 * Fetches pending TikTok requests from creator_requests table and processes them:
 * 1. Fetches TikTok profile data via scraper
 * 2. Inserts creator into creators table
 * 3. Creates initial stats entry
 * 4. Deletes the request on success
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scrapeTikTokProfile, closeBrowser as closeTikTokBrowser } from '../src/services/tiktokScraper.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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
 * Use Gemini AI to resolve a display name / guess to an actual handle
 * Returns the resolved username or null if it can't determine one
 */
async function resolveHandleWithAI(query, platform) {
  if (!GEMINI_API_KEY) {
    console.log(`[${query}] ⏭️  No GEMINI_API_KEY set, skipping AI handle resolution`);
    return null;
  }

  try {
    console.log(`[${query}] 🤖 Asking AI to resolve ${platform} handle...`);
    const platformName = 'TikTok';
    const prompt = `I tried to look up the ${platformName} profile "${query}" but it was not found. The input may be a display name, a misspelled handle, or missing special characters like underscores or dots. What is the correct, official ${platformName} username for this person? Reply with ONLY the exact username (no @ symbol, no explanation, no punctuation). If you cannot determine who this is or they don't have a ${platformName} account, reply with exactly "UNKNOWN".`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 50 }
        })
      }
    );

    if (!res.ok) {
      // Retry once after 10s on rate limit
      if (res.status === 429) {
        console.log(`[${query}] 🤖 Rate limited, retrying in 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        const retry = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0, maxOutputTokens: 50 }
            })
          }
        );
        if (!retry.ok) {
          console.warn(`[${query}] AI API still returned ${retry.status} after retry`);
          return null;
        }
        const retryData = await retry.json();
        const retryAnswer = retryData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (retryAnswer && retryAnswer !== 'UNKNOWN') {
          const cleaned = retryAnswer.replace(/^@/, '').replace(/["'`.]/g, '').trim().toLowerCase();
          if (cleaned && /^[a-zA-Z0-9._]{1,30}$/.test(cleaned) && cleaned !== query.toLowerCase().replace(/[^a-z0-9._]/g, '')) {
            console.log(`[${query}] 🤖 AI resolved handle → @${cleaned}`);
            return cleaned;
          }
        }
        return null;
      }
      console.warn(`[${query}] AI API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!answer || answer === 'UNKNOWN' || answer.length > 30) {
      console.log(`[${query}] 🤖 AI could not determine the handle`);
      return null;
    }

    // Clean the response — strip @, quotes, period at end
    const cleaned = answer.replace(/^@/, '').replace(/["'`.]/g, '').trim().toLowerCase();
    if (!cleaned || !/^[a-zA-Z0-9._]{1,30}$/.test(cleaned)) {
      console.log(`[${query}] 🤖 AI response wasn't a valid username: "${answer}"`);
      return null;
    }

    // Don't bother if AI returned the same thing we already tried
    if (cleaned === query.toLowerCase().replace(/[^a-z0-9._]/g, '')) {
      console.log(`[${query}] 🤖 AI returned same username we already tried`);
      return null;
    }

    console.log(`[${query}] 🤖 AI resolved handle → @${cleaned}`);
    return cleaned;
  } catch (err) {
    console.warn(`[${query}] AI resolution failed:`, err.message);
    return null;
  }
}

/**
 * Process a single creator request
 */
async function processRequest(request) {
  console.log(`\n[${request.platform}/${request.username}] Processing request...`);

  try {
    // Mark as processing
    await supabase
      .from('creator_requests')
      .update({ status: 'processing' })
      .eq('id', request.id);

    // Scrape profile data based on platform
    console.log(`[${request.username}] Scraping ${request.platform} profile...`);
    const profileData = await scrapeTikTokProfile(request.username);
    console.log(`[${request.username}] ✓ Scraped: ${profileData.displayName} (${profileData.followers.toLocaleString()} followers)`);

    // Check if creator already exists (in case it was added elsewhere)
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('platform', request.platform)
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
    const statsInsert = {
      creator_id: creatorId,
      recorded_at: today,
      followers: profileData.followers,
      total_posts: profileData.totalPosts,
      created_at: new Date().toISOString()
    };
    // TikTok also has totalLikes — store in total_views field
    if (request.platform === 'tiktok' && profileData.totalLikes) {
      statsInsert.total_views = profileData.totalLikes;
    }
    const { error: statsError } = await supabase
      .from('creator_stats')
      .insert(statsInsert);

    if (statsError && !statsError.message.includes('duplicate key')) {
      console.warn(`[${request.username}] Warning: Failed to create stats entry: ${statsError.message}`);
    } else {
      console.log(`[${request.username}] ✓ Initial stats created`);
    }

    // Delete the completed request (creator is now in the database)
    await supabase
      .from('creator_requests')
      .delete()
      .eq('id', request.id);

    console.log(`[${request.username}] ✅ Request completed successfully (record deleted)`);
    return { success: true, username: request.username };

  } catch (error) {
    const isRateLimit = error.message.includes('429');
    const isScrapeBlocked = error.message.includes('No __UNIVERSAL_DATA');
    console.error(`[${request.username}] ❌ Error:`, error.message);

    // If rate limited, revert to pending immediately (no AI resolution needed)
    if (isRateLimit) {
      await supabase
        .from('creator_requests')
        .update({ status: 'pending' })
        .eq('id', request.id);
      console.log(`[${request.username}] ↩️  Reverted to pending (rate limited, will retry next run)`);
      return { success: false, username: request.username, error: error.message, rateLimited: true, scrapeBlocked: false };
    }

    // --- AI Fallback: try to resolve the correct handle ---
    // This runs for scrape blocks (wrong username?) and other errors
    const aiHandle = await resolveHandleWithAI(request.username, request.platform);

    if (aiHandle) {
      try {
        console.log(`[${request.username}] 🔄 Retrying with AI-resolved handle: @${aiHandle}`);
        const profileData = await scrapeTikTokProfile(aiHandle);
        console.log(`[${aiHandle}] ✓ Scraped: ${profileData.displayName} (${profileData.followers.toLocaleString()} followers)`);

        // Check if this creator already exists under the corrected handle
        const { data: existingCreator } = await supabase
          .from('creators')
          .select('id')
          .eq('platform', request.platform)
          .ilike('username', aiHandle)
          .single();

        let creatorId;
        if (existingCreator) {
          creatorId = existingCreator.id;
          console.log(`[${aiHandle}] Creator already exists, using existing ID`);
        } else {
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

          if (creatorError) throw new Error(`Failed to insert creator: ${creatorError.message}`);
          creatorId = newCreator.id;
          console.log(`[${aiHandle}] ✓ Creator inserted into database`);
        }

        // Create initial stats entry
        const today = getTodayLocal();
        const statsInsert = {
          creator_id: creatorId,
          recorded_at: today,
          followers: profileData.followers,
          total_posts: profileData.totalPosts,
          created_at: new Date().toISOString()
        };
        if (request.platform === 'tiktok' && profileData.totalLikes) {
          statsInsert.total_views = profileData.totalLikes;
        }
        const { error: statsError } = await supabase
          .from('creator_stats')
          .insert(statsInsert);

        if (statsError && !statsError.message.includes('duplicate key')) {
          console.warn(`[${aiHandle}] Warning: Failed to create stats entry: ${statsError.message}`);
        }

        // Success via AI — delete the request
        await supabase.from('creator_requests').delete().eq('id', request.id);
        console.log(`[${request.username}] ✅ Completed via AI resolve → @${aiHandle} (record deleted)`);
        return { success: true, username: aiHandle };
      } catch (aiRetryError) {
        console.error(`[${request.username}] 🤖 AI-resolved handle @${aiHandle} also failed:`, aiRetryError.message);
      }
    }

    // All attempts exhausted — delete the request (username doesn't exist)
    await supabase.from('creator_requests').delete().eq('id', request.id);
    console.log(`[${request.username}] 🗑️  Request deleted (no valid profile found after all attempts)`);
    return { success: false, username: request.username, error: error.message, rateLimited: false, scrapeBlocked: false };
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
    // Clean up old completed/failed requests
    const { data: staleRequests, error: cleanupFetchError } = await supabase
      .from('creator_requests')
      .select('id')
      .in('status', ['completed', 'failed']);

    if (!cleanupFetchError && staleRequests && staleRequests.length > 0) {
      const ids = staleRequests.map(r => r.id);
      await supabase.from('creator_requests').delete().in('id', ids);
      console.log(`🧹 Cleaned up ${staleRequests.length} old completed/failed request(s)\n`);
    }

    // Fetch pending requests
    console.log('Fetching pending requests...');
    const maxRequests = parseInt(process.argv[2]) || 50; // default: 50 per run
    const platformFilter = process.argv[3] || null; // optional: 'tiktok'
    
    let query = supabase
      .from('creator_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(maxRequests);
    
    if (platformFilter) {
      query = query.eq('platform', platformFilter.toLowerCase());
      console.log(`Platform filter: ${platformFilter.toLowerCase()} only`);
    }
    
    const { data: pendingRequests, error: fetchError } = await query;

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
    let consecutiveScrapeFailures = 0;
    const BLOCK_THRESHOLD = 3; // 3 consecutive scrape failures = likely IP block

    for (let i = 0; i < pendingRequests.length; i++) {
      const request = pendingRequests[i];
      const result = await processRequest(request);
      results.push(result);

      // Track consecutive scrape failures (og:description missing = likely IP block)
      if (result.scrapeBlocked) {
        consecutiveScrapeFailures++;
      } else {
        consecutiveScrapeFailures = 0;
      }

      // If rate limited or likely IP-blocked, stop processing
      if (result.rateLimited) {
        console.log(`\n⚠️  Rate limited — skipping remaining ${pendingRequests.length - i - 1} request(s) (will retry next run)`);
        break;
      }

      if (consecutiveScrapeFailures >= BLOCK_THRESHOLD) {
        console.log(`\n⚠️  ${BLOCK_THRESHOLD} consecutive scrape failures — likely IP-blocked by ${request.platform}`);
        console.log(`    Reverting remaining ${pendingRequests.length - i - 1} request(s) to pending...`);
        // Revert any requests that were marked processing back to pending
        for (let j = i + 1; j < pendingRequests.length; j++) {
          await supabase
            .from('creator_requests')
            .update({ status: 'pending' })
            .eq('id', pendingRequests[j].id);
        }
        break;
      }

      // Delay between requests (10-15 seconds randomized for safety)
      if (i < pendingRequests.length - 1) {
        const delay = 10000 + Math.random() * 5000;
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
    await closeTikTokBrowser();
  }
}

main();
