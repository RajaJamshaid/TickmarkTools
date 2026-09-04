/* ==========================================================
   scripts/build-sitemap.js

   Single sitemap build script for the project. Driven entirely by
   assets/tools-data.json — the same source of truth used by the
   homepage — so it stays correct and scalable as tools are added,
   with no per-tool manual list to maintain.

   Run after editing assets/tools-data.json (or as a prebuild step):

     node scripts/build-sitemap.js

   It does two things:

   1. Regenerates the category tool-lists inside sitemap.html.
      Only the <div class="footer-col"> blocks whose <h5> heading
      matches a category name in tools-data.json are touched —
      everything else in sitemap.html (Main Pages, Blog Articles,
      layout, etc.) is left exactly as-is.

   2. Generates/refreshes sitemap.xml with:
        - the homepage
        - a fixed list of static/legal/category-hub pages
        - every tool in tools-data.json, as a clean canonical URL
          (extensionless, matching the site's existing sitemap.xml
          convention)

   No dependencies beyond Node's built-in fs/path.
========================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

// __dirname here is /scripts — the project root is one level up.
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SITE_ROOT = 'https://tickmarktools.com';

const dataPath = path.join(PROJECT_ROOT, 'assets', 'tools-data.json');
const sitemapHtmlPath = path.join(PROJECT_ROOT, 'sitemap.html');
const sitemapXmlPath = path.join(PROJECT_ROOT, 'sitemap.xml');

// ---------------------------------------------------------------------------
// Static pages that aren't tools and so don't live in tools-data.json, but
// still need to be in sitemap.xml. Category hub pages (Calculators, PDF
// Tools, etc.) are NOT listed here — those are derived automatically from
// each category's "page" field in tools-data.json below, so a category only
// shows up in the sitemap once it actually has its own dedicated page.
// Categories with page: null (Finance Tools, Productivity Tools) anchor into
// the homepage via index.html#categories and correctly get no separate entry.
// ---------------------------------------------------------------------------
const STATIC_PAGES = [
  { loc: 'about', changefreq: 'monthly', priority: '0.6' },
  { loc: 'contact', changefreq: 'monthly', priority: '0.5' },
  { loc: 'blog', changefreq: 'weekly', priority: '0.6' },
  { loc: 'privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: 'terms-of-service', changefreq: 'yearly', priority: '0.3' },
  { loc: 'disclaimer', changefreq: 'yearly', priority: '0.3' },
  { loc: 'sitemap', changefreq: 'monthly', priority: '0.3' },
  { loc: 'how-to-use-tools', changefreq: 'monthly', priority: '0.4' },
  { loc: 'productivity-tips', changefreq: 'monthly', priority: '0.4' },
  { loc: 'ai-tools', changefreq: 'monthly', priority: '0.5' },
  { loc: 'best-ai-tools', changefreq: 'monthly', priority: '0.5' },
  { loc: 'best-calculators', changefreq: 'monthly', priority: '0.5' },
  { loc: 'best-pdf-tools', changefreq: 'monthly', priority: '0.5' },
];

const TODAY = new Date().toISOString().slice(0, 10);

function loadToolsData() {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Could not find ${dataPath} — sitemap build requires tools-data.json.`);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

// ---------------------------------------------------------------------------
// 1. sitemap.html category blocks
// ---------------------------------------------------------------------------
function rebuildSitemapHtml(data) {
  if (!fs.existsSync(sitemapHtmlPath)) {
    console.warn('sitemap.html not found — skipping HTML regeneration.');
    return 0;
  }
  let html = fs.readFileSync(sitemapHtmlPath, 'utf8');

  const catById = {};
  data.categories.forEach((c) => { catById[c.id] = c.name; });

  const toolsByCategory = {};
  data.tools.forEach((t) => {
    (toolsByCategory[t.category] = toolsByCategory[t.category] || []).push(t);
  });

  let changed = 0;
  Object.keys(toolsByCategory).forEach((catId) => {
    const name = catById[catId];
    if (!name) return;
    const links = toolsByCategory[catId]
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((t) => `      <a href="${t.slug}.html">${t.title}</a>`)
      .join('\n');

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockRe = new RegExp(`(<h5>${escaped}</h5>\\n)([\\s\\S]*?)(\\n\\s*</div>)`);
    if (blockRe.test(html)) {
      html = html.replace(blockRe, `$1${links}$3`);
      changed++;
    } else {
      console.warn(`Could not find a matching sitemap.html block for category "${name}" — left untouched.`);
    }
  });

  fs.writeFileSync(sitemapHtmlPath, html, 'utf8');
  return changed;
}

// ---------------------------------------------------------------------------
// 2. sitemap.xml
// ---------------------------------------------------------------------------
function xmlEscape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSitemapXml(data) {
  const entries = [];

  entries.push({ loc: '', changefreq: 'weekly', priority: '1.0' });

  STATIC_PAGES.forEach((p) => entries.push(p));

  const seenHubs = new Set();
  data.categories.forEach((c) => {
    if (c.page) {
      const slug = c.page.replace(/\.html$/, '');
      if (!seenHubs.has(slug)) {
        seenHubs.add(slug);
        entries.push({ loc: slug, changefreq: 'monthly', priority: '0.65' });
      }
    }
  });

  data.tools
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((t) => {
      entries.push({
        loc: t.slug,
        changefreq: 'monthly',
        priority: t.popular ? '0.7' : '0.6',
      });
    });

  const body = entries
    .map((e) => {
      const loc = e.loc ? `${SITE_ROOT}/${e.loc}` : `${SITE_ROOT}/`;
      return [
        '  <url>',
        `    <loc>${xmlEscape(loc)}</loc>`,
        `    <lastmod>${TODAY}</lastmod>`,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(sitemapXmlPath, xml, 'utf8');
  return { count: entries.length, hubCount: seenHubs.size };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function run() {
  const data = loadToolsData();
  const htmlBlocksChanged = rebuildSitemapHtml(data);
  const { count, hubCount } = buildSitemapXml(data);

  console.log('SITEMAP BUILD REPORT');
  console.log(`  Categories:            ${data.categories.length}`);
  console.log(`  Tools:                 ${data.tools.length}`);
  console.log(`  sitemap.html blocks:   ${htmlBlocksChanged} regenerated`);
  console.log(`  sitemap.xml entries:   ${count} (1 homepage + ${STATIC_PAGES.length} static + ${hubCount} category hubs + ${data.tools.length} tools)`);
}

if (require.main === module) {
  run();
}

module.exports = { run, rebuildSitemapHtml, buildSitemapXml, loadToolsData };
