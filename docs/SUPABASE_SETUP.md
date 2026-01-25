# Supabase Database Setup Guide

This guide will help you set up the Supabase database for ShinyPull to improve performance and enable user authentication.

## Why Database?

Previously, the app made API calls to Pokemon TCG API and eBay API every time a page loaded, which was slow. With Supabase:
- All data is stored locally in a database for fast access
- Only sync new sets when they're released
- Update prices periodically instead of on every page load
- Enables user authentication for future features

## Setup Steps

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up
3. Create a new project:
   - Choose a project name (e.g., "shinypull")
   - Set a strong database password (save this!)
   - Choose a region closest to you
   - Wait for the project to be created (~2 minutes)

### 2. Set Up the Database Schema

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from your project
4. Paste it into the SQL editor
5. Click "Run" to create all the tables

This will create:
- `sets` table - stores all Pokemon TCG sets
- `cards` table - stores all cards with their details
- `prices` table - stores TCGPlayer, eBay, and PSA10 pricing data
- `sync_metadata` table - tracks when data was last synced

### 3. Get Your API Credentials

1. In your Supabase dashboard, click "Project Settings" (gear icon in left sidebar)
2. Click "API" in the settings menu
3. You'll see two important values:
   - **Project URL** - looks like `https://xxxxx.supabase.co`
   - **anon public** key - a long string starting with `eyJ...`

### 4. Add Credentials to Your .env File

1. Open your `.env` file in the project root
2. Find the Supabase section and update it:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-project-id` and `your-anon-key-here` with your actual values from step 3.

### 5. Initial Data Sync

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. Press `Ctrl + Shift + A` to open the Admin Sync Panel

4. Click **"Full Sync"** to sync all sets and cards from the Pokemon TCG API
   - This will take 5-10 minutes
   - It fetches all Pokemon sets and their cards
   - Wait for it to complete

5. (Optional) Click **"Update All Prices"** to fetch eBay and PSA10 prices
   - This can take 30-60 minutes depending on how many cards are in your database
   - You can skip this initially and run it later

### 6. Deploy to Vercel

If you're deploying to Vercel:

1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add both Supabase variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy your app

## Using the Admin Panel

Access the admin panel anytime by pressing `Ctrl + Shift + A`.

### Data Sync Actions

- **Full Sync**: Syncs all sets and cards from Pokemon TCG API (run on first setup or when new sets release)
- **Sync Sets**: Only syncs the sets data
- **Sync Cards**: Only syncs the cards data for existing sets

### Price Update Actions

- **Update All Prices**: Updates eBay and PSA10 prices for all cards (slow, use sparingly)
- **Update Stale Prices**: Only updates prices for cards that haven't been updated in 24+ hours (faster)

### Recommended Sync Schedule

- **Full Sync**: Run when a new Pokemon set is released (every 3-4 months)
- **Update Stale Prices**: Run daily or weekly to keep prices current

## Database Structure

### sets
Stores Pokemon TCG sets:
- `id` - Unique set identifier (e.g., "sv09")
- `name` - Set name (e.g., "Scarlet & Violet—Shrouded Fable")
- `series` - Series name (e.g., "Scarlet & Violet")
- `release_date` - When the set was released
- `total_cards` - Number of cards in the set
- `logo` - URL to set logo image
- `symbol` - URL to set symbol image

### cards
Stores individual cards:
- `id` - Unique card identifier
- `set_id` - Which set the card belongs to
- `name` - Card name (e.g., "Pikachu")
- `number` - Card number in the set
- `rarity` - Card rarity (Common, Rare, etc.)
- `image_small` - Small card image URL
- `image_large` - Large card image URL

### prices
Stores pricing data:
- `card_id` - Reference to the card
- `tcgplayer_market` - TCGPlayer market price
- `tcgplayer_low` - TCGPlayer low price
- `tcgplayer_high` - TCGPlayer high price
- `ebay_avg` - Average eBay sold price
- `ebay_verified` - Whether eBay price is from real data
- `psa10_avg` - Average PSA 10 graded price
- `psa10_verified` - Whether PSA10 price is from real data
- `last_updated` - When prices were last updated

## Performance Improvements

After setup, you'll notice:
- **Much faster loading** - Set browser loads instantly from database
- **No API rate limits** - Data is cached locally
- **Offline browsing** - Can view sets/cards without internet (prices need periodic updates)
- **Consistent experience** - No waiting for API responses

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure you added the credentials to `.env`
- Restart your dev server after adding credentials

### Tables not created
- Run the SQL schema file again in Supabase SQL Editor
- Check for any error messages in the SQL editor

### Sync failing
- Check your Pokemon TCG API key is valid
- Check your internet connection
- Look at browser console for error messages

### Prices showing as $0.00
- Run "Update All Prices" from the admin panel
- Or run "Update Stale Prices" to gradually update them

## Next Steps

With the database set up, you can now:
1. Browse sets much faster
2. Search cards instantly
3. Prepare for user authentication features
4. Track price history over time (future feature)

## Security Notes

- The `anon` key is safe to use in your frontend
- Supabase Row Level Security (RLS) is disabled for now (tables are public read)
- When you add authentication, you'll enable RLS to protect user data
- Never commit your `.env` file to git (it's already in `.gitignore`)
