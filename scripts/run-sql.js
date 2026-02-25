/**
 * Run arbitrary SQL against the live Supabase database via the Management API.
 *
 * This is the ONLY way to run DDL (CREATE TABLE, ALTER, DROP, CREATE POLICY, etc.)
 * from scripts. The Supabase JS client uses PostgREST and cannot run DDL.
 *
 * Usage:
 *   node scripts/run-sql.js "SELECT 1"
 *   node scripts/run-sql.js "CREATE POLICY ..."
 *   node scripts/run-sql.js "$(cat my-migration.sql)"
 *
 * Token source:
 *   The Supabase CLI access token is read at runtime from Windows Credential Manager
 *   (stored there by `npx supabase login`). Nothing is stored in this file.
 *   No token = no credentials = safe to commit.
 *
 * If the token lookup fails, run: npx supabase login
 */

import { execFileSync, spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

const sql = process.argv.slice(2).join(' ');
if (!sql.trim()) {
  console.error('Usage: node scripts/run-sql.js "YOUR SQL HERE"');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Extract access token from Windows Credential Manager at runtime.
// Writes a temp .ps1 to the system temp dir (NOT the repo), executes it,
// then deletes it immediately. No token is stored on disk after this block.
// ---------------------------------------------------------------------------
function getSupabaseToken() {
  const ps1 = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManagerHelper {
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
    private static extern bool CredRead(string target, int type, int flags, out IntPtr ptr);
    [DllImport("advapi32.dll")]
    private static extern void CredFree(IntPtr ptr);
    public static string Get(string target) {
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
[CredManagerHelper]::Get("Supabase CLI:supabase")
`;

  const tmpFile = join(tmpdir(), `supabase-token-${Date.now()}.ps1`);
  try {
    writeFileSync(tmpFile, ps1, 'utf8');
    const result = spawnSync('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NonInteractive',
      '-File', tmpFile,
    ], { encoding: 'utf8', timeout: 10000 });

    const token = (result.stdout || '').replace(/\r?\n/g, '').trim();
    if (!token) {
      console.error('Could not read Supabase token from Windows Credential Manager.');
      console.error('Run `npx supabase login` first, then retry.');
      process.exit(1);
    }
    return token;
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Execute SQL via the Management API
// ---------------------------------------------------------------------------
async function runSQL(token, query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API error ${res.status}: ${text}`);
  }

  return JSON.parse(text);
}

const token = getSupabaseToken();
runSQL(token, sql)
  .then((rows) => {
    if (Array.isArray(rows) && rows.length > 0) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('OK (no rows returned)');
    }
  })
  .catch((err) => {
    console.error('SQL error:', err.message);
    process.exit(1);
  });
