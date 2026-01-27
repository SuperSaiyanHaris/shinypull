-- Migration: Rename pricing columns to reflect eBay as primary source
-- Date: 2026-01-27
-- Purpose: Clean up confusing column names after switching from TCGPlayer to eBay

-- Rename main pricing columns
ALTER TABLE prices RENAME COLUMN tcgplayer_market TO market_price;
ALTER TABLE prices RENAME COLUMN tcgplayer_low TO market_low;
ALTER TABLE prices RENAME COLUMN tcgplayer_high TO market_high;
ALTER TABLE prices RENAME COLUMN tcgplayer_updated_at TO price_updated_at;

-- Add TCGPlayer comparison fields (for price comparison display & affiliate links)
ALTER TABLE prices ADD COLUMN IF NOT EXISTS tcg_comparison_price NUMERIC;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS tcg_affiliate_url TEXT;

-- Remove redundant legacy eBay columns (market_price now stores eBay data)
ALTER TABLE prices DROP COLUMN IF EXISTS ebay_avg;
ALTER TABLE prices DROP COLUMN IF EXISTS ebay_verified;

-- Rename PSA10 columns for clarity
ALTER TABLE prices RENAME COLUMN psa10_avg TO psa10_market;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS psa10_low NUMERIC;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS psa10_high NUMERIC;
ALTER TABLE prices DROP COLUMN IF EXISTS psa10_verified;

-- Add index on market_price for faster sorting
CREATE INDEX IF NOT EXISTS idx_prices_market_price ON prices(market_price);

-- Add comments for documentation
COMMENT ON COLUMN prices.market_price IS 'Primary market price from eBay median (10-15 active listings)';
COMMENT ON COLUMN prices.tcg_comparison_price IS 'TCGPlayer price for comparison display (not used as primary)';
COMMENT ON COLUMN prices.tcg_affiliate_url IS 'TCGPlayer affiliate link for price comparison row';
COMMENT ON COLUMN prices.psa10_market IS 'PSA 10 graded card median price from eBay';
