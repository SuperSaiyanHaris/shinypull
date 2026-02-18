# Creator Spotlight - Feature Spec

> **Status:** Planning only. Build when site reaches 5K-10K monthly visits.

## Overview

Paid feature where creators can purchase a "Spotlight" placement on ShinyPull. Animated, visually striking cards that showcase their profile with links to their platforms.

## Launch Strategy

1. **Phase 1 (5K-10K visits/mo):** Build the feature. Offer FREE spotlights to 3-5 mid-tier creators (100K-500K followers) already in the DB. Reach out directly. This creates social proof and potential viral sharing.
2. **Phase 2 (25K+ visits/mo):** Flip to paid via Stripe. Keep 1-2 free spotlights as examples alongside paid ones.

## Tier Structure

| Tier | Name | Price/mo | Features |
|------|------|----------|----------|
| 1 | Spotlight | $9/mo | Animated card on homepage, profile photo, name, 1-line bio, up to 4 platform links, "Featured Creator" badge on their ShinyPull profile page |
| 2 | Spotlight Pro | $19/mo | Tier 1 + pinned to top of their platform's Rankings page, custom banner/background color on their ShinyPull profile |
| 3 | Spotlight Elite | $39/mo | Tier 2 + featured in a dedicated "Creator Spotlight" blog post (we write it), shared on socials, spotlight appears on ALL platform ranking pages (not just their primary) |

All tiers include all their platform links (no limit by tier).

## Placement

### Desktop
- **Homepage:** Dedicated "Creator Spotlight" section below platform pills, above the features section. 1-3 rotating spotlight cards with entrance animations.
- **Rankings pages:** Tier 2+ spotlights pinned at top of their primary platform's rankings. Tier 3 appears on all rankings pages.
- **Creator profile:** "Featured Creator" badge next to their name (all tiers).

### Mobile
- **Homepage:** Horizontal swipeable card between search/platform pills and features section. Single card visible at a time with dot indicators.
- **Rankings:** Compact spotlight banner at top of list.

## UI Design Notes

### Spotlight Card (Homepage)
- Glass-morphism card with subtle gradient border animation
- Profile image (rounded, with glow effect matching their primary platform color)
- Display name + 1-line custom bio (creator writes this)
- Platform icon links (YouTube, TikTok, Twitch, Kick) — only the ones they choose
- Follower/subscriber count pulled live from our DB
- Subtle shimmer/pulse animation to draw attention without being obnoxious
- "Featured Creator" label with sparkle icon

### Animation Ideas
- Card entrance: slide-in from side with slight scale-up
- Idle: gentle floating/breathing animation (translateY oscillation)
- Platform icons: subtle bounce on hover
- Border: animated gradient rotation (conic-gradient spin)
- Transition between multiple spotlights: crossfade or carousel

## Database Schema

```sql
-- New table
creator_spotlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  bio TEXT, -- 1-line custom bio (max 120 chars)
  platform_links JSONB, -- e.g. {"youtube": "https://...", "tiktok": "https://..."}
  background_color TEXT, -- Tier 2+: custom card accent color
  stripe_subscription_id TEXT, -- Stripe subscription reference
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = ongoing subscription
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public read, service_role write
-- SELECT: TO anon, authenticated USING (is_active = true)
-- INSERT/UPDATE/DELETE: service_role only (via API)
```

## API Endpoints (Vercel Serverless)

```
POST /api/spotlight/checkout   — Create Stripe checkout session for selected tier
POST /api/spotlight/webhook    — Stripe webhook: activate/deactivate on payment events
GET  /api/spotlight/active     — Public: fetch active spotlights for homepage/rankings
POST /api/spotlight/update     — Authenticated: update bio/links for own spotlight
```

## Stripe Integration

- Use Stripe Checkout for payment (already have Stripe set up)
- 3 Products in Stripe: Spotlight ($9/mo), Spotlight Pro ($19/mo), Spotlight Elite ($39/mo)
- Handle `checkout.session.completed` webhook to activate
- Handle `customer.subscription.deleted` webhook to deactivate
- Handle `invoice.payment_failed` to flag/grace period

## CTA / Purchase Flow

1. User sees "Want to be featured?" CTA on homepage (below spotlights section or in footer area)
2. Clicks through to `/spotlight` page
3. Page shows tier comparison cards with features, pricing, and current spotlight examples
4. User selects tier → redirected to Stripe Checkout
5. On payment success → spotlight activates, they can set bio/links via their dashboard
6. Spotlight appears on site within minutes

## Files to Create When Building

```
src/pages/Spotlight.jsx           — Tier selection & purchase page
src/components/SpotlightCard.jsx  — The animated spotlight card component
src/components/SpotlightCTA.jsx   — "Want to be featured?" call-to-action
src/services/spotlightService.js  — Supabase CRUD for spotlights
api/spotlight/checkout.js         — Stripe checkout endpoint
api/spotlight/webhook.js          — Stripe webhook handler
api/spotlight/active.js           — Public API to fetch active spotlights
api/spotlight/update.js           — Update own spotlight details
```

## Routes to Add

| Path | Component | Description |
|------|-----------|-------------|
| `/spotlight` | Spotlight | Tier selection & purchase page |

## Content for the Spotlight Page

- Hero: "Get Featured on ShinyPull" with animated preview of what a spotlight looks like
- Social proof: "Join X creators already being featured" (once we have some)
- Tier comparison cards (side by side)
- FAQ section: How long does it take? Can I change my bio? What platforms can I link?
- CTA buttons per tier → Stripe Checkout

## Open Questions (Decide Before Building)

- [ ] Should spotlights rotate/carousel on homepage or show all at once?
- [ ] Max number of active spotlights at any time? (Scarcity = higher perceived value)
- [ ] Should free-tier users see spotlights or only logged-out visitors?
- [ ] Do we need an admin panel to manage/approve spotlights, or auto-activate on payment?
- [ ] Should the creator need to already exist in our DB, or can anyone purchase?
