import { scrapeInstagramProfile, closeBrowser } from '../src/services/instagramPuppeteer.js';

async function test() {
  console.log('🔍 Testing Instagram data structure\n');

  const profile = await scrapeInstagramProfile('snoopdogg');

  console.log('Full profile data:');
  console.log(JSON.stringify(profile, null, 2));

  await closeBrowser();
}

test();
