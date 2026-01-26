-- Clean up duplicate edition-based cards created during edition testing
-- Run this in your Supabase SQL Editor

-- This will remove cards that have edition suffixes (e.g., base1-4-unlimited)
-- and keep the original cards (e.g., base1-4)

BEGIN;

-- First, check what will be deleted
SELECT 
  id, 
  name, 
  number,
  set_id,
  CASE 
    WHEN id LIKE '%-unlimited' THEN 'Duplicate (Unlimited)'
    WHEN id LIKE '%-1st-edition' THEN 'Duplicate (1st Edition)'
    WHEN id LIKE '%-shadowless' THEN 'Duplicate (Shadowless)'
    WHEN id LIKE '%-reverse-holo' THEN 'Duplicate (Reverse Holo)'
    ELSE 'Original (Keep)'
  END as status
FROM cards
WHERE 
  id LIKE '%-unlimited' 
  OR id LIKE '%-1st-edition'
  OR id LIKE '%-shadowless'
  OR id LIKE '%-reverse-holo'
ORDER BY set_id, number;

-- Delete the duplicate edition-based cards
DELETE FROM cards 
WHERE 
  id LIKE '%-unlimited' 
  OR id LIKE '%-1st-edition'
  OR id LIKE '%-shadowless'
  OR id LIKE '%-reverse-holo';

-- Verify cleanup
SELECT 
  set_id,
  COUNT(*) as card_count
FROM cards
GROUP BY set_id
ORDER BY set_id;

COMMIT;

-- To rollback if needed: ROLLBACK;
