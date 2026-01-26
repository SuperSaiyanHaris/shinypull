import { supabase } from '../lib/supabase';

// Cache for collected card IDs to prevent repeated API calls
let collectionCache = {
  userId: null,
  cardIds: new Set(),
  timestamp: 0
};
// Shared in-flight refresh promise to avoid stampeding the DB
let collectionCachePromise = null;
const CACHE_DURATION = 60000; // 60 seconds cache to reduce query bursts

export const collectionService = {
  // Clear the cache (call after add/remove operations)
  clearCache() {
    collectionCache = { userId: null, cardIds: new Set(), timestamp: 0 };
    collectionCachePromise = null;
  },
  // Get all cards in user's collection
  async getCollection(userId) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Check if a card is in the collection (uses cache to prevent spam)
  async isInCollection(userId, cardId) {
    // Check cache first
    const now = Date.now();
    if (
      collectionCache.userId === userId &&
      now - collectionCache.timestamp < CACHE_DURATION
    ) {
      return collectionCache.cardIds.has(cardId) ? { id: cardId, quantity: 1 } : null;
    }

    // Cache miss - fetch all collected card IDs (deduplicated)
    await this.refreshCache(userId);
    return collectionCache.cardIds.has(cardId) ? { id: cardId, quantity: 1 } : null;
  },

  // Refresh the collection cache
  async refreshCache(userId) {
    // Deduplicate concurrent refreshes
    if (collectionCachePromise) {
      await collectionCachePromise;
      return;
    }

    collectionCachePromise = (async () => {
      const { data, error } = await supabase
        .from('user_collections')
        .select('card_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching collection for cache:', error);
        return;
      }

      collectionCache = {
        userId,
        cardIds: new Set(data.map(item => item.card_id)),
        timestamp: Date.now()
      };
    })();

    try {
      await collectionCachePromise;
    } finally {
      collectionCachePromise = null;
    }
  },

  // Get all collected card IDs for a user (for batch checking)
  async getCollectedCardIds(userId) {
    // Use cache if available
    const now = Date.now();
    if (
      collectionCache.userId === userId &&
      now - collectionCache.timestamp < CACHE_DURATION
    ) {
      return collectionCache.cardIds;
    }

    await this.refreshCache(userId);
    return collectionCache.cardIds;
  },

  // Add a card to collection
  async addToCollection(userId, card, edition = 'Unlimited') {
    const { data, error } = await supabase
      .from('user_collections')
      .upsert({
        user_id: userId,
        card_id: card.id,
        card_name: card.name,
        card_image: card.image,
        card_number: card.number,
        card_rarity: card.rarity,
        card_edition: edition,
        set_id: card.setId || card.set_id,
        set_name: card.set || card.setName,
        quantity: 1
      }, {
        onConflict: 'user_id,card_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Update cache
    if (collectionCache.userId === userId) {
      collectionCache.cardIds.add(card.id);
    }

    return data;
  },

  // Update quantity
  async updateQuantity(userId, cardId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCollection(userId, cardId);
    }

    const { data, error } = await supabase
      .from('user_collections')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove a card from collection
  async removeFromCollection(userId, cardId) {
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    if (error) throw error;

    // Update cache
    if (collectionCache.userId === userId) {
      collectionCache.cardIds.delete(cardId);
    }

    return true;
  },

  // Get collection stats
  async getCollectionStats(userId) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('quantity, set_name')
      .eq('user_id', userId);

    if (error) throw error;

    const totalCards = data.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueCards = data.length;
    const sets = [...new Set(data.map(item => item.set_name).filter(Boolean))];

    return {
      totalCards,
      uniqueCards,
      totalSets: sets.length
    };
  }
};
