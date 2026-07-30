/* ==========================================================
   TickmarkTools — single-source-of-truth data loader.
   Reads /assets/tools-data.json and:
     1. Fills every element with [data-tool-count] using its
        data-count-template (e.g. "{n} Tools, Always Free").
     2. Exposes window.TICKMARK_TOOLS (raw data) and a ready
        Promise (window.TICKMARK_TOOLS_READY) other scripts
        on ANY page can reuse for search, related tools, etc.
     3. Dispatches a "tickmark:tools-ready" event on document.

   To add a new tool: add ONE entry to assets/tools-data.json.
   Every page that includes this script (count badges, search,
   popular/trending sections) updates automatically — nothing
   else needs to be edited by hand.
========================================================== */
(function () {
  function resolveDataUrl() {
    // Works whether this page lives at the site root or one
    // level deep — always resolve relative to this script file.
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('tools-loader.js') !== -1) {
        return scripts[i].src.replace('tools-loader.js', 'tools-data.json');
      }
    }
    return 'assets/tools-data.json';
  }

  function applyCountBadges(data) {
    var total = data.tools.length;
    document.querySelectorAll('[data-tool-count]').forEach(function (el) {
      // Elements marked data-count-animate are handled by a page-specific
      // script (e.g. the homepage's count-up effect) — skip them here so
      // the two mechanisms don't race/flicker each other.
      if (el.hasAttribute('data-count-animate')) return;
      var tpl = el.getAttribute('data-count-template') || '{n}';
      el.textContent = tpl.replace('{n}', total);
    });
  }

  function categoryName(data, id) {
    var cat = data.categories.find(function (c) { return c.id === id; });
    return cat ? cat.name : '';
  }

  var readyResolve;
  window.TICKMARK_TOOLS_READY = new Promise(function (resolve) { readyResolve = resolve; });

  fetch(resolveDataUrl())
    .then(function (res) { return res.json(); })
    .then(function (data) {
      window.TICKMARK_TOOLS = data;
      window.TICKMARK_TOOLS.categoryName = function (id) { return categoryName(data, id); };
      applyCountBadges(data);
      document.dispatchEvent(new CustomEvent('tickmark:tools-ready', { detail: data }));
      readyResolve(data);
    })
    .catch(function (err) {
      console.warn('TickmarkTools: could not load tools-data.json (falling back to static copy in page).', err);
    });
})();
