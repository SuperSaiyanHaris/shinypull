-- Add price sync progress tracking to sets table
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS price_sync_progress INTEGER DEFAULT 0;

-- 0 = ready for sync, >0 = number of cards already synced in current cycle
-- When price_sync_progress = total_cards, it resets to 0 and last_price_sync updates

COMMENT ON COLUMN sets.price_sync_progress IS 'Number of cards with prices synced in current cycle (0 = ready for new sync)';
