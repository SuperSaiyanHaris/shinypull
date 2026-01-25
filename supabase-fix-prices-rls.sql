-- Fix Row Level Security for prices table
-- Allow authenticated users to read prices
-- Allow service role to update prices

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to prices" ON prices;
DROP POLICY IF EXISTS "Allow service role to update prices" ON prices;

-- Enable RLS
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read prices
CREATE POLICY "Allow public read access to prices"
ON prices FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert/update prices (for real-time updates)
CREATE POLICY "Allow authenticated users to upsert prices"
ON prices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access to prices"
ON prices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
