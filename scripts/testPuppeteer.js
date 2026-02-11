import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramPuppeteer.js';

async function test() {
  console.log('🚀 Testing Puppeteer Instagram Scraper\n');

  const testUsers = ['cristiano', 'leomessi', 'selenagomez'];

  for (const username of testUsers) {
    try {
      console.log(`Scraping ${username}...`);
      const profile = await scrapeInstagramProfile(username);

      console.log(`✓ ${profile.displayName}`);
      console.log(`  Username: @${profile.username}`);
      console.log(`  Followers: ${(profile.followers / 1000000).toFixed(1)}M`);
      console.log(`  Posts: ${profile.totalPosts.toLocaleString()}`);
      console.log(`  Verified: ${profile.isVerified ? 'Yes' : 'No'}`);
      console.log('');

      // Wait 3 seconds between requests
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.log(`✗ Failed: ${error.message}\n`);
    }
  }

  await closeBrowser();
  console.log('✅ Test complete!');
}

test();
