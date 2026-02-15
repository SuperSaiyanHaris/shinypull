import { scrapeTikTokProfile } from './src/services/tiktokScraper.js';

const users = ['charlidamelio', 'mrbeast', 'khaby.lame'];

for (const u of users) {
  try {
    console.log(`\nTesting @${u}...`);
    const data = await scrapeTikTokProfile(u);
    console.log(`  Display: ${data.displayName}`);
    console.log(`  Followers: ${data.followers.toLocaleString()}`);
    console.log(`  Likes: ${data.totalLikes ? data.totalLikes.toLocaleString() : 'N/A'}`);
    console.log(`  Videos: ${data.totalPosts}`);
    console.log(`  OK`);
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
  }
}
