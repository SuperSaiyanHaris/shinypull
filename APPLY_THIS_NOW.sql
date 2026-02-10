-- ============================================
-- 🚨 CRITICAL SECURITY FIX - Run in Supabase SQL Editor
-- ============================================
-- This will properly secure your database after the hack
-- Copy this entire file and paste into Supabase SQL Editor
-- https://supabase.com/dashboard/project/ziiqqbfcncjdewjkbvyq/sql/new
-- ============================================

-- Step 1: Drop ALL existing policies (they're broken)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 2: Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Step 3: Create READ-ONLY policies for all data tables
-- (No INSERT/UPDATE/DELETE policies = automatically blocked)

CREATE POLICY "creators_public_read"
ON creators FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "creator_stats_public_read"
ON creator_stats FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "stream_sessions_public_read"
ON stream_sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "viewer_samples_public_read"
ON viewer_samples FOR SELECT
TO anon, authenticated
USING (true);

-- Step 4: Blog posts - public can see published, admin can manage all

CREATE POLICY "blog_posts_public_read"
ON blog_posts FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "blog_posts_admin_all"
ON blog_posts FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'shinypull@proton.me')
WITH CHECK (auth.jwt() ->> 'email' = 'shinypull@proton.me');

-- Step 5: Products - public can see active, admin can manage all

CREATE POLICY "products_public_read"
ON products FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "products_admin_all"
ON products FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'shinypull@proton.me')
WITH CHECK (auth.jwt() ->> 'email' = 'shinypull@proton.me');

-- Step 6: Verify configuration
SELECT
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('creators', 'creator_stats', 'stream_sessions', 'viewer_samples', 'blog_posts', 'products')
ORDER BY tablename;

SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ✅ Done! Your database is now secure:
-- - Frontend can READ all data
-- - Frontend CANNOT write data (INSERT/UPDATE/DELETE blocked)
-- - GitHub Actions can still write (service role key bypasses RLS)
-- ============================================
