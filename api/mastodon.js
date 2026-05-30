/**
 * Edge runtime proxy for Mastodon (federated, ~30 instances across our seed).
 *
 * Why Edge: Hobby Vercel allows 12 serverless functions max. We're at the cap,
 * so this runs on Edge instead — Edge functions don't count against that limit
 * and a simple HTTP fetch proxy doesn't need Node APIs.
 *
 *   GET /api/mastodon?handle=user@instance              → account lookup
 *   GET /api/mastodon?handle=user@instance&latest=1     → latest visible status
 *   GET /api/mastodon?handle=user@instance&full=1       → both in one round trip
 */

export const config = { runtime: 'edge' };

const TIMEOUT_MS = 8000;

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim().substring(0, 500);
}

function parseHandle(input) {
  if (!input) return { username: null, instance: null };
  let raw = String(input).trim();
  const urlMatch = raw.match(/^https?:\/\/([^/]+)\/@([^/?#]+)/i);
  if (urlMatch) return { instance: urlMatch[1].toLowerCase(), username: urlMatch[2] };
  if (raw.startsWith('@')) raw = raw.slice(1);
  const parts = raw.split('@');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { username: parts[0], instance: parts[1].toLowerCase() };
  }
  return { username: raw, instance: 'mastodon.social' };
}

function normalizeAccount(account, instance) {
  if (!account || !account.id) return null;
  const headerMissing = !account.header || account.header.endsWith('/headers/original/missing.png');
  return {
    platform: 'mastodon',
    platformId: `${instance}:${account.id}`,
    accountId: account.id,
    username: `${account.username}@${instance}`,
    displayName: account.display_name || account.username,
    profileImage: account.avatar || account.avatar_static || null,
    bannerImage: headerMissing ? null : account.header,
    verified: Array.isArray(account.fields) && account.fields.some(f => f.verified_at),
    description: stripHtml(account.note),
    subscribers: account.followers_count || 0,
    followers: account.followers_count || 0,
    totalPosts: account.statuses_count || 0,
    totalViews: null,
    createdAt: account.created_at || null,
    latestPost: account.last_status_at ? { publishedAt: account.last_status_at } : null,
    instance,
    rawHandle: `@${account.username}@${instance}`,
    profileUrl: account.url || `https://${instance}/@${account.username}`,
  };
}

async function jsonFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    return { data: await res.json() };
  } catch (err) {
    return { error: err.message || 'fetch failed' };
  } finally {
    clearTimeout(t);
  }
}

async function lookupAccount(username, instance) {
  const r = await jsonFetch(`https://${instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(username)}`);
  if (r.data) return { account: r.data, instance };
  if (r.status === 404) return { notFound: true };
  return { error: r.error };
}

async function federatedFallback(username, instance) {
  const r = await jsonFetch(`https://mastodon.social/api/v2/search?q=${encodeURIComponent(`${username}@${instance}`)}&type=accounts&limit=1&resolve=true`);
  const account = r.data?.accounts?.[0];
  if (!account) return null;
  const acctInstance = account.acct.includes('@') ? account.acct.split('@')[1] : instance;
  return { account, instance: acctInstance };
}

async function fetchLatestStatus(instance, accountId) {
  const r = await jsonFetch(`https://${instance}/api/v1/accounts/${accountId}/statuses?limit=1&exclude_replies=true&exclude_reblogs=true`);
  const status = Array.isArray(r.data) ? r.data[0] : null;
  if (!status) return null;
  return {
    url: status.url || status.uri,
    title: stripHtml(status.content)?.substring(0, 200) || null,
    publishedAt: status.created_at,
    views: null,
    favourites: status.favourites_count || 0,
    reblogs: status.reblogs_count || 0,
    replies: status.replies_count || 0,
    thumbnail: status.media_attachments?.[0]?.preview_url || null,
  };
}

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return json({ error: 'Missing handle parameter' }, { status: 400 });

  const { username, instance } = parseHandle(handle);
  if (!username || !instance) return json({ error: 'Invalid handle format' }, { status: 400 });

  const wantLatest = url.searchParams.get('latest') === '1' || url.searchParams.get('full') === '1';
  const onlyLatest = url.searchParams.get('latest') === '1' && url.searchParams.get('full') !== '1';

  try {
    let lookup = await lookupAccount(username, instance);
    if ((lookup.notFound || lookup.error) && instance !== 'mastodon.social') {
      const fallback = await federatedFallback(username, instance);
      if (fallback) lookup = { account: fallback.account, instance: fallback.instance };
    }
    if (!lookup.account) return json({ error: 'Account not found' }, { status: 404 });

    const profile = normalizeAccount(lookup.account, lookup.instance);

    let latest = null;
    if (wantLatest) {
      latest = await fetchLatestStatus(lookup.instance, lookup.account.id);
      if (latest) profile.latestPost = latest;
    }

    if (onlyLatest) return json({ latestPost: latest });
    return json(profile);
  } catch (err) {
    return json({ error: 'Failed to reach Mastodon instance', detail: err.message }, { status: 502 });
  }
}
