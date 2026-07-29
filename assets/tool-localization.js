/**
 * TickmarkTools — Tool Localization
 * -----------------------------------
 * Sits on top of country-detector.js. Any tool page can opt in to
 * automatic currency dropdowns, metric/imperial unit toggles, date
 * formatting, and country-specific default values purely by adding
 * data-attributes to their HTML — no per-tool JavaScript needed.
 *
 * LOAD ORDER (both once, in your global layout, relative paths):
 *   <script src="assets/country-detector.js"></script>
 *   <script src="assets/tool-localization.js"></script>
 *   <script src="assets/main.js"></script>
 *
 * This file is defensive about load order: if for any reason it runs
 * before country-detector.js has defined window.TickmarkCountry (wrong
 * script order, a page missing the include, a slow/blocked CDN, etc.),
 * it POLLS for it for a few seconds instead of silently doing nothing.
 * If it still never appears, it falls back to safe metric/USD defaults
 * so tools never crash with "TickmarkCountry is not defined".
 *
 * ============================================================
 * CONVENTIONS — add these attributes to any tool's HTML
 * ============================================================
 *
 * 1) CURRENCY DROPDOWN
 *    <select data-ttools-currency></select>
 *
 * 2) METRIC / IMPERIAL UNIT TOGGLE
 *    <div data-ttools-unit-toggle>
 *      <button data-unit="metric">cm</button>
 *      <button data-unit="imperial">ft/in</button>
 *    </div>
 *
 * 3) DATE FORMAT DISPLAY
 *    <span data-ttools-date="2026-07-27"></span>
 *
 * 4) COUNTRY-SPECIFIC DEFAULT VALUES
 *    <input data-ttools-country-default='{"US":"7.5","PK":"17","IN":"18"}'
 *           data-ttools-default-fallback="0">
 *
 * 5) CURRENCY SYMBOL / COUNTRY NAME TEXT
 *    <span data-ttools-currency-symbol></span>
 *    <span data-ttools-country-name></span>
 *
 * PUBLIC API:
 *   TickmarkLocalization.apply()          // re-run after injecting HTML
 *   TickmarkLocalization.getUnitSystem()  // "metric" | "imperial"
 *   TickmarkLocalization.getCurrency()    // e.g. "PKR"
 *   TickmarkLocalization.getCountryInfo() // full info object or null
 *   TickmarkLocalization.formatDate(x)
 */
(function (window, document) {
  "use strict";

  const UNIT_OVERRIDE_KEY = "ttools_unit_override";
  const SAFE_DEFAULT_INFO = {
    countryCode: "UNKNOWN",
    countryName: "Unknown",
    currency: "USD",
    currencySymbol: "$",
    unitSystem: "metric",
    source: "no-country-detector",
  };

  const COMMON_CURRENCIES = [
    "USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR", "CAD",
    "AUD", "JPY", "CNY", "BDT", "NGN", "ZAR", "TRY",
  ];

  const SELECTOR_LIST =
    "[data-ttools-currency],[data-ttools-unit-toggle],[data-ttools-date]," +
    "[data-ttools-country-default],[data-ttools-currency-symbol],[data-ttools-country-name]";

  let currentInfo = null;

  // ---------- helpers ----------

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  }

  function getUnitOverride() {
    return safe(() => sessionStorage.getItem(UNIT_OVERRIDE_KEY), null);
  }

  function setUnitOverride(unit) {
    safe(() => sessionStorage.setItem(UNIT_OVERRIDE_KEY, unit));
  }

  function formatDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return safe(
      () => new Intl.DateTimeFormat(navigator.language || "en-US").format(d),
      d.toLocaleDateString()
    );
  }

  function setFieldValue(el, value) {
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") {
      if (!el.dataset.ttoolsUserEdited) el.value = value;
    } else {
      el.textContent = value;
    }
  }

  // ---------- individual binders ----------

  function bindCurrencyDropdowns(info) {
    document.querySelectorAll("[data-ttools-currency]").forEach((select) => {
      if (select.dataset.ttoolsBound) {
        if (!select.dataset.ttoolsUserEdited) select.value = info.currency;
        return;
      }
      COMMON_CURRENCIES.forEach((code) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code;
        select.appendChild(opt);
      });
      if (COMMON_CURRENCIES.includes(info.currency)) {
        select.value = info.currency;
      } else {
        const opt = document.createElement("option");
        opt.value = info.currency;
        opt.textContent = info.currency;
        select.insertBefore(opt, select.firstChild);
        select.value = info.currency;
      }
      select.addEventListener("change", () => {
        select.dataset.ttoolsUserEdited = "true";
      });
      select.dataset.ttoolsBound = "true";
    });
  }

  function applyUnitToggle(toggleEl, unit) {
    toggleEl.querySelectorAll("[data-unit]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.unit === unit);
    });
  }

  function bindUnitToggles(info) {
    const override = getUnitOverride();
    const activeUnit = override || info.unitSystem;

    document.querySelectorAll("[data-ttools-unit-toggle]").forEach((toggle) => {
      applyUnitToggle(toggle, activeUnit);
      if (toggle.dataset.ttoolsBound) return;
      toggle.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-unit]");
        if (!btn) return;
        const unit = btn.dataset.unit;
        setUnitOverride(unit);
        document.querySelectorAll("[data-ttools-unit-toggle]").forEach((t) =>
          applyUnitToggle(t, unit)
        );
        safe(() =>
          document.dispatchEvent(
            new CustomEvent("ttools:unitChanged", { detail: { unitSystem: unit } })
          )
        );
      });
      toggle.dataset.ttoolsBound = "true";
    });

    return activeUnit;
  }

  function bindDates() {
    document.querySelectorAll("[data-ttools-date]").forEach((el) => {
      const raw = el.getAttribute("data-ttools-date");
      el.textContent = formatDate(raw);
    });
  }

  function bindCountryDefaults(info) {
    document.querySelectorAll("[data-ttools-country-default]").forEach((el) => {
      if (el.dataset.ttoolsUserEdited) return;
      const map = safe(() => JSON.parse(el.getAttribute("data-ttools-country-default")), null);
      if (!map) return;
      const fallback = el.getAttribute("data-ttools-default-fallback") ?? "";
      const value = Object.prototype.hasOwnProperty.call(map, info.countryCode)
        ? map[info.countryCode]
        : fallback;
      setFieldValue(el, value);

      if (!el.dataset.ttoolsBound) {
        const tag = el.tagName.toLowerCase();
        if (tag === "input" || tag === "select" || tag === "textarea") {
          el.addEventListener("input", () => {
            el.dataset.ttoolsUserEdited = "true";
          });
        }
        el.dataset.ttoolsBound = "true";
      }
    });
  }

  function bindCurrencySymbolAndCountryName(info) {
    document.querySelectorAll("[data-ttools-currency-symbol]").forEach((el) => {
      el.textContent = info.currencySymbol;
    });
    document.querySelectorAll("[data-ttools-country-name]").forEach((el) => {
      el.textContent = info.countryName;
    });
  }

  // ---------- orchestration ----------

  function applyAll() {
    if (!currentInfo) return;
    bindCurrencyDropdowns(currentInfo);
    bindUnitToggles(currentInfo);
    bindDates();
    bindCountryDefaults(currentInfo);
    bindCurrencySymbolAndCountryName(currentInfo);
  }

  function observeDom() {
    const observer = new MutationObserver((mutations) => {
      const hasRelevantAddition = mutations.some((m) =>
        Array.from(m.addedNodes).some(
          (node) =>
            node.nodeType === 1 &&
            (safe(() => node.matches(SELECTOR_LIST), false) ||
              safe(() => !!node.querySelector(SELECTOR_LIST), false))
        )
      );
      if (hasRelevantAddition) applyAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function startObservingWhenReady() {
    if (document.body) {
      observeDom();
    } else {
      document.addEventListener("DOMContentLoaded", observeDom);
    }
  }

  function init(info) {
    currentInfo = info;
    applyAll();
    startObservingWhenReady();
  }

  // ---- Wait for country-detector.js, but never hang forever ----
  // Handles the case where script order is accidentally wrong, a CDN
  // is blocked, or this file loads on a page missing the other script.
  function waitForCountryDetector(maxWaitMs, intervalMs) {
    const start = Date.now();
    (function poll() {
      if (window.TickmarkCountry && typeof window.TickmarkCountry.onReady === "function") {
        window.TickmarkCountry.onReady(init);
        return;
      }
      if (Date.now() - start >= maxWaitMs) {
        console.warn(
          "[TickmarkTools] country-detector.js was not found after waiting. " +
          "Falling back to metric/USD defaults. Check that country-detector.js " +
          "is included BEFORE tool-localization.js on this page."
        );
        init(SAFE_DEFAULT_INFO);
        return;
      }
      setTimeout(poll, intervalMs);
    })();
  }

  waitForCountryDetector(4000, 50);

  window.TickmarkLocalization = {
    apply: applyAll,
    getUnitSystem: () => getUnitOverride() || currentInfo?.unitSystem || "metric",
    getCurrency: () => currentInfo?.currency || "USD",
    getCountryInfo: () => currentInfo,
    formatDate,
  };
})(window, document);
