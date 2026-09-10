/* =========================================================
   OICL Premium Calculator V30.0 · Quote History Module
   Auto-saves every calculation to localStorage with
   search, filters, stats, restore & CSV/JSON export.
   Depends on: window.OIC.getLastResult + 'premium:calculated'
   ========================================================= */
(function () {
  'use strict';

  var LS_KEY = 'oic_quote_history_v2';
  var LS_COUNTER = 'oic_quote_counter_v1';
  var MAX_ENTRIES = 200;

  /* All form field ids captured for a perfect restore */
  var TEXT_FIELDS = [
    'parentVehicleType', 'vehicleType', 'fuelType', 'isElectric',
    'cc', 'seating', 'policyType', 'policyTerm', 'dor', 'policyDate',
    'zone', 'state', 'invoice', 'idv', 'idvNonElec', 'idvElec', 'gst',
    'insuredName', 'regNo', 'ncb', 'uwDiscount', 'antiTheft',
    'ndDiscount', 'ndRenDiscount', 'addOnDiscount',
    'persBelongSI', 'towingLimit', 'passPaSI', 'cpaTerm',
    'llCount', 'llPaid'
  ];
  var CHECK_FIELDS = [
    'nilDep', 'engineProt', 'consumables', 'keyRepl', 'rti',
    'tyreRim', 'altCar', 'batteryProt', 'emiProt', 'persBelong',
    'elecAcc', 'cngKit', 'towing', 'geoExtOD', 'geoExtTP',
    'overturning', 'odPa', 'passPa'
  ];

  /* Single-dropdown era: derive the old parent group from vehicleType
     so History vehicle-filters keep working for new quotes. */
  var PARENT_OF_VEHICLE = {
    pvtCar: 'privateCar', evPvtCar: 'privateCar',
    twoWheeler: 'twoWheeler', evTwoWheeler: 'twoWheeler',
    taxi: 'taxi',
    schoolBus: 'pccv', staffBus: 'pccv',
    pccvSmall: 'pccv', pccvMedium: 'pccv', pccvLarge: 'pccv', pccvExtraLarge: 'pccv',
    ambulance: 'classD', miscD: 'classD',
    gccv: 'gccv', gccv3w: 'gccv3w', auto: 'auto'
  };


  /* =========================================================
     PRODUCT MAP — every non-Motor product that can be saved to
     History.  Motor keeps its own rich capture/restore path;
     everything else is captured as a field snapshot of its pane,
     which makes save + restore + re-calc work with zero per-product
     plumbing.  Quote numbers come from the SAME sequence as Motor.
     ========================================================= */
  var PRODUCT_MAP = {
    fire:    { label: 'Fire',            icon: '🔥', tab: 'fire', pane: 'op-fire',  calcBtn: 'fireCalcBtn' },
    theft:   { label: 'Theft / Burglary',icon: '🔐', tab: 'fire', pane: 'op-theft', calcBtn: 'theftCalcBtn' },
    pa:      { label: 'Personal Accident', icon: '🧍', tab: 'pa',  pane: 'op-pa',    calcBtn: 'paCalcBtn' },
    med:     { label: 'Generic Mediclaim', icon: '🏥', tab: 'med', pane: 'op-med',   calcBtn: 'medCalcBtn' },
    yec:     { label: 'Youth Eco Care',  icon: '🌱', tab: 'med', pane: 'op-yec',  calcBtn: 'yecCalcBtn',  med: 'yec'  },
    ossp:    { label: 'Sampoorna Swasthya Suraksha', icon: '🛡️', tab: 'med', pane: 'op-ossp', calcBtn: 'osCalcBtn', med: 'ossp' },
    hff:     { label: 'Happy Family Floater', icon: '👨‍👩‍👧', tab: 'med', pane: 'op-hff', calcBtn: 'hfCalcBtn', med: 'hff' },
    stu:     { label: 'Super Health Top-Up', icon: '⬆️', tab: 'med', pane: 'op-stu', calcBtn: 'stCalcBtn', med: 'stu' }
  };
  function productOf(kind) { return PRODUCT_MAP[kind] || { label: kind || 'Other', icon: '📄', tab: 'med' }; }
  function productOptionsHTML(selected) {
    var html = '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>All products</option>';
    html += '<option value="motor"' + (selected === 'motor' ? ' selected' : '') + '>🚗 Motor</option>';
    Object.keys(PRODUCT_MAP).forEach(function (k) {
      var p = PRODUCT_MAP[k];
      html += '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>'
            + p.icon + ' ' + p.label + '</option>';
    });
    return html;
  }

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------------- storage ---------------- */
  function loadHistory() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { console.warn('history load failed', e); return []; }
  }
  function persistHistory(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
      return true;
    } catch (e) {
      console.warn('history persist failed', e);
      if (window.proToast) window.proToast('⚠️ History storage full — oldest quotes were removed. Export CSV to keep a backup.', 'warning', 5000);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 50)));
        return true;
      } catch (e2) { return false; }
    }
  }
  function nextQuoteNo() {
    var n = 1;
    try {
      n = parseInt(localStorage.getItem(LS_COUNTER) || '0', 10) + 1;
      localStorage.setItem(LS_COUNTER, String(n));
    } catch (e) { n = Date.now() % 100000; }
    return n;
  }
  function fmtQuoteNo(n) { return String(n).padStart(4, '0'); }

  /* ---------------- capture / restore ---------------- */
  function captureForm() {
    var data = { text: {}, check: {} };
    TEXT_FIELDS.forEach(function (id) {
      var el = $(id);
      data.text[id] = el ? (el.value != null ? String(el.value) : '') : '';
    });
    CHECK_FIELDS.forEach(function (id) {
      var el = $(id);
      data.check[id] = el ? !!el.checked : false;
    });
    return data;
  }

  function restoreForm(data) {
    if (!data) return;
    window.__oicRestoring = true; /* bypass commercial policy-filter during restore */
    setTimeout(function () { window.__oicRestoring = false; }, 1000); /* safety */
    data = data || { text: {}, check: {} };
    /* 1. parent first, then category (dependent dropdown) */
    var parent = $('parentVehicleType');
    if (parent && data.text.parentVehicleType !== undefined) {
      parent.value = data.text.parentVehicleType;
      parent.dispatchEvent(new Event('change', { bubbles: true }));
    }
    Object.keys(data.text || {}).forEach(function (id) {
      if (id === 'parentVehicleType') return;
      var el = $(id);
      if (!el) return;
      el.value = data.text[id];
      el.classList && el.classList.remove('is-invalid');
    });
    /* fire change/input so dependent UI (labels, UW auto-hint, add-on visibility) refreshes */
    ['vehicleType', 'fuelType', 'policyType', 'policyTerm', 'zone', 'state', 'ncb',
     'antiTheft', 'persBelongSI', 'towingLimit', 'passPaSI', 'cpaTerm'].forEach(function (id) {
      var el = $(id);
      if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    ['cc', 'seating', 'dor', 'policyDate', 'invoice', 'idv', 'uwDiscount'].forEach(function (id) {
      var el = $(id);
      if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    Object.keys(data.check || {}).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.checked = !!data.check[id];
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    /* date validation styling */
    ['dor', 'policyDate'].forEach(function (id) {
      var el = $(id);
      if (el && el.value && el.value.length === 10) el.classList.add('is-valid');
    });
    window.__oicRestoring = false; /* all dispatches above are synchronous */
  }

  /* ---------------- generic pane snapshot (non-Motor products) ---------------- */
  function snapshotPane(paneId) {
    var data = { text: {}, check: {}, pane: paneId || '' };
    var root = paneId ? $(paneId) : null;
    if (!root) return data;
    Array.prototype.forEach.call(root.querySelectorAll('input, select, textarea'), function (el) {
      if (!el.id) return;
      if (el.type === 'checkbox' || el.type === 'radio') data.check[el.id] = !!el.checked;
      else data.text[el.id] = (el.value != null) ? String(el.value) : '';
    });
    return data;
  }

  function restorePane(paneId, fields) {
    var root = paneId ? $(paneId) : null;
    if (!root || !fields) return;
    var fire = function (el) {
      ['input', 'change'].forEach(function (ev) {
        try { el.dispatchEvent(new Event(ev, { bubbles: true })); } catch (e) {}
      });
    };
    Object.keys(fields.text || {}).forEach(function (id) {
      var el = $(id);
      if (el && !el.disabled) { el.value = fields.text[id]; fire(el); }
    });
    Object.keys(fields.check || {}).forEach(function (id) {
      var el = $(id);
      if (el && !el.disabled) { el.checked = !!fields.check[id]; fire(el); }
    });
  }

  function openProductTab(kind) {
    var p = productOf(kind);
    try {
      if (p.med && typeof window.openMediclaim === 'function') window.openMediclaim(p.med);
      else if (typeof window.openProduct === 'function') window.openProduct(p.tab, kind);
      else gotoTab(p.tab);
    } catch (e) { try { gotoTab(p.tab); } catch (e2) {} }
  }

  function fingerprint(form, net) {
    try { return JSON.stringify([form.text, form.check, Math.round(net || 0)]); }
    catch (e) { return String(Date.now()); }
  }

  function vehicleLabelOf(inputs) {
    try {
      if (window.VEHICLE_META && VEHICLE_META[inputs.vehicleType])
        return VEHICLE_META[inputs.vehicleType].label;
    } catch (e) {}
    return inputs.vehicleType || 'Vehicle';
  }
  function policyLabelOf(inputs, years) {
    try {
      if (window.POLICY_META && POLICY_META[inputs.policyType]) {
        var l = POLICY_META[inputs.policyType].label;
        if (inputs.policyType === 'bundle') l += ' (' + years + '-Year)';
        return l;
      }
    } catch (e) {}
    return inputs.policyType || 'Policy';
  }

  /* ---------------- add / dedup ---------------- */
  function buildEntry(result, extra) {
    var i = result.inputs || {};
    var form = captureForm();
    extra = extra || {};
    return {
      id: 'q_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
      kind: extra.kind || 'motor',
      product: extra.product || 'Motor',
      customer: extra.customer || '',
      quoteNo: nextQuoteNo(),
      createdAt: new Date().toISOString(),
      fingerprint: fingerprint(form, result.net),
      form: form,
      result: {
        odTotal: result.odTotal || 0,
        tpTotal: result.tpTotal || 0,
        totalPremium: result.totalPremium || 0,
        gstAmt: result.gstAmt || 0,
        net: result.net || 0,
        commission: result.commission || 0,
        years: result.years || 1,
        basicRate: result.basicRate || 0
      },
      meta: {
        insuredName: (i.insuredName || '').trim(),
        regNo: (i.regNo || '').trim().toUpperCase(),
        sumInsured: ((Number(i.idv) || 0) + (Number(i.idvNonElec) || 0) + (Number(i.idvElec) || 0)),
        vehicleLabel: vehicleLabelOf(i),
        vehicleType: i.vehicleType || '',
        parentType: PARENT_OF_VEHICLE[i.vehicleType] || form.text.parentVehicleType || '',
        policyLabel: policyLabelOf(i, result.years || 1),
        policyType: i.policyType || '',
        cc: i.cc || '',
        fuel: i.fuelType || '',
        zone: i.zone || '',
        state: i.state || ''
      }
    };
  }

  /* Save a Fire / Theft / PA / Mediclaim quote.  Called by other.js (after each
     product's own render) and by health-quote.js (when a quotation is generated). */
  function saveCustom(o) {
    o = o || {};
    var kind = o.kind || 'other';
    var p = productOf(kind);
    /* the CALLER snapshots the pane at calculate-time, so the saved inputs always
       match the saved premium (the pane may be edited before this runs) */
    var form = o.form || snapshotPane(o.pane || p.pane);
    var net = Math.round(Number(o.net || 0));
    if (suppressNextSave) { suppressNextSave = false; renderAll(); return null; }
    var list = loadHistory();
    var fp = JSON.stringify(['o', kind, form.text, form.check, net]);
    /* same product + same inputs + same premium = refresh the existing row
       (covers calculate-then-generate-quotation on the same quote) */
    var dupeIdx = -1;
    for (var dk = 0; dk < list.length; dk++) {
      if (list[dk].fingerprint === fp && (list[dk].kind || 'motor') === kind) { dupeIdx = dk; break; }
    }
    if (dupeIdx > -1) {
      var prev = list[dupeIdx];
      prev.createdAt = new Date().toISOString();
      prev.form = form;                    /* keep the freshest snapshot */
      prev.result = prev.result || {};
      prev.meta = prev.meta || {};
      if (o.customer) prev.customer = prev.meta.insuredName = o.customer;
      if (o.uin) prev.meta.uin = o.uin;
      if (o.note) prev.meta.note = o.note;
      if (o.policyLabel) prev.meta.policyLabel = o.policyLabel;
      list.splice(dupeIdx, 1); list.unshift(prev);
      persistHistory(list);
      renderAll();
      if (window.proToast) window.proToast('↻ Quote ' + fmtQuoteNo(prev.quoteNo) + ' updated in history', 'info', 2500);
      return prev;
    }
    var total = Math.round(Number(o.total != null ? o.total : net));
    var entry = {
      id: 'q_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
      quoteNo: nextQuoteNo(),
      createdAt: new Date().toISOString(),
      fingerprint: fp,
      kind: kind,
      product: o.product || p.label,
      customer: o.customer || '',
      form: form,
      result: {
        odTotal: 0, tpTotal: 0,
        totalPremium: total,
        gstAmt: Math.max(0, total - net),
        net: net,
        commission: 0, years: o.years || 1, basicRate: 0
      },
      meta: {
        insuredName: o.customer || '', regNo: '',
        sumInsured: Math.round(Number(o.sumInsured || 0)),
        vehicleLabel: o.product || p.label, vehicleType: '', parentType: '',
        policyLabel: o.policyLabel || '', policyType: '',
        gstLabel: o.gstLabel || '',
        cc: '', fuel: '', zone: '', state: o.state || '',
        product: o.product || p.label, kind: kind, icon: p.icon || '📄',
        uin: o.uin || '', note: o.note || ''
      }
    };
    list.unshift(entry);
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    persistHistory(list);
    renderAll();
    if (window.proToast) window.proToast('✅ ' + entry.product + ' quote ' + fmtQuoteNo(entry.quoteNo) + ' saved to history', 'success', 3000);
    try { updateStorageMeter(); } catch (e) {}
    return entry;
  }

  function autoSave(result) {
    if (!result) return null;
    /* viewing/editing an old quote re-runs calc — don't duplicate it */
    if (suppressNextSave) {
      suppressNextSave = false;
      renderAll();
      return null;
    }
    var list = loadHistory();
    var form = captureForm();
    var fp = fingerprint(form, result.net);
    /* dedup: same motor inputs + premium anywhere in the list → refresh + move to top */
    var mIdx = -1;
    for (var mk = 0; mk < list.length; mk++) {
      if (list[mk].fingerprint === fp && (list[mk].kind || 'motor') === 'motor') { mIdx = mk; break; }
    }
    if (mIdx > -1) {
      var mPrev = list[mIdx];
      mPrev.createdAt = new Date().toISOString();
      mPrev.form = form;
      list.splice(mIdx, 1); list.unshift(mPrev);
      persistHistory(list);
      setQuoteNumber(mPrev.quoteNo);
      renderAll();
      if (window.proToast) window.proToast('↻ Quote ' + fmtQuoteNo(mPrev.quoteNo) + ' updated in history', 'info', 2500);
      return mPrev;
    }
    var entry = buildEntry(result);
    entry.fingerprint = fp;
    list.unshift(entry);
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    persistHistory(list);
    setQuoteNumber(entry.quoteNo);
    renderAll();
    if (window.proToast) window.proToast('✅ Quote ' + fmtQuoteNo(entry.quoteNo) + ' saved to history', 'success', 3000);
    try { updateStorageMeter(); } catch (e) {}
    return entry;
  }

  function setQuoteNumber(n) {
    var el = $('quoteNumber');
    if (el) el.textContent = fmtQuoteNo(n);
  }

  function deleteQuote(id) {
    var list = loadHistory().filter(function (e) { return e.id !== id; });
    persistHistory(list);
    renderAll();
    try { updateStorageMeter(); } catch (e) {}
    if (window.proToast) window.proToast('🗑️ Quote deleted', 'info', 2500);
  }

  function clearAll() {
    if (!loadHistory().length) return;
    if (!confirm('Delete ALL saved quotes? This cannot be undone.\n\nTip: Export CSV first to keep a backup.')) return;
    persistHistory([]);
    renderAll();
    try { updateStorageMeter(); } catch (e) {}
    if (window.proToast) window.proToast('🧹 History cleared', 'info', 2500);
  }

  /* ---------------- filtering ---------------- */
  var state = { q: '', product: 'all', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };

  function matchesPeriod(iso, period) {
    if (period === 'all') return true;
    var d = new Date(iso), now = new Date();
    if (period === 'today') return d.toDateString() === now.toDateString();
    var diff = (now - d) / 864e5;
    if (period === 'week') return diff < 7;
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  }

  function filteredList() {
    var q = state.q.trim().toLowerCase();
    var list = loadHistory().filter(function (e) {
      if (state.product !== 'all') {
        var k = e.kind || (e.meta && e.meta.kind) || (e.meta && e.meta.policyType ? 'motor' : 'other');
        if (k !== state.product) return false;
      }
      if (state.policy !== 'all' && e.meta.policyType !== state.policy) return false;
      if (state.vehicle !== 'all' && e.meta.parentType !== state.vehicle && e.meta.vehicleType !== state.vehicle) return false;
      if (!matchesPeriod(e.createdAt, state.period)) return false;
      if (q) {
        var hay = [e.meta.regNo, e.meta.insuredName, e.meta.vehicleLabel, e.meta.policyLabel,
                   e.meta.state, e.meta.product, e.customer, e.product, e.meta.note,
                   fmtQuoteNo(e.quoteNo), String(e.result.net)].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (state.sort === 'new') list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    if (state.sort === 'old') list.sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    if (state.sort === 'high') list.sort(function (a, b) { return b.result.net - a.result.net; });
    if (state.sort === 'low') list.sort(function (a, b) { return a.result.net - b.result.net; });
    return list;
  }

  /* ---------------- rendering ---------------- */
  function inr(n) {
    n = Math.round(Number(n) || 0);
    return '₹' + n.toLocaleString('en-IN');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      var p = function (x) { return String(x).padStart(2, '0'); };
      return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    } catch (e) { return iso; }
  }
  function timeAgo(iso) {
    var s = Math.max(1, Math.floor((Date.now() - new Date(iso)) / 1000));
    if (s < 60) return s + 's ago';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24);
    if (d < 30) return d + 'd ago';
    return fmtDate(iso).slice(0, 10);
  }

  function policyBadgeClass(pt) {
    return { package: 'b-package', bundle: 'b-bundle', saod: 'b-saod', liability: 'b-tp' }[pt] || 'b-package';
  }

  function renderStats() {
    var list = loadHistory();
    var now = new Date();
    var monthCount = list.filter(function (e) {
      var d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    var totalNet = list.reduce(function (s, e) { return s + (Number(e.result.net) || 0); }, 0);
    var set = function (id, v) { var el = $(id); if (el) el.textContent = v; };
    set('hStatTotal', list.length);
    set('hStatMonth', monthCount);
    set('hStatPremium', inr(totalNet));
    set('hStatAvg', list.length ? inr(totalNet / list.length) : '₹0');
    /* sidebar badge */
    var badge = $('historyCount');
    if (badge) {
      badge.textContent = list.length > 99 ? '99+' : String(list.length);
      badge.style.display = list.length ? '' : 'none';
    }
    var cnt = $('hResultCount');
    if (cnt) {
      var f = filteredList().length;
      cnt.textContent = f === list.length
        ? (list.length ? list.length + ' saved quote' + (list.length > 1 ? 's' : '') : '')
        : (f + ' of ' + list.length + ' quotes');
    }
  }

  function cardHTML(e) {
    var r = e.result, m = e.meta;
    var isMotor = (e.kind || 'motor') === 'motor';
    var prodTag = isMotor ? ''
      : '<span class="h-tag h-tag-product">' + esc((m.icon || '📄') + ' ' + (m.product || e.product || 'Other')) + '</span>';
    var title = m.regNo || m.insuredName || e.customer || m.product || ('Quote ' + fmtQuoteNo(e.quoteNo));
    var sub = m.insuredName && m.regNo ? m.insuredName + ' · ' + m.regNo
      : (m.insuredName || m.regNo || m.vehicleLabel);
    return '' +
      '<article class="h-card" data-id="' + esc(e.id) + '">' +
        '<div class="h-card-top">' +
          '<div class="h-card-id"><span class="h-qno">#' + esc(fmtQuoteNo(e.quoteNo)) + '</span>' +
          '<span class="h-time" title="' + esc(fmtDate(e.createdAt)) + '">' + esc(timeAgo(e.createdAt)) + '</span></div>' +
          '<div class="h-net">' + esc(inr(r.net)) + '</div>' +
        '</div>' +
        '<div class="h-title">' + esc(title) + '</div>' +
        '<div class="h-sub">' + esc(sub) + '</div>' +
        '<div class="h-tags">' + prodTag +
          '<span class="h-tag">' + esc(m.vehicleLabel || '—') + '</span>' +
          '<span class="h-tag ' + policyBadgeClass(m.policyType) + '">' + esc(m.policyLabel || '—') + '</span>' +
          (m.state ? '<span class="h-tag h-tag-ghost">' + esc(m.state) + '</span>' : '') +
        '</div>' +
        (isMotor
          ? '<div class="h-mini">OD ' + esc(inr(r.odTotal)) + ' · TP ' + esc(inr(r.tpTotal)) +
            ' · Comm ' + esc(inr(r.commission)) + '</div>'
          : '<div class="h-mini">Sum Insured ' + esc(inr(m.sumInsured)) + ' · ' +
            esc(m.policyLabel || m.gstLabel || ('GST ' + inr(r.gstAmt))) +
            ' · Total ' + esc(inr(r.totalPremium)) + '</div>') +
        '<div class="h-actions">' +
          '<button class="h-btn h-btn-view" data-act="view">📄 View</button>' +
          '<button class="h-btn" data-act="edit">✏️ Edit</button>' +
          '<button class="h-btn h-btn-danger" data-act="del">🗑️</button>' +
        '</div>' +
      '</article>';
  }

  function renderList() {
    var wrap = $('historyList');
    if (!wrap) return;
    var list = filteredList();
    if (!list.length) {
      var hasAny = loadHistory().length > 0;
      wrap.innerHTML =
        '<div class="h-empty">' +
          '<div class="h-empty-icon">' + (hasAny ? '🔍' : '📭') + '</div>' +
          '<div class="h-empty-title">' + (hasAny ? 'No quotes match your search' : 'No saved quotes yet') + '</div>' +
          '<div class="h-empty-sub">' + (hasAny
            ? 'Try a different keyword or clear the filters.'
            : 'Calculate any premium and it will be auto-saved here with full details.') + '</div>' +
          (hasAny
            ? '<button class="btn-secondary" id="hClearFilters">Clear search & filters</button>'
            : '<button class="btn-primary" id="hGoCalc">⚡ Go to Calculator</button>') +
        '</div>';
      var cf = $('hClearFilters');
      if (cf) cf.addEventListener('click', resetFilters);
      var gc = $('hGoCalc');
      if (gc) gc.addEventListener('click', function () { gotoTab('calc'); });
      return;
    }
    wrap.innerHTML = list.map(cardHTML).join('');
  }

  function resetFilters() {
    state = { q: '', product: 'all', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };
    var spr = $('hFilterProduct'); if (spr) spr.value = 'all';
    var sq = $('hSearch'); if (sq) sq.value = '';
    var sp = $('hFilterPolicy'); if (sp) sp.value = 'all';
    var sv = $('hFilterVehicle'); if (sv) sv.value = 'all';
    var sd = $('hFilterPeriod'); if (sd) sd.value = 'all';
    var spn = $('hFilterProduct'); if (spn) spn.innerHTML = productOptionsHTML('all');
    var ss = $('hSort'); if (ss) ss.value = 'new';
    renderAll();
  }

  function renderAll() { renderStats(); renderList(); }

  function gotoTab(name) {
    $$('.nav-item').forEach(function (x) { x.classList.remove('active'); });
    $$('.tab-content').forEach(function (x) { x.classList.remove('active'); });
    var nav = document.querySelector('[data-tab="' + name + '"]');
    if (nav) nav.classList.add('active');
    var tab = $('tab-' + name);
    if (tab) tab.classList.add('active');
    if (window.setPageTitle) window.setPageTitle(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function findEntry(id) {
    var list = loadHistory();
    for (var k = 0; k < list.length; k++) if (list[k].id === id) return list[k];
    return null;
  }

  var suppressNextSave = false;
  function suppressOnce() {
    suppressNextSave = true;
    /* safety: never trap a future genuine save if recalc fails validation */
    setTimeout(function () { suppressNextSave = false; }, 3000);
  }

  function viewEntry(id) {
    var e = findEntry(id);
    if (!e) return;
    if ((e.kind || 'motor') !== 'motor') { viewOtherEntry(e); return; }
    restoreForm(e.form);
    setQuoteNumber(e.quoteNo);
    /* re-run calculation to rebuild full breakdown + quotation */
    var btn = $('calcBtn');
    if (btn) { suppressOnce(); btn.click(); }
    else if (window.proToast) window.proToast('Restored quote inputs', 'info');
    setTimeout(function () { setQuoteNumber(e.quoteNo); gotoTab('quote'); }, 60);
  }

  /* View / Edit for non-Motor quotes: open the product's pane, write the saved
     field values back, re-run that product's calculator, then show the quotation. */
  function viewOtherEntry(e) {
    var p = productOf(e.kind);
    openProductTab(e.kind);
    setTimeout(function () {
      restorePane(p.pane, e.form);
      setQuoteNumber(e.quoteNo);
      var btn = $(p.calcBtn);
      if (!btn && window.OtherProducts) btn = { click: function () {
        var fn = { fire: 'calcFire', theft: 'calcTheft', pa: 'calcPA', med: 'calcMediclaim' }[e.kind];
        if (fn && window.OtherProducts[fn]) window.OtherProducts[fn]();
      } };
      if (!btn) return;
      suppressOnce();
      btn.click();
      setQuoteNumber(e.quoteNo);
      setTimeout(function () { setQuoteNumber(e.quoteNo); }, 90);
    }, 70);
    if (window.proToast) window.proToast('📄 ' + (e.product || p.label) + ' quote #' + fmtQuoteNo(e.quoteNo), 'info', 2500);
  }

  function editEntry(id) {
    var e = findEntry(id);
    if (!e) return;
    if ((e.kind || 'motor') !== 'motor') {
      var pp = productOf(e.kind);
      openProductTab(e.kind);
      setTimeout(function () {
        restorePane(pp.pane, e.form);
        setQuoteNumber(e.quoteNo);
        var b = $(pp.calcBtn);
        if (b) { suppressOnce(); b.click(); }
        setQuoteNumber(e.quoteNo);
      }, 70);
      if (window.proToast) window.proToast('✏️ ' + (e.product || pp.label) + ' quote #' + fmtQuoteNo(e.quoteNo) + ' loaded — edit & recalculate', 'info', 3500);
      return;
    }
    restoreForm(e.form);
    setQuoteNumber(e.quoteNo);
    gotoTab('calc');
    if (window.proToast) window.proToast('✏️ Quote #' + fmtQuoteNo(e.quoteNo) + ' loaded — edit & recalculate', 'info', 3500);
    setTimeout(function () {
      var btn = $('calcBtn');
      if (btn) { suppressOnce(); btn.click(); }
      setQuoteNumber(e.quoteNo);
    }, 120);
  }

  /* ---------------- export ---------------- */
  function csvCell(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function exportCSV() {
    var list = filteredList();
    if (!list.length) { if (window.proToast) window.proToast('Nothing to export', 'warning'); return; }
    var rows = [['QuoteNo', 'Date', 'Product', 'Customer', 'Insured', 'RegNo', 'Vehicle', 'Policy', 'CC/GVW', 'Fuel', 'Zone', 'State', 'SumInsured', 'OD', 'TP', 'Total', 'GST', 'Net', 'Commission']];
    list.forEach(function (e) {
      rows.push([fmtQuoteNo(e.quoteNo), fmtDate(e.createdAt), e.product || 'Motor', e.customer || '',
        e.meta.insuredName, e.meta.regNo,
        e.meta.vehicleLabel, e.meta.policyLabel, e.meta.cc, e.meta.fuel, e.meta.zone, e.meta.state, Math.round(e.meta.sumInsured || 0),
        Math.round(e.result.odTotal), Math.round(e.result.tpTotal), Math.round(e.result.totalPremium),
        Math.round(e.result.gstAmt), Math.round(e.result.net), Math.round(e.result.commission)]);
    });
    var blob = new Blob(['\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')],
      { type: 'text/csv;charset=utf-8' });
    dlBlob(blob, 'OIC_Quotes_' + todayStamp() + '.csv');
    if (window.proToast) window.proToast('⬇️ Exported ' + list.length + ' quotes to CSV', 'success');
  }
  function exportJSON() {
    var list = filteredList();
    if (!list.length) { if (window.proToast) window.proToast('Nothing to export', 'warning'); return; }
    var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    dlBlob(blob, 'OIC_Quotes_' + todayStamp() + '.json');
    if (window.proToast) window.proToast('⬇️ Exported ' + list.length + ' quotes to JSON', 'success');
  }
  function dlBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function todayStamp() {
    var d = new Date(), p = function (x) { return String(x).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }

  function updateStorageMeter() {
    var el = $('hStorage');
    if (!el) return;
    try {
      var bytes = (localStorage.getItem(LS_KEY) || '').length * 2;
      var kb = bytes / 1024;
      el.textContent = loadHistory().length + ' / ' + MAX_ENTRIES + ' quotes · ' +
        (kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(2) + ' MB') + ' used';
    } catch (e) { el.textContent = ''; }
  }

  /* ---------------- events ---------------- */
  function bind() {
    var sq = $('hSearch');
    if (sq) sq.addEventListener('input', function () { state.q = sq.value; renderAll(); });
    var spn = $('hFilterProduct');
    if (spn) { spn.innerHTML = productOptionsHTML('all'); spn.addEventListener('change', function () { state.product = spn.value; renderAll(); }); }
    var sp = $('hFilterPolicy');
    if (sp) sp.addEventListener('change', function () { state.policy = sp.value; renderAll(); });
    var sv = $('hFilterVehicle');
    if (sv) sv.addEventListener('change', function () { state.vehicle = sv.value; renderAll(); });
    var sd = $('hFilterPeriod');
    if (sd) sd.addEventListener('change', function () { state.period = sd.value; renderAll(); });
    var ss = $('hSort');
    if (ss) ss.addEventListener('change', function () { state.sort = ss.value; renderAll(); });

    var wrap = $('historyList');
    if (wrap) wrap.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-act]');
      if (!btn) return;
      var card = ev.target.closest('.h-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      if (act === 'view') viewEntry(id);
      else if (act === 'edit') editEntry(id);
      else if (act === 'del') {
        var e = findEntry(id);
        if (e && confirm('Delete quote #' + fmtQuoteNo(e.quoteNo) + ' (' + (e.meta.regNo || e.meta.insuredName || 'unsaved name') + ')?')) deleteQuote(id);
      }
    });

    var ex = $('hExportCsv'); if (ex) ex.addEventListener('click', exportCSV);
    var ej = $('hExportJson'); if (ej) ej.addEventListener('click', exportJSON);
    var ca = $('hClearAll'); if (ca) ca.addEventListener('click', clearAll);
    var sv2 = $('hSaveCurrent');
    if (sv2) sv2.addEventListener('click', function () {
      var r = (window.OIC && window.OIC.getLastResult) ? window.OIC.getLastResult() : null;
      if (!r) { if (window.proToast) window.proToast('Calculate a premium first, then save.', 'warning'); return; }
      autoSave(r);
    });

    /* auto-save hook */
    window.addEventListener('premium:calculated', function (ev) {
      try { autoSave(ev.detail); } catch (err) { console.warn('autoSave failed', err); }
    });
  }

  /* Single source of truth for quote numbering.
     The legacy engine (app.js renderQuotation) bumps its own `quoteSeq`
     on EVERY render — lock it and migrate to the history counter. */
  function lockLegacyNumbering() {
    try {
      var qn = document.getElementById('quoteNumber');
      if (qn) qn.dataset.locked = '1';
      var oldSeq = parseInt(localStorage.getItem('quoteSeq') || '0', 10) || 0;
      var cur = parseInt(localStorage.getItem(LS_COUNTER) || '0', 10) || 0;
      var mx = loadHistory().reduce(function (m, e) { return Math.max(m, e.quoteNo || 0); }, 0);
      localStorage.setItem(LS_COUNTER, String(Math.max(oldSeq, cur, mx)));
    } catch (e) {}
  }
  lockLegacyNumbering(); /* run immediately — scripts sit after the DOM */

  /* ---------------- init ---------------- */
  var _inited = false;
  function init() {
    if (_inited) return;
    _inited = true;
    lockLegacyNumbering();
    bind();
    renderAll();
    updateStorageMeter();
    window.OIC = window.OIC || {};
    window.OIC.history = {
      all: loadHistory, save: autoSave, saveOther: saveCustom, snapshot: snapshotPane,
      products: PRODUCT_MAP,
      remove: deleteQuote,
      clear: clearAll, view: viewEntry, edit: editEntry,
      exportCSV: exportCSV, render: renderAll, gotoTab: gotoTab
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
