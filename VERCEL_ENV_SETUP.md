# Vercel Environment Variables Setup

After deploying to Vercel, you need to add these environment variables in your Vercel dashboard:

## How to Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Click on your `shinypull` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below

## Required Variables

### eBay Production API Keys

```
EBAY_APP_ID=HarisLil-shinypul-PRD-9b427e586-89ae2762
EBAY_DEV_ID=8907c71a-5c56-45de-a49e-964dbadbde5d
EBAY_CERT_ID=PRD-b427e5862c6d-1910-499a-b822-ccdd
EBAY_SANDBOX=false
```

### eBay Compliance Token

```
EBAY_VERIFICATION_TOKEN=shinypull_ebay_verification_token_2024_prod_secure
```

## After Adding Variables

1. Click "Save" for each variable
2. Redeploy your project (Vercel will auto-redeploy when you push to GitHub)
3. The eBay price fetching will work on the live site

## Testing

Once deployed with environment variables:
- Visit https://shinypull.vercel.app
- Search for a Pokemon card
- You should see real eBay prices (not estimates)
- Check browser console for eBay API logs
