// Debug Instagram HTML structure
async function debug() {
  const url = 'https://www.instagram.com/cristiano/';

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    },
  });

  const html = await response.text();

  console.log('Response status:', response.status);
  console.log('HTML length:', html.length);
  console.log('\n--- Searching for data patterns ---\n');

  // Check for meta tags
  const metaTags = html.match(/<meta[^>]*>/gi);
  const relevantMeta = metaTags?.filter(tag =>
    tag.includes('followers') ||
    tag.includes('Followers') ||
    tag.includes('og:') ||
    tag.includes('description')
  );

  console.log('Relevant meta tags:');
  relevantMeta?.forEach(tag => console.log(tag));

  // Check for JSON data
  console.log('\n--- Checking for JSON data ---\n');
  if (html.includes('_sharedData')) console.log('✓ Found _sharedData');
  if (html.includes('application/json')) console.log('✓ Found application/json scripts');
  if (html.includes('edge_followed_by')) console.log('✓ Found edge_followed_by');

  // Look for any numbers that might be follower counts
  const bigNumbers = html.match(/\b[0-9]{8,}\b/g);
  if (bigNumbers) {
    console.log('\nFound large numbers (potential follower counts):');
    console.log(bigNumbers.slice(0, 10));
  }
}

debug();
