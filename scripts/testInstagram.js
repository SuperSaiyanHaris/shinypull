// Quick test of Instagram scraping
import { fetchInstagramProfile } from '../src/services/instagramService.js';

async function test() {
  console.log('Testing Instagram scraping...\n');

  const testUsers = ['cristiano', 'leomessi', 'selenagomez'];

  for (const username of testUsers) {
    try {
      console.log(`Fetching ${username}...`);
      const profile = await fetchInstagramProfile(username);
      console.log(`✓ ${profile.displayName}`);
      console.log(`  Followers: ${(profile.followers / 1000000).toFixed(1)}M`);
      console.log(`  Posts: ${profile.totalPosts}`);
      console.log('');

      // Wait 3 seconds between requests
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.log(`✗ Failed: ${error.message}\n`);
    }
  }
}

test();
