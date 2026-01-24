/**
 * Check Price Alerts Edge Function
 * This function checks all active price alerts and sends notifications when thresholds are met
 * Should be triggered by Supabase cron job (e.g., daily at midnight)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) throw alertsError

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active alerts to check',
          checked: 0,
          triggered: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Checking ${alerts.length} active alerts...`)

    const triggeredAlerts = []
    const erroredAlerts = []

    // Check each alert
    for (const alert of alerts) {
      try {
        // Check if alert start date has been reached
        const startDate = new Date(alert.start_date)
        const now = new Date()
        
        if (now < startDate) {
          console.log(`Skipping alert ${alert.id}: Start date ${startDate} not reached yet`)
          continue
        }

        // Check if enough time has passed since last check based on frequency
        if (alert.last_checked_at) {
          const lastCheck = new Date(alert.last_checked_at)
          const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
          const checkFrequency = alert.check_frequency || 4
          
          if (hoursSinceLastCheck < checkFrequency) {
            console.log(`Skipping alert ${alert.id}: Only ${hoursSinceLastCheck.toFixed(1)}h since last check (needs ${checkFrequency}h)`)
            continue
          }
        }

        // Fetch current price from Pokemon TCG API
        const priceData = await fetchCardPrice(alert.card_id)
        
        // Update last_checked_at regardless of whether price was found
        await supabaseAdmin
          .from('price_alerts')
          .update({ last_checked_at: now.toISOString() })
          .eq('id', alert.id)
        
        if (!priceData) {
          console.log(`Could not fetch price for card ${alert.card_id}`)
          erroredAlerts.push(alert.id)
          continue
        }

        const currentPrice = priceData.market
        const targetPrice = parseFloat(alert.target_price)

        // Check if threshold is met
        const isTriggered = 
          (alert.alert_type === 'below' && currentPrice <= targetPrice) ||
          (alert.alert_type === 'above' && currentPrice >= targetPrice)

        if (isTriggered) {
          console.log(`Alert triggered for ${alert.card_name}: $${currentPrice} ${alert.alert_type} $${targetPrice}`)
          
          // Get user email
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(alert.user_id)
          
          if (!userError && user?.email) {
            // Send notification email
            await sendAlertEmail(supabaseAdmin, user.email, alert, currentPrice)
          }

          // Update last_triggered_at
          await supabaseAdmin
            .from('price_alerts')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', alert.id)

          triggeredAlerts.push({
            alertId: alert.id,
            cardName: alert.card_name,
            currentPrice,
            targetPrice,
            alertType: alert.alert_type
          })
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error)
        erroredAlerts.push(alert.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts.length,
        triggered: triggeredAlerts.length,
        errors: erroredAlerts.length,
        triggeredAlerts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error checking alerts:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

/**
 * Fetch current card price from Pokemon TCG API
 */
async function fetchCardPrice(cardId: string) {
  try {
    const apiKey = Deno.env.get('POKEMON_TCG_API_KEY') || ''
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards/${cardId}`,
      {
        headers: apiKey ? { 'X-Api-Key': apiKey } : {}
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.data?.tcgplayer?.prices?.holofoil || 
           data.data?.tcgplayer?.prices?.normal ||
           data.data?.tcgplayer?.prices?.reverseHolofoil ||
           null
  } catch (error) {
    console.error('Error fetching card price:', error)
    return null
  }
}

/**
 * Send alert notification email using Supabase Auth
 */
async function sendAlertEmail(supabase: any, userEmail: string, alert: any, currentPrice: number) {
  try {
    const cardUrl = `https://www.shinypull.com/?card=${alert.card_id}`
    const alertTypeText = alert.alert_type === 'below' ? 'dropped below' : 'risen above'
    
    // Create HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #fbbf24; margin: 0;">ShinyPull Alert</h1>
        </div>
        
        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 30px;">
          <h2 style="color: #fbbf24; margin: 0 0 16px 0;">${alert.card_name}</h2>
          
          <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px 0;">
            Your price alert has been triggered! The price has ${alertTypeText} your target.
          </p>
          
          <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 8px 0;">Current Price</p>
            <p style="color: #4ade80; font-size: 32px; font-weight: bold; margin: 0;">$${currentPrice.toFixed(2)}</p>
            <p style="color: #a3a3a3; font-size: 14px; margin: 8px 0 0 0;">
              Alert was set for prices ${alert.alert_type} $${parseFloat(alert.target_price).toFixed(2)}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${cardUrl}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0a0a0a; font-size: 16px; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px;">
              View Card Details
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px 0; color: #737373; font-size: 13px;">
          <p style="margin: 0;">You're receiving this because you set a price alert on ShinyPull</p>
        </div>
      </div>
    `

    // Note: Supabase Auth doesn't have a built-in method to send custom emails
    // You'll need to use a third-party service like Resend
    // For now, we'll log it
    console.log(`Would send email to ${userEmail} for alert ${alert.id}`)
    console.log(`Subject: 🔔 Price Alert: ${alert.card_name}`)
    
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${resendApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'alerts@shinypull.com',
    //     to: userEmail,
    //     subject: `🔔 Price Alert: ${alert.card_name}`,
    //     html: htmlBody
    //   })
    // })
    
  } catch (error) {
    console.error('Error sending alert email:', error)
  }
}
