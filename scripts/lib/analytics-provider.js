/* ==========================================================
   scripts/lib/analytics-provider.js

   Pluggable analytics adapter for the recommendation engine.

   The engine calls getAnalyticsScores() once per build. This module
   tries real providers first (if configured via env vars) and returns
   null if none are set up — the recommendation engine then falls back
   to the static popularityScore / dateAdded / alphabetical chain, per
   the required fallback order. No analytics account is required for
   this system to work; it just gets smarter automatically once one is
   connected.

   Expected return shape (or null if unavailable):
     {
       "age-calculator": { views7d: 1820, views30d: 6400, engagementScore: 0.71 },
       "pdf-merge":      { views7d: 2210, views30d: 7100, engagementScore: 0.65 },
       ...
     }

   To wire up a real provider, implement the matching function below
   and set the env var — nothing else in the codebase needs to change,
   since build-recommendations.js only ever calls getAnalyticsScores().
========================================================== */

'use strict';

/**
 * GA4 Data API adapter (stub).
 * Requires: GA4_PROPERTY_ID + GOOGLE_APPLICATION_CREDENTIALS (service account)
 * and the `@google-analytics/data` package installed.
 */
async function fetchFromGA4() {
  if (!process.env.GA4_PROPERTY_ID) return null;
  // -----------------------------------------------------------------
  // Real implementation sketch (uncomment once the package + creds are set up):
  //
  // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  // const client = new BetaAnalyticsDataClient();
  // const [response] = await client.runReport({
  //   property: `properties/${process.env.GA4_PROPERTY_ID}`,
  //   dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  //   dimensions: [{ name: 'pagePath' }],
  //   metrics: [{ name: 'screenPageViews' }, { name: 'engagementRate' }],
  // });
  // return mapGA4RowsToScores(response.rows);
  // -----------------------------------------------------------------
  return null; // not configured in this environment
}

/**
 * Plausible Analytics adapter (stub).
 * Requires: PLAUSIBLE_API_KEY + PLAUSIBLE_SITE_ID.
 */
async function fetchFromPlausible() {
  if (!process.env.PLAUSIBLE_API_KEY) return null;
  // Real implementation would call Plausible's Stats API
  // (https://plausible.io/docs/stats-api) per top pages, last 7/30 days.
  return null;
}

/**
 * Umami adapter (stub).
 * Requires: UMAMI_API_URL + UMAMI_API_KEY + UMAMI_WEBSITE_ID.
 */
async function fetchFromUmami() {
  if (!process.env.UMAMI_API_URL) return null;
  // Real implementation would call Umami's /api/websites/:id/pageviews.
  return null;
}

/**
 * Tries each configured provider in order and returns the first result,
 * or null if none are available — signaling the engine to use the
 * static fallback chain instead.
 */
async function getAnalyticsScores() {
  const providers = [fetchFromGA4, fetchFromPlausible, fetchFromUmami];
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) return result;
    } catch (err) {
      console.warn(`⚠ Analytics provider ${provider.name} failed, trying next: ${err.message}`);
    }
  }
  return null;
}

module.exports = { getAnalyticsScores };
