-- Add edition field to user_collections table
ALTER TABLE user_collections 
ADD COLUMN IF NOT EXISTS card_edition TEXT DEFAULT 'Unlimited';

-- Add index for filtering by edition in collections
CREATE INDEX IF NOT EXISTS idx_user_collections_edition ON user_collections(card_edition);

-- Add constraint for valid editions (same as cards table)
ALTER TABLE user_collections 
ADD CONSTRAINT user_collections_edition_check 
CHECK (card_edition IN ('1st Edition', 'Unlimited', 'Shadowless', 'Reverse Holofoil', 'Limited Edition', 'Normal'));

COMMENT ON COLUMN user_collections.card_edition IS 'Edition of the card in user collection: 1st Edition, Unlimited, Shadowless, etc.';

-- Update existing collection items to be 'Unlimited' (default for most cards)
UPDATE user_collections SET card_edition = 'Unlimited' WHERE card_edition IS NULL;
