-- Add last_metadata_sync column to sets table for tracking card metadata batch sync
-- Run this in your Supabase SQL Editor

ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS last_metadata_sync TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_sets_last_metadata_sync ON sets(last_metadata_sync);

-- Add comment
COMMENT ON COLUMN sets.last_metadata_sync IS 'Timestamp of last card metadata sync (types, supertype, etc.)';
