-- =============================================
-- SECURITY FIX: Explicit policy drops
-- The previous migration's DO blocks may have failed silently.
-- This migration drops EVERY known policy by name, then recreates clean ones.
-- Uses DROP POLICY IF EXISTS (no dynamic SQL, no DO blocks).
-- =============================================

-- === CREATORS: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public insert access" ON creators;
DROP POLICY IF EXISTS "Public update access" ON creators;
DROP POLICY IF EXISTS "Public delete access" ON creators;
DROP POLICY IF EXISTS "Public read access" ON creators;
DROP POLICY IF EXISTS "Public can view creators" ON creators;
DROP POLICY IF EXISTS "creators_public_read" ON creators;
DROP POLICY IF EXISTS "creators_allow_insert" ON creators;
DROP POLICY IF EXISTS "creators_allow_safe_update" ON creators;
DROP POLICY IF EXISTS "creators_block_insert_frontend" ON creators;
DROP POLICY IF EXISTS "creators_block_update_frontend" ON creators;
DROP POLICY IF EXISTS "creators_select" ON creators;
DROP POLICY IF EXISTS "creators_no_insert" ON creators;
DROP POLICY IF EXISTS "creators_no_update" ON creators;
DROP POLICY IF EXISTS "creators_no_delete" ON creators;
DROP POLICY IF EXISTS "Service write access" ON creators;
DROP POLICY IF EXISTS "Service role has full access" ON creators;
DROP POLICY IF EXISTS "Anyone can read creators" ON creators;
DROP POLICY IF EXISTS "Allow public read" ON creators;
DROP POLICY IF EXISTS "Enable read access for all users" ON creators;

-- Recreate clean policies for creators
CREATE POLICY "creators_select" ON creators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "creators_no_insert" ON creators FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "creators_no_update" ON creators FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "creators_no_delete" ON creators FOR DELETE TO anon, authenticated USING (false);


-- === CREATOR_STATS: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public insert access" ON creator_stats;
DROP POLICY IF EXISTS "Public update access" ON creator_stats;
DROP POLICY IF EXISTS "Public delete access" ON creator_stats;
DROP POLICY IF EXISTS "Public read access" ON creator_stats;
DROP POLICY IF EXISTS "Public can view stats" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_public_read" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_allow_insert" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_allow_update" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_block_insert_frontend" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_block_update_frontend" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_select" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_no_insert" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_no_update" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_no_delete" ON creator_stats;
DROP POLICY IF EXISTS "Service write access" ON creator_stats;
DROP POLICY IF EXISTS "Service role has full access" ON creator_stats;
DROP POLICY IF EXISTS "Anyone can read stats" ON creator_stats;
DROP POLICY IF EXISTS "Allow public read" ON creator_stats;
DROP POLICY IF EXISTS "Enable read access for all users" ON creator_stats;

-- Recreate clean policies for creator_stats
CREATE POLICY "creator_stats_select" ON creator_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "creator_stats_no_insert" ON creator_stats FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "creator_stats_no_update" ON creator_stats FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "creator_stats_no_delete" ON creator_stats FOR DELETE TO anon, authenticated USING (false);


-- === BLOG_POSTS: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can delete posts" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_no_insert" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_no_update" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_no_delete" ON blog_posts;
DROP POLICY IF EXISTS "Service role has full access" ON blog_posts;
DROP POLICY IF EXISTS "Service write access" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON blog_posts;

-- Recreate clean policies for blog_posts
CREATE POLICY "blog_posts_select" ON blog_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "blog_posts_no_insert" ON blog_posts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "blog_posts_no_update" ON blog_posts FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "blog_posts_no_delete" ON blog_posts FOR DELETE TO anon, authenticated USING (false);


-- === PRODUCTS: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Admin can create products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_no_insert" ON products;
DROP POLICY IF EXISTS "products_no_update" ON products;
DROP POLICY IF EXISTS "products_no_delete" ON products;
DROP POLICY IF EXISTS "Service role has full access" ON products;
DROP POLICY IF EXISTS "Service write access" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

-- Recreate clean policies for products
CREATE POLICY "products_select" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products_no_insert" ON products FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "products_no_update" ON products FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "products_no_delete" ON products FOR DELETE TO anon, authenticated USING (false);


-- === STREAM_SESSIONS: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public read access" ON stream_sessions;
DROP POLICY IF EXISTS "Service write access" ON stream_sessions;
DROP POLICY IF EXISTS "stream_sessions_select" ON stream_sessions;
DROP POLICY IF EXISTS "stream_sessions_no_insert" ON stream_sessions;
DROP POLICY IF EXISTS "stream_sessions_no_update" ON stream_sessions;
DROP POLICY IF EXISTS "stream_sessions_no_delete" ON stream_sessions;
DROP POLICY IF EXISTS "Service role has full access" ON stream_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON stream_sessions;

-- Recreate clean policies for stream_sessions
CREATE POLICY "stream_sessions_select" ON stream_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "stream_sessions_no_insert" ON stream_sessions FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "stream_sessions_no_update" ON stream_sessions FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "stream_sessions_no_delete" ON stream_sessions FOR DELETE TO anon, authenticated USING (false);


-- === VIEWER_SAMPLES: Drop ALL known policies ===
DROP POLICY IF EXISTS "Public read access" ON viewer_samples;
DROP POLICY IF EXISTS "Service write access" ON viewer_samples;
DROP POLICY IF EXISTS "viewer_samples_select" ON viewer_samples;
DROP POLICY IF EXISTS "viewer_samples_no_insert" ON viewer_samples;
DROP POLICY IF EXISTS "viewer_samples_no_update" ON viewer_samples;
DROP POLICY IF EXISTS "viewer_samples_no_delete" ON viewer_samples;
DROP POLICY IF EXISTS "Service role has full access" ON viewer_samples;
DROP POLICY IF EXISTS "Enable read access for all users" ON viewer_samples;

-- Recreate clean policies for viewer_samples
CREATE POLICY "viewer_samples_select" ON viewer_samples FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "viewer_samples_no_insert" ON viewer_samples FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "viewer_samples_no_update" ON viewer_samples FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "viewer_samples_no_delete" ON viewer_samples FOR DELETE TO anon, authenticated USING (false);
