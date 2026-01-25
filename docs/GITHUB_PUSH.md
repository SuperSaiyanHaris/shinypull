# Push to GitHub - Step by Step

## ✅ Step 1: Create GitHub Repository (Do this first!)

1. Go to https://github.com/new
2. Fill in the details:
   - **Repository name**: `shinypull`
   - **Description**: `Pokemon TCG Price Tracker - Track shiny card prices with real-time data`
   - **Visibility**: Public (or Private if you prefer)
   - **DO NOT** check "Initialize with README" (we already have one!)
   - **DO NOT** add .gitignore (we already have one!)
3. Click "Create repository"

## ✅ Step 2: Copy Your Repository URL

After creating, GitHub will show you a URL like:
```
https://github.com/YOUR-USERNAME/shinypull.git
```

Copy this URL!

## ✅ Step 3: Push Your Code

Run these commands in your terminal (replace YOUR-USERNAME with your actual GitHub username):

```bash
cd d:\Claude\tcg-price-tracker

# Add GitHub as the remote origin
git remote add origin https://github.com/YOUR-USERNAME/shinypull.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### If you get an authentication error:

GitHub no longer accepts passwords. You need to:

**Option A: Use GitHub CLI (Easiest)**
```bash
# Install GitHub CLI: https://cli.github.com/
gh auth login
git push -u origin main
```

**Option B: Use Personal Access Token**
1. Go to https://github.com/settings/tokens/new
2. Name it "ShinyPull Deploy"
3. Select scopes: `repo` (full control of private repositories)
4. Click "Generate token"
5. Copy the token (you won't see it again!)
6. When pushing, use token as password:
   - Username: your-github-username
   - Password: paste-your-token-here

**Option C: Use GitHub Desktop (Super Easy)**
1. Download GitHub Desktop: https://desktop.github.com/
2. File → Add Local Repository
3. Choose `d:\Claude\tcg-price-tracker`
4. Click "Publish repository"
5. Done!

## ✅ Step 4: Verify Upload

Go to your repository URL:
```
https://github.com/YOUR-USERNAME/shinypull
```

You should see all your files!

## 🎯 Next: Deploy to Vercel

Once your code is on GitHub:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `shinypull` repository
4. Vercel will auto-detect everything
5. Click "Deploy"
6. Wait ~30 seconds
7. Done! Your app is live!

Your compliance endpoint will be at:
```
https://shinypull-your-username.vercel.app/api/ebay-deletion-notification
```

## Troubleshooting

### "Repository not found"
- Make sure the repository name matches exactly
- Check your GitHub username is correct
- Try using HTTPS URL instead of SSH

### "Permission denied"
- Use GitHub CLI: `gh auth login`
- Or create a Personal Access Token
- Or use GitHub Desktop app

### "Nothing to push"
- Run `git status` to check
- Make sure you committed: `git log` should show your commit

## Need Help?

If you're stuck on the GitHub push, the easiest option is:

**Use GitHub Desktop:**
1. Download: https://desktop.github.com/
2. Install it
3. File → Add Local Repository → Select your project folder
4. Click "Publish repository"

It's point-and-click, no terminal needed!
