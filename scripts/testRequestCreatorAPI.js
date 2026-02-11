async function testRequestCreatorAPI() {
  console.log('Testing /api/request-creator endpoint...\n');

  // Test 1: Request a new creator
  console.log('Test 1: Requesting a new creator (testuser123)...');
  try {
    const response1 = await fetch('http://localhost:3000/api/request-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'instagram',
        username: 'testuser123',
        userId: null
      })
    });

    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log('Status:', response1.status);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Note: This test requires the dev server to be running (npm run dev)\n');
  }

  // Test 2: Request existing creator (joshlujan - we just created this)
  console.log('Test 2: Requesting existing pending creator (joshlujan)...');
  try {
    const response2 = await fetch('http://localhost:3000/api/request-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'instagram',
        username: 'joshlujan',
        userId: null
      })
    });

    const data2 = await response2.json();
    console.log('Response:', data2);
    console.log('Status:', response2.status);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Note: This test requires the dev server to be running (npm run dev)\n');
  }

  // Test 3: Invalid username
  console.log('Test 3: Testing invalid username validation...');
  try {
    const response3 = await fetch('http://localhost:3000/api/request-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'instagram',
        username: 'invalid@#$%',
        userId: null
      })
    });

    const data3 = await response3.json();
    console.log('Response:', data3);
    console.log('Status:', response3.status);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Note: This test requires the dev server to be running (npm run dev)\n');
  }
}

testRequestCreatorAPI();
