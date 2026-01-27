/**
 * Code Updates Required After Database Migration
 * 
 * After running rename_pricing_columns.sql, update these files:
 */

// ====================
// 1. src/services/dbSetService.js
// ====================

// FIND (line ~69):
prices (
  tcgplayer_market,
  tcgplayer_low,
  tcgplayer_high,
  ebay_avg,
  ebay_verified,
  psa10_avg,
  psa10_verified,
  last_updated
)

// REPLACE WITH:
prices (
  market_price,
  market_low,
  market_high,
  tcg_comparison_price,
  tcg_affiliate_url,
  psa10_market,
  psa10_low,
  psa10_high,
  price_updated_at,
  normal_market,
  holofoil_market,
  reverse_holofoil_market
)

// FIND (line ~107):
prices: {
  tcgplayer: {
    market: price.tcgplayer_market ?? 0,
    low: price.tcgplayer_low ?? 0,
    high: price.tcgplayer_high ?? 0
  },
  ebay: {
    market: price.tcgplayer_market ?? 0,
    avg: price.ebay_avg ?? 0,
    verified: price.ebay_verified ?? false,
    recentListings: [],
    searchTerms: '',
    searchUrl: ''
  },
  psa10: {
    avg: price.psa10_avg ?? 0,
    verified: price.psa10_verified ?? false,
    recentListings: [],
    searchTerms: '',
    searchUrl: ''
  }
}

// REPLACE WITH:
prices: {
  market: price.market_price ?? 0, // Primary eBay-based market price
  low: price.market_low ?? 0,
  high: price.market_high ?? 0,
  tcgplayer: {
    market: price.tcg_comparison_price ?? 0,
    url: price.tcg_affiliate_url ?? card.tcgplayer_url
  },
  ebay: {
    market: price.market_price ?? 0,
    low: price.market_low ?? 0,
    high: price.market_high ?? 0
  },
  psa10: {
    market: price.psa10_market ?? 0,
    low: price.psa10_low ?? 0,
    high: price.psa10_high ?? 0
  },
  // Variant prices (only populated for multi-variant cards)
  variants: {
    normal: price.normal_market ? { market: price.normal_market } : null,
    holofoil: price.holofoil_market ? { market: price.holofoil_market } : null,
    reverseHolofoil: price.reverse_holofoil_market ? { market: price.reverse_holofoil_market } : null
  }
}

// ====================
// 2. api/incremental-price-update.js
// ====================

// FIND (line ~125):
priceUpdates.push({
  card_id: priceRecord.card_id,
  tcgplayer_market: marketPrice,
  tcgplayer_low: ebayData.low,
  tcgplayer_high: ebayData.high,
  normal_market: marketPrice,
  normal_low: ebayData.low,
  normal_high: ebayData.high,
  normal_mid: ebayData.avg,
  last_updated: new Date().toISOString(),
  tcgplayer_updated_at: new Date().toISOString()
});

// REPLACE WITH:
priceUpdates.push({
  card_id: priceRecord.card_id,
  market_price: marketPrice,
  market_low: ebayData.low,
  market_high: ebayData.high,
  normal_market: marketPrice,
  normal_low: ebayData.low,
  normal_high: ebayData.high,
  normal_mid: ebayData.avg,
  price_updated_at: new Date().toISOString()
});

// ====================
// 3. api/admin-refresh-price.js
// ====================

// FIND (line ~145):
tcgplayer_market: prices.market,
tcgplayer_low: prices.low,
tcgplayer_high: prices.high,
tcgplayer_updated_at: new Date().toISOString()

// REPLACE WITH:
market_price: prices.market,
market_low: prices.low,
market_high: prices.high,
price_updated_at: new Date().toISOString()

// ====================
// 4. src/components/CardModal.jsx
// ====================

// FIND (line ~311):
const primaryMarketPrice = displayEbayPrices.market || displayEbayPrices.median || tcgPrices?.market || card.prices?.tcgplayer?.market || 0;

// REPLACE WITH:
const primaryMarketPrice = card.prices?.market || displayEbayPrices.market || displayEbayPrices.median || 0;

// FIND: Price comparison TCG row
<PriceCompareRow
  platform="TCG"
  price={card.prices.tcgplayer.market}
  verified
  link={card.tcgplayerUrl}
/>

// REPLACE WITH:
<PriceCompareRow
  platform="TCG"
  price={card.prices.tcgplayer?.market || 0}
  verified
  link={card.prices.tcgplayer?.url || card.tcgplayerUrl}
/>

// ====================
// 5. src/components/CardItem.jsx
// ====================

// FIND (line ~79):
{formatPrice(card.prices.tcgplayer.market)}

// REPLACE WITH:
{formatPrice(card.prices.market)}
