# Quick Vercel Deployment Guide

## Step 1: Login to Vercel

```bash
vercel login
```

This will:
- Open your browser
- Ask you to verify via email or GitHub
- Save your credentials locally

## Step 2: Deploy (First Time)

```bash
cd d:\Claude\tcg-price-tracker
vercel
```

You'll be asked:
- **Set up and deploy?** → Yes
- **Which scope?** → Your username (e.g., supersaiyanharis)
- **Link to existing project?** → No
- **Project name?** → shinypull (or keep default)
- **Directory?** → ./ (keep default)
- **Override settings?** → No

## Step 3: Deploy to Production

```bash
vercel --prod
```

This deploys to your production URL.

## Your Endpoint URL

After deployment, you'll get a URL like:
```
https://shinypull-supersaiyanharis.vercel.app
```

Your eBay notification endpoint will be:
```
https://shinypull-supersaiyanharis.vercel.app/api/ebay-deletion-notification
```

## Testing the Endpoint

After deployment, test it works:

```bash
curl -X POST https://your-url.vercel.app/api/ebay-deletion-notification \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","userId":"U12345"}'
```

Should return:
```json
{
  "success": true,
  "message": "Account deletion notification received and processed"
}
```

## Alternative: Deploy via Vercel Dashboard (Easier!)

If CLI is giving you trouble:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Or click "Import Third-Party Git Repository"
4. Select your GitHub repo (or upload the folder)
5. Vercel auto-detects everything
6. Click "Deploy"

Done! Much simpler.

## Current Issue

If you're seeing `vercel --prod` fail, make sure you:
1. ✅ Ran `vercel login` first
2. ✅ Ran `vercel` (without --prod) to initialize the project
3. ✅ Then run `vercel --prod` to deploy to production

## Need Help?

If you're still stuck, the easiest way is:
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import the GitHub repo
4. Click Deploy

Vercel automatically detects:
- ✅ The `/api` folder
- ✅ The `vercel.json` config
- ✅ All serverless functions

No CLI needed!
