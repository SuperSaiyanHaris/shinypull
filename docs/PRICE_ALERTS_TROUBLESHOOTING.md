# Price Alerts Troubleshooting Guide

## Issue: Emails Not Being Sent

### Step 1: Check Active Alerts in Database
Run this query in Supabase SQL Editor:
```sql
SELECT 
  id, 
  card_name, 
  target_price, 
  alert_type, 
  is_active,
  start_date,
  last_checked_at,
  last_triggered_at,
  current_price,
  check_frequency
FROM price_alerts 
WHERE is_active = true;
```

**What to check:**
- Are there any active alerts?
- Has `start_date` already passed?
- Is `check_frequency` hours elapsed since `last_checked_at`?
- Does `current_price` meet the threshold?

### Step 2: Deploy Edge Function
```powershell
# Make sure you're logged in
supabase login

# Deploy the function
supabase functions deploy check-alerts --project-ref ziiqqbfcncjdewjkbvyq
```

### Step 3: Configure Environment Variables
In Supabase Dashboard → Edge Functions → check-alerts → Settings:

**Required Secrets:**
1. `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
2. `POKEMON_TCG_API_KEY` - Your Pokemon TCG API key (optional but recommended)

**To set via CLI:**
```powershell
supabase secrets set RESEND_API_KEY=re_your_key_here --project-ref ziiqqbfcncjdewjkbvyq
supabase secrets set POKEMON_TCG_API_KEY=your_pokemon_key_here --project-ref ziiqqbfcncjdewjkbvyq
```

### Step 4: Fix Cron Job Authorization

Your current cron job uses a **publishable key** which is wrong. Update it:

**Option A: Use Service Role Key (Recommended)**
```sql
SELECT net.http_post(
  url := 'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
  ),
  body := '{}'::jsonb
);
```

**Option B: Use Anon Key**
```sql
SELECT net.http_post(
  url := 'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_ANON_KEY_HERE'
  ),
  body := '{}'::jsonb
);
```

**Where to find keys:**
- Dashboard → Settings → API
- Service Role Key: Secret, never expose client-side
- Anon Key: Public key, safe for client use

### Step 5: Test Function Manually

**Via Supabase Dashboard:**
1. Go to Edge Functions → check-alerts
2. Click "Invoke Function"
3. Check the logs for detailed output

**Via curl:**
```powershell
curl -X POST `
  'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts' `
  -H 'Authorization: Bearer YOUR_ANON_OR_SERVICE_KEY' `
  -H 'Content-Type: application/json' `
  -d '{}'
```

### Step 6: Check Function Logs

In Supabase Dashboard → Edge Functions → check-alerts → Logs:

**Look for:**
- ✅ "Checking X active alerts..."
- ✅ "Alert triggered for [card]: $X below/above $Y"
- ✅ "Email sent successfully to [email]"
- ❌ "No active alerts to check"
- ❌ "RESEND_API_KEY not configured"
- ❌ "Resend API error: XXX"

### Step 7: Verify Resend Configuration

1. Log into https://resend.com
2. Check API Keys → Make sure key is active
3. Check Domains → Verify `shinypull.com` is verified
   - If not verified, you can still send from `onboarding@resend.dev` for testing
4. Check if you're within free tier limits (3,000 emails/month)

**Test with temporary "from" address:**
If domain not verified, temporarily change in code:
```typescript
from: 'ShinyPull Alerts <onboarding@resend.dev>',  // Instead of alerts@shinypull.com
```

### Step 8: Test Email Manually

Create a simple test alert via your UI:
1. Find a card with known price (e.g., $10)
2. Set alert: "Below $15" (should trigger immediately)
3. Set `check_frequency: 1` (check every hour)
4. Set `start_date` to yesterday
5. Wait for cron or trigger manually

### Step 9: Check Cron Job Status

```sql
-- View pg_cron jobs
SELECT * FROM cron.job;

-- View recent cron job runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "No active alerts" | Create test alert with guaranteed trigger conditions |
| "RESEND_API_KEY not configured" | Set secret via `supabase secrets set` |
| "Resend API error: 403" | Check API key is valid and not expired |
| "Resend API error: 422" | Domain not verified, use `onboarding@resend.dev` |
| Function returns success but no email | Check Resend dashboard for delivery status |
| Cron runs but function not triggered | Fix authorization header in cron job |
| Price always null | Check Pokemon TCG API key is set |

### Quick Test Script

Run this to manually trigger an alert check:

```powershell
# Test the function
$headers = @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
    -Uri "https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts" `
    -Method POST `
    -Headers $headers `
    -Body "{}"

$response | ConvertTo-Json -Depth 10
```

### Debug Checklist

- [ ] Edge Function deployed (`supabase functions deploy check-alerts`)
- [ ] `RESEND_API_KEY` secret configured
- [ ] At least one active alert exists in database
- [ ] Alert `start_date` is in the past
- [ ] Alert `check_frequency` time has elapsed
- [ ] Cron job using correct authorization (service role or anon key)
- [ ] Function logs show alerts being checked
- [ ] Resend dashboard shows email sent (or error)
- [ ] Check spam folder for test emails

### Next Steps After Fixing

1. Test with one alert first
2. Monitor logs for 24 hours
3. Verify emails arrive in inbox (check spam)
4. Gradually add more alerts
5. Set up proper domain verification for production emails
