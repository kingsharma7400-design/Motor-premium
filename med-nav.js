/* ============================================================
   med-nav.js  —  OICL Premium Calculator V30.0
   1. Sidebar "Mediclaim" par click -> neeche plan list SLIDE hokar
      khulti hai (accordion). Dobara click -> band.
   2. Product selection sirf sidebar se — upar wale op-tabs hidden.
   3. Har result box ke neeche Generate Quotation + Share buttons.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var MED_PLANS = [
    { op: 'yec',  icon: '🌱', label: 'Youth Eco Care' },
    { op: 'ossp', icon: '🛡️', label: 'Sampoorna Swasthya' },
    { op: 'hff',  icon: '👨‍👩‍👧', label: 'Happy Family Floater' },
    { op: 'stu',  icon: '⬆️', label: 'Super Health Top-Up' }
  ];

  /* ============================================================
     1. Sidebar accordion
     ============================================================ */
  function buildSubNav() {
    var medBtn = document.querySelector('.nav-item[data-tab="med"]');
    if (!medBtn || $('medSubNav')) return;

    var caret = document.createElement('span');
    caret.className = 'nav-caret';
    caret.textContent = '▾';
    medBtn.appendChild(caret);

    var wrap = document.createElement('div');
    wrap.className = 'nav-sub';
    wrap.id = 'medSubNav';

    var inner = document.createElement('div');
    inner.className = 'nav-sub-inner';
    wrap.appendChild(inner);

    MED_PLANS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'nav-sub-item';
      b.dataset.op = p.op;
      b.innerHTML = '<span class="nav-sub-icon">' + p.icon + '</span><span>' + p.label + '</span>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        openMed(p.op);
      });
      inner.appendChild(b);
    });

    medBtn.parentNode.insertBefore(wrap, medBtn.nextSibling);

    /* Toggle slide open / close */
    medBtn.addEventListener('click', function () {
      var isOpen = wrap.classList.contains('open');
      /* agar Mediclaim tab pehle se active tha -> toggle, warna hamesha open */
      var wasActive = medBtn.classList.contains('active');
      if (isOpen && wasActive) {
        wrap.classList.remove('open');
        caret.classList.remove('open');
      } else {
        wrap.classList.add('open');
        caret.classList.add('open');
      }
      markActive(currentOp());
    });
  }

  function currentOp() {
    var pane = document.querySelector('#tab-med .op-pane.active');
    return pane ? pane.id.replace('op-', '') : 'yec';
  }

  function markActive(op) {
    Array.prototype.forEach.call(document.querySelectorAll('#medSubNav .nav-sub-item'), function (b) {
      b.classList.toggle('active', b.dataset.op === op);
    });
  }

  function openMed(op) {
    var medBtn = document.querySelector('.nav-item[data-tab="med"]');

    /* tab switch (nav-item click handler app.js me hai) */
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (x) { x.classList.remove('active'); });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-content'), function (x) { x.classList.remove('active'); });
    if (medBtn) medBtn.classList.add('active');
    var sec = $('tab-med');
    if (sec) sec.classList.add('active');
    if (window.setPageTitle) window.setPageTitle('med');

    /* subtitle me chuna hua plan dikhao */
    var sub = document.getElementById('pageTitleSub');
    if (sub) {
      for (var i = 0; i < MED_PLANS.length; i++) {
        if (MED_PLANS[i].op === op) {
          sub.textContent = MED_PLANS[i].label + ' — Health Premium Calculator';
          break;
        }
      }
    }

    /* pane switch */
    Array.prototype.forEach.call(document.querySelectorAll('#tab-med .op-pane'), function (p) { p.classList.remove('active'); });
    var pane = $('op-' + op);
    if (pane) pane.classList.add('active');
    Array.prototype.forEach.call(document.querySelectorAll('#tab-med .op-tab'), function (t) {
      t.classList.toggle('active', t.dataset.op === op);
    });

    markActive(op);
    var wrap = $('medSubNav');
    if (wrap) wrap.classList.add('open');
    var caret = document.querySelector('.nav-item[data-tab="med"] .nav-caret');
    if (caret) caret.classList.add('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.openMediclaim = openMed;

  /* ============================================================
     2. Result-side Generate Quotation + Share buttons
     ============================================================ */
  var GEN_MAP = [
    { pfx: 'yec', result: 'yecResult' },
    { pfx: 'os',  result: 'osResult'  },
    { pfx: 'hf',  result: 'hfResult'  },
    { pfx: 'st',  result: 'stResult'  },
    { pfx: 'pa',  result: 'paResult'  }   /* Personal Accident (Fire/PA tab) */
  ];

  function wireGenButtons() {
    GEN_MAP.forEach(function (g) {
      var gen = $(g.pfx + 'Gen'), sh = $(g.pfx + 'Share');
      if (gen) gen.addEventListener('click', function () {
        if (window.HealthQuote) window.HealthQuote.open();
      });
      if (sh) sh.addEventListener('click', function () {
        if (window.HealthQuote) window.HealthQuote.share();
      });
    });
  }

  /* Result box dikhte hi button row show karo */
  function watchResults() {
    GEN_MAP.forEach(function (g) {
      var box = $(g.result), row = $(g.pfx + 'GenRow');
      if (!box || !row) return;
      var mo = new MutationObserver(function () {
        row.style.display = (box.style.display !== 'none' && box.innerHTML.trim()) ? 'flex' : 'none';
      });
      mo.observe(box, { attributes: true, childList: true, attributeFilter: ['style'] });
    });
  }

  function init() {
    buildSubNav();
    wireGenButtons();
    watchResults();
    markActive(currentOp());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
