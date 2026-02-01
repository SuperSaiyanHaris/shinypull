# GitHub Actions Setup

## Configure Secrets

Go to your GitHub repo settings and add these secrets:

**Repository Settings → Secrets and variables → Actions → New repository secret**

Add each of these:

```
VITE_SUPABASE_URL
Value: https://ziiqqbfcncjdewjkbvyq.supabase.co

SUPABASE_SERVICE_ROLE_KEY
Value: [ROTATED_SERVICE_ROLE_KEY]

VITE_YOUTUBE_API_KEY
Value: [ROTATED_YOUTUBE_API_KEY]

VITE_TWITCH_CLIENT_ID
Value: [Your Twitch Client ID from .env]

VITE_TWITCH_CLIENT_SECRET
Value: [Your Twitch Client Secret from .env]
```

## Workflow Details

- **Schedule:** Runs daily at 00:00 UTC (midnight)
- **Manual Trigger:** Can run manually from Actions tab → "Daily Stats Collection" → Run workflow
- **First Run:** Will happen automatically after secrets are configured

## Testing

Test the workflow manually before waiting for the cron:
1. Push this commit
2. Go to GitHub → Actions tab
3. Click "Daily Stats Collection" workflow
4. Click "Run workflow" dropdown → Run workflow

## Monitoring

View workflow runs:
- GitHub repo → Actions tab → Daily Stats Collection
- See logs, success/failure status, and timing
