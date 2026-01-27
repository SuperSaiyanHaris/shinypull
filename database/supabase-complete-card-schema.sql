-- Complete Card Schema Migration
-- This adds ALL useful fields from the Pokemon TCG API
-- Run this ONCE in your Supabase SQL Editor

BEGIN;

-- Add all missing columns to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS types TEXT[],           -- Pokemon types: ['Fire', 'Dragon']
  ADD COLUMN IF NOT EXISTS supertype TEXT,         -- 'Pokémon', 'Trainer', 'Energy'
  ADD COLUMN IF NOT EXISTS subtypes TEXT[],        -- ['Stage 2', 'ex'], ['Item'], ['Basic']
  ADD COLUMN IF NOT EXISTS hp TEXT,                -- Hit points (as text because some are '?')
  ADD COLUMN IF NOT EXISTS evolves_from TEXT,      -- Pokemon it evolves from
  ADD COLUMN IF NOT EXISTS evolves_to TEXT[],      -- Pokemon it can evolve to
  ADD COLUMN IF NOT EXISTS rules TEXT[],           -- Card rules (for special cards like V, VMAX)
  ADD COLUMN IF NOT EXISTS abilities JSONB,        -- Array of abilities [{name, text, type}]
  ADD COLUMN IF NOT EXISTS attacks JSONB,          -- Array of attacks [{name, cost, damage, text}]
  ADD COLUMN IF NOT EXISTS weaknesses JSONB,       -- [{type, value}]
  ADD COLUMN IF NOT EXISTS resistances JSONB,      -- [{type, value}]
  ADD COLUMN IF NOT EXISTS retreat_cost TEXT[],    -- ['Colorless', 'Colorless']
  ADD COLUMN IF NOT EXISTS converted_retreat_cost INTEGER, -- Numeric retreat cost
  ADD COLUMN IF NOT EXISTS artist TEXT,            -- Card artist name
  ADD COLUMN IF NOT EXISTS flavor_text TEXT,       -- Flavor text on card
  ADD COLUMN IF NOT EXISTS national_pokedex_numbers INTEGER[], -- Pokedex numbers
  ADD COLUMN IF NOT EXISTS legalities JSONB,       -- {standard, expanded, unlimited}
  ADD COLUMN IF NOT EXISTS regulation_mark TEXT,   -- Regulation mark (F, G, H, etc.)
  ADD COLUMN IF NOT EXISTS ancient_trait JSONB,    -- Ancient trait if present
  ADD COLUMN IF NOT EXISTS set_printed_total INTEGER, -- Total cards in set (printed)
  ADD COLUMN IF NOT EXISTS set_total INTEGER;      -- Total cards in set (actual)

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_cards_types ON cards USING GIN (types);
CREATE INDEX IF NOT EXISTS idx_cards_supertype ON cards(supertype);
CREATE INDEX IF NOT EXISTS idx_cards_subtypes ON cards USING GIN (subtypes);
CREATE INDEX IF NOT EXISTS idx_cards_artist ON cards(artist);
CREATE INDEX IF NOT EXISTS idx_cards_hp ON cards(hp);
CREATE INDEX IF NOT EXISTS idx_cards_regulation_mark ON cards(regulation_mark);

-- Add last_full_sync to sets table to track when complete data was synced
ALTER TABLE sets
  ADD COLUMN IF NOT EXISTS last_full_sync TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tcgplayer_url TEXT,
  ADD COLUMN IF NOT EXISTS ptcgo_code TEXT;        -- Pokemon TCG Online code

-- Add index on sets last_full_sync
CREATE INDEX IF NOT EXISTS idx_sets_last_full_sync ON sets(last_full_sync);

-- Add comments for documentation
COMMENT ON COLUMN cards.types IS 'Pokemon types (Fire, Water, Grass, etc.) - array';
COMMENT ON COLUMN cards.supertype IS 'Card category: Pokémon, Trainer, or Energy';
COMMENT ON COLUMN cards.subtypes IS 'Card subtypes: Basic, Stage 1, Stage 2, V, VMAX, ex, Item, Supporter, etc.';
COMMENT ON COLUMN cards.hp IS 'Hit points - stored as text because some cards have special values';
COMMENT ON COLUMN cards.evolves_from IS 'Name of Pokemon this card evolves from';
COMMENT ON COLUMN cards.evolves_to IS 'Names of Pokemon this card can evolve to';
COMMENT ON COLUMN cards.rules IS 'Special rules text for V, VMAX, ex, Radiant, etc.';
COMMENT ON COLUMN cards.abilities IS 'Array of abilities with name, text, and type';
COMMENT ON COLUMN cards.attacks IS 'Array of attacks with name, cost, damage, and text';
COMMENT ON COLUMN cards.weaknesses IS 'Weakness types and values';
COMMENT ON COLUMN cards.resistances IS 'Resistance types and values';
COMMENT ON COLUMN cards.retreat_cost IS 'Energy types required to retreat';
COMMENT ON COLUMN cards.converted_retreat_cost IS 'Numeric total retreat cost';
COMMENT ON COLUMN cards.artist IS 'Card illustrator name';
COMMENT ON COLUMN cards.flavor_text IS 'Flavor text on the card';
COMMENT ON COLUMN cards.national_pokedex_numbers IS 'National Pokedex number(s)';
COMMENT ON COLUMN cards.legalities IS 'Format legalities: standard, expanded, unlimited';
COMMENT ON COLUMN cards.regulation_mark IS 'Regulation mark letter (F, G, H, etc.)';
COMMENT ON COLUMN cards.ancient_trait IS 'Ancient trait if card has one';
COMMENT ON COLUMN sets.last_full_sync IS 'When complete card data was last synced for this set';
COMMENT ON COLUMN sets.tcgplayer_url IS 'TCGPlayer URL for this set';
COMMENT ON COLUMN sets.ptcgo_code IS 'Pokemon TCG Online set code';

COMMIT;

-- Verify the new columns
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'cards'
ORDER BY ordinal_position;
