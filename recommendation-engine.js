/* ==========================================================
   scripts/lib/recommendation-engine.js

   Pure, dependency-free selection logic for all five recommendation
   sections. No file I/O here — feed it a normalized tools repo (from
   tools-repo.js) plus optional analytics scores, and it returns arrays
   of tool objects. This separation is what makes the engine reusable:
   build-recommendations.js uses it to inject static HTML, but the same
   functions could power a future JSON API or client-side widget too.
========================================================== */

'use strict';

const DEFAULT_COUNT = 8;

// Category adjacency graph — used ONLY as a fallback when a category
// doesn't have enough tools on its own to fill a section. Add new
// categories here as they're created; everything else about the engine
// needs zero changes.
const CATEGORY_SIMILARITY = {
  calculators: ['finance'],
  finance: ['calculators'],
  pdf: ['image', 'text'],
  image: ['pdf', 'developer'],
  text: ['pdf', 'developer'],
  developer: ['text', 'image', 'productivity'],
  productivity: ['developer', 'ai'],
  ai: ['productivity', 'developer'],
};

function scoreOf(tool, analyticsScores) {
  const a = analyticsScores && analyticsScores[tool.slug];
  if (a) {
    // Recent popularity (7-day) weighted higher than 30-day, plus engagement.
    return (a.views7d || 0) * 2 + (a.views30d || 0) * 0.5 + (a.engagementScore || 0) * 1000;
  }
  return tool.popularityScore; // static fallback (already includes popular/trending boost)
}

/** Fills `list` up to `count` using tools from similar categories, excluding anything already picked. */
function fillFromSimilarCategories(list, allTools, excludeSlugs, categoryId, count) {
  const similarIds = CATEGORY_SIMILARITY[categoryId] || [];
  for (const simId of similarIds) {
    if (list.length >= count) break;
    const candidates = allTools.filter(
      (t) => t.category === simId && !excludeSlugs.has(t.slug)
    );
    for (const c of candidates) {
      if (list.length >= count) break;
      list.push(c);
      excludeSlugs.add(c.slug);
    }
  }
  // Last-resort fallback: fill from anywhere if still short (keeps the
  // section from ever looking sparse, even for a brand-new category
  // that has no siblings yet).
  if (list.length < count) {
    const rest = allTools.filter((t) => !excludeSlugs.has(t.slug));
    for (const c of rest) {
      if (list.length >= count) break;
      list.push(c);
      excludeSlugs.add(c.slug);
    }
  }
  return list;
}

/** Related Tools: same category first, similar categories fill any remaining slots. */
function selectRelated(currentTool, repo, count = DEFAULT_COUNT) {
  const excludeSlugs = new Set([currentTool.slug]);
  const sameCategory = repo.tools.filter(
    (t) => t.category === currentTool.category && !excludeSlugs.has(t.slug)
  );
  const list = sameCategory.slice(0, count);
  list.forEach((t) => excludeSlugs.add(t.slug));
  return fillFromSimilarCategories(list, repo.tools, excludeSlugs, currentTool.category, count);
}

/** Popular Tools: ranked by analytics if available, else popularityScore fallback chain. */
function selectPopular(currentTool, repo, analyticsScores, count = DEFAULT_COUNT) {
  return repo.tools
    .filter((t) => t.slug !== currentTool.slug)
    .sort((a, b) => scoreOf(b, analyticsScores) - scoreOf(a, analyticsScores))
    .slice(0, count);
}

/** Trending Tools: recent-momentum signal if available, else trending/popular flags, else newest. */
function selectTrending(currentTool, repo, analyticsScores, count = DEFAULT_COUNT) {
  const hasAnalytics = !!analyticsScores;
  return repo.tools
    .filter((t) => t.slug !== currentTool.slug)
    .sort((a, b) => {
      if (hasAnalytics) {
        const av = (analyticsScores[a.slug] && analyticsScores[a.slug].views7d) || 0;
        const bv = (analyticsScores[b.slug] && analyticsScores[b.slug].views7d) || 0;
        if (bv !== av) return bv - av;
      }
      const flagScore = (t) => (t.trending ? 2 : 0) + (t.popular ? 1 : 0);
      const flagDiff = flagScore(b) - flagScore(a);
      if (flagDiff !== 0) return flagDiff;
      return new Date(b.dateAdded) - new Date(a.dateAdded); // newest wins remaining ties
    })
    .slice(0, count);
}

/** Recently Added: sorted by dateAdded (newest first), falling back to array position. */
function selectRecentlyAdded(currentTool, repo, count = DEFAULT_COUNT) {
  return repo.tools
    .filter((t) => t.slug !== currentTool.slug)
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, count);
}

/**
 * You May Also Like: cross-category discovery — deliberately favors tools
 * NOT already surfaced in Related Tools, to avoid repeating the same list
 * twice on one page and to widen topical reach across the site.
 */
function selectYouMayAlsoLike(currentTool, repo, analyticsScores, alreadyShownSlugs, count = DEFAULT_COUNT) {
  const excludeSlugs = new Set([currentTool.slug, ...alreadyShownSlugs]);
  const pool = repo.tools.filter((t) => !excludeSlugs.has(t.slug));
  const sorted = pool.sort((a, b) => scoreOf(b, analyticsScores) - scoreOf(a, analyticsScores));
  const list = sorted.slice(0, count);
  list.forEach((t) => excludeSlugs.add(t.slug));
  // If cross-category pool was too small (tiny site), top up from anywhere.
  return fillFromSimilarCategories(list, repo.tools, excludeSlugs, currentTool.category, count);
}

/** Builds all five sections at once for a given tool. */
function buildRecommendations(currentTool, repo, analyticsScores, count = DEFAULT_COUNT) {
  const related = selectRelated(currentTool, repo, count);
  const popular = selectPopular(currentTool, repo, analyticsScores, count);
  const recentlyAdded = selectRecentlyAdded(currentTool, repo, count);
  const trending = selectTrending(currentTool, repo, analyticsScores, count);
  const alreadyShown = new Set([
    ...related.map((t) => t.slug),
    ...popular.map((t) => t.slug),
  ]);
  const youMayAlsoLike = selectYouMayAlsoLike(currentTool, repo, analyticsScores, alreadyShown, count);

  return { related, popular, recentlyAdded, trending, youMayAlsoLike };
}

module.exports = {
  CATEGORY_SIMILARITY,
  selectRelated,
  selectPopular,
  selectTrending,
  selectRecentlyAdded,
  selectYouMayAlsoLike,
  buildRecommendations,
};
