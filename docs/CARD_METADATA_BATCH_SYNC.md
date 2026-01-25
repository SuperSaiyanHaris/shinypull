# Card Metadata Batch Sync - How It Works

## Problem Solved
- **Full Sync** times out after 2 minutes on free tier
- **Types and supertype** are static fields that never change (unlike prices)
- Mixing metadata sync with price sync was inefficient

## Solution: Dedicated Metadata Sync Mode

### New Button: "Card Metadata (5 sets)"
A purple button in Admin Sync Panel that:
- Syncs **5 sets at a time** (~30-60 seconds per run)
- Updates only **static fields**: `types`, `supertype`
- Tracks progress via `last_metadata_sync` timestamp
- Automatically picks the oldest 5 sets each time you click

### How to Use

1. **Run SQL migrations** (2 required):
   ```sql
   -- First: Add types/supertype columns to cards
   -- Run: database/supabase-add-card-types.sql
   
   -- Second: Add tracking column to sets
   -- Run: database/supabase-add-metadata-sync-tracking.sql
   ```

2. **Click "Card Metadata (5 sets)" repeatedly**:
   - First click: Syncs sets 1-5
   - Second click: Syncs sets 6-10
   - Third click: Syncs sets 11-15
   - Keep clicking until you see: "No sets to sync - all metadata up to date!"

3. **Check progress**:
   - Result message shows: "Updated metadata for X cards from 5/5 sets"
   - When complete: "All 5 sets synced successfully!"
   - Final run: "No sets to sync - all metadata up to date!"

### What It Does

**For each card**, updates:
- `types`: Array like `['Fire', 'Dragon']` or `['Water']`
- `supertype`: Either `'Pokémon'`, `'Trainer'`, or `'Energy'`

**Tracks in database**:
- `sets.last_metadata_sync`: Timestamp of last metadata update
- Automatically rotates through all sets (oldest first)

### Why This Approach?

✅ **No timeout issues** - 5 sets takes ~30-60 seconds  
✅ **One-time operation** - Types don't change, so run once and done  
✅ **Extensible** - Can add more static fields later (artist, flavor text, etc.)  
✅ **Separate from prices** - Price sync runs on schedule, metadata is manual  
✅ **Clear progress** - Know exactly when you're done  

### When to Use

- **After adding new columns** to cards table (like we just did with types/supertype)
- **When onboarding new sets** that don't have metadata yet
- **After API schema changes** that add new static fields

### vs. Price Sync

| Feature | Card Metadata | Price Sync |
|---------|--------------|------------|
| **Purpose** | Static fields | Dynamic pricing |
| **Frequency** | One-time/rare | Every 15 min |
| **Fields** | types, supertype | tcgplayer prices |
| **Batch Size** | 5 sets | 3 sets |
| **Auto-schedule** | No | Yes |
| **When Done** | Shows "all up to date" | Keeps rotating |

### Troubleshooting

**"No sets to sync"** on first click?  
→ Run the `supabase-add-metadata-sync-tracking.sql` migration first

**Still getting timeout errors?**  
→ Reduce batch size (change limit from 5 to 3 in AdminSyncPanel.jsx)

**Filters still not working?**  
→ Make sure you also ran `supabase-add-card-types.sql` migration

**Want to re-sync all sets?**  
→ Run: `UPDATE sets SET last_metadata_sync = NULL;` in Supabase SQL Editor
