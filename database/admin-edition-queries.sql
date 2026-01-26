-- Admin queries for edition architecture monitoring

-- 1. Count cards by edition
SELECT 
  edition,
  COUNT(*) as card_count,
  COUNT(DISTINCT base_card_id) as unique_base_cards,
  ROUND(AVG(tcgplayer_market), 2) as avg_price
FROM cards
LEFT JOIN prices ON cards.id = prices.card_id
WHERE edition IS NOT NULL
GROUP BY edition
ORDER BY card_count DESC;

-- 2. Find cards with multiple editions
SELECT 
  base_card_id,
  name,
  number,
  COUNT(*) as edition_count,
  STRING_AGG(edition, ', ' ORDER BY edition) as editions,
  STRING_AGG(tcgplayer_market::TEXT, ', ' ORDER BY edition) as prices
FROM cards
LEFT JOIN prices ON cards.id = prices.card_id
WHERE base_card_id IS NOT NULL
GROUP BY base_card_id, name, number
HAVING COUNT(*) > 1
ORDER BY edition_count DESC, name
LIMIT 50;

-- 3. Top 20 most valuable cards by edition
SELECT 
  cards.name,
  cards.number,
  cards.edition,
  sets.name as set_name,
  prices.tcgplayer_market
FROM cards
JOIN sets ON cards.set_id = sets.id
LEFT JOIN prices ON cards.id = prices.card_id
WHERE prices.tcgplayer_market > 0
ORDER BY prices.tcgplayer_market DESC
LIMIT 20;

-- 4. Edition distribution by set
SELECT 
  sets.name as set_name,
  sets.id as set_id,
  cards.edition,
  COUNT(*) as card_count
FROM cards
JOIN sets ON cards.set_id = sets.id
WHERE cards.edition IS NOT NULL
GROUP BY sets.name, sets.id, cards.edition
ORDER BY sets.name, cards.edition;

-- 5. Cards missing price data
SELECT 
  COUNT(*) as cards_without_prices
FROM cards
LEFT JOIN prices ON cards.id = prices.card_id
WHERE prices.card_id IS NULL;

-- 6. Price comparison: 1st Edition vs Unlimited
SELECT 
  c1.name,
  c1.number,
  sets.name as set_name,
  p1.tcgplayer_market as first_edition_price,
  p2.tcgplayer_market as unlimited_price,
  ROUND((p1.tcgplayer_market / NULLIF(p2.tcgplayer_market, 0) - 1) * 100, 2) as price_premium_percent
FROM cards c1
JOIN cards c2 ON c1.base_card_id = c2.base_card_id
JOIN sets ON c1.set_id = sets.id
LEFT JOIN prices p1 ON c1.id = p1.card_id
LEFT JOIN prices p2 ON c2.id = p2.card_id
WHERE c1.edition = '1st Edition'
  AND c2.edition = 'Unlimited'
  AND p1.tcgplayer_market > 0
  AND p2.tcgplayer_market > 0
ORDER BY price_premium_percent DESC
LIMIT 20;

-- 7. Sync progress stats
SELECT 
  entity_type,
  status,
  message,
  last_sync,
  EXTRACT(EPOCH FROM (NOW() - last_sync))/3600 as hours_since_sync
FROM sync_metadata
ORDER BY last_sync DESC;

-- 8. Sets with most editions per card (vintage sets)
SELECT 
  sets.name,
  COUNT(DISTINCT cards.base_card_id) as unique_cards,
  COUNT(*) as total_editions,
  ROUND(COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT cards.base_card_id), 0), 2) as avg_editions_per_card
FROM cards
JOIN sets ON cards.set_id = sets.id
WHERE cards.base_card_id IS NOT NULL
GROUP BY sets.name
HAVING COUNT(*) > COUNT(DISTINCT cards.base_card_id) -- Only sets with multiple editions
ORDER BY avg_editions_per_card DESC
LIMIT 20;

-- 9. User collection edition distribution
SELECT 
  card_edition,
  COUNT(*) as collection_items,
  COUNT(DISTINCT user_id) as unique_collectors
FROM user_collections
GROUP BY card_edition
ORDER BY collection_items DESC;

-- 10. Price alert edition distribution  
SELECT 
  cards.edition,
  COUNT(*) as alert_count,
  COUNT(DISTINCT price_alerts.user_id) as unique_users
FROM price_alerts
JOIN cards ON price_alerts.card_id = cards.id
GROUP BY cards.edition
ORDER BY alert_count DESC;
