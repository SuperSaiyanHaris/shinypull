-- Add types and supertype columns to cards table
-- Run this in your Supabase SQL Editor

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS types TEXT[], -- Array of Pokemon types (e.g., ['Fire', 'Dragon'])
ADD COLUMN IF NOT EXISTS supertype TEXT; -- Card supertype (e.g., 'Pokémon', 'Trainer', 'Energy')

-- Create index for better query performance on type filtering
CREATE INDEX IF NOT EXISTS idx_cards_types ON cards USING GIN (types);
CREATE INDEX IF NOT EXISTS idx_cards_supertype ON cards(supertype);

-- Add a comment to document the columns
COMMENT ON COLUMN cards.types IS 'Array of Pokemon types (Fire, Water, Grass, etc.) - only applicable for Pokemon cards';
COMMENT ON COLUMN cards.supertype IS 'Card supertype: Pokémon, Trainer, or Energy';
