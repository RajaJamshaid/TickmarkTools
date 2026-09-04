/* ==========================================================================
   TickmarkTools — Country / Locale Detection (v2)
   Implements every improvement point from the code review:
     1. Locale fallback map (35+ countries, defaults to USD)
     2. Disambiguated currency symbols (CA$, AU$, NZ$, S$, HK$, MX$...) +
        Intl.NumberFormat auto-lookup for everything else
     3. Smarter cache: timestamp + ipHash + timezone, 8h TTL
     4. Country flag emoji generator
     5. Returns language + locale
     6. Currency symbol generation via Intl instead of a manual map
     7. Versioned cache key (bump v1 -> v2 invalidates old cache automatically)
     8. Real network source recorded ("ipapi" / "ipwhois" / "fallback")
     Extras: isEU, vatSupported, dateFormat, decimalSeparator, thousandSeparator
   ========================================================================== */
(function (global) {
  'use strict';

  const CACHE_KEY = 'ttools_country_v2';      // bump this to v3, v4... to force-invalidate old cache
  const CACHE_TTL_HOURS = 8;                  // 6–12h range, tune per traffic pattern

  /* 1. Locale -> currency fallback map (extend anytime, defaults to USD) */
  const LOCALE_CURRENCY = {
    US:'USD', GB:'GBP', DE:'EUR', FR:'EUR', IT:'EUR', ES:'EUR', NL:'EUR', PT:'EUR',
    IE:'EUR', BE:'EUR', AT:'EUR', FI:'EUR', GR:'EUR',
    PK:'PKR', IN:'INR', AU:'AUD', CA:'CAD', AE:'AED', SA:'SAR', CN:'CNY', JP:'JPY',
    BR:'BRL', MX:'MXN', RU:'RUB', ZA:'ZAR', NG:'NGN', EG:'EGP', TR:'TRY', SG:'SGD',
    MY:'MYR', ID:'IDR', PH:'PHP', TH:'THB', VN:'VND', BD:'BDT', NZ:'NZD', KR:'KRW',
    CH:'CHF', SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN', HK:'HKD'
  };

  /* EU membership (for isEU) */
  const EU_COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];

  /* Countries where a GST/VAT-style calculator is directly relevant */
  const VAT_SUPPORTED = [...EU_COUNTRIES, 'GB','IN','AU','NZ','ZA','AE','SA','PK','SG','CA'];

  /* 2. Currencies that share the "$" symbol — disambiguate explicitly */
  const CURRENCY_SYMBOL_OVERRIDE = {
    CAD: 'CA$', AUD: 'AU$', NZD: 'NZ$', SGD: 'S$', HKD: 'HK$', MXN: 'MX$'
  };

  /* 4. Flag emoji from ISO country code, e.g. "PK" -> 🇵🇰 */
  function flagEmoji(code) {
    if (!code || code.length !== 2) return '';
    return [...code.toUpperCase()]
      .map(c => String.fromCodePoint(127397 + c.charCodeAt()))
      .join('');
  }

  /* 6. Currency symbol via Intl (auto-supports new currencies), with override for ambiguous $ */
  function currencySymbolFor(currency, locale) {
    if (CURRENCY_SYMBOL_OVERRIDE[currency]) return CURRENCY_SYMBOL_OVERRIDE[currency];
    try {
      const parts = new Intl.NumberFormat(locale || 'en', { style: 'currency', currency }).formatToParts(1);
      const symbolPart = parts.find(p => p.type === 'currency');
      return symbolPart ? symbolPart.value : currency;
    } catch (e) {
      return currency;
    }
  }

  function dateFormatFor(countryCode) {
    const YMD = ['CN', 'JP', 'KR', 'TW', 'HU', 'SE', 'LT', 'LV', 'EE'];
    if (countryCode === 'US') return 'MM/DD/YYYY';
    if (YMD.includes(countryCode)) return 'YYYY-MM-DD';
    return 'DD/MM/YYYY';
  }

  function localeNumberFormats(locale) {
    try {
      const parts = new Intl.NumberFormat(locale).formatToParts(1234567.8);
      const decimal = parts.find(p => p.type === 'decimal')?.value || '.';
      const group = parts.find(p => p.type === 'group')?.value || ',';
      return { decimalSeparator: decimal, thousandSeparator: group };
    } catch (e) {
      return { decimalSeparator: '.', thousandSeparator: ',' };
    }
  }

  function getTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
    catch (e) { return null; }
  }

  function getLanguage() {
    return (navigator.language || 'en-US').split('-')[0];
  }

  /* short, dependency-free hash so we never store a raw IP in cache */
  async function shortHash(str) {
    try {
      const enc = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'na'; }
  }

  /* 3. Cache with timestamp + ipHash + timezone — auto-expires on travel or after TTL */
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const ageHours = (Date.now() - data.timestamp) / 36e5;
      if (ageHours > CACHE_TTL_HOURS) return null;
      if (data.timezone && data.timezone !== getTimezone()) return null; // timezone changed -> likely traveled
      return data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  /* 8. Real network source instead of a generic "detected" flag, with automatic fallback provider */
  async function detectViaAPI() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('ipapi non-200');
      const d = await res.json();
      if (!d || !d.country_code) throw new Error('ipapi malformed');
      return { countryCode: d.country_code, countryName: d.country_name, ip: d.ip, source: 'ipapi' };
    } catch (e) {
      try {
        const res2 = await fetch('https://ipwho.is/');
        const d2 = await res2.json();
        if (!d2.success) throw new Error('ipwhois failed');
        return { countryCode: d2.country_code, countryName: d2.country, ip: d2.ip, source: 'ipwhois' };
      } catch (e2) {
        return null; // both providers failed — caller falls back to US/USD
      }
    }
  }

  /* 5. Full return payload: countryCode, countryName, locale, language + everything else */
  async function buildGeoData() {
    const cached = readCache();
    if (cached) return cached;

    const apiResult = await detectViaAPI();
    const countryCode = apiResult?.countryCode || 'US';
    const countryName = apiResult?.countryName || 'United States';
    const source = apiResult ? apiResult.source : 'fallback';
    const ip = apiResult?.ip || '';

    const language = getLanguage();
    const locale = `${language}-${countryCode}`;
    const currency = LOCALE_CURRENCY[countryCode] || 'USD';
    const currencySymbol = currencySymbolFor(currency, locale);
    const timezone = getTimezone();
    const { decimalSeparator, thousandSeparator } = localeNumberFormats(locale);
    const dateFormat = dateFormatFor(countryCode);
    const isEU = EU_COUNTRIES.includes(countryCode);
    const vatSupported = VAT_SUPPORTED.includes(countryCode);
    const flag = flagEmoji(countryCode);
    const ipHash = ip ? await shortHash(ip) : 'na';

    const data = {
      countryCode, countryName, locale, language,
      currency, currencySymbol, flagEmoji: flag,
      timezone, dateFormat, decimalSeparator, thousandSeparator,
      isEU, vatSupported, source, ipHash,
      timestamp: Date.now()
    };
    writeCache(data);
    return data;
  }

  /* Public API */
  global.TTGeo = {
    /** Resolve geo/locale data (cached, else fetched). Always resolves — never throws. */
    get: buildGeoData,
    /** Force a fresh lookup on next call. */
    clearCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} }
  };

})(window);

/* --------------------------------------------------------------------------
   USAGE (drop into any tool page, after this script tag):

   <script src="assets/geo-detect.js"></script>
   <script>
     TTGeo.get().then(geo => {
       console.log(geo);
       // {
       //   countryCode: "PK", countryName: "Pakistan", locale: "en-PK", language: "en",
       //   currency: "PKR", currencySymbol: "Rs", flagEmoji: "🇵🇰",
       //   timezone: "Asia/Karachi", dateFormat: "DD/MM/YYYY",
       //   decimalSeparator: ".", thousandSeparator: ",",
       //   isEU: false, vatSupported: true, source: "ipapi",
       //   ipHash: "a1b2c3d4", timestamp: 1735689600000
       // }
     });
   </script>
   -------------------------------------------------------------------------- */
