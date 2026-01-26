-- ============================================================================
-- EDITION ARCHITECTURE: Treat each edition as separate card entity
-- ============================================================================
-- This migration restructures the database to handle card editions properly.
-- Each edition (1st Edition, Unlimited, Shadowless) becomes its own card record.

-- Step 1: Modify cards table to include edition in the ID structure
-- Instead of: base1-4
-- We'll have: base1-4-unlimited, base1-4-1st-edition, base1-4-shadowless

-- Step 2: Add a base_card_id column to group editions together
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS base_card_id TEXT;

-- Step 3: Update edition field (already exists from previous migration)
-- Make sure it's NOT NULL after migration
ALTER TABLE cards 
ALTER COLUMN edition SET DEFAULT 'Unlimited';

-- Step 4: Create index for base_card_id (to query all editions of a card)
CREATE INDEX IF NOT EXISTS idx_cards_base_card_id ON cards(base_card_id);

-- Step 5: Create a view for easy querying of card editions
CREATE OR REPLACE VIEW card_editions AS
SELECT 
  base_card_id,
  COUNT(*) as edition_count,
  ARRAY_AGG(edition ORDER BY 
    CASE edition
      WHEN '1st Edition' THEN 1
      WHEN 'Shadowless' THEN 2
      WHEN 'Unlimited' THEN 3
      WHEN 'Reverse Holofoil' THEN 4
      ELSE 5
    END
  ) as available_editions,
  ARRAY_AGG(id ORDER BY 
    CASE edition
      WHEN '1st Edition' THEN 1
      WHEN 'Shadowless' THEN 2
      WHEN 'Unlimited' THEN 3
      WHEN 'Reverse Holofoil' THEN 4
      ELSE 5
    END
  ) as card_ids
FROM cards
WHERE base_card_id IS NOT NULL
GROUP BY base_card_id;

-- Step 6: Update existing cards to have base_card_id
-- For existing cards, set base_card_id to the current id
-- and append '-unlimited' to the id if it doesn't have edition suffix
-- NOTE: This is a one-time migration - run with caution!

-- First, let's add base_card_id to existing cards (their current id becomes base_card_id)
UPDATE cards 
SET base_card_id = id 
WHERE base_card_id IS NULL;

-- Step 7: Modify user_collections to allow multiple editions of same base card
-- Remove the unique constraint on (user_id, card_id) if it exists
-- and replace with (user_id, card_id, card_edition) to allow different editions

-- Check if constraint exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_collections_user_id_card_id_key'
  ) THEN
    ALTER TABLE user_collections 
    DROP CONSTRAINT user_collections_user_id_card_id_key;
  END IF;
END $$;

-- Add new composite unique constraint
ALTER TABLE user_collections 
ADD CONSTRAINT user_collections_user_card_edition_unique 
UNIQUE (user_id, card_id, card_edition);

-- Step 8: Add helper function to generate edition-specific card IDs
CREATE OR REPLACE FUNCTION get_edition_card_id(base_id TEXT, edition TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN edition = 'Unlimited' THEN base_id || '-unlimited'
    WHEN edition = '1st Edition' THEN base_id || '-1st-edition'
    WHEN edition = 'Shadowless' THEN base_id || '-shadowless'
    WHEN edition = 'Reverse Holofoil' THEN base_id || '-reverse-holo'
    WHEN edition = 'Limited Edition' THEN base_id || '-limited'
    WHEN edition = 'Normal' THEN base_id || '-normal'
    ELSE base_id || '-' || LOWER(REPLACE(edition, ' ', '-'))
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 9: Add helper function to extract base card ID from edition-specific ID
CREATE OR REPLACE FUNCTION extract_base_card_id(card_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove edition suffix to get base card ID
  RETURN REGEXP_REPLACE(
    card_id, 
    '-(unlimited|1st-edition|shadowless|reverse-holo|limited|normal)$', 
    ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 10: Create index for efficient edition lookups
CREATE INDEX IF NOT EXISTS idx_cards_edition_base ON cards(base_card_id, edition);

COMMENT ON COLUMN cards.base_card_id IS 'Base card identifier without edition suffix (e.g., base1-4). Used to group all editions of the same card.';
COMMENT ON COLUMN cards.edition IS 'Card edition: 1st Edition, Unlimited, Shadowless, Reverse Holofoil, etc.';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- After running this migration:
-- 1. Sync function needs to create separate card records for each edition
-- 2. Each edition will have its own pricing data in the prices table
-- 3. Users can collect multiple editions of the same card
-- 4. UI needs to display editions as separate cards
-- 5. Collection queries need to handle edition-specific card_ids
