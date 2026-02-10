/**
 * Generate sitemap.xml for SEO
 * Run: node scripts/generateSitemap.js
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const SITE_URL = 'https://shinypull.com';

// Static pages with their priority and change frequency
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/blog', changefreq: 'daily', priority: 0.9 },
  { url: '/rankings', changefreq: 'daily', priority: 0.9 },
  { url: '/rankings/youtube', changefreq: 'daily', priority: 0.85 },
  { url: '/rankings/twitch', changefreq: 'daily', priority: 0.85 },
  { url: '/rankings/kick', changefreq: 'daily', priority: 0.85 },
  { url: '/compare', changefreq: 'weekly', priority: 0.8 },
  { url: '/search', changefreq: 'weekly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/privacy', changefreq: 'monthly', priority: 0.3 },
  { url: '/terms', changefreq: 'monthly', priority: 0.3 },
];

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(({ url, lastmod, changefreq, priority }) => {
    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${url}</loc>\n`;
    if (lastmod) {
      xml += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
    }
    if (changefreq) {
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
    }
    if (priority) {
      xml += `    <priority>${priority}</priority>\n`;
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

async function generateSitemap() {
  console.log('🗺️ Generating sitemap.xml...\n');

  const urls = [...staticPages];

  // Fetch blog posts
  console.log('📝 Fetching blog posts...');
  const { data: posts, error: postsError } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (postsError) {
    console.error('❌ Error fetching blog posts:', postsError);
  } else {
    console.log(`   Found ${posts.length} blog posts`);
    posts.forEach(post => {
      urls.push({
        url: `/blog/${post.slug}`,
        lastmod: post.updated_at || post.published_at,
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Fetch creator profiles
  console.log('👤 Fetching creator profiles...');
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('platform, username, updated_at')
    .not('username', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (creatorsError) {
    console.error('❌ Error fetching creators:', creatorsError);
  } else {
    console.log(`   Found ${creators.length} creator profiles`);
    const seen = new Set();
    creators.forEach(creator => {
      const key = `${creator.platform}/${creator.username.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      urls.push({
        url: `/${creator.platform}/${creator.username}`,
        lastmod: creator.updated_at,
        changefreq: 'daily',
        priority: 0.7,
      });
      urls.push({
        url: `/live/${creator.platform}/${creator.username}`,
        lastmod: creator.updated_at,
        changefreq: 'daily',
        priority: 0.6,
      });
    });
  }

  // Generate XML
  const xml = generateSitemapXML(urls);

  // Write to public folder
  writeFileSync('public/sitemap.xml', xml);

  console.log('\n✅ Sitemap generated successfully!');
  console.log(`   Total URLs: ${urls.length}`);
  console.log(`   Location: public/sitemap.xml`);
  console.log(`   Submit to Google Search Console: ${SITE_URL}/sitemap.xml`);
}

generateSitemap().catch(console.error);
