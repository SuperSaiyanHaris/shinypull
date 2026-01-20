// eBay Marketplace Account Deletion Notification Handler
// This endpoint receives notifications when eBay users delete their accounts
// Deploy this to Vercel/Netlify for production compliance

// IMPORTANT: Set this verification token in your eBay Developer Portal
// AND as an environment variable in Vercel
// eBay requires 32-80 characters for the verification token
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || 'shinypull_ebay_verification_token_2024_prod_secure';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the notification for compliance records
    const notification = req.body;
    const authHeader = req.headers['authorization'];

    console.log('eBay Account Deletion Notification Received:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      notification: JSON.stringify(notification, null, 2)
    });

    // Verify the token if provided in Authorization header
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token !== VERIFICATION_TOKEN) {
        console.warn('Invalid verification token received');
        return res.status(401).json({
          error: 'Invalid verification token'
        });
      }
    }

    // Extract user information
    const username = notification?.username;
    const userId = notification?.userId;
    const eiasToken = notification?.eiasToken;

    // If this is a test notification from eBay, just acknowledge it
    if (!username && !userId && !eiasToken) {
      console.log('Test notification received from eBay');
      return res.status(200).json({
        success: true,
        message: 'Endpoint is configured and ready to receive notifications'
      });
    }

    if (!username && !userId) {
      return res.status(400).json({
        error: 'Missing required fields (username or userId)'
      });
    }

    // TODO: When you implement user accounts, delete user data here:
    // - Remove user from database
    // - Delete stored listings/collections
    // - Remove price alerts
    // - Clear any cached data

    // For now, just acknowledge receipt
    console.log(`Account deletion acknowledged for user: ${username || userId}`);

    // Return success response (required by eBay)
    return res.status(200).json({
      success: true,
      message: 'Account deletion notification received and processed',
      timestamp: new Date().toISOString(),
      username: username || userId
    });

  } catch (error) {
    console.error('Error processing eBay deletion notification:', error);

    // Still return 200 to prevent eBay from retrying
    return res.status(200).json({
      success: true,
      message: 'Notification received (error logged)',
      error: error.message
    });
  }
}
