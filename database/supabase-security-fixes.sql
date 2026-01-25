-- Security Fixes for ShinyPull Database
-- Run this in Supabase SQL Editor to fix overly permissive RLS policies
-- Date: January 24, 2026

-- ============================================================================
-- FIX #1: Tighten Prices Table RLS Policy
-- ============================================================================
-- PROBLEM: Any authenticated user could modify ALL price data
-- SOLUTION: Only allow service role to write, everyone can read

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to upsert prices" ON prices;

-- Keep public read access (this is correct - prices should be public)
-- Drop and recreate to ensure it's properly configured
DROP POLICY IF EXISTS "Allow public read access to prices" ON prices;

CREATE POLICY "Allow public read access to prices"
ON prices FOR SELECT
TO public
USING (true);

-- Only service role (Edge Functions) can insert/update/delete prices
DROP POLICY IF EXISTS "Allow service role full access to prices" ON prices;

CREATE POLICY "Service role can manage prices"
ON prices FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFY: Ensure RLS is enabled on all sensitive tables
-- ============================================================================

-- Enable RLS on prices (should already be enabled)
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Verify other tables have RLS enabled
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Public tables (sets, cards) should allow public read access
-- These don't need RLS since they're public data, but enable for consistency
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Add public read policies for sets and cards if they don't exist
DO $$ 
BEGIN
  -- Sets table - public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sets' AND policyname = 'Allow public read access to sets'
  ) THEN
    CREATE POLICY "Allow public read access to sets"
    ON sets FOR SELECT
    TO public
    USING (true);
  END IF;

  -- Cards table - public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cards' AND policyname = 'Allow public read access to cards'
  ) THEN
    CREATE POLICY "Allow public read access to cards"
    ON cards FOR SELECT
    TO public
    USING (true);
  END IF;

  -- Service role needs write access to sets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sets' AND policyname = 'Service role can manage sets'
  ) THEN
    CREATE POLICY "Service role can manage sets"
    ON sets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;

  -- Service role needs write access to cards
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cards' AND policyname = 'Service role can manage cards'
  ) THEN
    CREATE POLICY "Service role can manage cards"
    ON cards FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- VERIFY: Check all RLS policies
-- ============================================================================
-- Run this query to see all policies and verify they're correct:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED POLICIES AFTER THIS SCRIPT:
-- ============================================================================
-- 
-- Table: prices
--   ✅ "Allow public read access to prices" (SELECT, public)
--   ✅ "Service role can manage prices" (ALL, service_role)
--
-- Table: price_alerts
--   ✅ "Users can view their own alerts" (SELECT, authenticated, user_id check)
--   ✅ "Users can create their own alerts" (INSERT, authenticated, user_id check)
--   ✅ "Users can update their own alerts" (UPDATE, authenticated, user_id check)
--   ✅ "Users can delete their own alerts" (DELETE, authenticated, user_id check)
--
-- Table: user_collections
--   ✅ Similar user-scoped policies (should already exist)
--
-- Table: sets
--   ✅ "Allow public read access to sets" (SELECT, public)
--   ✅ "Service role can manage sets" (ALL, service_role)
--
-- Table: cards
--   ✅ "Allow public read access to cards" (SELECT, public)
--   ✅ "Service role can manage cards" (ALL, service_role)

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. After running this script, only Supabase Edge Functions (using service role key)
--    can modify prices, sets, and cards data.
-- 2. All users can read prices, sets, and cards (public data).
-- 3. Users can only modify their own alerts and collections (existing policies).
-- 4. This prevents the vulnerability where any authenticated user could corrupt
--    price data.
