/**
 * Test new Pokemon API key
 */
import fetch from 'node-fetch';

const NEW_API_KEY = '788fb666-6927-4b77-b3df-ecc384f6dcf9';

async function testAPIKey() {
  console.log('🧪 Testing new Pokemon TCG API key...\n');
  
  const testUrls = [
    'https://api.pokemontcg.io/v2/sets',
    'https://api.pokemontcg.io/v2/cards/base1-1',
    'https://api.pokemontcg.io/v2/cards?q=set.id:base1&pageSize=1'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        headers: { 
          'X-Api-Key': NEW_API_KEY,
          'User-Agent': 'ShinyPull/1.0'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      console.log(`  Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.totalCount !== undefined) {
          console.log(`  Total items: ${data.totalCount}`);
        }
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`  Returned ${data.data.length} items`);
            if (data.data[0]) {
              console.log(`  Sample: ${data.data[0].id} - ${data.data[0].name}`);
            }
          } else {
            console.log(`  Card: ${data.data.name} (${data.data.id})`);
          }
        }
      } else {
        const text = await response.text();
        console.log(`  Response: ${text.substring(0, 200)}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
}

testAPIKey();
