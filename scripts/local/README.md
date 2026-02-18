# Local TikTok Automation

TikTok profile refresh now runs via **GitHub Actions** (2x daily). Local scripts are kept as a fallback if GitHub Actions gets rate-limited.

## Scripts

- **`refresh-tiktok.bat`** - Manually refresh ALL TikTok profiles (fallback)
- **`discover-tiktok.bat`** - Discovers new creators from curated list

## Normal Operation

TikTok profile refresh runs automatically via GitHub Actions:
- **9 PM EST** (02:00 UTC)
- **9 AM EST** (14:00 UTC)

Creator requests also run via GitHub Actions (4x daily). No local scripts needed for regular operation.

## When to Run Locally

Only run the local scripts if:
- GitHub Actions is getting 429 errors from TikTok (check Actions logs)
- You need to refresh profiles immediately without waiting for the schedule
- You want to run discovery for new creators

## Manual Running

- Double-click `refresh-tiktok.bat` to refresh all profiles
- Double-click `discover-tiktok.bat` to discover new creators

## Troubleshooting

**Getting 429 errors on GitHub Actions:**
- TikTok may be temporarily rate-limiting Azure IPs
- Run locally as a fallback (residential IP)
- Check again next scheduled run — usually recovers quickly

**Script crashes locally:**
- Check `.env` file exists in `d:\Claude\ShinyPull`
- Verify `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Run manually to see full error output
