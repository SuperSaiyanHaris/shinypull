/**
 * Mastodon (ActivityPub) integration.
 * Fully public — no auth required, no API key.
 *
 * Federated quirk: every user lives on a specific instance (mastodon.social,
 * hachyderm.io, etc.). A full handle is `user@instance.tld`. We store handles
 * in that exact form in the `username` column, and `platform_id` is the
 * disambiguated `{instance}:{account.id}` so the same numeric ID on two
 * different instances never collides.
 */

// Pinned set of major instances. Used for discovery + as the fallback when
// resolving a bare handle without an instance suffix.
export const MAJOR_INSTANCES = [
  'mastodon.social',
  'hachyderm.io',
  'fosstodon.org',
  'infosec.exchange',
  'tech.lgbt',
  'mas.to',
  'sfba.social',
  'mastodon.online',
];

/**
 * Parse `user@instance.tld` (or `@user@instance.tld`, or a profile URL) into parts.
 */
export function parseHandle(input) {
  if (!input) return { username: null, instance: null };
  let raw = String(input).trim();

  // URL form: https://hachyderm.io/@mosseri
  const urlMatch = raw.match(/^https?:\/\/([^/]+)\/@([^/?#]+)/i);
  if (urlMatch) return { instance: urlMatch[1].toLowerCase(), username: urlMatch[2] };

  // Strip leading @
  if (raw.startsWith('@')) raw = raw.slice(1);

  const parts = raw.split('@');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { username: parts[0], instance: parts[1].toLowerCase() };
  }

  // Bare username — default to mastodon.social
  return { username: raw, instance: 'mastodon.social' };
}

/**
 * Strip HTML tags from a Mastodon `note` (bio) field.
 */
function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Normalize a raw Mastodon account object into our shared shape.
 */
function normalizeProfile(account, instance) {
  if (!account || !account.id) return null;
  return {
    platform: 'mastodon',
    platformId: `${instance}:${account.id}`,
    username: `${account.username}@${instance}`,
    displayName: account.display_name || account.username,
    profileImage: account.avatar || account.avatar_static || null,
    description: stripHtml(account.note),
    country: null,
    category: null,
    subscribers: account.followers_count || 0,
    followers: account.followers_count || 0,
    totalPosts: account.statuses_count || 0,
    totalViews: null,
    createdAt: account.created_at || null,
    instance,
    rawHandle: `@${account.username}@${instance}`,
    profileUrl: account.url || `https://${instance}/@${account.username}`,
  };
}

/**
 * Fetch a Mastodon profile by handle.
 * Accepts `user@instance`, `@user@instance`, or a profile URL.
 */
export async function getMastodonProfile(input) {
  const { username, instance } = parseHandle(input);
  if (!username || !instance) return null;

  // Primary: hit the instance's own lookup endpoint
  try {
    const url = `https://${instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(username)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Mastodon API error ${res.status}`);
    const account = await res.json();
    return normalizeProfile(account, instance);
  } catch (err) {
    // Fallback: mastodon.social federated search (works for almost any handle visible to that instance)
    if (instance !== 'mastodon.social') {
      try {
        const fallbackUrl = `https://mastodon.social/api/v2/search?q=${encodeURIComponent(`${username}@${instance}`)}&type=accounts&limit=1&resolve=true`;
        const res = await fetch(fallbackUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          const account = data.accounts?.[0];
          if (account) {
            // account.acct on a remote profile is `user@instance`
            const acctInstance = account.acct.includes('@') ? account.acct.split('@')[1] : instance;
            return normalizeProfile(account, acctInstance);
          }
        }
      } catch {}
    }
    throw err;
  }
}

/**
 * Live search across the federation via mastodon.social.
 * `resolve=true` causes mastodon.social to fetch and federate unknown handles.
 */
export async function searchMastodon(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const url = `https://mastodon.social/api/v2/search?q=${encodeURIComponent(query)}&type=accounts&limit=${limit}&resolve=true`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.accounts || [])
      .map((acc) => {
        // For remote accounts mastodon.social returns acct = `user@instance`
        // For local accounts (mastodon.social users) acct = `user` (no @)
        const acctInstance = acc.acct.includes('@') ? acc.acct.split('@')[1] : 'mastodon.social';
        return normalizeProfile(acc, acctInstance);
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Batch a list of handles. Mastodon has no batch endpoint, so we fetch
 * sequentially with light pacing (10/sec is well under the 300-per-5min default).
 */
export async function getMastodonProfilesBatch(handles, { delayMs = 100 } = {}) {
  const results = new Map();
  for (const handle of handles) {
    try {
      const profile = await getMastodonProfile(handle);
      if (profile) results.set(handle, profile);
    } catch {
      // Skip failures silently — caller handles missing entries
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}
