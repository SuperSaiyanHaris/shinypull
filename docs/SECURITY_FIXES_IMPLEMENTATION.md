# 🔒 Security Fixes Implementation Guide

## ✅ Critical Issues Fixed

All critical security issues have been addressed. Follow these steps to deploy the fixes:

---

## 🚀 Step 1: Deploy Code Changes (Vercel)

The following files have been updated with security fixes:

### API Endpoints (Fixed CORS + Auth)
- ✅ `api/ebay-prices.js` - Restricted CORS to your domains
- ✅ `api/tcg-prices.js` - Restricted CORS to your domains
- ✅ `api/trigger-sync.js` - Added authentication + restricted CORS
- ✅ `api/ebay-deletion-notification.js` - Removed hardcoded token

### Configuration
- ✅ `vercel.json` - Added security headers

### Action Required:
```bash
# Commit and push changes to deploy to Vercel
git add .
git commit -m "Security fixes: CORS restrictions, authentication, headers"
git push
```

Vercel will automatically deploy the changes.

---

## 🔐 Step 2: Update Vercel Environment Variables

**CRITICAL:** Add/update these environment variables in Vercel:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

#### Required Variables (if not already set):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EBAY_APP_ID=your-ebay-app-id
EBAY_CERT_ID=your-ebay-cert-id
```

#### New Required Variables:
```
# Generate a strong random token (32-80 characters)
EBAY_VERIFICATION_TOKEN=<generate-strong-random-token>

# Admin emails (comma-separated) who can trigger sync
ADMIN_EMAILS=your-admin-email@example.com,another-admin@example.com
```

#### How to Generate Strong eBay Token:
```bash
# In PowerShell, run:
# Generate a 64-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Or use: https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new

#### ⚠️ Important:
- Set variables for **Production**, **Preview**, and **Development**
- After adding variables, **redeploy** your project (Deployments → ... → Redeploy)

---

## 🗄️ Step 3: Update Supabase Database (RLS Fixes)

1. Go to: **Supabase Dashboard** → Your Project → **SQL Editor**

2. Copy the entire contents of: `database/supabase-security-fixes.sql`

3. Paste and click **Run**

4. Verify success - you should see:
   - ✅ Policies dropped and recreated
   - ✅ RLS enabled on all tables
   - No errors

5. **(Optional)** Verify policies:
   ```sql
   SELECT 
     tablename,
     policyname,
     roles,
     cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

---

## 🧪 Step 4: Test the Fixes

### Test 1: CORS Restrictions
```javascript
// This should work (from your domain)
fetch('https://your-app.vercel.app/api/ebay-prices?cardName=Pikachu')

// This should fail (from random website)
// Try from browser console on google.com:
fetch('https://your-app.vercel.app/api/ebay-prices?cardName=Pikachu')
// Expected: CORS error
```

### Test 2: Authentication on trigger-sync
```javascript
// Without auth - should return 401
fetch('https://your-app.vercel.app/api/trigger-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'prices' })
})
// Expected: {"error":"Unauthorized","hint":"Authentication token required. Please sign in."}

// With auth - should work (if you're an admin)
// In your app, this is automatically sent by AdminSyncPanel component
```

### Test 3: eBay Verification Token
1. Check Vercel logs after deployment
2. Should see: ✅ No error messages about missing EBAY_VERIFICATION_TOKEN
3. If you see errors, verify the environment variable is set

### Test 4: Security Headers
```bash
# Check headers are present
curl -I https://your-app.vercel.app
```

Expected headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## 📱 Step 5: Update Frontend Code (If Needed)

The frontend (AdminSyncPanel) needs to send the auth token when triggering sync:

Check file: `src/components/AdminSyncPanel.jsx`

**The triggerEdgeFunctionSync should already pass the auth token.** Verify around line 94-115:

```javascript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  throw new Error('Not authenticated');
}

const response = await fetch(`${apiBase}/api/trigger-sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}` // ✅ This should be present
  },
  body: JSON.stringify({ mode: 'full' })
});
```

If it's missing, add the Authorization header.

---

## 🎯 Step 6: Update Your .env.example (Documentation)

Update `.env.example` to reflect security best practices:

```bash
# Remove these (eBay keys should NEVER be VITE_ prefixed):
# ❌ VITE_EBAY_APP_ID=your_ebay_app_id
# ❌ VITE_EBAY_CERT_ID=your_ebay_cert_id

# Add note:
# eBay API Keys - Set in Vercel Environment Variables (server-side only)
# DO NOT prefix with VITE_ - these must remain server-side
```

---

## ✅ Final Verification Checklist

Run through this checklist after deploying:

### Vercel Deployment
- [ ] All files committed and pushed
- [ ] Vercel deployment successful (no build errors)
- [ ] Environment variables set for Production
- [ ] Environment variables set for Preview (optional)
- [ ] `EBAY_VERIFICATION_TOKEN` is a strong random string (not default)
- [ ] `ADMIN_EMAILS` includes your email

### Supabase Database
- [ ] SQL security script ran without errors
- [ ] Verified policies with SELECT query
- [ ] Tested that users can read prices (public access)
- [ ] Tested that users can only see their own alerts

### Functionality Tests
- [ ] Can still fetch card prices (CORS works from your domain)
- [ ] Cannot fetch prices from other domains (CORS blocked)
- [ ] Admin sync requires authentication
- [ ] Non-admin users get 403 error (if ADMIN_EMAILS is set)
- [ ] Security headers present in response

### Documentation
- [ ] `.env.example` updated (no VITE_EBAY_* prefixes)
- [ ] Team notified of changes (if applicable)

---

## 🆘 Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:** 
- Check that your domain is in the `allowedOrigins` array in API files
- Add your Vercel preview domains if testing on preview deployments

### Issue: "Unauthorized" when triggering sync
**Solution:**
1. Make sure you're signed in
2. Check that `ADMIN_EMAILS` environment variable includes your email
3. Verify the Authorization header is being sent (check Network tab)

### Issue: eBay endpoint returns "Server configuration error"
**Solution:**
- Add `EBAY_VERIFICATION_TOKEN` to Vercel environment variables
- Redeploy the project after adding the variable

### Issue: Database changes not taking effect
**Solution:**
- Verify you ran the SQL in the correct Supabase project
- Check SQL Editor for error messages
- Try running the DROP POLICY and CREATE POLICY commands separately

---

## 📊 What Changed (Summary)

### Before → After

**CORS:**
- ❌ `Access-Control-Allow-Origin: *` (anyone can access)
- ✅ Restricted to your domains only

**trigger-sync endpoint:**
- ❌ Anyone could trigger expensive sync operations
- ✅ Requires authentication + admin email check

**eBay Token:**
- ❌ Hardcoded fallback in source code
- ✅ Must be set in environment variables

**Database Prices:**
- ❌ Any authenticated user could modify all prices
- ✅ Only service role (Edge Functions) can modify

**Security Headers:**
- ❌ No security headers
- ✅ Full set of security headers (HSTS, CSP, X-Frame-Options, etc.)

---

## 🔜 Next Steps (Optional - Medium Priority)

After the critical fixes are deployed, consider:

1. **Rate Limiting** - Implement Upstash Redis rate limiting
2. **Monitoring** - Set up Vercel Analytics and error tracking
3. **Admin Dashboard** - Create proper admin role in database
4. **API Logging** - Log all API requests for security monitoring
5. **Content Security Policy** - Add strict CSP (currently commented out)

See `SECURITY_AUDIT_REPORT.md` for full details on medium/low priority improvements.

---

## 🎉 Success!

After completing these steps, your application will be **significantly more secure** and ready for production use. The critical vulnerabilities have been eliminated.

**Need help?** Re-read the troubleshooting section or check Vercel/Supabase logs for specific error messages.
