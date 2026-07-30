/* ==========================================================
   Regenerates the category tool-lists inside sitemap.html
   from assets/tools-data.json — the same single source used
   by the homepage. Run this after editing tools-data.json:

     node build-sitemap.js

   It only touches the <div class="footer-col"> blocks whose
   heading matches a category name inside the "Calculators /
   Text Tools / Image Tools / PDF Tools / Productivity Tools /
   Developer Tools / Finance Tools" grid — nothing else in
   sitemap.html is modified.
========================================================== */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'assets', 'tools-data.json');
const sitemapPath = path.join(__dirname, 'sitemap.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let html = fs.readFileSync(sitemapPath, 'utf8');

// category.id -> category.name, used to find the matching <h5> heading
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
    .map((t) => `      <a href="${t.slug}.html">${t.title}</a>`)
    .join('\n');

  // Match: <h5>Category Name</h5> ... (links) ... </div>
  const blockRe = new RegExp(
    `(<h5>${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h5>\\n)([\\s\\S]*?)(\\n\\s*</div>)`
  );
  if (blockRe.test(html)) {
    html = html.replace(blockRe, `$1${links}$3`);
    changed++;
  } else {
    console.warn(`Could not find a matching block for category "${name}" — left untouched.`);
  }
});

fs.writeFileSync(sitemapPath, html);
console.log(`sitemap.html updated: ${changed} category block(s) regenerated from tools-data.json.`);
