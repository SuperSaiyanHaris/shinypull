-- Add tcgplayer_url column to cards table
-- This stores the direct TCGPlayer product page URL from Pokemon TCG API

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS tcgplayer_url TEXT;

-- Add index for potential future queries
CREATE INDEX IF NOT EXISTS idx_cards_tcgplayer_url ON cards(tcgplayer_url);

-- Add comment to document the column
COMMENT ON COLUMN cards.tcgplayer_url IS 'Direct TCGPlayer product page URL from Pokemon TCG API (e.g., https://prices.pokemontcg.io/tcgplayer/xy12-108)';
