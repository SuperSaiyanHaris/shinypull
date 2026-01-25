-- Add current_price column to price_alerts table
-- This stores the price at alert creation and gets updated during cron checks

ALTER TABLE price_alerts
ADD COLUMN IF NOT EXISTS current_price decimal(10, 2);

-- Add comment explaining the column
COMMENT ON COLUMN price_alerts.current_price IS 'Last known market price for this card, updated during alert checks';
