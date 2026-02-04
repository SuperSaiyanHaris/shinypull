-- Blog Admin Policies
-- Allow anonymous users to manage blog posts (for admin UI)
-- In production, you'd want to add proper authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Service role has full access" ON blog_posts;

-- Public can view published posts
CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- Allow all operations for admin (using anon key for now)
-- Note: In production, replace 'true' with proper auth check like:
-- auth.uid() IN (SELECT user_id FROM admin_users)

CREATE POLICY "Admin can view all posts"
  ON blog_posts FOR SELECT
  USING (true);

CREATE POLICY "Admin can create posts"
  ON blog_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update posts"
  ON blog_posts FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete posts"
  ON blog_posts FOR DELETE
  USING (true);
