# GitHub Actions Budget Optimization

## Problem
Current usage: ~4,560 minutes/month
Free tier limit: 2,000 minutes/month
Overage: 2,560 minutes/month (~128% over budget)

## Optimized Schedule (stays within 2,000 min/month)

### Stream Monitors (biggest savings)
**Current:** Every hour (24x daily) = 3,600 min/month for both
**New:** Every 3 hours (8x daily) = 480 min/month for both
- Twitch: 0, 3, 6, 9, 12, 15, 18, 21 UTC
- Kick: 1, 4, 7, 10, 13, 16, 19, 22 UTC (offset by 1 hour)
- **Savings: 3,120 minutes/month**

### Creator Discovery
**Current:** 6x daily = 720 min/month
**New:** 4x daily = 480 min/month
- 0, 6, 12, 18 UTC (every 6 hours)
- **Savings: 240 minutes/month**

### Stats Collection
**Keep:** 2x daily = 240 min/month
- Still plenty for tracking trends
- **No change**

### Instagram Collection (NEW)
**Add:** 2x daily = 240 min/month
- Slow scraping: 10-20 profiles per run
- 6, 18 UTC (same schedule as stats)
- **Cost: 240 minutes/month**

## New Total: 1,440 minutes/month
✅ Within 2,000 minute budget
✅ 560 minutes safety margin (28%)

## Impact
- Stream data: Every 3 hours (still fresh for "hours watched")
- Discovery: 4x daily (still aggressive growth)
- Stats: 2x daily (unchanged)
- Instagram: 2x daily (20-40 new profiles/day)
