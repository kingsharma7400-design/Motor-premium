/* ============================================================
   hff.js  —  OICL Premium Calculator V30.0
   OICL HAPPY FAMILY FLOATER POLICY 2024
   UIN: OICHLIP25046V062425

   Office premium computation (chart page 2):
     • Primary member (eldest) ......... 100%
     • Secondary member (2nd eldest) ... 100%
     • Tertiary member (3rd eldest) .... 50%
     • Each additional member .......... 40%
   Discounts:
     • Online ......... 10% (max ₹2,000)
     • No TPA ......... 5.5% (no discount on PA premium)
   Add-ons (% of base office premium):
     • Restoration of SI ......... 15/25 · 12/22 · 10/18 by SI slab
     • Waiver of proportionate ... plan-wise 15-30%
     • Removal of co-pay ......... Silver 17%
     • Personal Accident ......... ₹60 per lakh per person
     • Life Hardship Survival .... Plan A 3% · Plan B 5%
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
  function toast(m, t) {
    if (window.proToast) window.proToast(m, t || 'error'); else alert(m);
  }

  var PLAN_LABEL = {
    silver:   'SILVER Plan (₹1–5 lakh)',
    gold:     'GOLD Plan (₹6–10 lakh)',
    diamond:  'DIAMOND Plan (₹12–20 lakh)',
    platinum: 'PLATINUM Plan (₹25–50 lakh)'
  };

  var AGE_MAX = [20, 35, 45, 50, 55, 60, 65, 70, 75, 80, 999];
  function ageIdx(age) {
    for (var i = 0; i < AGE_MAX.length; i++) if (age <= AGE_MAX[i]) return i;
    return AGE_MAX.length - 1;
  }
  function ageLabel(age) { return (window.HFF_AGE_BANDS || [])[ageIdx(age)] || ''; }

  /* Silver is zone-rated; other plans share one grid */
  function zoneKey(plan) { return plan === 'silver' ? (v('hfZone') || '1') : 'all'; }

  function grid() {
    var R = window.HFF_RATES;
    if (!R) return null;
    var plan = v('hfPlan') || 'silver';
    return ((R[zoneKey(plan)] || {})[plan]) || null;
  }

  function siList() {
    var g = grid();
    return g ? Object.keys(g).map(Number).sort(function (a, b) { return a - b; }) : [];
  }

  function rateFor(si, age) {
    var g = grid();
    if (!g) return 0;
    var row = g[String(si)];
    if (!row) {
      var list = siList(), pick = list[list.length - 1];
      for (var i = 0; i < list.length; i++) if (si <= list[i]) { pick = list[i]; break; }
      row = g[String(pick)];
    }
    return row ? row[ageIdx(age)] : 0;
  }
  window.hffRateFor = rateFor;

  function restoreSlab(si) {
    if (si <= 100000) return window.HFF_RESTORE.small;
    if (si <= 400000) return window.HFF_RESTORE.mid;
    return window.HFF_RESTORE.large;
  }

  /* ---------- plan feature highlights ---------- */
  function benefits(plan, si) {
    var rows = [
      ['Sum Insured band', PLAN_LABEL[plan].replace(/^\w+ Plan /, '')],
      ['Room, Boarding & Nursing', '1% of Sum Insured per day'],
      ['ICU expenses', '2% of Sum Insured per day'],
      ['Surgeon / Anaesthetist / Consultant fees', 'As per limits of Sum Insured'],
      ['Pre-existing Diseases', 'Covered after 3 consecutive policy periods'],
      ['AYUSH treatment', 'Up to full Sum Insured'],
      ['New born baby cover', 'From day one, all SI levels'],
      ['Assisted Reproduction Treatment', 'Covered as per policy limits'],
      ['Modern treatment methods', 'Covered up to specified amount'],
      ['Dental / Plastic surgery', 'Covered when due to disease or injury']
    ];
    if (plan === 'diamond' || plan === 'platinum') {
      rows.push(['★ Maternity expenses', 'Covered (Diamond & Platinum only)']);
      rows.push(['Pre-acceptance medical check-up', 'Required for age 55 yrs and above']);
    } else {
      rows.push(['Maternity expenses', 'Not available in ' + plan.toUpperCase() + ' plan']);
      rows.push(['Pre-acceptance medical check-up', 'Required for age 60 yrs and above']);
    }
    rows.push(['Zone-wise rating', plan === 'silver' ? 'Yes — Zone I / Zone II' : 'No — single all-India rate']);
    rows.push(['Entry age', 'Max 65 yrs (extendable to 70 subject to conditions)']);
    rows.push(['Policy term', '1 year · renewable lifelong · min 2 persons']);
    rows.push(['Optional add-ons', 'Restoration of SI · Waiver of proportionate clause · Removal of co-pay · PA · Life Hardship Benefit']);
    void si;
    return rows;
  }

  /* ============================================================
     Calculation
     ============================================================ */
  function calcHFF() {
    if (!window.HFF_RATES) { toast('HFF rate chart load nahi hua'); return; }

    var si   = parseFloat(v('hfSI')) || 0;
    var plan = v('hfPlan') || 'silver';
    if (!v('hfPlan')) { toast('Plan chuniye'); return; }
    if (plan === 'silver' && !v('hfZone')) { toast('Zone chuniye'); return; }
    if (si <= 0) { toast('Sum Insured chuniye'); return; }
    if (!v('hfMembers')) { toast('Number of Members chuniye'); return; }

    var ages = [];
    for (var i = 1; i <= 6; i++) { var a = n('hfAge' + i); if (a > 0) ages.push(a); }
    if (!ages.length) { toast('HFF: kam se kam 1 member ki age daaliye'); return; }
    if (ages.length < 2) toast('Happy Family Floater me minimum 2 persons chahiye', 'info');

    var sorted = ages.slice().sort(function (a, b) { return b - a; });

    var rows = [
      ['Plan', PLAN_LABEL[plan]],
      ['Zone', plan === 'silver'
        ? (zoneKey(plan) === '1' ? 'Zone I' : 'Zone II')
        : 'N/A — single rate for this plan'],
      ['Sum Insured (floater)', si],
      ['Members covered', sorted.length]
    ];

    /* ---- Base office premium: 100 / 100 / 50 / 40 ---- */
    var base = 0;
    sorted.forEach(function (age, i) {
      var r = rateFor(si, age);
      var pct = (i <= 1) ? 100 : (i === 2 ? 50 : 40);
      var share = r * pct / 100;
      base += share;
      var tag = i === 0 ? 'Primary member' : (i === 1 ? 'Secondary member'
              : (i === 2 ? 'Tertiary member' : 'Member ' + (i + 1)));
      rows.push([tag + ' — age ' + age + ' (' + ageLabel(age) + ') @ ' + pct + '%', share]);
    });
    rows.push(['Base office premium', base]);

    var net = base;

    /* ---- Add-ons: all % are on BASE office premium ---- */
    var rOpt = v('hfRestore');
    if (rOpt && rOpt !== 'none') {
      var slab = restoreSlab(si);
      var pct = rOpt === '50' ? slab.opt50 : slab.opt100;
      var amt = base * pct / 100;
      net += amt;
      rows.push(['Restoration of SI — Option ' + rOpt + '% (' + slab.label + ' slab, +' + pct + '%)', amt]);
    }

    var wOpt = v('hfWaiver');
    if (wOpt && wOpt !== 'none') {
      var w = window.HFF_WAIVER[plan] || {};
      var wp = wOpt === '50' ? w.opt50 : w.opt100;
      if (wp == null) {
        rows.push(['Waiver of proportionate clause — Option ' + wOpt + '%', 'N/A for ' + plan.toUpperCase()]);
      } else {
        var wa = base * wp / 100;
        net += wa;
        rows.push(['Waiver of proportionate clause — Option ' + wOpt + '% (+' + wp + '%)', wa]);
      }
    }

    if (ck('hfCopayRem')) {
      var cp = window.HFF_COPAY_REMOVAL[plan];
      if (cp == null) {
        rows.push(['Removal of co-pay', 'N/A — Silver plan only']);
      } else {
        var ca = base * cp / 100;
        net += ca;
        rows.push(['Removal of co-pay (+' + cp + '%)', ca]);
      }
    }

    var lh = v('hfLHSB');
    if (lh && lh !== 'none') {
      var lp = window.HFF_LHSB[lh];
      var la = base * lp / 100;
      net += la;
      rows.push(['Life Hardship Survival Benefit — Plan ' + lh.toUpperCase() + ' (+' + lp + '%)', la]);
    }

    rows.push(['Premium before discounts', net]);

    /* ---- Discounts (PA excluded) ----
       Sabhi discounts SIRF basic premium par — add-ons par nahi, successive nahi. */
    var basicPrem = base;
    var discTotal = 0;

    if (ck('hfNoTPA')) {
      var td = basicPrem * 0.055; discTotal += td;
      rows.push(['TPA services not opted (5.5% of basic)', -td]);
    }
    if (ck('hfOnline')) {
      var od = Math.min(basicPrem * 0.10, 2000); discTotal += od;
      rows.push(['Online discount (10% of basic, max ₹2,000)', -od]);
    }

    if (discTotal > 0) {
      net -= discTotal;
      if (net < 0) net = 0;
      rows.push(['Total discount', -discTotal]);
    }

    /* ---- Optional PA cover — no discounts apply ---- */
    if (ck('hfPA')) {
      var paSI = n('hfPASI') || si;
      var paRate = n('hfPARate') || window.HFF_PA_RATE;
      var pa = (paSI / 100000) * paRate * sorted.length;
      net += pa;
      rows.push(['PA cover — ' + fmt(paRate) + '/lakh × ' + sorted.length + ' person(s) on ' + fmt(paSI), pa]);
    }

    var adj = n('hfAdj');
    if (adj !== 0) { var av = net * adj / 100; net += av; rows.push(['Manual adjustment (' + adj + '%)', av]); }

    /* ---- Render (GST exempt) ---- */
    var total = net;
    var h = '<div class="op-result-head"><span>👨‍👩‍👧 Happy Family Floater 2024 — Premium</span>'
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
       + 'background:rgba(148,163,184,.10);">Official OICL chart · UIN OICHLIP25046V062425 · '
       + 'Floater SI ₹1–50 lakh · minimum 2 persons · 1-year term, renewable lifelong · '
       + '<strong>Health premium GST-exempt.</strong></div>';

    var box = $('hfResult');
    box.innerHTML = h;
    box.style.display = 'block';

    var bh = '<div class="op-result-head"><span>📋 Plan Features — ' + PLAN_LABEL[plan]
           + ' @ ' + fmt(si) + '</span></div><table class="breakdown-table"><tbody>';
    benefits(plan, si).forEach(function (r) {
      bh += '<tr><td>' + r[0] + '</td><td style="text-align:right;">' + r[1] + '</td></tr>';
    });
    bh += '</tbody></table>';
    var bb = $('hfBenefits');
    if (bb) { bb.innerHTML = bh; bb.style.display = 'block'; }

    var tip = $('hfTaxTip');
    if (tip) {
      tip.style.display = 'block';
      tip.innerHTML = '💡 <strong>Section 80D:</strong> approx <strong>'
        + fmt(Math.min(total, sorted[0] >= 60 ? 50000 : 25000)) + '</strong> tak deduction (old regime, indicative).';
    }

    /* ---- Quotation register ---- */
    if (window.registerHealthQuote) {
      window.registerHealthQuote({
        product: 'OICL Happy Family Floater Policy 2024',
        uin: 'OICHLIP25046V062425',
        base: base,
        net: total,
        meta: [
          ['Plan', PLAN_LABEL[plan]],
          ['Sum Insured (Floater)', fmt(si)],
          ['Zone', plan === 'silver' ? (zoneKey(plan) === '1' ? 'Zone I' : 'Zone II') : 'Single rate'],
          ['Members', String(sorted.length)],
          ['Ages', sorted.join(', ') + ' yrs'],
          ['Primary Age Band', ageLabel(sorted[0])],
          ['Policy Term', '1 Year · renewable lifelong'],
          ['Min Family Size', '2 persons']
        ],
        rows: rows,
        covers: benefits(plan, si),
        notes: 'Rates as per official OICL HFFP 2024 premium chart. '
             + 'Health insurance premium GST-exempt.'
      });
    }

    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return total;
  }

  /* ============================================================
     UI sync
     ============================================================ */
  function fillSI() {
    var sel = $('hfSI');
    if (!sel) return;
    var prev = sel.value, list = siList();
    sel.innerHTML = '<option value="" selected disabled>-- Select --</option>';
    list.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s;
      o.textContent = '₹ ' + s.toLocaleString('en-IN') + '  (' + (s / 100000) + ' lakh)';
      sel.appendChild(o);
    });
    if (prev && list.indexOf(Number(prev)) >= 0) sel.value = prev;
    syncPlanUI();
  }

  function syncPlanUI() {
    var plan = v('hfPlan') || 'silver';
    var zw = $('hfZoneWrap');
    if (zw) zw.style.display = plan === 'silver' ? 'block' : 'none';
    var cw = $('hfCopayWrap');
    if (cw) cw.style.display = plan === 'silver' ? 'flex' : 'none';
    var wsel = $('hfWaiver');
    if (wsel) {
      var o100 = wsel.querySelector('option[value="100"]');
      if (o100) o100.disabled = (plan === 'silver');
      if (plan === 'silver' && wsel.value === '100') wsel.value = 'none';
    }
    syncPreview();
  }

  function syncPreview() {
    /* rate preview removed */
  }

  function syncMembers() {
    var count = parseInt(v('hfMembers'), 10) || 0;
    for (var i = 1; i <= 6; i++) {
      var w = $('hfMemWrap' + i);
      if (w) w.style.display = i <= count ? 'block' : 'none';
      if (i > count && $('hfAge' + i)) $('hfAge' + i).value = '';
    }
    syncPreview();
  }

  function syncPA() {
    var w = $('hfPAWrap');
    if (w) w.style.display = ck('hfPA') ? 'grid' : 'none';
  }

  function init() {
    var p = $('hfPlan'); if (p) p.addEventListener('change', fillSI);
    var z = $('hfZone'); if (z) z.addEventListener('change', syncPreview);
    ['hfSI', 'hfAge1'].forEach(function (id) {
      var e = $(id);
      if (e) { e.addEventListener('change', syncPreview); e.addEventListener('input', syncPreview); }
    });
    var m = $('hfMembers'); if (m) m.addEventListener('change', syncMembers);
    var pa = $('hfPA'); if (pa) pa.addEventListener('change', syncPA);
    var b = $('hfCalcBtn'); if (b) b.addEventListener('click', calcHFF);
    fillSI();
    syncMembers();
    syncPA();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.HFF = { calc: calcHFF, rateFor: rateFor };
})();
