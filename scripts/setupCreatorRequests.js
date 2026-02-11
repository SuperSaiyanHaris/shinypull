import { spawn } from 'child_process';

const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

// PowerShell script to extract access token from Windows Credential Manager
const psScript = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CREDENTIAL {
        public int Flags; public int Type;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetName;
        [MarshalAs(UnmanagedType.LPWStr)] public string Comment;
        public long LastWritten; public int CredentialBlobSize;
        public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetAlias;
        [MarshalAs(UnmanagedType.LPWStr)] public string UserName;
    }
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll")]
    private static extern void CredFree(IntPtr buffer);
    public static string GetCredential(string target) {
        IntPtr ptr;
        if (CredRead(target, 1, 0, out ptr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            CredFree(ptr);
            return Encoding.UTF8.GetString(bytes);
        }
        return null;
    }
}
'@
Add-Type -TypeDefinition $code
[CredManager]::GetCredential('Supabase CLI:supabase')
`;

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell.exe', ['-Command', psScript]);
    let output = '';
    let error = '';

    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    ps.stderr.on('data', (data) => {
      error += data.toString();
    });

    ps.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        reject(new Error(`Failed to extract access token: ${error || 'No output'}`));
      }
    });
  });
}

async function runSQL(accessToken, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

async function main() {
  try {
    console.log('Extracting Supabase access token from Windows Credential Manager...');
    const accessToken = await getAccessToken();
    console.log('✓ Access token retrieved\n');

    console.log('Creating creator_requests table...');
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
    await runSQL(accessToken, createTableSQL);
    console.log('✓ Table created\n');

    console.log('Creating index on status...');
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_creator_requests_status
      ON public.creator_requests(status, created_at);
    `;
    await runSQL(accessToken, createIndexSQL);
    console.log('✓ Index created\n');

    console.log('Enabling Row Level Security...');
    const enableRLSSQL = `ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;`;
    await runSQL(accessToken, enableRLSSQL);
    console.log('✓ RLS enabled\n');

    console.log('Creating RLS policies...');
    const createPoliciesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "allow_insert_requests" ON public.creator_requests;
      DROP POLICY IF EXISTS "allow_select_own_requests" ON public.creator_requests;
      DROP POLICY IF EXISTS "allow_select_status_anon" ON public.creator_requests;

      -- Create new policies
      CREATE POLICY "allow_insert_requests" ON public.creator_requests
        FOR INSERT TO anon, authenticated
        WITH CHECK (true);

      CREATE POLICY "allow_select_own_requests" ON public.creator_requests
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "allow_select_status_anon" ON public.creator_requests
        FOR SELECT TO anon
        USING (status IN ('pending', 'completed'));
    `;
    await runSQL(accessToken, createPoliciesSQL);
    console.log('✓ RLS policies created\n');

    console.log('✅ Creator requests table setup complete!');
    console.log('\nYou can now test the Request Creator feature on the search page.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
