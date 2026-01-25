-- Add price variant columns to prices table
-- This allows storing separate normal and holofoil prices

ALTER TABLE prices 
ADD COLUMN IF NOT EXISTS tcgplayer_normal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tcgplayer_holofoil DECIMAL(10, 2);

-- Add indexes for potential future queries
CREATE INDEX IF NOT EXISTS idx_prices_normal ON prices(tcgplayer_normal);
CREATE INDEX IF NOT EXISTS idx_prices_holofoil ON prices(tcgplayer_holofoil);

-- Add comments to document the columns
COMMENT ON COLUMN prices.tcgplayer_normal IS 'Market price for normal (non-holofoil) variant from Pokemon TCG API';
COMMENT ON COLUMN prices.tcgplayer_holofoil IS 'Market price for holofoil/reverse holofoil variant from Pokemon TCG API';
