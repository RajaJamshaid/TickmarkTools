/* ==========================================================
   scripts/lib/tools-repo.js

   Loads assets/tools-data.json (the single source of truth used by
   the homepage, sitemap builder, and this recommendation engine) and
   normalizes every tool with the extra fields the recommendation
   system needs — without requiring you to hand-edit the JSON file.

   New OPTIONAL fields you can add per tool in tools-data.json as you
   go (none are required — sane defaults are computed if missing):

     "dateAdded": "2026-06-01"   // ISO date string. Powers "Recently Added".
     "popularityScore": 87        // 0–100. Manual fallback ranking signal.

   If a tool has neither, this module assigns a deterministic default
   so ordering is stable across builds (not random each run):
     - dateAdded  → derived from the tool's position in the array
                    (earlier in the file = added earlier). Add a real
                    date whenever you know it for more accurate sorting.
     - popularityScore → 100 if "popular": true, 70 if "trending": true,
                    otherwise 30, nudged by a stable hash of the slug
                    so ties don't all sort identically forever.
========================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(PROJECT_ROOT, 'assets', 'tools-data.json');

/** Deterministic 0–9 "jitter" derived from a string, so tie-breaks are stable. */
function stableJitter(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % 10;
}

function loadRawData(dataPath = DATA_PATH) {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Could not find ${dataPath} — the recommendation engine requires tools-data.json as its single source of truth.`);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

/**
 * Loads and normalizes the tools dataset.
 * @returns {{ categories: object[], tools: object[], toolsBySlug: Map, categoriesById: Map }}
 */
function loadToolsRepo(dataPath = DATA_PATH) {
  const raw = loadRawData(dataPath);
  const categories = raw.categories || [];
  const rawTools = raw.tools || [];

  // Base epoch for synthetic dateAdded values, oldest tool first.
  const baseEpoch = new Date('2025-01-01T00:00:00Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const tools = rawTools.map((tool, index) => {
    const dateAdded = tool.dateAdded
      ? tool.dateAdded
      : new Date(baseEpoch + index * dayMs).toISOString().slice(0, 10);

    let popularityScore = typeof tool.popularityScore === 'number'
      ? tool.popularityScore
      : (tool.popular ? 100 : tool.trending ? 70 : 30);
    popularityScore += stableJitter(tool.slug) * 0.1; // tiny stable tie-breaker

    return { ...tool, dateAdded, popularityScore };
  });

  const toolsBySlug = new Map(tools.map((t) => [t.slug, t]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  return { categories, tools, toolsBySlug, categoriesById };
}

module.exports = { loadToolsRepo, DATA_PATH };
