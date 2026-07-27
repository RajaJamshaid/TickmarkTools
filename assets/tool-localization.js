/**
 * TickmarkTools — Tool Localization
 * -----------------------------------
 * Sits on top of country-detector.js. Any tool page can opt in to
 * automatic currency dropdowns, metric/imperial unit toggles, date
 * formatting, and country-specific default values purely by adding
 * data-attributes to their HTML — no per-tool JavaScript needed.
 *
 * LOAD ORDER (both once, in your global layout):
 *   <script src="/assets/js/country-detector.js"></script>
 *   <script src="/assets/js/tool-localization.js"></script>
 *
 * ============================================================
 * CONVENTIONS — add these attributes to any tool's HTML
 * ============================================================
 *
 * 1) CURRENCY DROPDOWN
 *    <select data-ttools-currency></select>
 *    → Auto-filled with common currencies, visitor's currency pre-selected.
 *    Read the chosen value anytime with:
 *      TickmarkLocalization.getCurrency()  // e.g. "PKR"
 *
 * 2) METRIC / IMPERIAL UNIT TOGGLE
 *    <div data-ttools-unit-toggle>
 *      <button data-unit="metric">cm</button>
 *      <button data-unit="imperial">ft/in</button>
 *    </div>
 *    → "active" class auto-applied to the button matching the visitor's
 *    country. Clicking a button overrides it (remembered for the session).
 *    Read anytime with:
 *      TickmarkLocalization.getUnitSystem()  // "metric" | "imperial"
 *    Listen for changes (e.g. to re-render a calculator):
 *      document.addEventListener('ttools:unitChanged', (e) => { e.detail.unitSystem })
 *
 * 3) DATE FORMAT DISPLAY
 *    <span data-ttools-date="2026-07-27"></span>
 *    → Rendered in the visitor's local date format automatically
 *    (e.g. 7/27/2026 in the US, 27/07/2026 elsewhere).
 *
 * 4) COUNTRY-SPECIFIC DEFAULT VALUES
 *    <input data-ttools-country-default='{"US":"7.5","PK":"17","IN":"18","GB":"20"}'
 *           data-ttools-default-fallback="0">
 *    → Pre-fills the input's value with the entry matching the visitor's
 *    country code, or the fallback if there's no match. Useful for tax
 *    rates, shipping fees, minimum wage, etc. Works on <input>, <select>,
 *    and plain text elements (uses textContent for non-form elements).
 *
 * 5) CURRENCY SYMBOL / COUNTRY NAME TEXT
 *    <span data-ttools-currency-symbol></span>   → "₨", "$", "€"...
 *    <span data-ttools-country-name></span>      → "Pakistan", "United States"...
 *
 * All bindings re-run automatically if new matching elements are added to
 * the page later (e.g. a calculator that renders its form dynamically),
 * via a lightweight MutationObserver. You can also trigger it manually
 * after injecting HTML:
 *      TickmarkLocalization.apply();
 */
(function (window, document) {
  "use strict";

  if (!window.TickmarkCountry) {
    console.warn(
      "[TickmarkTools] tool-localization.js requires country-detector.js to be loaded first."
    );
    return;
  }

  const UNIT_OVERRIDE_KEY = "ttools_unit_override";

  const COMMON_CURRENCIES = [
    "USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR", "CAD",
    "AUD", "JPY", "CNY", "BDT", "NGN", "ZAR", "TRY",
  ];

  let currentInfo = null;

  // ---------- helpers ----------

  function getUnitOverride() {
    try {
      return sessionStorage.getItem(UNIT_OVERRIDE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setUnitOverride(unit) {
    try {
      sessionStorage.setItem(UNIT_OVERRIDE_KEY, unit);
    } catch (e) {
      /* ignore */
    }
  }

  function formatDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    try {
      return new Intl.DateTimeFormat(navigator.language || "en-US").format(d);
    } catch (e) {
      return d.toLocaleDateString();
    }
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
        // Already built — just make sure the right option is selected,
        // unless the visitor already changed it themselves.
        if (!select.dataset.ttoolsUserEdited) select.value = info.currency;
        return;
      }
      COMMON_CURRENCIES.forEach((code) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code;
        select.appendChild(opt);
      });
      select.value = COMMON_CURRENCIES.includes(info.currency)
        ? info.currency
        : (() => {
            const opt = document.createElement("option");
            opt.value = info.currency;
            opt.textContent = info.currency;
            select.insertBefore(opt, select.firstChild);
            return info.currency;
          })();
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
        document.dispatchEvent(
          new CustomEvent("ttools:unitChanged", { detail: { unitSystem: unit } })
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
      let map = {};
      try {
        map = JSON.parse(el.getAttribute("data-ttools-country-default"));
      } catch (e) {
        return;
      }
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
    const unitSystem = bindUnitToggles(currentInfo);
    bindDates();
    bindCountryDefaults(currentInfo);
    bindCurrencySymbolAndCountryName(currentInfo);
    return unitSystem;
  }

  // Watch for tools that render their markup dynamically (after data
  // loads, after a template renders, etc.) and re-apply automatically.
  function observeDom() {
    const observer = new MutationObserver((mutations) => {
      const hasRelevantAddition = mutations.some((m) =>
        Array.from(m.addedNodes).some(
          (node) =>
            node.nodeType === 1 &&
            (node.matches?.(
              "[data-ttools-currency],[data-ttools-unit-toggle],[data-ttools-date],[data-ttools-country-default],[data-ttools-currency-symbol],[data-ttools-country-name]"
            ) ||
              node.querySelector?.(
                "[data-ttools-currency],[data-ttools-unit-toggle],[data-ttools-date],[data-ttools-country-default],[data-ttools-currency-symbol],[data-ttools-country-name]"
              ))
        )
      );
      if (hasRelevantAddition) applyAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.TickmarkCountry.onReady((info) => {
    currentInfo = info;
    applyAll();
    if (document.body) observeDom();
    else document.addEventListener("DOMContentLoaded", observeDom);
  });

  window.TickmarkLocalization = {
    apply: applyAll,
    getUnitSystem: () => getUnitOverride() || currentInfo?.unitSystem || "metric",
    getCurrency: () => currentInfo?.currency || "USD",
    getCountryInfo: () => currentInfo,
    formatDate,
  };
})(window, document);
