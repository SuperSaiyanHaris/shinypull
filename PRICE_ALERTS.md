# Price Alerts Feature

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of supabase-alerts-schema.sql
# Paste into Supabase Dashboard > SQL Editor > New Query
# Run the query to create the table and policies
```

### 2. Deploy Edge Function

Deploy the check-alerts function to Supabase:

```bash
# From the project root
supabase functions deploy check-alerts
```

### 3. Set Edge Function Secrets

Add environment variables for the Edge Function:

```bash
# Set Pokemon TCG API Key (optional, for better rate limits)
supabase secrets set POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key

# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available
```

### 4. Configure Supabase Cron Job

Set up a daily cron job in Supabase:

1. Go to Supabase Dashboard
2. Database > Extensions > Enable `pg_cron`
3. Go to SQL Editor and run:

```sql
-- Create a cron job to run check-alerts daily at midnight UTC
SELECT cron.schedule(
  'check-price-alerts-daily',
  '0 0 * * *', -- Run at midnight UTC every day
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-alerts',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- View all scheduled jobs
SELECT * FROM cron.job;

-- To remove the job later (if needed):
-- SELECT cron.unschedule('check-price-alerts-daily');
```

**Note:** Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (found in Project Settings > API > Project URL)

### 5. Email Notifications (TODO)

Currently, the check-alerts function logs when alerts are triggered but doesn't send emails yet. To complete email functionality:

**Option 1: Resend (Recommended)**
1. Sign up for Resend and get API key
2. Set the secret: `supabase secrets set RESEND_API_KEY=your_key`
3. Uncomment the Resend code in `supabase/functions/check-alerts/index.ts`
4. Verify sender domain in Resend dashboard

**Option 2: SendGrid/Mailgun**
1. Get API key from your email service
2. Set the secret in Supabase
3. Update the `sendAlertEmail()` function with your service's API

### Email Template

```html
Subject: 🔔 Price Alert: {{card_name}}

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 20px;">
  <div style="text-align: center; padding: 20px 0;">
    <h1 style="color: #fbbf24; margin: 0;">ShinyPull Alert</h1>
  </div>
  
  <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 30px;">
    <h2 style="color: #fbbf24; margin: 0 0 16px 0;">{{card_name}}</h2>
    
    <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px 0;">
      Your price alert has been triggered!
    </p>
    
    <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px 0;">Current Price</p>
      <p style="color: #4ade80; font-size: 32px; font-weight: bold; margin: 0;">${{current_price}}</p>
      <p style="color: #a3a3a3; font-size: 14px; margin: 8px 0 0 0;">
        Alert was set for prices {{alert_type}} ${{target_price}}
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{card_url}}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0a0a0a; font-size: 16px; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px;">
        View Card
      </a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px 0; color: #737373; font-size: 13px;">
    <p style="margin: 0;">You're receiving this because you set a price alert on ShinyPull</p>
  </div>
</div>
```

## How It Works

### User Flow

1. User opens a card modal
2. Clicks "Set Alert" button
3. Chooses alert type (below/above) and target price
4. Alert is saved to database
5. Daily cron job checks all active alerts
6. If price threshold is met, user receives email notification

### Technical Flow

1. **Frontend:** PriceAlertButton component handles UI and alert creation
2. **Service Layer:** alertService.js manages CRUD operations with Supabase
3. **Database:** price_alerts table stores all user alerts with RLS policies
4. **Supabase Cron:** pg_cron triggers the Edge Function daily at midnight
5. **Edge Function:** check-alerts function checks prices and sends notifications
6. **Email:** (TODO) Send notification via Resend/SendGrid when alert is triggered

### Alert Management

Users can manage their alerts from:
- **Header Menu:** "My Alerts" link (requires sign-in)
- **Alerts Page:** View all alerts, toggle active/inactive, delete alerts
- **CardModal:** See existing alerts for a card, create new ones

### Database Schema

```sql
price_alerts (
  id: UUID (PK)
  user_id: UUID (FK to auth.users)
  card_id: TEXT
  card_name: TEXT
  card_image: TEXT
  card_set: TEXT
  target_price: DECIMAL
  alert_type: TEXT ('below' | 'above')
  is_active: BOOLEAN
  last_triggered_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

## Testing

### Manual Testing

1. **Create an alert:**
   - Sign in
   - Open any card modal
   - Click "Set Alert"
   - Set a target price (use current price ± $5 for easy testing)
   - Submit

2. **View alerts:**
   - Click your profile icon
   - Select "My Alerts"
   - Verify your alert appears

3. **Test Edge Function locally:**
   ```bash
   # Start Supabase locally
   supabase start
   
   # Serve the function locally
   supabase functions serve check-alerts
   
   # In another terminal, invoke it
   curl -i --location --request POST 'http://localhost:54321/functions/v1/check-alerts' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json'
   ```

### Production Testing

1. Deploy the Edge Function:
   ```bash
   supabase functions deploy check-alerts
   ```

2. Manually invoke the function:
   ```bash
   curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-alerts' \
     --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     --header 'Content-Type: application/json'
   ```

3. Check function logs in Supabase Dashboard:
   - Go to Edge Functions > check-alerts > Logs

## Future Enhancements

- [ ] Email notifications (Resend/SendGrid integration)
- [ ] Push notifications (web push API)
- [ ] SMS alerts (Twilio integration)
- [ ] Price drop percentage alerts ("Alert when price drops 20%")
- [ ] Price history tracking
- [ ] Alert frequency settings (daily, weekly, instant)
- [ ] Alert expiration dates
- [ ] Batch alert creation (alert for all cards in a set)
