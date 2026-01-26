-- Remove edition-related columns added during edition architecture work
-- Run this in your Supabase SQL Editor

BEGIN;

-- Drop any views that depend on edition columns
DROP VIEW IF EXISTS card_editions CASCADE;

-- Remove edition columns from cards table (use CASCADE to drop dependencies)
ALTER TABLE cards 
  DROP COLUMN IF EXISTS edition CASCADE,
  DROP COLUMN IF EXISTS base_card_id CASCADE;

-- Remove edition column from user_collections table
ALTER TABLE user_collections 
  DROP COLUMN IF EXISTS card_edition;

-- Verify columns are removed
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'cards'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'user_collections'
ORDER BY ordinal_position;

COMMIT;

-- To rollback if needed: ROLLBACK;
