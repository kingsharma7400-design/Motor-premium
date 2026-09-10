#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Applies the "all products in History" change to uploads/*.
Each anchor must match EXACTLY once, otherwise the run aborts with no write."""
import io, sys, os
U = '/home/user/uploads/'

def edit(fname, pairs):
    p = U + fname
    s = io.open(p, encoding='utf-8').read()
    for i, (old, new) in enumerate(pairs):
        n = s.count(old)
        if n != 1:
            print('ABORT %s anchor #%d matched %d times:\n%s' % (fname, i, n, old[:200]))
            sys.exit(1)
        s = s.replace(old, new)
    io.open(p, 'w', encoding='utf-8').write(s)
    print('%-18s %d change(s) applied' % (fname, len(pairs)))

# ============================ history.js ============================
PRODUCT_MAP = """
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

  var $ = function (id) { return document.getElementById(id); };"""

edit('history.js', [
  # ---- 1. product map (inserted above the $ helper) ----
  ("""  var $ = function (id) { return document.getElementById(id); };""", PRODUCT_MAP),

  # ---- 2. generic pane snapshot capture / restore ----
  ("""  function fingerprint(form, net) {""",
"""  /* ---------------- generic pane snapshot (non-Motor products) ---------------- */
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

  function fingerprint(form, net) {"""),

  # ---- 3. motor entries get a product identity too ----
  ("""  function buildEntry(result) {
    var i = result.inputs || {};
    var form = captureForm();
    return {
      id: 'q_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
      quoteNo: nextQuoteNo(),""",
"""  function buildEntry(result, extra) {
    var i = result.inputs || {};
    var form = captureForm();
    extra = extra || {};
    return {
      id: 'q_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
      kind: extra.kind || 'motor',
      product: extra.product || 'Motor',
      customer: extra.customer || '',
      quoteNo: nextQuoteNo(),"""),

  # ---- 4. generic save for other products ----
  ("""  function autoSave(result) {
    if (!result) return null;
    /* viewing/editing an old quote re-runs calc — don't duplicate it */
    if (suppressNextSave) {""",
"""  /* Save a Fire / Theft / PA / Mediclaim quote.  Called by other.js (after each
     product's own render) and by health-quote.js (when a quotation is generated). */
  function saveCustom(o) {
    o = o || {};
    var kind = o.kind || 'other';
    var p = productOf(kind);
    var form = snapshotPane(o.pane || p.pane);
    var net = Math.round(Number(o.net || 0));
    if (suppressNextSave) { suppressNextSave = false; renderAll(); return null; }
    var list = loadHistory();
    var fp = JSON.stringify(['o', kind, form.text, form.check, net]);
    if (list.length && list[0].fingerprint === fp) {   /* same inputs+net = refresh only */
      list[0].createdAt = new Date().toISOString();
      persistHistory(list);
      renderAll();
      if (window.proToast) window.proToast('↻ Quote ' + fmtQuoteNo(list[0].quoteNo) + ' updated in history', 'info', 2500);
      return list[0];
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
    if (suppressNextSave) {"""),

  # ---- 5. filter state + product filter + search over product/customer ----
  ("""  var state = { q: '', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };""",
   """  var state = { q: '', product: 'all', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };"""),
  ("""    var list = loadHistory().filter(function (e) {
      if (state.policy !== 'all' && e.meta.policyType !== state.policy) return false;""",
"""    var list = loadHistory().filter(function (e) {
      if (state.product !== 'all') {
        var k = e.kind || (e.meta && e.meta.kind) || (e.meta && e.meta.policyType ? 'motor' : 'other');
        if (k !== state.product) return false;
      }
      if (state.policy !== 'all' && e.meta.policyType !== state.policy) return false;"""),
  ("""        var hay = [e.meta.regNo, e.meta.insuredName, e.meta.vehicleLabel, e.meta.policyLabel,
                   e.meta.state, fmtQuoteNo(e.quoteNo), String(e.result.net)].join(' ').toLowerCase();""",
"""        var hay = [e.meta.regNo, e.meta.insuredName, e.meta.vehicleLabel, e.meta.policyLabel,
                   e.meta.state, e.meta.product, e.customer, e.product, e.meta.note,
                   fmtQuoteNo(e.quoteNo), String(e.result.net)].join(' ').toLowerCase();"""),
  ("""    state = { q: '', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };
    var sq = $('hSearch'); if (sq) sq.value = '';""",
"""    state = { q: '', product: 'all', policy: 'all', vehicle: 'all', period: 'all', sort: 'new' };
    var spr = $('hFilterProduct'); if (spr) spr.value = 'all';
    var sq = $('hSearch'); if (sq) sq.value = '';"""),
  ("""    var sp = $('hFilterPolicy'); if (sp) sp.value = 'all';
    var sv = $('hFilterVehicle'); if (sv) sv.value = 'all';
    var sd = $('hFilterPeriod'); if (sd) sd.value = 'all';""",
"""    var sp = $('hFilterPolicy'); if (sp) sp.value = 'all';
    var sv = $('hFilterVehicle'); if (sv) sv.value = 'all';
    var sd = $('hFilterPeriod'); if (sd) sd.value = 'all';
    var spn = $('hFilterProduct'); if (spn) spn.innerHTML = productOptionsHTML('all');"""),

  # ---- 6. card: product badge + customer line ----
  ("""  function cardHTML(e) {
    var r = e.result, m = e.meta;
    var title = m.regNo || m.insuredName || ('Quote ' + fmtQuoteNo(e.quoteNo));""",
"""  function cardHTML(e) {
    var r = e.result, m = e.meta;
    var isMotor = (e.kind || 'motor') === 'motor';
    var prodTag = isMotor ? ''
      : '<span class="h-tag h-tag-product">' + esc((m.icon || '📄') + ' ' + (m.product || e.product || 'Other')) + '</span>';
    var title = m.regNo || m.insuredName || e.customer || m.product || ('Quote ' + fmtQuoteNo(e.quoteNo));"""),
  ("""        '<div class="h-tags">' +
          '<span class="h-tag">' + esc(m.vehicleLabel || '—') + '</span>'""",
"""        '<div class="h-tags">' + prodTag +
          '<span class="h-tag">' + esc(m.vehicleLabel || '—') + '</span>'"""),
  ("""        '<div class="h-mini">OD ' + esc(inr(r.odTotal)) + ' · TP ' + esc(inr(r.tpTotal)) +
          ' · Comm ' + esc(inr(r.commission)) + '</div>' +""",
"""        (isMotor
          ? '<div class="h-mini">OD ' + esc(inr(r.odTotal)) + ' · TP ' + esc(inr(r.tpTotal)) +
            ' · Comm ' + esc(inr(r.commission)) + '</div>'
          : '<div class="h-mini">Sum Insured ' + esc(inr(m.sumInsured)) + ' · GST ' + esc(inr(r.gstAmt)) +
            ' · Total ' + esc(inr(r.totalPremium)) + '</div>') +"""),

  # ---- 7. kind-aware View / Edit ----
  ("""  function viewEntry(id) {
    var e = findEntry(id);
    if (!e) return;
    restoreForm(e.form);""",
"""  function viewEntry(id) {
    var e = findEntry(id);
    if (!e) return;
    if ((e.kind || 'motor') !== 'motor') { viewOtherEntry(e); return; }
    restoreForm(e.form);"""),
  ("""  function editEntry(id) {
    var e = findEntry(id);
    if (!e) return;
    restoreForm(e.form);""",
"""  /* View / Edit for non-Motor quotes: open the product's pane, write the saved
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
    restoreForm(e.form);"""),

  # ---- 8. CSV: Product column ----
  ("""    var rows = [['QuoteNo', 'Date', 'Insured', 'RegNo', 'Vehicle', 'Policy', 'CC/GVW', 'Fuel', 'Zone', 'State', 'SumInsured', 'OD', 'TP', 'Total', 'GST', 'Net', 'Commission']];
    list.forEach(function (e) {
      rows.push([fmtQuoteNo(e.quoteNo), fmtDate(e.createdAt), e.meta.insuredName, e.meta.regNo,
        e.meta.vehicleLabel, e.meta.policyLabel,""",
"""    var rows = [['QuoteNo', 'Date', 'Product', 'Customer', 'Insured', 'RegNo', 'Vehicle', 'Policy', 'CC/GVW', 'Fuel', 'Zone', 'State', 'SumInsured', 'OD', 'TP', 'Total', 'GST', 'Net', 'Commission']];
    list.forEach(function (e) {
      rows.push([fmtQuoteNo(e.quoteNo), fmtDate(e.createdAt), e.product || 'Motor', e.customer || '',
        e.meta.insuredName, e.meta.regNo,
        e.meta.vehicleLabel, e.meta.policyLabel,"""),

  # ---- 9. bind product filter + expose API ----
  ("""    var sq = $('hSearch');
    if (sq) sq.addEventListener('input', function () { state.q = sq.value; renderAll(); });""",
"""    var sq = $('hSearch');
    if (sq) sq.addEventListener('input', function () { state.q = sq.value; renderAll(); });
    var spn = $('hFilterProduct');
    if (spn) { spn.innerHTML = productOptionsHTML('all'); spn.addEventListener('change', function () { state.product = spn.value; renderAll(); }); }"""),
  ("""      all: loadHistory, save: autoSave, remove: deleteQuote,""",
"""      all: loadHistory, save: autoSave, saveOther: saveCustom, products: PRODUCT_MAP,
      remove: deleteQuote,"""),
])

# ============================ other.js ============================
edit('other.js', [
  # render() returns the numbers, and reports to history
  ("""    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return total;
  }""",
"""    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return { net: net, gst: gst, total: total, noGst: !!noGst, rows: rows };
  }

  /* Har product calculation History me save hoti hai (same quote-number
     sequence as Motor). `pane` field-snapshot li jaata hai taaki
     History → View / Edit us product ke form ko wapas bhar sake. */
  function saveToHistory(kind, title, sums, out) {
    if (!window.OIC || !window.OIC.history || !window.OIC.history.saveOther || !out) return;
    try {
      window.OIC.history.saveOther({
        kind: kind,
        pane: { fire: 'op-fire', theft: 'op-theft', pa: 'op-pa', med: 'op-med' }[kind],
        product: title,
        customer: '',
        net: out.net,
        total: out.total,
        sumInsured: sums && sums.si,
        years: sums && sums.years,
        policyLabel: sums && sums.policyLabel,
        uin: sums && sums.uin,
        note: sums && sums.note
      });
    } catch (e) { if (window.console) console.warn('history save skipped', e); }
  }"""),
  # Fire
  ("""    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    render('fireResult', '🔥 Fire Insurance Premium', rows, net);
  }""",
"""    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    var outFire = render('fireResult', '🔥 Fire Insurance Premium', rows, net);
    saveToHistory('fire', 'Fire & Special Perils', { si: si, years: yrs, policyLabel: occ.label }, outFire);
  }"""),
  # Theft
  ("""    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    render('theftResult', '🔐 Theft / Burglary Premium', rows, net);
  }""",
"""    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    var outTheft = render('theftResult', '🔐 Theft / Burglary Premium', rows, net);
    saveToHistory('theft', 'Theft / Burglary', { si: si, policyLabel: typ.label }, outTheft);
  }"""),
  # PA
  ("""    /* PA premium — GST not charged (user requirement) */
    render('paResult', '🧍 Personal Accident Premium', rows, net, true);""",
"""    /* PA premium — GST not charged (user requirement) */
    var outPa = render('paResult', '🧍 Personal Accident Premium', rows, net, true);
    saveToHistory('pa', 'Personal Accident (Individual)', {
      si: csi * members, years: yrs, policyLabel: plan.label
    }, outPa);"""),
])

# ============================ health-quote.js ============================
edit('health-quote.js', [
  ("""  window.registerHealthQuote = function (data) {
    lastHealth = data;
    var btn = $('healthGotoQuote');
    if (btn) btn.style.display = 'block';
    if (window.OIC) window.OIC.lastHealth = data;
  };""",
"""  window.registerHealthQuote = function (data) {
    lastHealth = data;
    var btn = $('healthGotoQuote');
    if (btn) btn.style.display = 'block';
    if (window.OIC) window.OIC.lastHealth = data;
    /* Quotation banate hi History me save (Motor ke saath ek hi number sequence). */
    try { saveHealthToHistory(data); } catch (e) { if (window.console) console.warn(e); }
  };

  function kindOfQuote(d) {
    if (d.backTab === 'pa') return 'pa';
    var p = String(d.product || '');
    if (/Youth Eco/i.test(p))      return 'yec';
    if (/Sampoorna|Swasthya Suraksha/i.test(p)) return 'ossp';
    if (/Family Floater/i.test(p)) return 'hff';
    if (/Top-?Up/i.test(p))        return 'stu';
    return 'med';
  }

  function saveHealthToHistory(d) {
    if (!d || !window.OIC || !window.OIC.history || !window.OIC.history.saveOther) return;
    var kind = kindOfQuote(d);
    var cust = '';
    (d.meta || []).forEach(function (m) {
      var k = String((m && (m[0] !== undefined ? m[0] : m.k)) || '');
      var v = (m && (m[1] !== undefined ? m[1] : m.v));
      if (!cust && /name|life assured|member|insured/i.test(k)) cust = String(v || '');
    });
    var si = 0;
    (d.meta || []).forEach(function (m) {
      var k = String((m && (m[0] !== undefined ? m[0] : m.k)) || '');
      if (!si && /sum insured|capital|deductible/i.test(k)) {
        var num = String(m[1] !== undefined ? m[1] : m.v).replace(/[^\\d]/g, '');
        si = parseInt(num, 10) || 0;
      }
    });
    var paneOf = { pa: 'op-pa', yec: 'op-yec', ossp: 'op-ossp', hff: 'op-hff', stu: 'op-stu', med: 'op-med' };
    window.OIC.history.saveOther({
      kind: kind,
      pane: paneOf[kind],
      product: d.product || 'Health',
      customer: cust,
      net: d.net, total: d.net,
      sumInsured: si,
      policyLabel: 'GST Exempt',
      uin: d.uin,
      note: d.notes
    });
  }"""),
])
print('\nALL DONE')
