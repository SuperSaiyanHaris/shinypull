/**
 * Create creator_requests table for queuing background scraping jobs
 * Run: node scripts/createCreatorRequestsTable.js <ACCESS_TOKEN>
 */

const ACCESS_TOKEN = process.argv[2];
const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/createCreatorRequestsTable.js <ACCESS_TOKEN>');
  console.error('Get access token from Windows Credential Manager (Supabase CLI:supabase)');
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Creating creator_requests table...\n');

  // Create table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.creator_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      UNIQUE(platform, username)
    );
  `;

  await runSQL(createTableSQL);
  console.log('✓ Table created');

  // Create index on status for efficient querying
  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_creator_requests_status
    ON public.creator_requests(status, created_at);
  `;

  await runSQL(createIndexSQL);
  console.log('✓ Index created');

  // Enable RLS
  const enableRLSSQL = `ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;`;
  await runSQL(enableRLSSQL);
  console.log('✓ RLS enabled');

  // Create RLS policies
  const createPoliciesSQL = `
    -- Allow anyone to insert requests (both authenticated and anonymous)
    CREATE POLICY "allow_insert_requests" ON public.creator_requests
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);

    -- Allow users to view their own requests
    CREATE POLICY "allow_select_own_requests" ON public.creator_requests
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);

    -- Allow anonymous users to view only status (for "already requested" check)
    CREATE POLICY "allow_select_status_anon" ON public.creator_requests
      FOR SELECT TO anon
      USING (status IN ('pending', 'completed'));
  `;

  await runSQL(createPoliciesSQL);
  console.log('✓ RLS policies created');

  console.log('\n✅ creator_requests table setup complete!\n');
  console.log('Table schema:');
  console.log('- id: UUID (primary key)');
  console.log('- platform: TEXT (youtube, instagram, twitch, kick)');
  console.log('- username: TEXT');
  console.log('- user_id: UUID (optional, references auth.users)');
  console.log('- status: TEXT (pending, processing, completed, failed)');
  console.log('- error_message: TEXT (optional)');
  console.log('- created_at: TIMESTAMPTZ');
  console.log('- processed_at: TIMESTAMPTZ\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
