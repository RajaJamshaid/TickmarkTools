/**
 * TickmarkTools — Country Detector
 * ---------------------------------
 * Detects the visitor's country and exposes it globally so any tool on
 * the site can localize its results (currency, units, tax rules, dates).
 *
 * LOAD THIS SCRIPT FIRST, before tool-localization.js and before main.js,
 * as a plain classic <script> tag (no async/defer) so execution order is
 * guaranteed by the browser:
 *
 *   <script src="assets/country-detector.js"></script>
 *   <script src="assets/tool-localization.js"></script>
 *   <script src="assets/main.js"></script>
 *
 * Note the RELATIVE path ("assets/...", no leading slash). This is
 * required for GitHub Pages project sites served from a subfolder
 * (e.g. username.github.io/tickmarktools/) — a leading "/assets/..."
 * would incorrectly resolve to the domain root and 404.
 *
 * PUBLIC API (always available immediately after this script runs):
 *   window.TickmarkCountry.detect()      -> Promise<info>
 *   window.TickmarkCountry.onReady(fn)   -> calls fn(info) once ready
 *
 * `info` shape:
 *   {
 *     countryCode:    "PK",
 *     countryName:    "Pakistan",
 *     currency:       "PKR",
 *     currencySymbol: "₨",
 *     unitSystem:     "metric" | "imperial",
 *     source:         "detected" | "locale-fallback" | "default-fallback"
 *   }
 *
 * This script is defensive by design: it can never throw during load,
 * and window.TickmarkCountry is always defined the instant this file
 * finishes executing — even if every network call later fails.
 */
(function (window) {
  "use strict";

  const CACHE_KEY = "ttools_country_v1";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const HARD_TIMEOUT_MS = 6000; // never let onReady() hang longer than this

  const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

  const CURRENCY_SYMBOLS = {
    USD: "$", EUR: "€", GBP: "£", PKR: "₨", INR: "₹", AED: "د.إ",
    SAR: "﷼", CAD: "$", AUD: "$", JPY: "¥", CNY: "¥", BDT: "৳",
    NGN: "₦", ZAR: "R", TRY: "₺",
  };

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  function readCache() {
    return safe(() => {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed.data;
    }, null);
  }

  function writeCache(data) {
    safe(() => {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
    });
  }

  function buildInfo({ countryCode, countryName, currency }, source) {
    countryCode = (countryCode || "").toUpperCase();
    return {
      countryCode: countryCode || "UNKNOWN",
      countryName: countryName || "Unknown",
      currency: currency || "USD",
      currencySymbol: CURRENCY_SYMBOLS[currency] || currency || "$",
      unitSystem: IMPERIAL_COUNTRIES.has(countryCode) ? "imperial" : "metric",
      source: source || "detected",
    };
  }

  function hardDefault() {
    return {
      countryCode: "UNKNOWN",
      countryName: "Unknown",
      currency: "USD",
      currencySymbol: "$",
      unitSystem: "metric",
      source: "default-fallback",
    };
  }

  function localeFallback() {
    return safe(() => {
      const locale = navigator.language || "en-US";
      const region = window.Intl && Intl.Locale
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
    }, hardDefault());
  }

  function fetchWithTimeout(url, ms) {
    if (typeof fetch !== "function") {
      return Promise.reject(new Error("fetch unavailable"));
    }
    if (typeof AbortController === "function") {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), ms);
      return fetch(url, { signal: controller.signal })
        .then((res) => {
          clearTimeout(id);
          if (!res.ok) throw new Error("Bad response: " + res.status);
          return res.json();
        })
        .catch((err) => {
          clearTimeout(id);
          throw err;
        });
    }
    // Very old browsers without AbortController: race a manual timeout.
    return Promise.race([
      fetch(url).then((res) => {
        if (!res.ok) throw new Error("Bad response: " + res.status);
        return res.json();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);
  }

  function detectFromNetwork() {
    return fetchWithTimeout("https://ipapi.co/json/", 4000)
      .then((data) => {
        if (data && data.country_code) {
          return buildInfo(
            { countryCode: data.country_code, countryName: data.country_name, currency: data.currency },
            "detected"
          );
        }
        throw new Error("primary provider returned no country_code");
      })
      .catch(() =>
        fetchWithTimeout("https://ipwhois.app/json/", 4000)
          .then((data) => {
            if (data && data.country_code) {
              return buildInfo(
                {
                  countryCode: data.country_code,
                  countryName: data.country,
                  currency: data.currency && data.currency.code,
                },
                "detected"
              );
            }
            throw new Error("fallback provider returned no country_code");
          })
          .catch(() => localeFallback())
      );
  }

  let detectPromise = null;

  function detect() {
    const cached = readCache();
    if (cached) return Promise.resolve(cached);

    if (!detectPromise) {
      const withHardTimeout = Promise.race([
        detectFromNetwork(),
        new Promise((resolve) =>
          setTimeout(() => resolve(localeFallback()), HARD_TIMEOUT_MS)
        ),
      ]);

      detectPromise = withHardTimeout
        .then((info) => {
          writeCache(info);
          safe(() =>
            document.dispatchEvent(
              new CustomEvent("ttools:countryDetected", { detail: info })
            )
          );
          return info;
        })
        .catch(() => hardDefault()); // absolute last resort — never rejects
    }
    return detectPromise;
  }

  function onReady(callback) {
    if (typeof callback !== "function") return;
    detect().then(callback).catch(() => callback(hardDefault()));
  }

  // Warm the cache immediately so the first onReady() call anywhere on
  // the page resolves as fast as possible.
  detect();

  window.TickmarkCountry = { detect, onReady };
})(window);
