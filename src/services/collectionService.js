import { supabase } from '../lib/supabase';

export const collectionService = {
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

  // Check if a card is in the collection
  async isInCollection(userId, cardId) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('card_id', cardId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Add a card to collection
  async addToCollection(userId, card) {
    const { data, error } = await supabase
      .from('user_collections')
      .upsert({
        user_id: userId,
        card_id: card.id,
        card_name: card.name,
        card_image: card.image,
        card_number: card.number,
        card_rarity: card.rarity,
        set_id: card.setId || card.set_id,
        set_name: card.set || card.setName,
        quantity: 1
      }, {
        onConflict: 'user_id,card_id'
      })
      .select()
      .single();

    if (error) throw error;
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
