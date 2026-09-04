/* ==========================================================
   scripts/lib/render-html.js

   Turns tool objects into real, crawlable <a href="..."> markup using
   the site's EXISTING .related-grid / .related-card classes — no new
   CSS files, no design changes. Every card is a plain server-rendered
   anchor tag, so all internal links are indexable even with JS disabled.
========================================================== */

'use strict';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Renders one tool as a crawlable card: icon, title, short description, SEO-friendly URL. */
function renderToolCard(tool) {
  const title = escapeHtml(tool.title);
  const desc = escapeHtml(tool.description || '');
  const icon = tool.icon || '🔧';
  return `      <a href="${tool.slug}.html" class="related-card">
        <div class="related-emoji">${icon}</div>
        <div>
          <h4 style="font-size:14.5px;font-weight:600;">${title}</h4>
          <p style="font-size:12px;color:var(--ink-soft);margin-top:3px;line-height:1.4;">${desc}</p>
        </div>
      </a>`;
}

/** Wraps a list of tools in the section markup, bounded by AUTO markers so re-runs stay idempotent. */
function renderSection(markerName, heading, tools) {
  const cards = tools.map(renderToolCard).join('\n');
  return `<!-- AUTO:${markerName}:START -->
<div class="wrap tool-section">
  <h2>${escapeHtml(heading)}</h2>
  <div class="related-grid">
${cards}
  </div>
</div>
<!-- AUTO:${markerName}:END -->`;
}

module.exports = { renderToolCard, renderSection, escapeHtml };
