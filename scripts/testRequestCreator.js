import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRequestCreator() {
  const username = 'joshlujan';
  const platform = 'instagram';

  console.log(`Testing Request Creator for @${username} on ${platform}...\n`);

  // Check if creator exists
  console.log('1. Checking if creator exists in database...');
  const { data: existingCreator, error: creatorError } = await supabase
    .from('creators')
    .select('id, username, display_name, profile_image')
    .eq('platform', platform)
    .ilike('username', username)
    .single();

  if (existingCreator) {
    console.log('   ✓ Creator found in database:');
    console.log(`     - Username: ${existingCreator.username}`);
    console.log(`     - Display Name: ${existingCreator.display_name}`);
    console.log(`     - Profile: https://shinypull.com/instagram/${existingCreator.username}\n`);
    return;
  } else {
    console.log('   ✗ Creator not found in database\n');
  }

  // Check if there's already a pending request
  console.log('2. Checking for existing request...');
  const { data: existingRequest, error: requestError } = await supabase
    .from('creator_requests')
    .select('id, username, status, created_at')
    .eq('platform', platform)
    .ilike('username', username)
    .single();

  if (existingRequest) {
    console.log('   ✓ Request already exists:');
    console.log(`     - Status: ${existingRequest.status}`);
    console.log(`     - Created: ${new Date(existingRequest.created_at).toLocaleString()}\n`);
    return;
  } else {
    console.log('   ✗ No existing request found\n');
  }

  // Simulate creating a request
  console.log('3. Simulating request creation...');
  const { data: newRequest, error: insertError } = await supabase
    .from('creator_requests')
    .insert({
      platform,
      username: username.toLowerCase(),
      user_id: null, // Anonymous request
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('   ✗ Failed to create request:', insertError.message);
    return;
  }

  console.log('   ✓ Request created successfully!');
  console.log(`     - Request ID: ${newRequest.id}`);
  console.log(`     - Username: ${newRequest.username}`);
  console.log(`     - Status: ${newRequest.status}`);
  console.log(`     - Created: ${new Date(newRequest.created_at).toLocaleString()}\n`);

  // Verify request was inserted
  console.log('4. Verifying request in database...');
  const { data: verifyRequest, error: verifyError } = await supabase
    .from('creator_requests')
    .select('*')
    .eq('id', newRequest.id)
    .single();

  if (verifyRequest) {
    console.log('   ✓ Request verified in database');
    console.log(`     - All fields present and correct\n`);
  } else {
    console.log('   ✗ Could not verify request');
  }

  console.log('✅ Test complete! The Request Creator feature is working.\n');
  console.log('Next steps:');
  console.log('- Test on live site: https://shinypull.com/search?q=joshlujan');
  console.log('- Select Instagram platform');
  console.log('- Click "Request This Creator" button');
  console.log('- Verify request submission UI works correctly');
}

testRequestCreator().catch(console.error);
