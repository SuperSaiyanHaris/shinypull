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
 * Send alert notification email using Resend
 */
async function sendAlertEmail(supabase: any, userEmail: string, alert: any, currentPrice: number) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return
    }

    const cardUrl = `https://www.shinypull.com/?card=${alert.card_id}`
    const alertTypeText = alert.alert_type === 'below' ? 'dropped below' : 'risen above'
    const priceIcon = alert.alert_type === 'below' ? '📉' : '📈'
    
    // Create HTML email body with ShinyPull branding
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <h1 style="color: #fbbf24; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 0 20px rgba(251, 191, 36, 0.4);">
                      ✨ ShinyPull Alert
                    </h1>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 16px; padding: 40px;">
                    <h2 style="color: #fbbf24; margin: 0 0 16px 0; font-size: 24px;">${priceIcon} ${alert.card_name}</h2>
                    
                    <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Great news! Your price alert has been triggered. The price has <strong style="color: #fbbf24;">${alertTypeText}</strong> your target.
                    </p>
                    
                    <!-- Price Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.4); border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.2); margin: 24px 0;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="color: #a3a3a3; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Current Price</p>
                          <p style="color: ${alert.alert_type === 'below' ? '#4ade80' : '#f59e0b'}; font-size: 42px; font-weight: bold; margin: 0; text-shadow: 0 0 20px ${alert.alert_type === 'below' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(245, 158, 11, 0.3)'};">
                            $${currentPrice.toFixed(2)}
                          </p>
                          <p style="color: #737373; font-size: 14px; margin: 12px 0 0 0;">
                            Alert target: <span style="color: #a3a3a3; font-weight: 600;">$${parseFloat(alert.target_price).toFixed(2)}</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${cardUrl}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #0a0a0a; font-size: 16px; font-weight: 700; padding: 16px 40px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);">
                            View Card Details →
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #737373; font-size: 13px; text-align: center; margin: 20px 0 0 0; line-height: 1.5;">
                      Want to adjust your alerts? <a href="https://www.shinypull.com/alerts" style="color: #fbbf24; text-decoration: none;">Manage alerts</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="text-align: center; padding: 30px 20px;">
                    <p style="color: #737373; font-size: 13px; margin: 0 0 8px 0;">
                      You're receiving this because you set a price alert on ShinyPull
                    </p>
                    <p style="color: #525252; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ShinyPull. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ShinyPull Alerts <alerts@shinypull.com>',
        to: userEmail,
        subject: `🔔 Price Alert: ${alert.card_name} is now $${currentPrice.toFixed(2)}`,
        html: htmlBody
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Resend API error: ${response.status} - ${errorText}`)
      return
    }

    const result = await response.json()
    console.log(`✅ Email sent successfully to ${userEmail} (ID: ${result.id})`)
    
  } catch (error) {
    console.error('Error sending alert email:', error)
  }
}
