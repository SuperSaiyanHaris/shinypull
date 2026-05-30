/**
 * Vercel Serverless Function — Mastodon proxy.
 *
 * Mastodon is federated, so every creator we track lives on a different
 * instance (mastodon.social, hachyderm.io, journa.host, mstdn.social, …).
 * Maintaining an exhaustive list of those origins in CSP `connect-src` is
 * a losing game — new instances appear constantly. This endpoint proxies
 * the two API calls we need so the browser only ever talks to shinypull.com.
 *
 *   GET /api/mastodon?handle=user@instance              → account lookup
 *   GET /api/mastodon?handle=user@instance&latest=1     → latest visible status
 *   GET /api/mastodon?handle=user@instance&full=1       → account + latest in one round trip
 *
 * Falls back to mastodon.social federated search if the instance lookup 404s.
 */

import { checkRateLimit, getClientIdentifier } from './_ratelimit.js';

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

async function lookupAccount(username, instance) {
  try {
    const url = `https://${instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(username)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { error: `instance returned ${res.status}` };
    const account = await res.json();
    return { account, instance };
  } catch (err) {
    return { error: err.message };
  }
}

async function federatedFallback(username, instance) {
  // Some instances rate-limit anonymous lookups (401/429). mastodon.social
  // federates almost every visible account and responds reliably.
  try {
    const url = `https://mastodon.social/api/v2/search?q=${encodeURIComponent(`${username}@${instance}`)}&type=accounts&limit=1&resolve=true`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = await res.json();
    const account = data.accounts?.[0];
    if (!account) return null;
    const acctInstance = account.acct.includes('@') ? account.acct.split('@')[1] : instance;
    return { account, instance: acctInstance };
  } catch {
    return null;
  }
}

async function fetchLatestStatus(instance, accountId) {
  try {
    const url = `https://${instance}/api/v1/accounts/${accountId}/statuses?limit=1&exclude_replies=true&exclude_reblogs=true`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const arr = await res.json();
    const status = Array.isArray(arr) ? arr[0] : null;
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
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(clientId, 'mastodon', { limit: 60, windowMs: 60_000 });
  if (!rate.allowed) {
    res.setHeader('Retry-After', Math.ceil(rate.resetIn / 1000));
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const handle = req.query.handle;
  if (!handle) return res.status(400).json({ error: 'Missing handle parameter' });

  const { username, instance } = parseHandle(handle);
  if (!username || !instance) return res.status(400).json({ error: 'Invalid handle format' });

  const wantLatest = req.query.latest === '1' || req.query.full === '1';
  const onlyLatest = req.query.latest === '1' && req.query.full !== '1';

  try {
    let lookup = await lookupAccount(username, instance);
    if ((lookup.notFound || lookup.error) && instance !== 'mastodon.social') {
      const fallback = await federatedFallback(username, instance);
      if (fallback) lookup = { account: fallback.account, instance: fallback.instance };
    }
    if (!lookup.account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const profile = normalizeAccount(lookup.account, lookup.instance);

    let latest = null;
    if (wantLatest) {
      latest = await fetchLatestStatus(lookup.instance, lookup.account.id);
      if (latest) profile.latestPost = latest;
    }

    // Edge cache: 5 min fresh, 1 hr SWR.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

    if (onlyLatest) return res.status(200).json({ latestPost: latest });
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Mastodon instance', detail: err.message });
  }
}
