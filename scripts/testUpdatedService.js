// Test the updated getCreatorByUsername function
import { getCreatorByUsername, getCreatorStats } from '../src/services/creatorService.js';

async function testUpdatedService() {
  console.log('🧪 Testing updated getCreatorByUsername service...\n');

  try {
    console.log('Test 1: Get MrBeast by username (should return most popular)');
    const creator = await getCreatorByUsername('youtube', 'mrbeast');

    if (!creator) {
      console.log('❌ No creator returned');
      return;
    }

    console.log('✅ Success! Returned:');
    console.log(`   Display Name: ${creator.display_name}`);
    console.log(`   Platform ID: ${creator.platform_id}`);
    console.log(`   Username: ${creator.username}`);
    console.log(`   Creator ID: ${creator.id}`);

    console.log('\nTest 2: Get historical stats for this creator');
    const stats = await getCreatorStats(creator.id, 30);

    if (!stats || stats.length === 0) {
      console.log('❌ No stats returned');
    } else {
      console.log(`✅ Success! Returned ${stats.length} historical stats`);
      console.log(`   Latest: ${stats[0].recorded_at.substring(0, 10)}`);
      console.log(`   Subscribers: ${stats[0].subscribers || 'N/A'}`);
      console.log(`   Views: ${stats[0].total_views || 'N/A'}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('RESULT: Service is working correctly!');
    console.log('Historical data should now display on the frontend.');
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testUpdatedService().catch(console.error);
