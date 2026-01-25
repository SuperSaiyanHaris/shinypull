-- Add last_price_sync column to sets table for rotation tracking
-- This ensures all sets get updated eventually, not just the most recent ones

ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS last_price_sync timestamptz;

-- Add index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_sets_last_price_sync ON sets(last_price_sync);

-- Optionally: Set initial value to release_date for existing sets
-- This gives older sets priority in the first rotation
UPDATE sets 
SET last_price_sync = release_date::timestamptz 
WHERE last_price_sync IS NULL;
