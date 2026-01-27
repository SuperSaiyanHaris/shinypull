-- Add ALL price variants from Pokemon TCG API
-- Run this in your Supabase SQL Editor BEFORE running the complete sync

BEGIN;

-- Remove old simplified columns (we'll replace with comprehensive ones)
ALTER TABLE prices
  DROP COLUMN IF EXISTS tcgplayer_normal,
  DROP COLUMN IF EXISTS tcgplayer_holofoil;

-- Add all price variants with full price breakdown
-- Each variant has: market, low, high, mid, direct_low

-- Normal (non-holo) prices
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS normal_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS normal_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS normal_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS normal_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS normal_direct_low DECIMAL(10, 2);

-- Holofoil prices
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS holofoil_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS holofoil_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS holofoil_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS holofoil_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS holofoil_direct_low DECIMAL(10, 2);

-- Reverse Holofoil prices
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS reverse_holofoil_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS reverse_holofoil_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS reverse_holofoil_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS reverse_holofoil_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS reverse_holofoil_direct_low DECIMAL(10, 2);

-- 1st Edition Holofoil prices (older sets like Base Set)
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS first_ed_holofoil_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_holofoil_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_holofoil_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_holofoil_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_holofoil_direct_low DECIMAL(10, 2);

-- 1st Edition Normal prices (older sets)
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS first_ed_normal_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_normal_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_normal_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_normal_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS first_ed_normal_direct_low DECIMAL(10, 2);

-- Unlimited prices (some cards have this variant)
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS unlimited_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_direct_low DECIMAL(10, 2);

-- Unlimited Holofoil prices
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS unlimited_holofoil_market DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_holofoil_low DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_holofoil_high DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_holofoil_mid DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS unlimited_holofoil_direct_low DECIMAL(10, 2);

-- TCGPlayer metadata
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS tcgplayer_updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for commonly queried price columns
CREATE INDEX IF NOT EXISTS idx_prices_normal_market ON prices(normal_market);
CREATE INDEX IF NOT EXISTS idx_prices_holofoil_market ON prices(holofoil_market);
CREATE INDEX IF NOT EXISTS idx_prices_reverse_holofoil_market ON prices(reverse_holofoil_market);
CREATE INDEX IF NOT EXISTS idx_prices_first_ed_holofoil_market ON prices(first_ed_holofoil_market);

-- Add comments for documentation
COMMENT ON COLUMN prices.normal_market IS 'TCGPlayer market price for normal (non-holo) variant';
COMMENT ON COLUMN prices.holofoil_market IS 'TCGPlayer market price for holofoil variant';
COMMENT ON COLUMN prices.reverse_holofoil_market IS 'TCGPlayer market price for reverse holofoil variant';
COMMENT ON COLUMN prices.first_ed_holofoil_market IS 'TCGPlayer market price for 1st Edition holofoil (older sets)';
COMMENT ON COLUMN prices.first_ed_normal_market IS 'TCGPlayer market price for 1st Edition normal (older sets)';
COMMENT ON COLUMN prices.unlimited_market IS 'TCGPlayer market price for unlimited variant';
COMMENT ON COLUMN prices.unlimited_holofoil_market IS 'TCGPlayer market price for unlimited holofoil variant';
COMMENT ON COLUMN prices.tcgplayer_updated_at IS 'When TCGPlayer last updated their price data';

COMMIT;

-- Verify the new columns
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'prices'
ORDER BY ordinal_position;
