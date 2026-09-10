/* =========================================================
   OICL Premium Calculator V30.0 · UI Enhancements
   Toasts · Dark mode · Step progress · Count-up ·
   Keyboard shortcuts
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- toasts ---------------- */
  var ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  window.proToast = function (msg, type, ms) {
    type = type || 'info';
    ms = ms == null ? 4000 : ms;
    var wrap = $('toastWrap');
    if (!wrap) { alert(String(msg).replace(/<[^>]*>/g, '')); return; }
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<span class="toast-ico">' + (ICONS[type] || 'ℹ️') + '</span>' +
      '<span class="toast-msg">' + esc(msg).replace(/\n/g, '<br>') + '</span>' +
      '<button class="toast-x" aria-label="Dismiss">✕</button>';
    wrap.appendChild(el);
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
    var kill = function () {
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 280);
    };
    el.querySelector('.toast-x').addEventListener('click', kill);
    setTimeout(kill, ms);
  };

  /* ---------------- theme ---------------- */
  var THEME_KEY = 'oic_theme_v1';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var btn = $('themeToggle');
    if (btn) {
      btn.textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    }
  }
  function initTheme() {
    var t = 'light';
    try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
    applyTheme(t);
    var btn = $('themeToggle');
    if (btn) btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
    });
  }

  /* ---------------- step progress ---------------- */
  var STEPS = [
    { id: 'step1', fields: ['vehicleType', 'fuelType', 'cc', 'seating'] },
    { id: 'step2', fields: ['policyType', 'dor', 'policyDate', 'zone', 'state', 'invoice', 'idv', 'ncb', 'uwDiscount'] },
    { id: 'step3', fields: [] }, /* covers = optional */
    { id: 'step4', fields: [] }  /* done on calculate */
  ];
  var calcDone = false;
  function fieldFilled(id) {
    var el = $(id);
    if (!el) return true; /* missing (liability-disabled) counts as done */
    if (el.disabled) return true;
    var v = el.value;
    return v !== '' && v != null;
  }
  function updateSteps() {
    var stepEls = [ $('step1'), $('step2'), $('step3'), $('step4') ];
    if (!stepEls[0]) return;
    var done = [false, false, false, false];
    /* step 1 */
    done[0] = STEPS[0].fields.every(fieldFilled);
    /* step 2 (skip valuation/discount fields for liability-only) */
    var pol = $('policyType') ? $('policyType').value : '';
    var s2 = STEPS[1].fields.filter(function (f) {
      return !(pol === 'liability' && ['invoice', 'idv', 'ncb', 'uwDiscount'].indexOf(f) !== -1);
    });
    done[1] = done[0] && s2.every(fieldFilled);
    done[2] = done[1]; /* covers reviewed once policy complete */
    done[3] = calcDone;
    var activeIdx = done[3] ? 3 : (done[1] ? 2 : (done[0] ? 1 : 0));
    stepEls.forEach(function (el, i) {
      if (!el) return;
      el.classList.toggle('done', !!done[i]);
      el.classList.toggle('current', i === activeIdx && !done[3]);
      el.classList.toggle('done-all', !!done[3]);
    });
    var bar = $('stepBarFill');
    if (bar) {
      var pct = done[3] ? 100 : (done[1] ? 72 : (done[0] ? 38 : 12));
      bar.style.width = pct + '%';
    }
  }

  /* ---------------- hero count-up ---------------- */
  var lastNetShown = 0;
  function countUp(to) {
    var el = $('netAmount');
    if (!el) return;
    to = Math.round(Number(to) || 0);
    var from = lastNetShown;
    lastNetShown = to;
    if (from === to) { el.textContent = to.toLocaleString('en-IN'); return; }
    var t0 = performance.now(), dur = 650;
    function frame(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    var hero = document.querySelector('.premium-hero');
    if (hero) {
      hero.classList.remove('hero-pop');
      void hero.offsetWidth;
      hero.classList.add('hero-pop');
    }
  }

  /* ---------------- top actions ---------------- */
  function bindTopActions() {
    var nq = $('newQuoteBtn');
    if (nq) nq.addEventListener('click', function () {
      var r = $('resetBtn');
      if (r) r.click();
      calcDone = false;
      lastNetShown = 0;
      updateSteps();
      if (window.OIC && window.OIC.history) window.OIC.history.gotoTab('calc');
      window.proToast('📝 New quote started', 'info', 2000);
      var pv = $('vehicleType');
      if (pv) pv.focus();
    });
  }

  /* ---------------- keyboard shortcuts ---------------- */
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      var typing = /INPUT|SELECT|TEXTAREA/.test(tag);
      /* Ctrl/Cmd + Enter → calculate */
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        var c = $('calcBtn');
        if (c) c.click();
      }
      /* Esc → close modal */
      if (e.key === 'Escape') {
        var m = $('shareModal');
        if (m) m.style.display = 'none';
      }
      /* Alt+H → history, Alt+C → calculator (when not typing) */
      if (!typing && e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        if (window.OIC && window.OIC.history) window.OIC.history.gotoTab('history');
      }
      if (!typing && e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (window.OIC && window.OIC.history) window.OIC.history.gotoTab('calc');
      }
    });
  }

  /* ---------------- result scroll (desktop nicety) ---------------- */
  function bindCalcEvents() {
    window.addEventListener('premium:calculated', function (ev) {
      calcDone = true;
      updateSteps();
      try { countUp(ev.detail ? ev.detail.net : 0); } catch (e) {}
    });
    var rb = $('resetBtn');
    if (rb) rb.addEventListener('click', function () {
      setTimeout(function () {
        calcDone = false; lastNetShown = 0; updateSteps();
      }, 30);
    });
    /* live step updates */
    var calc = $('tab-calc');
    if (calc) {
      calc.addEventListener('input', function () { updateSteps(); });
      calc.addEventListener('change', function () { updateSteps(); });
    }
  }

  var _inited = false;
  function init() {
    if (_inited) return;
    _inited = true;
    initTheme();
    bindTopActions();
    bindKeys();
    bindCalcEvents();
    updateSteps();
    window.OIC = window.OIC || {};
    window.OIC.pro = { toast: window.proToast, updateSteps: updateSteps };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
