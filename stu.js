/* ============================================================
   stu.js  —  OICL Premium Calculator V30.0
   ORIENTAL SUPER HEALTH TOP-UP 2024
   UIN: OICHLIP25042V042425

   High-deductible top-up. Policy triggers only when aggregate
   claims in a policy period EXCEED the chosen Deductible.

   Individual Plan : each member charged 100% of own rate.
   Family Floater  : highest age 100% · 2nd highest 50% · others 40%.

   Order of application (chart page 4 — successive, not cumulative):
     1. LOADINGS   — entry age 66-70 (+10%), room-rent removal (20/10/5%)
     2. DISCOUNTS  — family 10% · loyalty 10% · staff 33% · portal 10% (max ₹2,000)
   Staff discount excludes family & loyalty discounts (portal still allowed).
   Health insurance premium is GST-EXEMPT.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function n(id) { var e = $(id); return e ? (parseFloat(e.value) || 0) : 0; }
  function v(id) { var e = $(id); return e ? e.value : ''; }
  function ck(id) { var e = $(id); return !!(e && e.checked); }
  function fmt(x) {
    return '₹' + (Math.round(x * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  function lakh(x) { return '₹' + (x / 100000) + 'L'; }
  function toast(m, t) {
    if (window.proToast) window.proToast(m, t || 'error'); else alert(m);
  }

  function ageGroup(age) {
    if (age <= 35) return '0-35';
    if (age <= 45) return '36-45';
    if (age <= 60) return '46-60';
    return '61+';
  }

  function currentCombo() {
    var idx = parseInt(v('stCombo'), 10);
    var c = (window.STU_COMBOS || [])[idx];
    return c || null;
  }

  function rateFor(ded, si, age) {
    var R = window.STU_RATES;
    if (!R) return 0;
    return (R[ageGroup(age)] || {})[ded + '|' + si] || 0;
  }
  window.stuRateFor = rateFor;

  function roomLoadingPct(ded) {
    var t = window.STU_ROOM_LOADING || [];
    for (var i = 0; i < t.length; i++) if (ded <= t[i].maxDed) return t[i];
    return t[t.length - 1];
  }

  /* ---------- benefit highlights ---------- */
  function benefits(ded, si) {
    var rows = [
      ['Deductible (threshold)', fmt(ded) + ' — policy triggers only above this'],
      ['Sum Insured (above deductible)', fmt(si)],
      ['Basis of payment', 'Aggregate admissible expenses exceeding deductible, up to SI'],
      ['Pre / Post hospitalisation', 'Covered'],
      ['Day care procedures', '180 day care procedures / surgeries'],
      ['Organ donor — recipient', 'In-patient expenses of donor covered'],
      ['Organ donor — insured is donor', 'Lump sum 10% of SI (after 24 months, even if deductible not exceeded)'],
      ['Maternity expenses', 'Automatic, up to 10% of SI · 12-month wait · max 2 events'],
      ['New born baby cover', 'From day one, up to Sum Insured'],
      ['Hospital cash', 'Covered'],
      ['Ambulance charges', 'Covered'],
      ['HIV / AIDS cover', 'Covered'],
      ['Mental illness cover', 'Covered (subject to conditions)'],
      ['AYUSH treatment', 'Covered'],
      ['SAARC countries', 'Auto-covered — Afghanistan, Bangladesh, Bhutan, Maldives, Nepal, Pakistan, Sri Lanka (reimbursement only)'],
      ['Telemedicine', si <= 2000000 ? 'Max ₹2,000 per insured/family per policy period'
                                      : 'Max ₹5,000 per insured/family per policy period'],
      ['Modern / advanced procedures', si <= 1000000
          ? 'Sub-limits ₹40,000 – ₹50,000 per policy period'
          : 'Higher sub-limits up to ₹1,50,000 per policy period'],
      ['Room rent limit', 'Linked to deductible — removable on extra premium'],
      ['Entry age', 'Max 65 yrs · 66–70 allowed with 10% loading (applies every renewal)'],
      ['Family size', 'Floater needs minimum 2 persons · single member = Individual plan only']
    ];
    return rows;
  }

  /* ============================================================
     Calculation
     ============================================================ */
  function calcSTU() {
    if (!window.STU_RATES) { toast('Super Top-Up rate chart load nahi hua'); return; }

    if (!v('stPlan')) { toast('Plan chuniye'); return; }
    var combo = currentCombo();
    if (!combo) { toast('Deductible / Sum Insured chuniye'); return; }
    if (!v('stMembers')) { toast('Number of Members chuniye'); return; }
    var ded = combo.ded, si = combo.si;
    var plan = v('stPlan') || 'floater';

    var ages = [];
    for (var i = 1; i <= 6; i++) { var a = n('stAge' + i); if (a > 0) ages.push(a); }
    if (!ages.length) { toast('Super Top-Up: kam se kam 1 member ki age daaliye'); return; }
    if (plan === 'floater' && ages.length < 2) {
      toast('Family Floater me minimum 2 persons chahiye — single member Individual plan me hi', 'info');
    }

    var sorted = ages.slice().sort(function (a, b) { return b - a; });

    var rows = [
      ['Plan', plan === 'floater' ? 'Family Floater' : 'Individual'],
      ['Deductible (threshold)', ded],
      ['Sum Insured (above deductible)', si],
      ['Members covered', sorted.length]
    ];

    /* ---- Base premium ---- */
    var base = 0;
    sorted.forEach(function (age, i) {
      var r = rateFor(ded, si, age);
      var pct = 100;
      if (plan === 'floater') pct = (i === 0) ? 100 : (i === 1 ? 50 : 40);
      var share = r * pct / 100;
      base += share;
      var tag = plan === 'floater'
        ? (i === 0 ? 'Highest age member' : (i === 1 ? 'Second highest age' : 'Member ' + (i + 1)))
        : ('Member ' + (i + 1));
      rows.push([tag + ' — age ' + age + ' (' + (window.STU_AGE_LABEL || {})[ageGroup(age)] + ') @ ' + pct + '%', share]);
    });
    rows.push(['Base premium', base]);

    var net = base;

    /* ================= STEP 1 — LOADINGS ================= */
    /* Entry-age loading: 10% on the premium of each member aged 66-70 */
    if (ck('stEntryLoad')) {
      var seniorPrem = 0, seniorCount = 0;
      sorted.forEach(function (age, i) {
        if (age >= 66 && age <= 70) {
          var r = rateFor(ded, si, age);
          var pct = (plan === 'floater') ? (i === 0 ? 100 : (i === 1 ? 50 : 40)) : 100;
          seniorPrem += r * pct / 100;
          seniorCount++;
        }
      });
      if (seniorCount) {
        var el = seniorPrem * 0.10;
        net += el;
        rows.push(['Entry-age loading 10% — ' + seniorCount + ' member(s) aged 66-70', el]);
      } else {
        rows.push(['Entry-age loading', 'N/A — koi member 66-70 age me nahi']);
      }
    }

    /* Room rent limit removal */
    if (ck('stRoomRemove')) {
      var rl = roomLoadingPct(ded);
      var ra = net * rl.pct / 100;
      net += ra;
      rows.push(['Removal of room-rent limit (+' + rl.pct + '% · deductible ' + rl.label + ')', ra]);
    }

    rows.push(['Premium after loadings', net]);

    /* ================= STEP 2 — DISCOUNTS =================
       Sabhi discounts SIRF basic premium par lagte hain — loadings
       (entry-age, room-rent removal) par nahi, aur successive nahi. */
    var basicPrem = base;
    var discTotal = 0;
    var staff = ck('stStaff');

    if (staff) {
      var sd = basicPrem * 0.33; discTotal += sd;
      rows.push(['Staff discount (33% of basic)', -sd]);
      rows.push(['Note', 'Staff discount ke saath family / loyalty discount allowed nahi']);
    } else {
      if (ck('stFamily')) {
        if (plan === 'individual' && sorted.length > 1) {
          var fd = basicPrem * 0.10; discTotal += fd;
          rows.push(['Family discount (10% of basic)', -fd]);
        } else if (plan !== 'individual') {
          rows.push(['Family discount', 'N/A — sirf Individual plan me (2+ members)']);
        } else {
          rows.push(['Family discount', 'N/A — only 1 member']);
        }
      }
      if (ck('stLoyalty')) {
        var ld = basicPrem * 0.10; discTotal += ld;
        rows.push(['Loyalty discount (10% of basic) — existing OICL base health policy', -ld]);
      }
    }

    if (ck('stPortal')) {
      var pd = Math.min(basicPrem * 0.10, 2000); discTotal += pd;
      rows.push(['Portal discount (10% of basic, max ₹2,000 — fresh policy only)', -pd]);
    }

    if (discTotal > 0) {
      net -= discTotal;
      if (net < 0) net = 0;
      rows.push(['Total discount', -discTotal]);
    }

    var adj = n('stAdj');
    if (adj !== 0) { var av = net * adj / 100; net += av; rows.push(['Manual adjustment (' + adj + '%)', av]); }

    /* ---- Render (GST exempt) ---- */
    var total = net;
    var h = '<div class="op-result-head"><span>⬆️ Super Health Top-Up — Premium</span>'
          + '<span class="op-total">' + fmt(total) + '</span></div>'
          + '<table class="breakdown-table"><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td>' + r[0] + '</td><td style="text-align:right;">'
         + (typeof r[1] === 'number' ? fmt(r[1]) : r[1]) + '</td></tr>';
    });
    h += '<tr class="op-sub"><td><strong>Net Premium</strong></td><td style="text-align:right;"><strong>'
       + fmt(net) + '</strong></td></tr>'
       + '<tr><td>GST</td><td style="text-align:right;">NIL — Exempt</td></tr>'
       + '<tr class="op-grand"><td><strong>TOTAL PAYABLE</strong></td><td style="text-align:right;"><strong>'
       + fmt(total) + '</strong></td></tr></tbody></table>'
       + '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);'
       + 'background:rgba(148,163,184,.10);">⚠️ <strong>Trigger:</strong> claim tabhi payable hai jab policy period me '
       + 'aggregate (ya koi single) claim <strong>' + fmt(ded) + '</strong> se zyada ho jaaye. '
       + 'Uske upar <strong>' + fmt(si) + '</strong> tak cover milta hai.<br>'
       + 'Official OICL chart · UIN OICHLIP25042V042425 · loadings pehle, phir discounts (sab basic premium par) · '
       + '<strong>Health premium GST-exempt.</strong></div>';

    var box = $('stResult');
    box.innerHTML = h;
    box.style.display = 'block';

    var bh = '<div class="op-result-head"><span>📋 Covers — Deductible ' + lakh(ded)
           + ' / SI ' + lakh(si) + '</span></div><table class="breakdown-table"><tbody>';
    benefits(ded, si).forEach(function (r) {
      bh += '<tr><td>' + r[0] + '</td><td style="text-align:right;">' + r[1] + '</td></tr>';
    });
    bh += '</tbody></table>';
    var bb = $('stBenefits');
    if (bb) { bb.innerHTML = bh; bb.style.display = 'block'; }

    var tip = $('stTaxTip');
    if (tip) {
      tip.style.display = 'block';
      tip.innerHTML = '💡 <strong>Section 80D:</strong> approx <strong>'
        + fmt(Math.min(total, sorted[0] >= 60 ? 50000 : 25000)) + '</strong> tak deduction (old regime, indicative).';
    }

    /* ---- Quotation register ---- */
    if (window.registerHealthQuote) {
      window.registerHealthQuote({
        product: 'Oriental Super Health Top-Up 2024',
        uin: 'OICHLIP25042V042425',
        base: base,
        net: total,
        meta: [
          ['Plan', plan === 'floater' ? 'Family Floater' : 'Individual'],
          ['Deductible (Threshold)', fmt(ded)],
          ['Sum Insured', fmt(si)],
          ['Members', String(sorted.length)],
          ['Ages', sorted.join(', ') + ' yrs'],
          ['Highest Age Group', (window.STU_AGE_LABEL || {})[ageGroup(sorted[0])] || '—'],
          ['Policy Term', '1 Year'],
          ['Entry Age', 'Max 65 yrs (66-70 with loading)']
        ],
        rows: rows,
        covers: benefits(ded, si),
        notes: '<strong>Important:</strong> Claim tabhi payable hai jab policy period me aggregate '
             + '(ya koi single) claim ' + fmt(ded) + ' se zyada ho jaaye. Uske upar ' + fmt(si)
             + ' tak cover milta hai. Health insurance premium GST-exempt.'
      });
    }

    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return total;
  }

  /* ============================================================
     UI sync
     ============================================================ */
  function fillCombos() {
    var sel = $('stCombo');
    if (!sel || sel.options.length) return;
    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = '-- Select --';
    ph.selected = true; ph.disabled = true;
    sel.appendChild(ph);
    (window.STU_COMBOS || []).forEach(function (c, i) {
      var o = document.createElement('option');
      o.value = i;
      o.textContent = 'Deductible ' + lakh(c.ded) + '  →  Sum Insured ' + lakh(c.si);
      sel.appendChild(o);
    });
  }

  function syncPreview() {
    /* rate preview removed */
  }

  function syncMembers() {
    var count = parseInt(v('stMembers'), 10) || 0;
    for (var i = 1; i <= 6; i++) {
      var w = $('stMemWrap' + i);
      if (w) w.style.display = i <= count ? 'block' : 'none';
      if (i > count && $('stAge' + i)) $('stAge' + i).value = '';
    }
    syncPreview();
  }

  function syncStaff() {
    var staff = ck('stStaff');
    ['stFamily', 'stLoyalty'].forEach(function (id) {
      var e = $(id);
      if (e) { e.disabled = staff; if (staff) e.checked = false; }
    });
  }

  function init() {
    fillCombos();
    ['stCombo', 'stAge1', 'stPlan'].forEach(function (id) {
      var e = $(id);
      if (e) { e.addEventListener('change', syncPreview); e.addEventListener('input', syncPreview); }
    });
    var m = $('stMembers'); if (m) m.addEventListener('change', syncMembers);
    var s = $('stStaff'); if (s) s.addEventListener('change', syncStaff);
    var b = $('stCalcBtn'); if (b) b.addEventListener('click', calcSTU);
    syncMembers();
    syncStaff();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SuperTopUp = { calc: calcSTU, rateFor: rateFor };
})();
