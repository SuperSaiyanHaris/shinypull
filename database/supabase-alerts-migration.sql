-- Migration: Add check_frequency, start_date, and last_checked_at to price_alerts
-- Run this if you already created the table with the old schema

-- Add check_frequency column (default 4 hours, must be 1, 4, 8, or 12)
ALTER TABLE price_alerts 
ADD COLUMN IF NOT EXISTS check_frequency INTEGER DEFAULT 4;

-- Add constraint for check_frequency values
ALTER TABLE price_alerts 
ADD CONSTRAINT check_frequency_values 
CHECK (check_frequency IN (1, 4, 8, 12));

-- Add start_date column (defaults to now)
ALTER TABLE price_alerts 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add last_checked_at column (tracks when alert was last checked)
ALTER TABLE price_alerts 
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP WITH TIME ZONE;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'price_alerts' 
ORDER BY ordinal_position;
