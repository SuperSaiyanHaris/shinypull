# Price Alerts Feature

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of supabase-alerts-schema.sql
# Paste into Supabase Dashboard > SQL Editor > New Query
# Run the query to create the table and policies
```

### 2. Environment Variables

Add these to your Vercel environment variables:

```bash
# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cron Secret (generate a random string for security)
CRON_SECRET=your_random_secret_here

# Optional: Pokemon TCG API Key (for better rate limits)
POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key
```

To find your Supabase Service Role Key:
1. Go to Supabase Dashboard
2. Project Settings > API
3. Copy the `service_role` key (not the `anon` key)

### 3. Vercel Cron Job

The cron job is configured in `vercel.json` to run daily at midnight UTC:

```json
"crons": [
  {
    "path": "/api/check-alerts",
    "schedule": "0 0 * * *"
  }
]
```

**Important:** Cron jobs are only available on Vercel Pro plans. If you're on the Hobby plan, you can:
- Manually trigger: `curl -X GET https://your-domain.com/api/check-alerts -H "Authorization: Bearer YOUR_CRON_SECRET"`
- Use a third-party cron service like cron-job.org
- Upgrade to Vercel Pro

### 4. Email Notifications (TODO)

Currently, the check-alerts endpoint logs when alerts are triggered but doesn't send emails yet. To complete email functionality:

**Option 1: Supabase Edge Functions with Resend**
1. Set up a Supabase Edge Function
2. Use Resend for email delivery
3. Create a custom email template (see template below)

**Option 2: SendGrid/Mailgun**
1. Add API key to environment variables
2. Update `sendAlertEmail()` in `api/check-alerts.js`
3. Use the email template provided

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
4. **Cron Job:** check-alerts.js runs daily to check prices and trigger notifications
5. **Email:** (TODO) Send notification when alert is triggered

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

3. **Test cron job locally:**
   ```bash
   # In api/check-alerts.js, temporarily set authorization check to always pass
   # Then run:
   curl -X GET http://localhost:5173/api/check-alerts -H "Authorization: Bearer test"
   ```

### Production Testing

1. Deploy to Vercel
2. Add environment variables
3. Manually trigger cron:
   ```bash
   curl -X GET https://shinypull.com/api/check-alerts -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Future Enhancements

- [ ] Email notifications (Resend/SendGrid integration)
- [ ] Push notifications (web push API)
- [ ] SMS alerts (Twilio integration)
- [ ] Price drop percentage alerts ("Alert when price drops 20%")
- [ ] Price history tracking
- [ ] Alert frequency settings (daily, weekly, instant)
- [ ] Alert expiration dates
- [ ] Batch alert creation (alert for all cards in a set)
