// One-off: re-fetch every Rumble creator and backfill profile_image + display_name + description.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BASE = 'https://rumble.com';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
};

function extractMeta(html, propertyName, propertyAttr = 'property') {
  const escaped = propertyName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(
    `<meta\\s+${propertyAttr}\\s*=\\s*["']?${escaped}["']?\\s+content\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`,
    'i'
  );
  const m = html.match(re);
  if (!m) return null;
  return m[1] || m[2] || m[3] || null;
}

function cleanText(html) {
  if (!html) return null;
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim().substring(0, 500);
}

const { data: creators, error } = await supabase
  .from('creators')
  .select('id, platform_id, username, display_name, profile_image')
  .eq('platform', 'rumble')
  .is('profile_image', null);

if (error) { console.error(error); process.exit(1); }
console.log(`🔄 Backfilling ${creators.length} Rumble channels missing profile images\n`);

let updated = 0;
for (const c of creators) {
  let kind = 'c';
  let slug = c.username;
  if (c.platform_id?.includes(':')) {
    [kind, slug] = c.platform_id.split(':');
  }
  try {
    const res = await fetch(`${BASE}/${kind}/${slug}`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    if (!html) continue;

    const profileImage = extractMeta(html, 'og:image');
    const ogTitle = extractMeta(html, 'og:title');
    const h1Match = html.match(/<h1[^>]*class=["']?[^"'>]*channel-header--title[^"'>]*["']?[^>]*>([^<]+)<\/h1>/i);
    const displayName = cleanText(h1Match ? h1Match[1] : ogTitle);
    const description = cleanText(extractMeta(html, 'description', 'name') || extractMeta(html, 'og:description'));

    const patch = {};
    if (profileImage) patch.profile_image = profileImage;
    if (displayName && displayName !== c.username) patch.display_name = displayName;
    if (description) patch.description = description;

    if (Object.keys(patch).length > 0) {
      await supabase.from('creators').update(patch).eq('id', c.id);
      updated++;
      if (updated % 10 === 0) console.log(`  ${updated}/${creators.length}`);
    }
  } catch (e) {
    console.error(`  ❌ ${slug}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 800));
}
console.log(`\n✨ Updated ${updated} channels`);
