-- STRICT RLS: Block ALL writes from frontend (anon key)
-- Only allow READ access - all writes go through API endpoints

-- Drop the insecure policies
DROP POLICY IF EXISTS "creators_allow_insert" ON creators;
DROP POLICY IF EXISTS "creators_allow_safe_update" ON creators;
DROP POLICY IF EXISTS "creator_stats_allow_insert" ON creator_stats;
DROP POLICY IF EXISTS "creator_stats_allow_update" ON creator_stats;

-- READ-ONLY policies remain (already created)
-- creators_public_read
-- creator_stats_public_read

-- Explicitly block INSERT/UPDATE on creators
CREATE POLICY "creators_block_insert_frontend"
ON creators FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "creators_block_update_frontend"
ON creators FOR UPDATE
TO anon, authenticated
USING (false);

-- Explicitly block INSERT/UPDATE on creator_stats
CREATE POLICY "creator_stats_block_insert_frontend"
ON creator_stats FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "creator_stats_block_update_frontend"
ON creator_stats FOR UPDATE
TO anon, authenticated
USING (false);

-- Note: DELETE is already blocked from previous migrations

-- Verify policies
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('creators', 'creator_stats')
ORDER BY tablename, cmd, policyname;
