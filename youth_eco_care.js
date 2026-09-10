/* ============================================================
   youth_eco_care.js  —  OICL Premium Calculator V30.0
   ORIENTAL YOUTH ECO CARE POLICY · UIN: OICHLIP24034V012324
   Source: Official Premium Chart + Prospectus (rates excl. GST)

   Premium rules (per chart page 2/3):
     • Primary (eldest) member .......... 100%
     • Second member .................... 75%
     • All other members / children ..... 50%
   Discounts:
     • Online .......... 10% (max ₹2,000)
     • No TPA .......... 5.5%
     • Family .......... 10% (2+ members, individual SI basis only)
     • In lieu of CB ... 2%
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  /* Health insurance premium is GST-EXEMPT — no tax added */

  function n(id) { var e = $(id); return e ? (parseFloat(e.value) || 0) : 0; }
  function v(id) { var e = $(id); return e ? e.value : ''; }
  function ck(id) { var e = $(id); return !!(e && e.checked); }
  function fmt(x) {
    return '₹' + (Math.round(x * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  function toast(m, t) {
    if (window.proToast) window.proToast(m, t || 'error'); else alert(m);
  }

  /* ---------- Sum Insured bands (₹) ---------- */
  var YEC_SI = [300000, 500000, 700000, 1000000, 1500000, 2000000, 2500000,
                3000000, 3500000, 4000000, 4500000, 5000000, 7500000, 10000000];

  /* ---------- Age brackets ---------- */
  var YEC_AGE = [
    { max: 20,  label: '0-20' },
    { max: 25,  label: '21-25' },
    { max: 30,  label: '26-30' },
    { max: 35,  label: '31-35' },
    { max: 40,  label: '36-40' },
    { max: 45,  label: '41-45' },
    { max: 50,  label: '46-50' },
    { max: 55,  label: '51-55' },
    { max: 60,  label: '56-60' },
    { max: 65,  label: '61-65' },
    { max: 999, label: 'Above 65' }
  ];

  /* ---------- Premium grids (per insured, excluding GST) ----------
     Row = SI band (order of YEC_SI), Column = age bracket (order of YEC_AGE) */
  var YEC_RATES = {
    basic: [
      [ 2369,  3308,  4107,  5665,  5899,  7910, 10047, 12265, 15686, 18184, 22207],
      [ 2792,  4769,  5490,  6786,  6865,  9985, 12178, 15544, 21437, 27213, 31385],
      [ 3783,  6169,  6617,  7759,  7912, 11890, 14152, 18111, 25633, 32003, 36749],
      [ 4856,  7015,  7360,  8722,  9120, 13148, 15489, 20076, 29325, 35568, 41677],
      [ 5680,  8223,  8429, 10311, 10624, 15128, 17554, 22857, 34068, 41618, 47826],
      [ 6176,  8516,  8670, 10524, 11297, 16859, 19411, 24740, 37344, 45821, 52100],
      [ 6561,  9766,  9917, 11955, 13401, 17905, 20506, 26202, 39885, 49081, 55416],
      [ 8540, 10199, 10335, 12393, 13886, 18762, 21403, 27397, 41963, 51747, 58127],
      [ 8870, 10563, 10696, 12762, 14295, 19484, 22158, 28406, 43718, 53998, 60416],
      [ 9157, 10878, 10997, 13081, 14649, 20109, 22813, 29279, 45238, 55948, 62399],
      [ 9410, 11156, 11265, 13362, 14961, 20661, 23390, 30050, 46579, 57668, 64149],
      [10200, 11405, 13199, 14685, 16321, 21154, 23907, 30740, 47778, 59207, 65713],
      [11123, 12460, 14736, 16422, 17989, 23054, 25896, 33393, 52395, 65130, 71736],
      [11779, 13556, 16067, 18522, 20719, 24403, 27307, 35277, 55671, 69333, 76010]
    ],
    premium: [
      [ 2432,  3932,  4732,  6289,  6524,  8535, 10672, 12889, 16174, 18247, 22270],
      [ 2802,  5340,  6061,  7357,  7436, 10556, 12749, 16115, 21872, 27222, 31395],
      [ 3873,  6820,  7268,  8410,  8563, 12541, 14803, 18762, 26148, 32093, 36839],
      [ 4875,  7595,  7941,  9302,  9700, 13728, 16070, 20657, 29770, 35588, 41696],
      [ 5700,  9016,  9222, 11104, 11417, 15921, 18347, 23650, 34725, 41637, 47846],
      [ 6196,  9309,  9463, 11317, 12090, 17652, 20204, 25533, 38001, 45840, 52120],
      [ 6580, 10559, 10711, 12748, 14194, 18698, 21299, 26995, 40543, 49101, 55436],
      [ 8589, 11234, 11370, 13429, 14922, 19797, 22438, 28433, 42863, 51796, 58176],
      [ 8920, 11598, 11731, 13797, 15330, 20519, 23194, 29441, 44617, 54047, 60466],
      [ 9206, 11913, 12032, 14116, 15684, 21144, 23848, 30315, 46137, 55998, 62449],
      [ 9459, 12191, 12300, 14398, 15996, 21696, 24426, 31086, 47478, 57718, 64198],
      [10250, 12440, 14234, 15721, 17357, 22189, 24942, 31775, 48678, 59257, 65763],
      [11173, 13495, 15772, 17457, 19024, 24089, 26931, 34429, 53294, 65179, 71786],
      [11828, 14591, 17102, 19558, 21754, 25438, 28343, 36312, 56570, 69382, 76060]
    ]
  };

  function ageIdx(age) {
    for (var i = 0; i < YEC_AGE.length; i++) if (age <= YEC_AGE[i].max) return i;
    return YEC_AGE.length - 1;
  }
  function siIdx(si) {
    var idx = YEC_SI.indexOf(si);
    if (idx >= 0) return idx;
    for (var i = 0; i < YEC_SI.length; i++) if (si <= YEC_SI[i]) return i;
    return YEC_SI.length - 1;
  }
  function rateFor(plan, si, age) {
    var grid = YEC_RATES[plan] || YEC_RATES.basic;
    return grid[siIdx(si)][ageIdx(age)];
  }
  window.yecRateFor = rateFor;

  /* ============================================================
     Benefit / sub-limit table (from Prospectus)
     ============================================================ */
  function slab(si, a, b, c) { // <=10L, 15-25L, >25L
    if (si <= 1000000) return a;
    if (si <= 2500000) return b;
    return c;
  }
  function benefits(si, plan) {
    var lakh = si / 100000;
    var room = si <= 500000 ? 'Single Room, 1% of SI, max ₹5,000/day'
             : (si <= 1000000 ? 'Single Room, max ₹10,000/day' : 'Actual expenses');
    var icu  = si <= 500000 ? 'Max ₹10,000/day'
             : (si <= 1000000 ? 'Max ₹20,000/day' : 'Actual expenses');
    var rows = [
      ['Room, Boarding & Nursing', room],
      ['ICU charges', icu],
      ['Pre / Post hospitalisation', '45 days / 90 days'],
      ['Road ambulance', slab(si, '₹5,000 per occurrence (max ₹10,000/yr)',
                                  '₹10,000 per occurrence (max ₹20,000/yr)',
                                  '₹25,000 per occurrence (max ₹50,000/yr)')],
      ['Air ambulance (once in lifetime)', slab(si, '10% of SI', '25% of SI', 'Actual expenses')],
      ['AYUSH treatment', 'Up to full Sum Insured'],
      ['Mental illness cover', si <= 1000000 ? '50% of SI' : 'Up to full SI'],
      ['Modern treatment (12 procedures)', si <= 1000000 ? '25% of SI' : 'Up to full SI'],
      ['Domiciliary hospitalisation', '10% of SI, max ₹50,000 (3-day deductible)'],
      ['Telemedicine / online consult', si <= 1000000 ? '2 consults × ₹1,000' : '3 consults × ₹1,500'],
      ['Cataract (per eye, incl. IOL)', si <= 1000000 ? '₹50,000' : '₹1,00,000'],
      ['Organ donor — insured is donor', '10% of SI (after 12 months)'],
      ['Health check-up (after 3 claim-free yrs)',
        slab(si, 'Individual ₹1,500 · Family ₹3,000',
                 'Individual ₹2,000 · Family ₹4,000',
                 'Individual ₹3,000 · Family ₹6,000')],
      ['Additional SI for Critical Illness',
        si >= 1000000 ? '10% of SI (11 listed CIs, after 2-yr wait)' : 'Not available (SI must be ≥ ₹10 lakh)'],
      ['Cumulative Bonus', '10% of SI per claim-free year, max 100%'],
      ['HIV / AIDS cover', 'Covered']
    ];
    if (plan === 'premium') {
      rows.push(['★ Daily hospital cash', (si <= 500000 ? '₹500' : '₹1,000') + '/day · max 7 per hosp., 14 per yr (3-day deductible)']);
      rows.push(['★ Medical second opinion', slab(si, '₹5,000', '₹10,000', '₹25,000') + ' per policy period']);
      rows.push(['★ Maternity (per event)', slab(si, '₹50,000', '₹75,000', '₹1,00,000') + ' · 24-month wait, max 2']);
      rows.push(['★ Assisted Reproduction (ART)', '₹2,00,000 once in lifetime · 36-month wait (part of SI)']);
    }
    rows.push(['Waiting periods', 'PED 12 months · initial 30 days · specified diseases 1–2 yrs (HTN/Diabetes 90 days)']);
    void lakh;
    return rows;
  }

  /* ============================================================
     Calculation
     ============================================================ */
  function calcYEC() {
    var si   = parseFloat(v('yecSI')) || 0;
    var plan = v('yecPlan') || 'basic';
    var mode = v('yecMode') || 'individual';

    if (!v('yecPlan')) { toast('Plan chuniye'); return; }
    if (si <= 0) { toast('Sum Insured chuniye'); return; }
    if (!v('yecMode')) { toast('Cover Basis chuniye'); return; }
    if (!v('yecMembers')) { toast('Number of Members chuniye'); return; }

    /* Collect member ages */
    var ages = [];
    ['yecAge1', 'yecAge2', 'yecAge3', 'yecAge4', 'yecAge5', 'yecAge6'].forEach(function (id) {
      var a = n(id);
      if (a > 0) ages.push(a);
    });
    if (!ages.length) { toast('Youth Eco Care: kam se kam 1 member ki age daaliye'); return; }
    if (ages[0] < 18 || ages[0] > 45) {
      toast('Note: entry age 18–45 yrs (primary). Renewal lifelong hai.', 'info');
    }

    /* Eldest = primary, next = second member */
    var sorted = ages.slice().sort(function (a, b) { return b - a; });

    var rows = [
      ['Plan', plan === 'premium' ? 'PREMIUM PLAN' : 'BASIC PLAN'],
      ['Cover basis', mode === 'floater' ? 'Family Floater'
                    : (mode === 'ff' ? 'Floater with Floater' : 'Individual')],
      ['Sum Insured', si],
      ['Members covered', sorted.length]
    ];

    var net = 0, share, r, pct, label;
    sorted.forEach(function (age, i) {
      r = rateFor(plan, si, age);
      pct = i === 0 ? 100 : (i === 1 ? 75 : 50);
      share = r * pct / 100;
      net += share;
      label = (i === 0 ? 'Primary member' : (i === 1 ? 'Second member' : 'Member ' + (i + 1)));
      rows.push([label + ' — age ' + age + ' (' + YEC_AGE[ageIdx(age)].label + ') @ ' + pct + '%', share]);
    });
    rows.push(['Gross premium (before discounts)', net]);
    var grossBase = net;
    var basicPrem = net;   /* saare discounts isi par lagenge */
    var discTotal = 0;

    /* ---- Discounts ---- */
    if (ck('yecFamily')) {
      if (sorted.length > 1) {
        var fd = basicPrem * 0.10; discTotal += fd;
        rows.push(['Family discount (10% of basic)', -fd]);
      } else {
        rows.push(['Family discount', 'N/A — only 1 member']);
      }
    }
    if (ck('yecNoTPA')) { var td = basicPrem * 0.055; discTotal += td; rows.push(['TPA not opted (5.5% of basic)', -td]); }
    if (ck('yecCBLieu')) { var cd = basicPrem * 0.02; discTotal += cd; rows.push(['In lieu of Cumulative Bonus (2% of basic)', -cd]); }
    if (ck('yecOnline')) {
      var od = Math.min(basicPrem * 0.10, 2000); discTotal += od;
      rows.push(['Online discount (10% of basic, max ₹2,000)', -od]);
    }

    /* ---- Loyalty / other manual adjustment ---- */
    if (discTotal > 0) {
      net -= discTotal;
      if (net < 0) net = 0;
      rows.push(['Total discount', -discTotal]);
    }

    var adj = n('yecAdj');
    if (adj !== 0) { var av = net * adj / 100; net += av; rows.push(['Manual adjustment (' + adj + '%)', av]); }

    /* ---- Render ---- (Health insurance = GST exempt) */
    var total = net;
    var h = '<div class="op-result-head"><span>🏥 Oriental Youth Eco Care — Premium</span>'
          + '<span class="op-total">' + fmt(total) + '</span></div>'
          + '<table class="breakdown-table"><tbody>';
    rows.forEach(function (row) {
      h += '<tr><td>' + row[0] + '</td><td style="text-align:right;">'
         + (typeof row[1] === 'number' ? fmt(row[1]) : row[1]) + '</td></tr>';
    });
    h += '<tr class="op-sub"><td><strong>Net Premium</strong></td><td style="text-align:right;"><strong>'
       + fmt(net) + '</strong></td></tr>'
       + '<tr><td>GST</td><td style="text-align:right;">NIL — Exempt</td></tr>'
       + '<tr class="op-grand"><td><strong>TOTAL PAYABLE</strong></td><td style="text-align:right;"><strong>'
       + fmt(total) + '</strong></td></tr></tbody></table>'
       + '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);'
       + 'background:rgba(148,163,184,.10);">Rates as per official OICL Youth Eco Care premium chart '
       + '(UIN: OICHLIP24034V012324). Entry age 18–45 yrs · SI ₹3 lakh to ₹1 crore · policy term 1 year, lifelong renewable. '
       + '<strong>Health insurance premium GST-exempt hai — koi GST charge nahi.</strong></div>';

    var box = $('yecResult');
    box.innerHTML = h;
    box.style.display = 'block';

    /* ---- Benefit table ---- */
    var bh = '<div class="op-result-head"><span>📋 Covers & Sub-limits — '
           + (plan === 'premium' ? 'Premium Plan' : 'Basic Plan') + ' @ ' + fmt(si) + '</span></div>'
           + '<table class="breakdown-table"><tbody>';
    benefits(si, plan).forEach(function (row) {
      bh += '<tr><td>' + row[0] + '</td><td style="text-align:right;">' + row[1] + '</td></tr>';
    });
    bh += '</tbody></table>';
    var bb = $('yecBenefits');
    if (bb) { bb.innerHTML = bh; bb.style.display = 'block'; }

    /* ---- 80D tip ---- */
    var tip = $('yecTaxTip');
    if (tip) {
      var senior = sorted[0] >= 60;
      tip.style.display = 'block';
      tip.innerHTML = '💡 <strong>Section 80D:</strong> is policy par approx <strong>'
        + fmt(Math.min(total, senior ? 50000 : 25000)) + '</strong> tak deduction (old regime, indicative).';
    }

    /* ---- Quotation register ---- */
    if (window.registerHealthQuote) {
      window.registerHealthQuote({
        product: 'Oriental Youth Eco Care Policy',
        uin: 'OICHLIP24034V012324',
        base: grossBase,
        net: total,
        meta: [
          ['Plan', plan === 'premium' ? 'Premium Plan' : 'Basic Plan'],
          ['Sum Insured', fmt(si)],
          ['Cover Basis', mode === 'floater' ? 'Family Floater'
                        : (mode === 'ff' ? 'Floater with Floater' : 'Individual')],
          ['Members', String(sorted.length)],
          ['Ages', sorted.join(', ') + ' yrs'],
          ['Primary Age Band', YEC_AGE[ageIdx(sorted[0])].label],
          ['Policy Term', '1 Year'],
          ['Entry Age Rule', '18–45 yrs · lifelong renewable']
        ],
        rows: rows,
        covers: benefits(si, plan),
        notes: 'Rates as per official OICL Youth Eco Care premium chart. '
             + 'Health insurance premium GST-exempt.'
      });
    }

    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return total;
  }

  /* ============================================================
     Live rate preview + member row toggling
     ============================================================ */
  function syncPreview() {
    /* rate preview removed */
  }

  function syncMembers() {
    var count = parseInt(v('yecMembers'), 10) || 0;
    for (var i = 1; i <= 6; i++) {
      var w = $('yecMemWrap' + i);
      if (w) w.style.display = i <= count ? 'block' : 'none';
      if (i > count && $('yecAge' + i)) $('yecAge' + i).value = '';
    }
    var f = $('yecFamily');
    if (f && count < 2) f.checked = false;
    syncPreview();
  }

  function init() {
    /* Fill SI dropdown */
    var sel = $('yecSI');
    if (sel && !sel.options.length) {
      var ph = document.createElement('option');
      ph.value = ''; ph.textContent = '-- Select --';
      ph.selected = true; ph.disabled = true;
      sel.appendChild(ph);
      YEC_SI.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s;
        o.textContent = '₹ ' + s.toLocaleString('en-IN') + '  (' + (s / 100000) + ' lakh)';
        sel.appendChild(o);
      });
    }
    ['yecSI', 'yecPlan', 'yecAge1'].forEach(function (id) {
      var e = $(id);
      if (e) { e.addEventListener('change', syncPreview); e.addEventListener('input', syncPreview); }
    });
    var m = $('yecMembers');
    if (m) m.addEventListener('change', syncMembers);
    var b = $('yecCalcBtn');
    if (b) b.addEventListener('click', calcYEC);
    syncMembers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.YouthEcoCare = { calc: calcYEC, rateFor: rateFor, SI: YEC_SI, AGE: YEC_AGE, RATES: YEC_RATES };
})();
