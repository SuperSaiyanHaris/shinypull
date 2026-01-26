// Edition-aware card sync utilities
// These functions handle creating separate card entities for each edition

/**
 * Map Pokemon API price variant keys to edition names
 */
export function mapPriceVariantToEdition(variantKey: string): string | null {
  const mapping: Record<string, string> = {
    '1stEditionHolofoil': '1st Edition',
    '1stEditionNormal': '1st Edition',
    '1stEdition': '1st Edition',
    'unlimitedHolofoil': 'Unlimited',
    'unlimited': 'Unlimited',
    'holofoil': 'Unlimited', // Default holofoil is usually unlimited
    'reverseHolofoil': 'Reverse Holofoil',
    'normal': 'Unlimited', // Default normal is usually unlimited
  };

  return mapping[variantKey] || null;
}

/**
 * Generate edition-specific card ID
 * Example: base1-4 + "1st Edition" => base1-4-1st-edition
 */
export function generateEditionCardId(baseCardId: string, edition: string): string {
  const editionSuffix = edition
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `${baseCardId}-${editionSuffix}`;
}

/**
 * Extract base card ID from edition-specific ID
 * Example: base1-4-1st-edition => base1-4
 */
export function extractBaseCardId(editionCardId: string): string {
  return editionCardId.replace(/-(unlimited|1st-edition|shadowless|reverse-holofoil|limited|normal)$/, '');
}

/**
 * Parse all editions from Pokemon API card data
 * Returns array of edition objects with pricing
 */
export interface EditionData {
  edition: string;
  variantKey: string;
  prices: {
    low: number;
    market: number;
    high: number;
  };
}

export function parseEditionsFromCard(pokemonCard: any): EditionData[] {
  const editions: EditionData[] = [];
  const tcgplayer = pokemonCard.tcgplayer;
  
  if (!tcgplayer?.prices) {
    return editions;
  }

  const prices = tcgplayer.prices;

  // Iterate through all price variants
  for (const [variantKey, priceData] of Object.entries(prices)) {
    const edition = mapPriceVariantToEdition(variantKey);
    
    if (!edition || !priceData || typeof priceData !== 'object') {
      continue;
    }

    const typedPriceData = priceData as any;
    
    // Only include if we have market price
    if (typedPriceData.market) {
      editions.push({
        edition,
        variantKey,
        prices: {
          low: typedPriceData.low || typedPriceData.market * 0.8,
          market: typedPriceData.market,
          high: typedPriceData.high || typedPriceData.market * 1.5,
        },
      });
    }
  }

  return editions;
}

/**
 * Transform Pokemon API card into multiple database card records (one per edition)
 */
export function transformCardWithEditions(pokemonCard: any, setId: string): Array<{card: any, price: any}> {
  const baseCardId = pokemonCard.id;
  const editions = parseEditionsFromCard(pokemonCard);
  
  // If no editions found, create one Unlimited edition by default
  if (editions.length === 0) {
    const editionCardId = generateEditionCardId(baseCardId, 'Unlimited');
    
    return [{
      card: {
        id: editionCardId,
        base_card_id: baseCardId,
        set_id: setId,
        name: pokemonCard.name,
        number: pokemonCard.number || "N/A",
        rarity: pokemonCard.rarity || "Common",
        types: pokemonCard.types || null,
        supertype: pokemonCard.supertype || null,
        image_small: pokemonCard.images?.small,
        image_large: pokemonCard.images?.large,
        tcgplayer_url: pokemonCard.tcgplayer?.url || null,
        edition: 'Unlimited',
      },
      price: {
        card_id: editionCardId,
        tcgplayer_market: 0,
        tcgplayer_low: 0,
        tcgplayer_high: 0,
        last_updated: new Date().toISOString(),
      },
    }];
  }

  // Create separate card record for each edition
  return editions.map((editionData) => {
    const editionCardId = generateEditionCardId(baseCardId, editionData.edition);
    
    return {
      card: {
        id: editionCardId,
        base_card_id: baseCardId,
        set_id: setId,
        name: pokemonCard.name,
        number: pokemonCard.number || "N/A",
        rarity: pokemonCard.rarity || "Common",
        types: pokemonCard.types || null,
        supertype: pokemonCard.supertype || null,
        image_small: pokemonCard.images?.small,
        image_large: pokemonCard.images?.large,
        tcgplayer_url: pokemonCard.tcgplayer?.url || null,
        edition: editionData.edition,
      },
      price: {
        card_id: editionCardId,
        tcgplayer_market: editionData.prices.market,
        tcgplayer_low: editionData.prices.low,
        tcgplayer_high: editionData.prices.high,
        last_updated: new Date().toISOString(),
      },
    };
  });
}

/**
 * Build TCGPlayer search URL for specific edition
 * Since Pokemon API doesn't provide edition-specific URLs, we construct search URLs
 */
export function buildTCGPlayerSearchUrl(cardName: string, setName: string, number: string, edition: string): string {
  const baseUrl = 'https://www.tcgplayer.com/search/pokemon/product';
  const query = `${cardName} ${number} ${edition} ${setName}`.trim();
  return `${baseUrl}?q=${encodeURIComponent(query)}`;
}

/**
 * Deduplicate editions - if we have both "holofoil" and "unlimitedHolofoil", keep unlimitedHolofoil
 */
export function deduplicateEditions(editions: EditionData[]): EditionData[] {
  const editionMap = new Map<string, EditionData>();
  
  for (const edition of editions) {
    const key = edition.edition;
    const existing = editionMap.get(key);
    
    if (!existing) {
      editionMap.set(key, edition);
    } else {
      // Prefer more specific variant keys (e.g., unlimitedHolofoil over holofoil)
      if (edition.variantKey.length > existing.variantKey.length) {
        editionMap.set(key, edition);
      }
    }
  }
  
  return Array.from(editionMap.values());
}
