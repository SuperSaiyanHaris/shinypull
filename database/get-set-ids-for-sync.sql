-- Get all set IDs to sync one at a time
-- Run this in Supabase SQL Editor to see what sets need syncing

SELECT id, name, series, release_date 
FROM sets 
ORDER BY release_date DESC;

-- This will give you a list of all set IDs
-- You can then sync them one at a time using the Admin Sync Panel
