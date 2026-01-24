/**
 * Check Price Alerts API Endpoint
 * This endpoint checks all active price alerts and sends notifications when thresholds are met
 * Should be triggered by a cron job (e.g., daily at midnight)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
);

export default async function handler(req, res) {
  // Verify request is from Vercel Cron or has the correct secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) throw alertsError;

    if (!alerts || alerts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active alerts to check',
        checked: 0,
        triggered: 0
      });
    }

    console.log(`Checking ${alerts.length} active alerts...`);

    const triggeredAlerts = [];
    const erroredAlerts = [];

    // Check each alert
    for (const alert of alerts) {
      try {
        // Fetch current price from Pokemon TCG API
        const priceData = await fetchCardPrice(alert.card_id);
        
        if (!priceData) {
          console.log(`Could not fetch price for card ${alert.card_id}`);
          erroredAlerts.push(alert.id);
          continue;
        }

        const currentPrice = priceData.market;
        const targetPrice = parseFloat(alert.target_price);

        // Check if threshold is met
        const isTriggered = 
          (alert.alert_type === 'below' && currentPrice <= targetPrice) ||
          (alert.alert_type === 'above' && currentPrice >= targetPrice);

        if (isTriggered) {
          console.log(`Alert triggered for ${alert.card_name}: $${currentPrice} ${alert.alert_type} $${targetPrice}`);
          
          // Send notification email
          await sendAlertEmail(alert, currentPrice);

          // Update last_triggered_at
          await supabase
            .from('price_alerts')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', alert.id);

          triggeredAlerts.push({
            alertId: alert.id,
            cardName: alert.card_name,
            currentPrice,
            targetPrice,
            alertType: alert.alert_type
          });
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        erroredAlerts.push(alert.id);
      }
    }

    return res.status(200).json({
      success: true,
      checked: alerts.length,
      triggered: triggeredAlerts.length,
      errors: erroredAlerts.length,
      triggeredAlerts
    });

  } catch (error) {
    console.error('Error checking alerts:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Fetch current card price from Pokemon TCG API
 */
async function fetchCardPrice(cardId) {
  try {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards/${cardId}`,
      {
        headers: {
          'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.tcgplayer?.prices?.holofoil || 
           data.data?.tcgplayer?.prices?.normal ||
           data.data?.tcgplayer?.prices?.reverseHolofoil ||
           null;
  } catch (error) {
    console.error('Error fetching card price:', error);
    return null;
  }
}

/**
 * Send alert notification email
 */
async function sendAlertEmail(alert, currentPrice) {
  try {
    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(alert.user_id);
    
    if (userError || !userData.user) {
      console.error('Could not fetch user for alert:', alert.id);
      return;
    }

    const userEmail = userData.user.email;
    
    // Send email using Supabase Auth
    // Note: This requires setting up email templates in Supabase
    // For now, we'll log it. In production, integrate with your email service
    console.log(`Would send email to ${userEmail}:`);
    console.log(`Alert: ${alert.card_name} is now $${currentPrice.toFixed(2)} (${alert.alert_type} $${parseFloat(alert.target_price).toFixed(2)})`);
    
    // TODO: Implement actual email sending
    // Options:
    // 1. Use Supabase Edge Functions with Resend/SendGrid
    // 2. Use a third-party email service
    // 3. Trigger a separate email function
    
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
}
