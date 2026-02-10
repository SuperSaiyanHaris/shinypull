# Supabase Row-Level Security (RLS) Setup Guide

## ⚠️ CRITICAL SECURITY - Implement RLS Immediately

Your Supabase anon key is exposed in the frontend, which is intentional for Supabase. However, **Row-Level Security (RLS) MUST be enabled** to protect your database from unauthorized access.

---

## Why RLS is Critical

Without RLS, anyone with your anon key can:
- Read ALL data from your tables
- Insert fake creators
- Modify existing records
- Delete data

## Implementation Steps

### 1. Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your ShinyPull project
3. Click **"SQL Editor"** in the left sidebar

### 2. Enable RLS on All Tables

Run this SQL to enable RLS on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### 3. Create Public Read Policies

Allow anyone to **read** public data (creators, stats, blog posts):

```sql
-- Public read access for creators
CREATE POLICY "Public read creators"
ON creators FOR SELECT
USING (true);

-- Public read access for creator_stats
CREATE POLICY "Public read creator_stats"
ON creator_stats FOR SELECT
USING (true);

-- Public read access for stream_sessions
CREATE POLICY "Public read stream_sessions"
ON stream_sessions FOR SELECT
USING (true);

-- Public read access for viewer_samples
CREATE POLICY "Public read viewer_samples"
ON viewer_samples FOR SELECT
USING (true);

-- Public read access for published blog posts only
CREATE POLICY "Public read published blog posts"
ON blog_posts FOR SELECT
USING (is_published = true);

-- Public read access for active products only
CREATE POLICY "Public read active products"
ON products FOR SELECT
USING (is_active = true);
```

### 4. Create Admin-Only Write Policies

For blog posts and products, only admins should be able to create/update/delete:

```sql
-- Admin-only access for blog posts (create, update, delete)
CREATE POLICY "Admin manage blog posts"
ON blog_posts FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('shinypull@proton.me')
);

-- Admin-only access for products (create, update, delete)
CREATE POLICY "Admin manage products"
ON products FOR ALL
USING (
  auth.jwt() ->> 'email' IN ('shinypull@proton.me')
);
```

### 5. Server-Side Insert Policies for Creators/Stats

Your API endpoints (running on Vercel) need to insert creator data. Create a service role policy:

**Option A: Use Service Account (Recommended)**

Create a separate service account in Supabase with restricted permissions, then use that in your API endpoints.

**Option B: Allow Inserts from API (Less Secure)**

If you must allow inserts from the anon key:

```sql
-- WARNING: This allows anyone with anon key to insert creators
-- Only use this if you validate inputs thoroughly in your API
CREATE POLICY "API insert creators"
ON creators FOR INSERT
WITH CHECK (true);

CREATE POLICY "API insert creator_stats"
ON creator_stats FOR INSERT
WITH CHECK (true);

CREATE POLICY "API insert stream_sessions"
ON stream_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "API insert viewer_samples"
ON viewer_samples FOR INSERT
WITH CHECK (true);
```

**Better Alternative**: Move data insertion to server-side scripts only, not API endpoints accessible from browser.

### 6. Verify RLS is Working

Test your policies:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show 'true' for rowsecurity on all tables

-- List all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 7. Test from Frontend

1. Open your browser DevTools → Console
2. Try to insert data directly (should fail):

```javascript
// This should be BLOCKED by RLS
const { data, error } = await supabase
  .from('creators')
  .insert({ platform: 'youtube', username: 'test' });

console.log(error); // Should show "permission denied"
```

3. Try to read data (should succeed):

```javascript
// This should WORK
const { data, error } = await supabase
  .from('creators')
  .select('*')
  .limit(5);

console.log(data); // Should return creators
```

---

## Recommended Policy Structure

### For Public Tables (creators, stats, sessions)

- **SELECT**: Public (anyone can read)
- **INSERT**: Restricted to API/service role only
- **UPDATE**: Restricted to API/service role only
- **DELETE**: Restricted to admin only

### For Content Tables (blog_posts, products)

- **SELECT**: Public (only published/active items)
- **INSERT**: Admin only
- **UPDATE**: Admin only
- **DELETE**: Admin only

---

## Additional Security Measures

### 1. Restrict API Endpoints

Your API endpoints should validate requests:

```javascript
// In api/kick.js, api/youtube.js, etc.
export default async function handler(req, res) {
  // Check origin
  const allowedOrigins = ['https://shinypull.com'];
  const origin = req.headers.origin;

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Continue with logic...
}
```

### 2. Add Rate Limiting

Install and configure rate limiting:

```bash
npm install @vercel/edge-rate-limit
```

### 3. Use Environment-Specific Keys

- **Production**: Use production Supabase project
- **Development**: Use separate dev Supabase project with different keys

---

## Testing Checklist

- [ ] RLS enabled on all tables
- [ ] Public can read creators/stats
- [ ] Public CANNOT insert/update/delete creators
- [ ] Only admins can manage blog posts
- [ ] Only admins can manage products
- [ ] Unpublished blog posts are hidden from public
- [ ] Inactive products are hidden from public

---

## If You Need Help

1. Supabase RLS Docs: https://supabase.com/docs/guides/auth/row-level-security
2. Policy Examples: https://supabase.com/docs/guides/auth/row-level-security#policy-examples
3. Supabase Discord: https://discord.supabase.com

---

**After implementing RLS, commit these changes:**

```bash
git add SUPABASE_RLS_SETUP.md
git commit -m "Add Supabase RLS setup guide"
git push
```

Then implement the policies in your Supabase dashboard!
