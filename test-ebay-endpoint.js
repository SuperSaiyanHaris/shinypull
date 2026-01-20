// Test script for eBay deletion notification endpoint
// Run with: node test-ebay-endpoint.js

const testNotification = {
  username: 'test_user_123',
  userId: 'U123456789',
  eiasToken: 'test_token_abc123',
  timestamp: new Date().toISOString()
};

async function testEndpoint() {
  try {
    console.log('🧪 Testing eBay deletion notification endpoint...\n');

    // Test locally (if running dev server)
    const localUrl = 'http://localhost:3001/api/ebay-deletion-notification';

    console.log('Sending test notification to:', localUrl);
    console.log('Payload:', JSON.stringify(testNotification, null, 2));
    console.log('');

    const response = await fetch(localUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testNotification)
    });

    const data = await response.json();

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Body:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.success) {
      console.log('\n🎉 Test passed! Endpoint is working correctly.');
    } else {
      console.log('\n❌ Test failed. Check the response above.');
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    console.log('\n💡 Make sure your dev server is running: npm run dev');
  }
}

testEndpoint();
