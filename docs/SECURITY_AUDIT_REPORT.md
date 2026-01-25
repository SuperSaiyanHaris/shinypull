# 🔒 Security Audit Report - ShinyPull
**Date:** January 24, 2026  
**Auditor:** GitHub Copilot Security Review  
**Scope:** Full application security review including code, Supabase, and Vercel integrations

---

## Executive Summary

This comprehensive security audit examined the ShinyPull Pokemon TCG price tracker application across multiple dimensions: API security, authentication, data handling, third-party integrations, and infrastructure configuration. The application demonstrates **generally good security practices** with several areas requiring immediate attention.

**Overall Security Rating:** ⚠️ **MEDIUM RISK** (Action Required)

---

## 🚨 CRITICAL Issues (Fix Immediately)

### 1. **Hardcoded eBay Verification Token**
**Location:** [api/ebay-deletion-notification.js](api/ebay-deletion-notification.js#L8-L9)
```javascript
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || 'shinypull_ebay_verification_token_2024_prod_secure';
```

**Risk:** High - Hardcoded fallback token in source code  
**Impact:** If environment variable is not set, the hardcoded default is used and visible in public repository  
**Recommendation:**
- ❌ **REMOVE** the hardcoded fallback string
- ✅ **FAIL** the endpoint if the environment variable is missing
- ✅ Use a cryptographically secure random token (minimum 32 characters)
- ✅ Store only in Vercel environment variables

**Fix:**
```javascript
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN;

if (!VERIFICATION_TOKEN) {
  console.error('❌ EBAY_VERIFICATION_TOKEN not configured');
  return res.status(500).json({ 
    error: 'Server configuration error - verification token not set' 
  });
}
```

### 2. **Wide-Open CORS Policy on All API Endpoints**
**Locations:** All API endpoints (ebay-prices.js, tcg-prices.js, trigger-sync.js, ebay-deletion-notification.js)
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Risk:** Medium-High - Allows any domain to call your APIs  
**Impact:**
- Any website can make requests to your API endpoints
- Potential for unauthorized price data scraping
- Increased risk of CSRF attacks
- API quota/rate limit abuse from third parties

**Recommendations:**
```javascript
// Option 1: Restrict to your domains (RECOMMENDED)
const allowedOrigins = [
  'https://shinypull.com',
  'https://www.shinypull.com',
  'https://shinypull.vercel.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5173'] : [])
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}

// Option 2: Use Vercel's built-in CORS handling
// In vercel.json:
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://shinypull.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" }
      ]
    }
  ]
}
```

### 3. **No Rate Limiting on Public API Endpoints**
**Risk:** Medium - API abuse and cost explosion  
**Impact:**
- eBay API has usage limits - abuse could get you suspended
- Vercel serverless function costs could skyrocket
- Database connection exhaustion

**Recommendations:**
- Implement rate limiting using Vercel's edge middleware or Upstash Redis
- Add IP-based throttling
- Consider API keys for legitimate third-party use

```javascript
// Example using Vercel Rate Limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export default async function handler(req, res) {
  const identifier = req.headers['x-forwarded-for'] || 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  // ... rest of handler
}
```

---

## ⚠️ HIGH Priority Issues

### 4. **Service Role Key Used in Frontend-Accessible Code**
**Location:** [api/trigger-sync.js](api/trigger-sync.js#L24)
```javascript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Risk:** High if exposed  
**Status:** ✅ Currently secure (server-side only) BUT...  
**Concern:** This endpoint has NO authentication check!

**Current Vulnerability:**
```javascript
// trigger-sync.js - ANYONE can trigger expensive sync operations
res.setHeader('Access-Control-Allow-Origin', '*');
// No auth check here!
```

**Impact:**
- Anyone can trigger full data syncs, causing:
  - Database load
  - API quota usage
  - Vercel function execution costs
  - Potential DoS attack vector

**Fix Required:**
```javascript
export default async function handler(req, res) {
  // Add authorization check
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_API_KEY;
  
  if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // OR check Supabase auth token
  const token = req.headers.authorization?.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check if user is admin (add admin role to profiles table)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // ... proceed with sync
}
```

### 5. **Weak RLS Policy - Authenticated Users Can Modify All Prices**
**Location:** [database/supabase-fix-prices-rls.sql](database/supabase-fix-prices-rls.sql#L19-L23)
```sql
CREATE POLICY "Allow authenticated users to upsert prices"
ON prices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Risk:** High - Data integrity threat  
**Impact:** ANY authenticated user can modify ALL price data in the database

**Recommendation:**
```sql
-- REMOVE the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to upsert prices" ON prices;

-- Prices should ONLY be updated by:
-- 1. Service role (Edge Functions)
-- 2. Specific backend API with server-side validation

-- Keep read access for authenticated users
CREATE POLICY "Allow authenticated users to read prices"
ON prices FOR SELECT
TO authenticated
USING (true);

-- Only service role can write
CREATE POLICY "Service role can manage prices"
ON prices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 6. **Email Validation Not Enforced in check-alerts Edge Function**
**Location:** [supabase/functions/check-alerts/index.ts](supabase/functions/check-alerts/index.ts#L209)

**Risk:** Medium - Potential email injection  
**Impact:** Could send emails to unvalidated addresses

**Recommendation:**
```typescript
// Add email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Before sending
if (!user?.email || !isValidEmail(user.email)) {
  console.error('Invalid email address:', user?.email);
  return;
}
```

---

## ⚠️ MEDIUM Priority Issues

### 7. **Missing Security Headers**
**Risk:** Medium - Various attack vectors  
**Missing Headers:**
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- Permissions-Policy

**Recommendation - Add to vercel.json:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://epnt.ebay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.pokemontcg.io https://api.ebay.com; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

### 8. **Environment Variables Exposed in Frontend Code**
**Location:** Multiple files use `import.meta.env.VITE_*`

**Risk:** Low-Medium (by design, but verify)  
**Current Exposure:**
- ✅ VITE_SUPABASE_URL - OK (public)
- ✅ VITE_SUPABASE_ANON_KEY - OK (public, RLS protects)
- ✅ VITE_POKEMON_API_KEY - OK (public API, optional key)
- ❌ **PROBLEM:** .env.example shows VITE_EBAY_* keys

**Issue in .env.example:**
```dotenv
# eBay API - THESE SHOULD NOT BE VITE_ PREFIXED!
VITE_EBAY_APP_ID=your_ebay_app_id  # ❌ WRONG - Exposed to browser
VITE_EBAY_CERT_ID=your_ebay_cert_id # ❌ WRONG - Exposed to browser
```

**Fix:**
```dotenv
# eBay API - Server-side only (NO VITE_ PREFIX)
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id

# These are set in Vercel Environment Variables, NOT in frontend
```

**Verify:**
- ✅ [api/ebay-prices.js](api/ebay-prices.js#L119-L120) correctly uses `process.env` (server-side)
- ✅ No VITE_EBAY_* usage in src/ directory

### 9. **No Input Validation on Card Search Parameters**
**Locations:** All API endpoints accepting user input

**Risk:** Medium - Potential injection, DoS  
**Current State:** Basic validation only

**Recommendation:**
```javascript
// Add comprehensive input validation
function validateCardSearchParams(params) {
  const { cardName, cardNumber, setName } = params;
  
  // Length limits
  if (cardName && cardName.length > 100) {
    throw new Error('Card name too long');
  }
  
  // Character whitelist (alphanumeric + common punctuation)
  const validPattern = /^[a-zA-Z0-9\s\-'.,&()éÉ]*$/;
  if (cardName && !validPattern.test(cardName)) {
    throw new Error('Invalid characters in card name');
  }
  
  // Card number format validation
  if (cardNumber && !/^[0-9]{1,4}(\/[0-9]{1,4})?[a-zA-Z]?$/.test(cardNumber)) {
    throw new Error('Invalid card number format');
  }
  
  return true;
}
```

### 10. **OAuth Token Caching Without Encryption**
**Location:** [api/ebay-prices.js](api/ebay-prices.js#L4-L6)

**Risk:** Low-Medium (in-memory only)  
**Current:**
```javascript
let cachedToken = null;
let tokenExpiry = 0;
```

**Concern:** Tokens in memory could be logged or exposed in error messages

**Recommendation:**
- Consider using Redis for token caching (more secure, shared across function instances)
- Ensure tokens are never logged
- Add token rotation monitoring

---

## ✅ GOOD Security Practices Found

### Authentication & Authorization
✅ **Supabase Auth properly implemented**
- Using official Supabase client libraries
- RLS policies on user-specific tables (price_alerts, user_collections)
- Auth state properly managed in React context

✅ **User data isolation**
- price_alerts table has proper RLS: `auth.uid() = user_id`
- user_collections table properly scoped

✅ **Edge Functions use service role correctly**
- check-alerts and sync-pokemon-data properly use SUPABASE_SERVICE_ROLE_KEY
- Not exposed to frontend

### Data Handling
✅ **No XSS vulnerabilities detected**
- No `dangerouslySetInnerHTML` usage
- No `eval()` or `Function()` constructors
- User input properly escaped in React components

✅ **SQL Injection protected**
- All database queries use Supabase client (parameterized)
- No raw SQL with string concatenation

✅ **Proper error handling**
- API errors don't leak sensitive information
- Generic error messages returned to clients

### Third-Party Integrations
✅ **eBay API OAuth 2.0 properly implemented**
- Client credentials flow correct
- Token caching for performance
- Credentials stored server-side only

✅ **Pokemon TCG API used correctly**
- Optional API key (not required)
- Proper rate limiting in ebayService.js

✅ **Resend email API secured**
- API key server-side only (Edge Function)
- Email templates prevent injection

### Infrastructure
✅ **Environment variables properly used**
- Secrets in environment variables, not hardcoded (mostly)
- .env.example doesn't contain real credentials
- .gitignore properly configured

✅ **HTTPS enforced**
- Vercel provides automatic HTTPS
- Supabase connections over HTTPS

---

## 📋 Recommended Actions Checklist

### Immediate (This Week)
- [ ] Remove hardcoded eBay verification token fallback
- [ ] Add authentication to trigger-sync.js endpoint
- [ ] Restrict CORS to your domains only
- [ ] Fix overly permissive RLS policy on prices table
- [ ] Verify eBay credentials are NOT prefixed with VITE_ in production

### Short Term (This Month)
- [ ] Implement rate limiting on all public API endpoints
- [ ] Add security headers via vercel.json
- [ ] Add comprehensive input validation
- [ ] Implement email validation in alert system
- [ ] Add admin role system for sync operations
- [ ] Set up monitoring/alerting for suspicious activity

### Medium Term (Next Quarter)
- [ ] Add API request logging and monitoring
- [ ] Implement Redis-based token caching
- [ ] Add CAPTCHA to prevent automated abuse
- [ ] Security penetration testing
- [ ] Add Content Security Policy reporting
- [ ] Implement session management improvements

---

## 🔍 Vercel-Specific Security Review

### Environment Variables
**Status:** ✅ Properly configured (assuming you've set them)

**Required Variables:**
```
Server-Side (Vercel):
- EBAY_APP_ID
- EBAY_CERT_ID
- EBAY_VERIFICATION_TOKEN (generate a strong one!)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Frontend (Vite):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_POKEMON_API_KEY (optional)
```

**⚠️ ACTION REQUIRED:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify EBAY_VERIFICATION_TOKEN is set and NOT the default hardcoded value
3. Ensure SUPABASE_SERVICE_ROLE_KEY is production key, not development
4. Set variables for Production, Preview, and Development separately

### Vercel Deployment Security
✅ **Automatic HTTPS**
✅ **Serverless function isolation**
✅ **Environment variable encryption**
⚠️ **Missing:** Rate limiting, DDoS protection

---

## 🔒 Supabase Security Review

### Row Level Security (RLS)
**Status:** ⚠️ Mostly Good, One Critical Issue

✅ **Properly Secured Tables:**
- `price_alerts` - Users can only access their own
- `user_collections` - Users can only access their own

⚠️ **Issue:**
- `prices` table - Too permissive (see Critical Issue #5)

✅ **Public Tables (Correct):**
- `sets` - Public read access (correct)
- `cards` - Public read access (correct)

### Authentication
✅ **Email/Password + OAuth working correctly**
✅ **Session management proper**
✅ **No exposed credentials**

### Edge Functions
✅ **Properly secured with service role**
✅ **CORS configured**
⚠️ **Missing:** Rate limiting, input validation

**Recommendation - Add to Edge Functions:**
```typescript
// Input validation helper
function validateInput(input: any, schema: any) {
  // Use a validation library like Zod
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid input: ${result.error.message}`);
  }
  return result.data;
}
```

---

## 📊 Security Scoring

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | 8/10 | Solid Supabase implementation |
| Authorization | 6/10 | RLS needs tightening on prices table |
| Input Validation | 6/10 | Basic validation, needs enhancement |
| API Security | 5/10 | CORS too open, no rate limiting |
| Data Protection | 8/10 | Good encryption, proper secrets handling |
| Error Handling | 7/10 | Good, no leaks detected |
| Dependencies | 8/10 | Using official libraries, no known vulns |
| Infrastructure | 7/10 | Missing security headers |
| **Overall** | **6.9/10** | **Good foundation, needs hardening** |

---

## 🎯 Priority Implementation Plan

### Week 1 - Critical Fixes
```javascript
// 1. Fix CORS (30 mins)
// 2. Remove hardcoded token (15 mins)
// 3. Add auth to trigger-sync (1 hour)
// 4. Fix RLS policy (30 mins)
```

### Week 2 - High Priority
```javascript
// 1. Add security headers (1 hour)
// 2. Implement rate limiting (2-3 hours)
// 3. Add input validation (2 hours)
```

### Week 3 - Medium Priority
```javascript
// 1. Add monitoring (2 hours)
// 2. Email validation (1 hour)
// 3. Admin role system (3 hours)
```

---

## 📚 Resources & References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [eBay API Security](https://developer.ebay.com/api-docs/static/rest-request-components.html)

---

## 🔐 Secrets Checklist

**Verify these are NEVER committed:**
- [ ] `.env` (in .gitignore ✅)
- [ ] eBay App ID & Cert ID
- [ ] Supabase Service Role Key
- [ ] Any API keys
- [ ] eBay Verification Token

**Verify in Git History:**
```bash
# Check if any secrets were ever committed
git log --all --full-history --source --pickaxe-all -S"EBAY_CERT_ID"
git log --all --full-history --source --pickaxe-all -S"SERVICE_ROLE_KEY"
```

---

## 📝 Audit Conclusion

ShinyPull demonstrates **solid fundamentals** with good use of modern security practices (Supabase RLS, OAuth 2.0, HTTPS). However, several **production-readiness issues** need addressing before public launch:

**Must Fix Before Production:**
1. Hardcoded token removal
2. CORS restriction
3. Trigger-sync authentication
4. RLS policy tightening

**Should Fix Soon:**
5. Rate limiting
6. Security headers
7. Input validation

The application is **not production-ready** in its current state but can be made secure with 1-2 weeks of focused security improvements.

---

**Report Generated:** January 24, 2026  
**Next Audit Recommended:** After implementing fixes (2-3 weeks)
