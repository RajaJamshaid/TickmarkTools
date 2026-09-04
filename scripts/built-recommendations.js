/* ==========================================================
   scripts/build-recommendations.js

   Automatic internal-linking + recommendation system for
   TickmarkTools. Single source of truth: assets/tools-data.json.

   For every tool listed in tools-data.json, this script writes five
   real, crawlable HTML sections into that tool's page:
     - Related Tools        (same category, similar-category fallback)
     - Popular Tools        (analytics-ranked, else popularityScore)
     - Recently Added Tools (by dateAdded)
     - Trending Tools       (recent momentum, else trending/popular flags)
     - You May Also Like    (cross-category discovery)

   Run it after editing tools-data.json, or as part of your build:
     node scripts/build-recommendations.js

   HOW IT SCALES TO 1000+ TOOLS WITH ZERO MANUAL EDITS
   ----------------------------------------------------
   Adding a new tool = adding one object to tools-data.json. The next
   time this script runs, that tool automatically:
     (a) gets its own five recommendation sections injected, and
     (b) starts appearing inside every OTHER tool's sections where it
         qualifies (same category, high popularity score, most recent,
         etc.) — no page anywhere needs to be touched by hand.

   IDEMPOTENT / SAFE TO RE-RUN
   ----------------------------
   The first time it runs on a page, it locates the existing
   "Related Tools" / "Popular Calculators" / "You May Also Like"
   blocks (the boilerplate already shared by every tool page) and
   wraps fresh, data-driven versions in `<!-- AUTO:...:START/END -->`
   marker comments. Every run after that just replaces the content
   between markers — nothing else on the page is ever touched. If a
   page's structure doesn't match the expected boilerplate at all,
   the script falls back to inserting the full section set directly
   above the Comments section, so no tool page is ever left without
   recommendations (and nothing is silently skipped).

   SEO
   ---
   Every link rendered here is a plain `<a href="slug.html">` — no
   JavaScript is required to see or follow them, so they carry full
   crawlable link equity and reduce orphan pages by construction
   (every tool links out to ~40 other tools across five sections).

   PERFORMANCE
   -----------
   This is a build-time step, not runtime JS — it adds real markup to
   static HTML with zero extra script weight or render-blocking work,
   so it has no negative effect on Lighthouse Performance. Icons are
   emoji (text), not images, so there is nothing to lazy-load; if real
   <img> icons are introduced later, add loading="lazy" to them.
========================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const { loadToolsRepo } = require('./lib/tools-repo');
const { getAnalyticsScores } = require('./lib/analytics-provider');
const { buildRecommendations } = require('./lib/recommendation-engine');
const { renderSection } = require('./lib/render-html');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SECTION_NAMES = ['RELATED', 'POPULAR', 'RECENT', 'TRENDING', 'ALSOLIKE'];

// ---------------------------------------------------------------------------
// Legacy boilerplate patterns (used only for the one-time bootstrap on a
// page that has never been run through this script before). Relies on the
// site's existing, consistent tool-page template.
// ---------------------------------------------------------------------------
const RELATED_RE = /<div class="wrap tool-section">\s*<h2>Related Tools<\/h2>\s*<div class="related-grid">[\s\S]*?\n {2}<\/div>\n<\/div>/;
const POPULAR_RE = /<div class="wrap tool-section">\s*<h2>Popular Calculators<\/h2>\s*<div class="related-grid">[\s\S]*?\n {2}<\/div>\n<\/div>/;
const ALSOLIKE_RE = /<div class="wrap tool-section">\s*<h2>You May Also Like<\/h2>\s*<div class="related-grid">[\s\S]*?\n {2}<\/div>\n<\/div>/;
const COMMENTS_ANCHOR_RE = /(<div class="wrap tool-section" style="border-bottom:1px solid var\(--border\);">\s*<h2>Comments<\/h2>)/;

function buildSectionsHtml(tool, repo, analyticsScores) {
  const recs = buildRecommendations(tool, repo, analyticsScores);
  return {
    RELATED: renderSection('RELATED', 'Related Tools', recs.related),
    POPULAR: renderSection('POPULAR', 'Popular Tools', recs.popular),
    RECENT: renderSection('RECENT', 'Recently Added Tools', recs.recentlyAdded),
    TRENDING: renderSection('TRENDING', 'Trending Tools', recs.trending),
    ALSOLIKE: renderSection('ALSOLIKE', 'You May Also Like', recs.youMayAlsoLike),
  };
}

/** Fast path: markers already exist from a previous run — just refresh content between them. */
function updateViaMarkers(html, sections) {
  let out = html;
  for (const name of SECTION_NAMES) {
    const re = new RegExp(`<!-- AUTO:${name}:START -->[\\s\\S]*?<!-- AUTO:${name}:END -->`);
    out = out.replace(re, sections[name]);
  }
  return out;
}

/** First-run path: locate legacy sections and wrap them; append anything not found. */
function bootstrapSections(html, sections) {
  let out = html;
  let gotRelated = false;
  let gotPopular = false;
  let gotAlsoLike = false;

  if (RELATED_RE.test(out)) {
    out = out.replace(RELATED_RE, sections.RELATED);
    gotRelated = true;
  }
  if (POPULAR_RE.test(out)) {
    out = out.replace(POPULAR_RE, sections.POPULAR);
    gotPopular = true;
  }
  if (ALSOLIKE_RE.test(out)) {
    // Insert Recently Added + Trending directly before the (now-fresh)
    // You May Also Like section, giving the required final order:
    // Related, Popular, Recently Added, Trending, You May Also Like.
    out = out.replace(ALSOLIKE_RE, `${sections.RECENT}\n\n${sections.TRENDING}\n\n${sections.ALSOLIKE}`);
    gotAlsoLike = true;
  }

  const missing = [];
  if (!gotRelated) missing.push(sections.RELATED);
  if (!gotPopular) missing.push(sections.POPULAR);
  if (!gotAlsoLike) missing.push(sections.RECENT, sections.TRENDING, sections.ALSOLIKE);

  if (missing.length) {
    if (COMMENTS_ANCHOR_RE.test(out)) {
      out = out.replace(COMMENTS_ANCHOR_RE, `${missing.join('\n\n')}\n\n$1`);
    } else {
      // Last resort: page structure is unrecognized — append at the end
      // rather than silently skipping the tool.
      out += `\n${missing.join('\n\n')}\n`;
    }
  }
  return out;
}

function injectFile(filePath, tool, repo, analyticsScores) {
  const html = fs.readFileSync(filePath, 'utf8');
  const sections = buildSectionsHtml(tool, repo, analyticsScores);
  const hasMarkers = html.includes('<!-- AUTO:RELATED:START -->');
  const updated = hasMarkers ? updateViaMarkers(html, sections) : bootstrapSections(html, sections);
  fs.writeFileSync(filePath, updated, 'utf8');
  return hasMarkers ? 'updated' : 'bootstrapped';
}

async function run() {
  const repo = loadToolsRepo();
  const analyticsScores = await getAnalyticsScores();

  if (!analyticsScores) {
    console.log('ℹ No analytics provider configured — using popularityScore → newest → alphabetical fallback.');
  }

  let bootstrapped = 0;
  let updated = 0;
  const missingFiles = [];

  for (const tool of repo.tools) {
    const filePath = path.join(PROJECT_ROOT, `${tool.slug}.html`);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(tool.slug);
      continue;
    }
    const mode = injectFile(filePath, tool, repo, analyticsScores);
    if (mode === 'bootstrapped') bootstrapped++;
    else updated++;
  }

  console.log(`✔ Recommendations injected for ${bootstrapped + updated} tool page(s) — ${bootstrapped} bootstrapped, ${updated} refreshed.`);
  if (missingFiles.length) {
    console.warn(`⚠ No HTML file found for these slugs (check tools-data.json): ${missingFiles.join(', ')}`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, injectFile };
