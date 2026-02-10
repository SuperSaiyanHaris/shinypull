-- Nuclear option: Drop ALL policies on creators, then recreate ONLY the ones we want

-- Drop ALL existing policies on creators table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'creators'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON creators';
    END LOOP;
END $$;

-- Now create ONLY the policies we want:
-- 1. Read access for everyone
CREATE POLICY "creators_public_read"
ON creators FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Block INSERT
CREATE POLICY "creators_block_insert"
ON creators FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3. Block UPDATE
CREATE POLICY "creators_block_update"
ON creators FOR UPDATE
TO anon, authenticated
USING (false);

-- 4. Block DELETE
CREATE POLICY "creators_block_delete"
ON creators FOR DELETE
TO anon, authenticated
USING (false);

-- Verify what we just created
SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'creators'
ORDER BY cmd, policyname;
