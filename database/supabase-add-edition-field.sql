-- Add edition field to cards table
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT 'Unlimited';

-- Add index for filtering by edition
CREATE INDEX IF NOT EXISTS idx_cards_edition ON cards(edition);

-- Add constraint for valid editions
ALTER TABLE cards 
ADD CONSTRAINT cards_edition_check 
CHECK (edition IN ('1st Edition', 'Unlimited', 'Shadowless', 'Reverse Holofoil', 'Limited Edition', 'Normal'));

COMMENT ON COLUMN cards.edition IS 'Card edition/printing: 1st Edition, Unlimited, Shadowless, etc.';

-- Update existing cards to be 'Unlimited' (default for most cards)
UPDATE cards SET edition = 'Unlimited' WHERE edition IS NULL;
