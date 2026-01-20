# eBay Marketplace Account Deletion Compliance

## Overview
eBay requires all production API users to implement a notification endpoint for handling user account deletion requests. This is required before you can get production API credentials.

## What We've Built

We've created a simple compliance endpoint at `/api/ebay-deletion-notification` that:
- ✅ Accepts POST requests from eBay
- ✅ Logs deletion notifications
- ✅ Returns proper response (200 OK)
- ✅ Ready to deploy to Vercel (free)

## Quick Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy the Endpoint
```bash
cd d:\Claude\tcg-price-tracker
vercel --prod
```

This will give you a URL like: `https://shinypull.vercel.app`

Your notification endpoint will be: `https://shinypull.vercel.app/api/ebay-deletion-notification`

## Registering with eBay

### 1. Go to eBay Developer Program
- Navigate to: https://developer.ebay.com/my/api_subscriptions
- Click "Manage marketplace account deletion notifications"

### 2. Add Your Endpoint
- **Notification Endpoint URL**: `https://shinypull.vercel.app/api/ebay-deletion-notification`
- **Verification Token**: Leave blank (optional for sandbox)
- Click "Send Test Notification" to verify it works

### 3. Subscribe to Notifications
- Toggle "Enable notifications" to ON
- Save changes

### 4. Request Production Access
Once the endpoint is working:
- Go to: https://developer.ebay.com/my/keys
- Click "Request Production Keys"
- Reference your deployed notification endpoint URL

## Alternative: Use Webhook.site (Quick Test)

If you need to test immediately without deploying:

1. Go to https://webhook.site
2. Copy your unique URL
3. Use that URL in eBay's notification settings
4. eBay will send test notifications there
5. You can see all incoming requests in real-time

## Current Status

✅ Sandbox keys working
⏳ Compliance endpoint created
⏳ Need to deploy to Vercel
⏳ Need to register with eBay
⏳ Need to request production keys

## When You Add User Accounts Later

Update `api/ebay-deletion-notification.js` to actually delete user data:

```javascript
// Example pseudo-code for future implementation
if (username) {
  await database.users.delete({ ebayUsername: username });
  await database.collections.deleteMany({ userId: user.id });
  await database.priceAlerts.deleteMany({ userId: user.id });
}
```

## Important Notes

- **GDPR Compliance**: You must delete data within 30 days of receiving notification
- **Response Time**: Respond to notifications within 24 hours
- **Logging**: Keep logs of all deletion requests for audit purposes
- **No User Data Yet**: Since ShinyPull doesn't have user accounts yet, this endpoint just logs and acknowledges notifications

## Resources

- [eBay Marketplace Account Deletion Guide](https://developer.ebay.com/develop/guides-v2/marketplace-user-account-deletion/marketplace-user-account-deletion)
- [eBay Developer Program](https://developer.ebay.com)
- [Vercel Deployment Docs](https://vercel.com/docs)
