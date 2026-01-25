-- ShinyPull Database Schema
-- Run this in your Supabase SQL Editor

-- Sets table
CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT,
  release_date DATE,
  total_cards INTEGER,
  logo TEXT,
  symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  rarity TEXT,
  image_small TEXT,
  image_large TEXT,
  tcgplayer_url TEXT, -- Direct TCGPlayer product page URL from Pokemon TCG API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Prices table (stores current pricing data)
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tcgplayer_market DECIMAL(10, 2),
  tcgplayer_low DECIMAL(10, 2),
  tcgplayer_high DECIMAL(10, 2),
  ebay_avg DECIMAL(10, 2),
  ebay_verified BOOLEAN DEFAULT FALSE,
  psa10_avg DECIMAL(10, 2),
  psa10_verified BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(card_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_prices_card_id ON prices(card_id);
CREATE INDEX IF NOT EXISTS idx_sets_release_date ON sets(release_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync metadata table (tracks when data was last synced)
CREATE TABLE IF NOT EXISTS sync_metadata (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL UNIQUE, -- 'sets', 'cards', 'prices'
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT, -- 'success', 'failed', 'in_progress'
  message TEXT
);

-- Initialize sync metadata
INSERT INTO sync_metadata (entity_type, status)
VALUES
  ('sets', 'pending'),
  ('cards', 'pending'),
  ('prices', 'pending')
ON CONFLICT (entity_type) DO NOTHING;
