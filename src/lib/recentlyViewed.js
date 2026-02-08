// Recently viewed creators - stored in localStorage

const STORAGE_KEY = 'shinypull_recently_viewed';
const MAX_ITEMS = 10;

export function getRecentlyViewed() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addRecentlyViewed(creator) {
  try {
    const existing = getRecentlyViewed();

    // Remove if already exists (will re-add at front)
    const filtered = existing.filter(
      c => !(c.platform === creator.platform && c.username === creator.username)
    );

    // Add to front with timestamp
    const newEntry = {
      platform: creator.platform,
      username: creator.username,
      displayName: creator.displayName || creator.display_name,
      profileImage: creator.profileImage || creator.profile_image,
      subscribers: creator.subscribers,
      followers: creator.followers,
      timestamp: Date.now(),
    };

    // Keep only MAX_ITEMS
    const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}
