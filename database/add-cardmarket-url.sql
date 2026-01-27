-- Add cardmarket_url column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS cardmarket_url TEXT;
COMMENT ON COLUMN cards.cardmarket_url IS 'Cardmarket (European marketplace) URL for this card';
