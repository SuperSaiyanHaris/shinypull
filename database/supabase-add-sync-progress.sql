-- Add progress tracking to sets table
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS metadata_sync_progress INTEGER DEFAULT 0;

-- 0 = not started, >0 = number of cards synced so far
-- When metadata_sync_progress = total_cards, set is complete

COMMENT ON COLUMN sets.metadata_sync_progress IS 'Number of cards with metadata synced (0 = not started, equals total_cards = complete)';
