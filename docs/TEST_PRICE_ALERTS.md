# Testing Price Alert System

## Step 1: Find a Test Card

Run this in **Supabase SQL Editor**:

```sql
-- Find cards with outdated prices (or just pick any popular card)
SELECT c.id, c.name, c.set_id, p.tcgplayer_market, p.last_updated
FROM cards c
JOIN prices p ON c.id = p.card_id
WHERE p.tcgplayer_market > 0
ORDER BY p.last_updated ASC
LIMIT 10;
```

Or just use a popular card like:
```sql
SELECT id, name FROM cards WHERE name ILIKE '%charizard%' LIMIT 5;
```

## Step 2: Create a Test Alert

**Option A: Via SQL** (replace with your user_id and card_id):

```sql
INSERT INTO price_alerts (
  user_id,
  card_id,
  card_name,
  target_price,
  alert_type,
  check_frequency,
  start_date,
  is_active
) VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user ID
  'base1-4',  -- Replace with a real card ID
  'Charizard',  -- Card name
  50.00,  -- Target price (set low to trigger easily)
  'below',  -- Alert when price goes below this
  1,  -- Check every 1 hour
  NOW(),  -- Start immediately
  true
);
```

**Option B: Via your app** (if you have the UI working):
- Go to a card detail page
- Click "Set Price Alert"
- Set target price low (so it triggers)
- Set frequency to 1 hour

## Step 3: Run the Check-Alerts Function Manually

In **Supabase SQL Editor**:

```sql
-- This will trigger the check-alerts Edge Function
SELECT net.http_post(
  url := 'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer [ROTATED_SERVICE_ROLE_KEY]'
  ),
  body := '{}'::jsonb
);
```

## Step 4: Check Results

### View Alert Status:
```sql
SELECT * FROM price_alerts WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;
```

### Check Edge Function Logs:
Go to: **Supabase Dashboard → Edge Functions → check-alerts → Logs**

Look for:
- "Checking X active alerts..."
- "Alert triggered for [card]: $X.XX below $Y.YY"
- Or "Skipping alert: Only Xh since last check"

## Step 5: Verify Email (if enabled)

Check your email for the alert notification. If you don't receive one, check:

1. **Email service configured?** The function uses Supabase Auth emails
2. **User email verified?** Check in Supabase Dashboard → Authentication → Users

## Common Issues

### Issue: "No active alerts to check"
**Solution:** Make sure you created an alert with `is_active = true`

### Issue: "Skipping alert: Start date not reached"
**Solution:** Make sure `start_date` is in the past or NOW()

### Issue: "Only Xh since last check"
**Solution:** 
- Wait for the frequency period to pass, OR
- Manually update `last_checked_at` to be older:
```sql
UPDATE price_alerts 
SET last_checked_at = NOW() - INTERVAL '2 hours'
WHERE id = 'YOUR_ALERT_ID';
```

### Issue: Alert not triggering
**Solution:** Check your target price and alert type:
- `alert_type = 'below'`: triggers when current price ≤ target
- `alert_type = 'above'`: triggers when current price ≥ target
- Set target price to guarantee trigger (e.g., $0.01 for 'above')

## Quick Test Setup

Here's a complete test that should definitely trigger:

```sql
-- 1. Find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- 2. Create an alert that will definitely trigger
INSERT INTO price_alerts (
  user_id,
  card_id,
  card_name,
  target_price,
  alert_type,
  check_frequency,
  start_date,
  is_active,
  current_price
) VALUES (
  'YOUR_USER_ID',
  'base1-4',
  'Charizard',
  0.01,  -- Very low price
  'above',  -- Will trigger since real price is above $0.01
  1,
  NOW() - INTERVAL '2 hours',  -- Start in the past
  true,
  NULL  -- Will be fetched
);

-- 3. Run the check
SELECT net.http_post(
  url := 'https://ziiqqbfcncjdewjkbvyq.supabase.co/functions/v1/check-alerts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer [ROTATED_SERVICE_ROLE_KEY]'
  ),
  body := '{}'::jsonb
);

-- 4. Check if it triggered
SELECT * FROM price_alerts WHERE user_id = 'YOUR_USER_ID';
```

## Current Cron Schedule

The check-alerts function runs automatically every hour. To view/modify:

**Supabase Dashboard → Database → Cron Jobs**

Current schedule should be:
```sql
SELECT cron.schedule(
  'check-price-alerts',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(...)
  $$
);
```
