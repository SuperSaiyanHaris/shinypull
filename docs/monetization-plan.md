# ShinyPull Monetization Plan

## Phase 0 (Now): Display Ads via Google AdSense

Site is under 1 month old. AdSense is the right starting point — instant approval, no traffic minimum, one script tag. RPM will be low (~$1-3) but it's passive income while the site grows, and it establishes the "no ads" upgrade incentive for subscriptions.

Place ads on:
- Rankings pages (sidebar, between rows)
- Creator profile pages (below header, between sections)
- Blog posts (inline, end of post)

**Ad network progression as traffic grows:**
1. **Now (new site):** Google AdSense — zero barrier, get it running
2. **At 10K sessions:** Apply to Carbon Ads (developer/creator audience is a strong fit). Switch to Monumetric if rejected (~$99 setup fee, better RPM than AdSense)
3. **At 50K sessions:** Migrate to Mediavine — best RPM in the industry for content sites (~$15-25 RPM), meaningful revenue

Skip Ezoic — bad reputation for destroying PageSpeed scores. ShinyPull is at mobile 85/desktop 96 and that matters for SEO.

"No ads" becomes a core Pro/Agency perk — natural upgrade incentive for users who find the ads annoying.

---

## Revenue Stream 1: User Subscriptions (B2C)

### Free
- Follow up to **5 creators**
- Compare **2 creators** at a time
- **30 days** of stat history on charts
- View rankings (with display ads + sponsored slots)
- Basic search

### Pro — ~$6/month
The analytics nerd tier.
- **No ads**
- Follow up to **100 creators**
- Compare up to **5 creators**
- **1 year** of stat history
- **CSV export** of any creator's stats
- **Milestone alerts** — email when a followed creator hits a round number
- Dashboard with followed creator feed

### Agency — ~$20/month
Targets creator managers, MCNs, brand partnership teams.
- **No ads**
- **Unlimited** follows
- Compare up to **10 creators**
- **Full history** (everything we have)
- **1 featured listing slot** per month (bundled in)
- Bulk CSV export (multiple creators at once)
- White-label shareable profile links (clean URL, no nav)

---

## Revenue Stream 2: Featured Listings (B2B — the AD slots)

Separate product. Creators, managers, or brands pay to insert their channel into relevant rankings pages (like vqv.app).

**How it works:**
- Every 5th row in rankings is a "Sponsored" slot
- Purchaser picks a platform + category (e.g. "Twitch Gaming", "YouTube Cooking")
- Card looks identical to normal cards with a small "Sponsored" badge
- Monthly flat fee: $49/month for one slot, $149/month for three slots
- Agency tier subscribers get 1 slot bundled

**Why native over banner ads:**
- No ad blocker risk — it's a DB row, not a script
- Directly targets people browsing that platform's rankings
- Looks like real content

---

## Revenue Stream 3: Affiliate (Already Live)

Blog product embeds via `{{product:slug}}`. Keep growing this passively.

---

## Implementation Stack

**Stripe:** Checkout + Customer Portal for self-serve upgrades/cancellations. Webhooks update Supabase.

**Database changes needed:**
```sql
-- users table additions
subscription_tier      text  DEFAULT 'free'   -- 'free' | 'pro' | 'agency'
subscription_status    text  DEFAULT 'active'  -- 'active' | 'past_due' | 'canceled'
stripe_customer_id     text
stripe_subscription_id text

-- new table for featured listings
featured_listings (
  id, creator_id, platform, category,
  active_from, active_until,
  purchased_by_user_id, stripe_payment_id
)
```

**Feature gate pattern:** A `useSubscription()` hook that reads tier from user context and exposes helpers like `canFollow()`, `maxCompare()`, `hasExport()`, `isAdFree()`. Every gated UI element checks this — no scattered conditionals.

**Ad placement logic:** AdSense script injected globally in `index.html`. Ad slot components wrapped in a check for `isAdFree()` — if Pro/Agency, the component returns null and no ad renders. No need to coordinate with the ad network.

**Rankings injection logic:** Second query pulls active `featured_listings` for that platform. Client inserts them at positions 5, 10, 15... before rendering. Pure frontend — server just returns the list.

---

## Rollout Order

1. **Phase 0: Google AdSense** — sign up, paste script, immediate passive revenue (upgrade to Carbon/Monumetric at 10K, Mediavine at 50K)
2. **Stripe subscriptions** — tier gates on follows/compare/history + ad-free perk
3. **Featured listings** — admin UI to manage slots + creator outreach
4. **Milestone alerts** — GitHub Actions cron checking thresholds (most dev work)

---

*Created: 2026-02-26*
