// Find and extract JSON from Instagram HTML
async function extractJSON() {
  const url = 'https://www.instagram.com/cristiano/';

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    },
  });

  const html = await response.text();

  // Find all script tags with JSON
  const scriptMatches = html.matchAll(/<script[^>]*type="application\/json"[^>]*>(.*?)<\/script>/gs);

  let count = 0;
  for (const match of scriptMatches) {
    count++;
    try {
      const json = JSON.parse(match[1]);

      // Search for follower count in this JSON blob
      const jsonStr = JSON.stringify(json);

      if (jsonStr.includes('follower') || jsonStr.includes('edge_followed_by')) {
        console.log(`\n=== Script #${count} (CONTAINS FOLLOWER DATA) ===`);
        console.log(JSON.stringify(json, null, 2).substring(0, 2000));
        console.log('...');
      }
    } catch (e) {
      // Not valid JSON
    }
  }

  console.log(`\nTotal JSON scripts found: ${count}`);
}

extractJSON();
