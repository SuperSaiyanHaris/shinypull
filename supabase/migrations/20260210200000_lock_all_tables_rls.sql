-- =============================================
-- SECURITY FIX: Lock down ALL tables
-- Previous migrations failed because they added USING(false)
-- policies alongside existing USING(true) policies.
-- Postgres ORs all policies: true OR false = true (still open!)
-- This migration drops ALL policies first, then recreates clean ones.
-- =============================================

-- === CREATORS ===
-- Drop ALL existing policies (regardless of name)
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'creators' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON creators', pol.policyname);
  END LOOP;
END $$;

-- Read-only for frontend
CREATE POLICY "creators_select" ON creators FOR SELECT TO anon, authenticated USING (true);
-- Block all writes from frontend (service_role bypasses RLS automatically)
CREATE POLICY "creators_no_insert" ON creators FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "creators_no_update" ON creators FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "creators_no_delete" ON creators FOR DELETE TO anon, authenticated USING (false);


-- === CREATOR_STATS ===
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'creator_stats' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON creator_stats', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "creator_stats_select" ON creator_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "creator_stats_no_insert" ON creator_stats FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "creator_stats_no_update" ON creator_stats FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "creator_stats_no_delete" ON creator_stats FOR DELETE TO anon, authenticated USING (false);


-- === BLOG_POSTS ===
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blog_posts' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON blog_posts', pol.policyname);
  END LOOP;
END $$;

-- Public can read published posts; admin reads all (SELECT is safe, no write risk)
CREATE POLICY "blog_posts_public_read" ON blog_posts FOR SELECT TO anon, authenticated USING (true);
-- Block all writes from frontend
CREATE POLICY "blog_posts_no_insert" ON blog_posts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "blog_posts_no_update" ON blog_posts FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "blog_posts_no_delete" ON blog_posts FOR DELETE TO anon, authenticated USING (false);


-- === PRODUCTS ===
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON products', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products_no_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "products_no_update" ON products FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "products_no_delete" ON products FOR DELETE TO anon, authenticated USING (false);


-- === STREAM_SESSIONS ===
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'stream_sessions' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON stream_sessions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "stream_sessions_select" ON stream_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "stream_sessions_no_insert" ON stream_sessions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "stream_sessions_no_update" ON stream_sessions FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "stream_sessions_no_delete" ON stream_sessions FOR DELETE TO anon, authenticated USING (false);


-- === VIEWER_SAMPLES ===
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'viewer_samples' AND schemaname = 'public'
  LOOP EXECUTE format('DROP POLICY %I ON viewer_samples', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "viewer_samples_select" ON viewer_samples FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "viewer_samples_no_insert" ON viewer_samples FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "viewer_samples_no_update" ON viewer_samples FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "viewer_samples_no_delete" ON viewer_samples FOR DELETE TO anon, authenticated USING (false);


-- NOTE: service_role bypasses RLS entirely, so server-side scripts
-- and API endpoints using SUPABASE_SERVICE_ROLE_KEY still work for writes.
-- user_saved_creators and users tables are NOT touched here since they
-- require authenticated user writes for the follow/auth system.
