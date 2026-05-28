/**
 * List Supabase project backups + Point-in-Time recovery (PITR) availability.
 * Uses the Management API + the same Windows Credential Manager token mechanism
 * that scripts/run-sql.js uses.
 *
 * Usage:
 *   node scripts/list-backups.js
 */

import { spawnSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

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
      console.error('Could not read Supabase token. Run `npx supabase login`.');
      process.exit(1);
    }
    return token;
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

async function api(token, path) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text };
}

async function main() {
  const token = getSupabaseToken();

  console.log('\n=== Project info ===');
  const proj = await api(token, '');
  if (proj.ok) {
    const j = JSON.parse(proj.body);
    console.log('Name:', j.name);
    console.log('Region:', j.region);
    console.log('Tier:', j.subscription_tier || '(not exposed)');
    console.log('Status:', j.status);
    console.log('Created:', j.created_at);
  } else {
    console.log('status', proj.status, proj.body);
  }

  console.log('\n=== Backups (logical / dump-based) ===');
  const backups = await api(token, '/database/backups');
  console.log('status', backups.status);
  if (backups.ok) {
    try {
      const j = JSON.parse(backups.body);
      console.log(JSON.stringify(j, null, 2));
    } catch {
      console.log(backups.body);
    }
  } else {
    console.log(backups.body);
  }

  console.log('\n=== PITR / WAL based recovery ===');
  const pitr = await api(token, '/database/backups/info');
  console.log('status', pitr.status);
  if (pitr.ok || pitr.status === 200) {
    try {
      const j = JSON.parse(pitr.body);
      console.log(JSON.stringify(j, null, 2));
    } catch {
      console.log(pitr.body);
    }
  } else {
    console.log(pitr.body);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
