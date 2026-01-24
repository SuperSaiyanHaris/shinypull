import { supabase } from '../lib/supabase';

export const alertService = {
  /**
   * Create a new price alert
   */
  async createAlert(userId, cardData, targetPrice, alertType, checkFrequency = 4, startDate = null) {
    try {
      const currentPrice = cardData.prices?.tcgplayer?.market || 0;
      
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: userId,
          card_id: cardData.id,
          card_name: cardData.name,
          card_image: cardData.image,
          card_set: cardData.set,
          target_price: targetPrice,
          current_price: currentPrice,
          alert_type: alertType,
          check_frequency: checkFrequency,
          start_date: startDate || new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId, activeOnly = false) {
    try {
      let query = supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get alerts for a specific card
   */
  async getCardAlerts(userId, cardId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .eq('is_active', true);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching card alerts:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an alert
   */
  async updateAlert(alertId, updates) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete an alert
   */
  async deleteAlert(alertId) {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId, isActive) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling alert:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if user has an alert for a card
   */
  async hasAlert(userId, cardId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking alert:', error);
      return false;
    }
  }
};
