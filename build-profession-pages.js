/* ==========================================================
   scripts/build-profession-pages.js

   Generates the 11 profession-specific invoice generator pages from
   profession-invoice-template.html + assets/data/invoice-professions.json.

   This is the project's pSEO generator: structured data in, validated
   HTML pages out, with a quality gate that refuses to write a page
   that fails validation, and a build report so failures are never
   silent.

   Run: node scripts/build-profession-pages.js
========================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'scripts', 'templates', 'profession-invoice-template.html');
const DATA_PATH = path.join(ROOT, 'assets', 'data', 'invoice-professions.json');

const REQUIRED_TOKENS = [
  'PROF_TITLE', 'PROF_META_DESC', 'PROF_SLUG', 'PROF_LABEL', 'PROF_LABEL_LOWER',
  'PROF_KEY', 'PROF_H1', 'PROF_HERO_DESC', 'PROF_INTRO', 'PROF_GUIDANCE_LIST',
  'PROF_MISTAKES_LIST', 'PROF_FAQ_JSONLD', 'PROF_FAQ_HTML', 'PROF_RELATED_LINKS_HTML'
];

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function jsonEsc(str) {
  return String(str == null ? '' : str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildFaqJsonLd(faqs) {
  return faqs.map((f) => (
    `    {"@type": "Question", "name": "${jsonEsc(f.q)}", "acceptedAnswer": {"@type": "Answer", "text": "${jsonEsc(f.a)}"}}`
  )).join(',\n');
}

function buildFaqHtml(faqs) {
  return faqs.map((f) => (
    '  <div class="faq-item">\n' +
    `    <div class="faq-q" role="button" tabindex="0" aria-expanded="false"><span>${esc(f.q)}</span><svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></div>\n` +
    `    <div class="faq-a"><p>${esc(f.a)}</p></div>\n` +
    '  </div>'
  )).join('\n');
}

function buildList(items) {
  return items.map((i) => `      <li>${esc(i)}</li>`).join('\n');
}

function buildRelatedLinksHtml(related, professionsByKey) {
  const cards = related.map((key) => {
    const p = professionsByKey[key];
    if (!p) return '';
    return `    <a href="${esc(p.slug)}.html" class="related-card"><div class="related-emoji" aria-hidden="true">🧾</div><h3 style="font-size:14.5px;font-weight:600;margin:0;">${esc(p.label)} Invoice Generator</h3></a>`;
  }).filter(Boolean);
  return '  <div class="related-grid">\n' + cards.join('\n') + '\n  </div>';
}

// The 3 shared, genuinely-true-for-every-page FAQs, appended after each
// profession's 3 unique ones (matches the pattern validated in the master page).
const SHARED_FAQS = [
  { q: 'Is this invoice generator free to use?', a: 'Yes, it is completely free with no sign-up required.' },
  { q: 'Can I download the invoice as a PDF?', a: 'Yes. Use the Print / Save as PDF button, then choose "Save as PDF" as the destination in your browser\'s print dialog.' },
  { q: 'Does this tool store or upload my data?', a: 'No. All calculations run entirely in your browser, and nothing you enter is ever sent to a server or stored, unless you turn on the optional "remember in this browser" setting, which only saves data locally on your own device.' }
];

function run() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const professions = data.professions;
  const professionsByKey = {};
  professions.forEach((p) => { professionsByKey[p.key] = p; });

  const report = { requested: professions.length, generated: 0, rejected: 0, rejections: [] };
  const generatedTitles = new Set();
  const generatedDescriptions = new Set();
  const generatedH1s = new Set();

  professions.forEach((p) => {
    const problems = [];

    const faqs = [
      ...p.faqs.map((f) => ({ q: f.q, a: f.a })),
      ...SHARED_FAQS
    ];

    const values = {
      PROF_TITLE: p.pageTitle,
      PROF_META_DESC: p.metaDescription,
      PROF_SLUG: p.slug,
      PROF_LABEL: p.label,
      PROF_LABEL_LOWER: p.label.toLowerCase(),
      PROF_KEY: p.presetKey,
      PROF_H1: p.h1,
      PROF_HERO_DESC: p.heroDesc,
      PROF_INTRO: p.intro,
      PROF_GUIDANCE_LIST: buildList(p.guidance),
      PROF_MISTAKES_LIST: buildList(p.mistakes),
      PROF_FAQ_JSONLD: buildFaqJsonLd(faqs),
      PROF_FAQ_HTML: buildFaqHtml(faqs),
      PROF_RELATED_LINKS_HTML: buildRelatedLinksHtml(p.relatedProfessions, professionsByKey)
    };

    // --- Quality gate ---
    if (generatedTitles.has(p.pageTitle)) problems.push('duplicate title vs another generated page');
    if (generatedDescriptions.has(p.metaDescription)) problems.push('duplicate meta description vs another generated page');
    if (generatedH1s.has(p.h1)) problems.push('duplicate H1 vs another generated page');
    if (!p.intro || p.intro.length < 200) problems.push('intro paragraph too short for genuine unique value');
    if (!p.guidance || p.guidance.length < 2) problems.push('fewer than 2 guidance tips');
    if (!p.mistakes || p.mistakes.length < 2) problems.push('fewer than 2 common mistakes');
    if (!p.faqs || p.faqs.length < 3) problems.push('fewer than 3 profession-specific FAQs');
    if (!p.relatedProfessions || p.relatedProfessions.length < 2) problems.push('fewer than 2 related profession links');
    p.relatedProfessions.forEach((r) => {
      if (!professionsByKey[r]) problems.push(`relatedProfessions references unknown key "${r}"`);
    });
    if (!/^[a-z0-9-]+$/.test(p.slug)) problems.push('slug contains invalid characters');

    if (problems.length) {
      report.rejected++;
      report.rejections.push({ profession: p.key, problems });
      return; // do NOT publish a page that fails the quality gate
    }

    let html = template;
    REQUIRED_TOKENS.forEach((token) => {
      const re = new RegExp('\\{\\{' + token + '\\}\\}', 'g');
      html = html.replace(re, () => values[token]); // function form avoids $-substitution issues
    });

    // Verify no unresolved tokens remain anywhere in the output.
    const leftover = html.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (leftover) {
      report.rejected++;
      report.rejections.push({ profession: p.key, problems: ['unresolved tokens: ' + leftover.join(', ')] });
      return;
    }

    const outPath = path.join(ROOT, p.slug + '.html');
    fs.writeFileSync(outPath, html, 'utf8');
    generatedTitles.add(p.pageTitle);
    generatedDescriptions.add(p.metaDescription);
    generatedH1s.add(p.h1);
    report.generated++;
  });

  console.log('PSEO BUILD REPORT — profession invoice pages');
  console.log(`  Pages requested: ${report.requested}`);
  console.log(`  Pages generated: ${report.generated}`);
  console.log(`  Pages rejected:  ${report.rejected}`);
  if (report.rejections.length) {
    console.log('\n  Rejection detail:');
    report.rejections.forEach((r) => {
      console.log(`    - ${r.profession}: ${r.problems.join('; ')}`);
    });
  }
  return report;
}

if (require.main === module) {
  const report = run();
  process.exitCode = report.rejected > 0 ? 1 : 0;
}

module.exports = { run };
