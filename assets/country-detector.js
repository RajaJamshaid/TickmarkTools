/**
 * TickmarkTools — Country Detector
 * ---------------------------------
 * Site-wide utility to detect the visitor's country and expose it to
 * every tool/calculator on the platform, so results can be localized
 * (currency, measurement units, tax rules, date format, etc.)
 *
 * USAGE (drop once in your global footer/layout):
 *   <script src="/assets/js/country-detector.js"></script>
 *
 * Any tool page can then do:
 *
 *   TickmarkCountry.onReady((info) => {
 *     console.log(info.countryCode, info.countryName, info.unitSystem, info.currency);
 *   });
 *
 *   // or, if you need it later / conditionally:
 *   const info = await TickmarkCountry.detect();
 *
 * Design notes:
 * - Result is cached in localStorage for 24h so we don't hit the API on
 *   every page view (important once you have 500+ tool pages).
 * - Primary provider: ipapi.co (free tier, CORS-enabled, no key needed).
 * - Fallback provider: ipwhois.app (used only if the primary fails).
 * - Final fallback: browser locale/timezone guess (never blocks the UI).
 * - Never throws — worst case, callers get a "best guess" object.
 */
(function (window) {
  "use strict";

  const CACHE_KEY = "ttools_country_v1";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Countries that primarily use the imperial system for everyday measurements.
  const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

  // Small currency map for common cases; falls back to Intl for the rest.
  const CURRENCY_SYMBOLS = {
    USD: "$", EUR: "€", GBP: "£", PKR: "₨", INR: "₹", AED: "د.إ",
    SAR: "﷼", CAD: "$", AUD: "$", JPY: "¥", CNY: "¥", BDT: "৳",
    NGN: "₦", ZAR: "R", TRY: "₺",
  };

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (e) {
      /* localStorage unavailable (private mode etc.) — safe to ignore */
    }
  }

  function buildInfo({ countryCode, countryName, currency }) {
    countryCode = (countryCode || "").toUpperCase();
    return {
      countryCode: countryCode || "UNKNOWN",
      countryName: countryName || "Unknown",
      currency: currency || "USD",
      currencySymbol: CURRENCY_SYMBOLS[currency] || currency || "$",
      unitSystem: IMPERIAL_COUNTRIES.has(countryCode) ? "imperial" : "metric",
      source: "detected",
    };
  }

  function localeFallback() {
    // Best-effort guess using browser locale/timezone when all network
    // providers fail. Not accurate, but keeps the site functional.
    try {
      const locale = navigator.language || "en-US";
      const region = new Intl.Locale
        ? new Intl.Locale(locale).maximize().region
        : locale.split("-")[1];
      const code = (region || "US").toUpperCase();
      return {
        countryCode: code,
        countryName: code,
        currency: "USD",
        currencySymbol: "$",
        unitSystem: IMPERIAL_COUNTRIES.has(code) ? "imperial" : "metric",
        source: "locale-fallback",
      };
    } catch (e) {
      return {
        countryCode: "UNKNOWN",
        countryName: "Unknown",
        currency: "USD",
        currencySymbol: "$",
        unitSystem: "metric",
        source: "default-fallback",
      };
    }
  }

  async function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Bad response: " + res.status);
      return await res.json();
    } finally {
      clearTimeout(id);
    }
  }

  async function detectFromNetwork() {
    // Primary provider
    try {
      const data = await fetchWithTimeout("https://ipapi.co/json/", 4000);
      if (data && data.country_code) {
        return buildInfo({
          countryCode: data.country_code,
          countryName: data.country_name,
          currency: data.currency,
        });
      }
    } catch (e) {
      /* fall through to secondary provider */
    }

    // Fallback provider
    try {
      const data = await fetchWithTimeout("https://ipwhois.app/json/", 4000);
      if (data && data.country_code) {
        return buildInfo({
          countryCode: data.country_code,
          countryName: data.country,
          currency: data.currency && data.currency.code,
        });
      }
    } catch (e) {
      /* fall through to locale fallback */
    }

    return localeFallback();
  }

  let detectPromise = null;

  async function detect() {
    const cached = readCache();
    if (cached) return cached;

    if (!detectPromise) {
      detectPromise = detectFromNetwork().then((info) => {
        writeCache(info);
        document.dispatchEvent(
          new CustomEvent("ttools:countryDetected", { detail: info })
        );
        return info;
      });
    }
    return detectPromise;
  }

  function onReady(callback) {
    detect().then(callback);
  }

  // Kick off detection as soon as the script loads, so the cache is
  // warm and the event fires early for any listeners already attached.
  detect();

  window.TickmarkCountry = { detect, onReady };
})(window);
