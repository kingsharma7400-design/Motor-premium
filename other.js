/* ============================================================
   other.js  —  OICL Premium Calculator V30.0
   Non-Motor Premium Calculators: Fire · Theft/Burglary · PA · Mediclaim
   Motor calculation engine bilkul untouched hai.
   Saare rates EDITABLE hain (default = market/tariff guideline rates).
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var GST = 18;

  function n(id) { var e = $(id); return e ? (parseFloat(e.value) || 0) : 0; }
  function v(id) { var e = $(id); return e ? e.value : ''; }
  function fmt(x) {
    return '₹' + (Math.round(x * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  function toast(m, t) {
    if (window.proToast) window.proToast(m, t || 'error');
    else alert(m);
  }

  /* ---------- generic renderer ---------- */
  function render(boxId, title, rows, net, noGst) {
    var gst = noGst ? 0 : net * GST / 100;
    var total = net + gst;
    var h = '<div class="op-result-head"><span>' + title + '</span>'
          + '<span class="op-total">' + fmt(total) + '</span></div>'
          + '<table class="breakdown-table"><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td>' + r[0] + '</td><td style="text-align:right;">'
         + (typeof r[1] === 'number' ? fmt(r[1]) : r[1]) + '</td></tr>';
    });
    h += '<tr class="op-sub"><td><strong>Net Premium</strong></td><td style="text-align:right;"><strong>'
       + fmt(net) + '</strong></td></tr>'
       + '<tr><td>GST' + (noGst ? '' : ' @ ' + GST + '%') + '</td><td style="text-align:right;">'
       + (noGst ? 'NIL — Exempt' : fmt(gst)) + '</td></tr>'
       + '<tr class="op-grand"><td><strong>TOTAL PAYABLE</strong></td><td style="text-align:right;"><strong>'
       + fmt(total) + '</strong></td></tr></tbody></table>';
    var b = $(boxId);
    b.innerHTML = h;
    b.style.display = 'block';
    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return { net: net, gst: gst, total: total, noGst: !!noGst, rows: rows };
  }

  /* Har product calculation History me save hoti hai (same quote-number
     sequence as Motor). `pane` field-snapshot li jaata hai taaki
     History → View / Edit us product ke form ko wapas bhar sake. */
  var HIST_PANE = { fire: 'op-fire', theft: 'op-theft', pa: 'op-pa', med: 'op-med' };

  function saveToHistory(kind, title, sums, out) {
    var H = window.OIC && window.OIC.history;
    if (!H || !H.saveOther || !out) return;
    try {
      H.saveOther({
        kind: kind,
        pane: HIST_PANE[kind],
        form: H.snapshot ? H.snapshot(HIST_PANE[kind]) : undefined,
        product: title,
        customer: '',
        net: out.net,
        total: out.total,
        sumInsured: sums && sums.si,
        years: sums && sums.years,
        policyLabel: sums && sums.policyLabel,
        gstLabel: sums && sums.gstLabel,
        uin: sums && sums.uin,
        note: sums && sums.note
      });
    } catch (e) { if (window.console) console.warn('history save skipped', e); }
  }

  /* ============================================================
     1. FIRE  (Standard Fire & Special Perils / Bharat Griha Raksha)
     ============================================================ */
  // Base rate per mille (‰) by occupancy — guideline defaults
  var FIRE_OCC = {
    dwelling:  { label: 'Dwelling / Residential',        rate: 0.25 },
    office:    { label: 'Office / Shop (non-hazardous)', rate: 0.50 },
    godown:    { label: 'Godown / Warehouse',            rate: 0.75 },
    industrial:{ label: 'Industrial — Non-hazardous',    rate: 1.00 },
    hazardous: { label: 'Industrial — Hazardous',        rate: 1.75 }
  };
  var FIRE_CONSTR = { pucca: 0, semi: 0.15, kutcha: 0.40 };  // added ‰ loading

  function calcFire() {
    var bld = n('fBuilding'), cont = n('fContents'), stock = n('fStock');
    var si = bld + cont + stock;
    if (si <= 0) { toast('Fire: Sum Insured daaliye'); return; }

    var occ = FIRE_OCC[v('fOccupancy')] || FIRE_OCC.dwelling;
    var base = n('fRate') || occ.rate;
    var constr = FIRE_CONSTR[v('fConstruction')] || 0;
    var rate = base + constr;

    var rows = [
      ['Total Sum Insured', si],
      ['Occupancy', occ.label],
      ['Base rate', base.toFixed(2) + ' ‰'],
      ['Construction loading', '+' + constr.toFixed(2) + ' ‰'],
      ['Applied rate', rate.toFixed(2) + ' ‰']
    ];

    var basic = si * rate / 1000;
    rows.push(['Basic Fire Premium', basic]);
    var net = basic;

    if ($('fSTFI').checked)  { var a = si * 0.10 / 1000; net += a; rows.push(['STFI (0.10‰)', a]); }
    if ($('fRSMD').checked)  { var b = si * 0.05 / 1000; net += b; rows.push(['RSMD (0.05‰)', b]); }
    if ($('fEQ').checked)    { var c = si * 0.05 / 1000; net += c; rows.push(['Earthquake (0.05‰)', c]); }
    if ($('fTerror').checked){ var d = si * 0.12 / 1000; net += d; rows.push(['Terrorism (0.12‰)', d]); }
    if ($('fEscalation').checked) { var e = basic * 0.05; net += e; rows.push(['Escalation clause (5%)', e]); }

    /* Theft / Burglary add-on — rate user daalta hai (per mille) */
    if ($('fTheftAdd') && $('fTheftAdd').checked) {
      var tr = n('fTheftRate');
      var tAmt = si * tr / 1000;
      net += tAmt;
      rows.push(['Theft / Burglary Cover (' + tr.toFixed(2) + ' ‰)', tAmt]);
    }

    var disc = n('fDiscount');
    if (disc > 0) { var dd = net * disc / 100; net -= dd; rows.push(['Discount (' + disc + '%)', -dd]); }

    var yrs = parseFloat(v('fTerm')) || 1;
    if (yrs > 1) { net = net * yrs * 0.95; rows.push(['Long-term ' + yrs + " yrs (5% disc)", 'applied']); }

    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    var outFire = render('fireResult', '🔥 Fire Insurance Premium', rows, net);
    saveToHistory('fire', 'Fire & Special Perils', { si: si, years: yrs, policyLabel: occ.label, gstLabel: 'GST ' + GST + '%' }, outFire);
  }

  /* ============================================================
     2. THEFT / BURGLARY
     ============================================================ */
  var BURG_TYPE = {
    residence: { label: 'Residence / Household',   rate: 0.60 },
    shop:      { label: 'Shop / Showroom',         rate: 1.00 },
    office:    { label: 'Office / Establishment',  rate: 0.80 },
    godown:    { label: 'Godown / Warehouse',      rate: 1.25 },
    jewellery: { label: 'Jewellery / High value',  rate: 2.50 }
  };

  function calcTheft() {
    var si = n('tSI');
    if (si <= 0) { toast('Theft: Sum Insured daaliye'); return; }
    var typ = BURG_TYPE[v('tType')] || BURG_TYPE.residence;
    var rate = n('tRate') || typ.rate;

    var rows = [['Sum Insured', si], ['Property type', typ.label], ['Rate', rate.toFixed(2) + ' ‰']];
    var net = si * rate / 1000;
    rows.push(['Basic Burglary Premium', net]);

    if ($('tFirstLoss').checked) { var f = net * 0.75; rows.push(['First Loss basis (−25%)', -(net - f)]); net = f; }
    if ($('tRiot').checked)   { var r = si * 0.05 / 1000; net += r; rows.push(['Riot & Strike (0.05‰)', r]); }
    if ($('tMoney').checked)  { var m = n('tMoneySI') * 2.00 / 1000; net += m; rows.push(['Money in safe/transit (2.00‰)', m]); }
    if ($('tSafe').checked)   { var s = net * 0.10; net -= s; rows.push(['Burglar alarm / safe disc (10%)', -s]); }

    var disc = n('tDiscount');
    if (disc > 0) { var dd = net * disc / 100; net -= dd; rows.push(['Discount (' + disc + '%)', -dd]); }

    if (net < 100) { net = 100; rows.push(['Minimum premium applied', 100]); }
    var outTheft = render('theftResult', '🔐 Theft / Burglary Premium', rows, net);
    saveToHistory('theft', 'Theft / Burglary', { si: si, policyLabel: typ.label, gstLabel: 'GST ' + GST + '%' }, outTheft);
  }

  /* ============================================================
     3. PERSONAL ACCIDENT (PA)
     ============================================================ */
  /* ============================================================
     3. PERSONAL ACCIDENT (PA) — Individual
        Benefits/limits as per OICL PA (Individual) Policy Wordings
        IRDA/NL-HLT/OIC/P-P/V.1/456/13-14
     ============================================================ */
  /* PA TABLES (corrected 08-Sep-2026) — rate per mille (‰) of Capital Sum Insured */
  var PA_TABLE = {
    i:   { label: 'Table I — Death only',                        rate: 0.45 },
    ii:  { label: 'Table II — Death + PTD + PPD',                rate: 1.00 },
    iii: { label: 'Table III — Death + PTD + PPD + TTD',         rate: 1.50 }
  };
  /* Risk group loading on basic PA premium */
  var PA_RISK = {
    1: { label: 'Risk I — Admin / Clerical',          load: 0 },
    2: { label: 'Risk II — Manual (non-hazardous)',   load: 25 },
    3: { label: 'Risk III — Hazardous work',          load: 50 }
  };
  /* Medical Expenses Extension — clause (j):
     +10% premium => covers 25% of admissible claim
     +25% premium => covers 50% of admissible claim */
  var PA_MEDEXT = {
    10: { prem: 10, claim: 25 },
    25: { prem: 25, claim: 50 }
  };

  function calcPA() {
    var csi = n('pCSI');
    if (csi <= 0) { toast('Capital Sum Insured daaliye'); return; }
    if (!v('pPlan')) { toast('Plan chuniye'); return; }
    if (!v('pRisk')) { toast('Risk Group chuniye'); return; }
    if (!v('pTerm')) { toast('Policy Term chuniye'); return; }
    var plan = PA_TABLE[v('pPlan')];
    var risk = v('pRisk');
    var rk   = PA_RISK[risk];
    var rate = n('pRate') || plan.rate;
    if (rate <= 0) { toast('Rate daaliye'); return; }
    var members = Math.max(1, Math.round(n('pMembers') || 1));

    var rows = [
      ['Capital Sum Insured (per person)', csi],
      ['Plan', plan.label],
      ['Risk group', rk.label],
      ['Rate', rate.toFixed(2) + ' ‰'],
      ['Insured persons', members]
    ];

    var net = csi * rate / 1000;
    rows.push(['Basic PA premium / person', net]);

    /* Risk group loading */
    if (rk.load > 0) {
      var rl = net * rk.load / 100;
      net += rl;
      rows.push(['Risk group loading (' + rk.load + '%)', rl]);
    }

    /* Medical Expenses Extension — clause (j).
       Premium loading is on BASIC accident premium (risk-loaded). */
    var medExtOn = $('pMedExt') && $('pMedExt').checked;
    var meCfg = null;
    if (medExtOn) {
      meCfg = PA_MEDEXT[v('pMedExtPct')] || PA_MEDEXT[10];
      var m = net * meCfg.prem / 100;
      net += m;
      rows.push(['Medical Expenses Ext. (+' + meCfg.prem + '% → covers ' + meCfg.claim + '% of claim)', m]);
    }

    var age = n('pAge');
    if (age >= 61) { var al = net * 0.25; net += al; rows.push(['Age loading 61+ (25%)', al]); }
    else if (age >= 46) { var al2 = net * 0.10; net += al2; rows.push(['Age loading 46-60 (10%)', al2]); }

    net = net * members;
    rows.push(['× ' + members + ' person(s)', net]);

    if (members >= 5)  { var g = net * 0.10; net -= g; rows.push(['Group discount 5+ (10%)', -g]); }
    if (members >= 25) { var g2 = net * 0.05; net -= g2; rows.push(['Group discount 25+ (extra 5%)', -g2]); }

    var yrs = parseFloat(v('pTerm')) || 1;
    if (yrs > 1) { net = net * yrs * 0.925; rows.push(['Long-term ' + yrs + ' yrs (7.5% disc)', 'applied']); }

    /* PA premium — GST not charged (user requirement) */
    var outPa = render('paResult', '🧍 Personal Accident Premium', rows, net, true);
    saveToHistory('pa', 'Personal Accident (Individual)', {
      si: csi * members, years: yrs, policyLabel: plan.label, gstLabel: 'GST Exempt'
    }, outPa);
    renderPABenefits(csi, v('pPlan'), meCfg, n('pCbYears'));

    /* Quotation module ko data do (Generate / Share buttons ke liye) */
    if (window.registerHealthQuote) {
      var covers = [
        ['Plan', plan.label],
        ['Risk Group', rk.label],
        ['Rate applied', rate.toFixed(2) + ' per mille (‰)'],
        ['Insured Persons', String(members)],
        ['Policy Term', yrs + ' year(s)']
      ];
      if (meCfg) {
        covers.push(['Medical Expenses Extension',
          '+' + meCfg.prem + '% premium — covers ' + meCfg.claim + '% of admissible claim']);
      }
      window.registerHealthQuote({
        product: 'Personal Accident (Individual) Policy',
        uin: 'IRDA/NL-HLT/OIC/P-P/V.1/456/13-14',
        backTab: 'pa',
        base: csi * rate / 1000,
        net: net,
        meta: [
          ['Capital Sum Insured', '₹ ' + csi.toLocaleString('en-IN') + ' per person'],
          ['Plan', plan.label],
          ['Risk Group', rk.label],
          ['Insured Persons', String(members)],
          ['Policy Term', yrs + ' year(s)']
        ],
        rows: rows.concat([['Premium payable', net]]),
        covers: covers,
        notes: 'Personal Accident premium par GST applicable nahi hai. '
             + 'Rates indicative / guideline hain (de-tariffed market).'
      });
    }
  }

  /* ---------- Benefit / claim-payout table as per policy wordings ---------- */
  function renderPABenefits(csi, planKey, meCfg, cbYears) {
    var box = $('paBenefits');
    if (!box) return;

    /* Cumulative Bonus: +5% per completed year, max 50% — clause 4(a).
       Applies to death / loss of limb / PTD only. */
    cbYears = Math.max(0, Math.round(cbYears || 0));
    var cbPct = Math.min(50, cbYears * 5);
    var csiWithCB = csi * (1 + cbPct / 100);

    var b = [];
    b.push(['Death', fmt(csiWithCB) + (cbPct ? ' (100% CSI + ' + cbPct + '% CB)' : ' (100% CSI)')]);
    b.push(['Loss of 2 limbs / 2 eyes / PTD', fmt(csiWithCB) + ' (100%' + (cbPct ? ' + CB' : '') + ')']);
    b.push(['Loss of 1 limb / 1 eye', fmt(csi * 0.50) + ' (50% CSI)']);

    if (planKey === 'iii') {
      var wk = Math.min(csi * 0.01, 20000);
      b.push(['TTD — weekly benefit', fmt(wk) + ' / week (1% CSI, cap ₹20,000) · max 100 weeks']);
      b.push(['TTD — maximum payout', fmt(Math.min(wk * 100, csi))]);
    }
    if (planKey === 'ii' || planKey === 'iii') {
      b.push(['PPD', 'As per scale in policy (e.g. hearing both ears 50%, thumb 25%)']);
    }

    b.push(['Carriage of dead body', fmt(Math.min(csi * 0.02, 2500)) + ' (2% CSI or ₹2,500, whichever less)']);
    b.push(['Education fund — 1 child', fmt(Math.min(csi * 0.10, 5000)) + ' (10% CSI, cap ₹5,000)']);
    b.push(['Education fund — 2+ children', fmt(Math.min(csi * 0.10, 10000)) + ' (10% CSI, cap ₹10,000)']);
    b.push(['Loss of employment', fmt(Math.min(csi * 0.01, 15000)) + ' (1% CSI or ₹15,000, whichever less)']);

    if (meCfg) {
      b.push(['Medical expenses', meCfg.claim + '% of admissible claim (extension opted)']);
    } else {
      b.push(['Medical expenses', 'Not covered — tick Medical Expenses Extension']);
    }
    b.push(['Cumulative Bonus', cbPct + '% (' + cbYears + ' claim-free yr) · +5%/yr, max 50%']);

    var h = '<div class="op-result-head" style="background:linear-gradient(135deg,#0ea5e9,#2563eb);">'
          + '<span>📋 Benefits Payable on Claim</span><span class="op-total" style="font-size:13px;">CSI ' + fmt(csi) + '</span></div>'
          + '<table class="breakdown-table"><tbody>';
    b.forEach(function (r) {
      h += '<tr><td>' + r[0] + '</td><td style="text-align:right;font-weight:600;">' + r[1] + '</td></tr>';
    });
    h += '</tbody></table>'
       + '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);background:rgba(148,163,184,.10);">'
       + 'As per OICL Personal Accident (Individual) Policy Wordings · IRDA/NL-HLT/OIC/P-P/V.1/456/13-14. '
       + 'CB applies to death / loss of limbs / PTD only, on original CSI. Education fund age limit 23 yrs.</div>';
    box.innerHTML = h;
    box.style.display = 'block';
  }

  /* ============================================================
     4. MEDICLAIM (Health)
     ============================================================ */
  // Base premium per lakh of SI, by age band (individual, indicative)
  var MED_AGE = [
    { max: 17, label: '0-17 yrs',  perLakh: 480 },
    { max: 25, label: '18-25 yrs', perLakh: 560 },
    { max: 35, label: '26-35 yrs', perLakh: 680 },
    { max: 45, label: '36-45 yrs', perLakh: 900 },
    { max: 55, label: '46-55 yrs', perLakh: 1400 },
    { max: 60, label: '56-60 yrs', perLakh: 1950 },
    { max: 65, label: '61-65 yrs', perLakh: 2700 },
    { max: 70, label: '66-70 yrs', perLakh: 3500 },
    { max: 999, label: '70+ yrs',  perLakh: 4600 }
  ];
  function medBand(age) {
    for (var i = 0; i < MED_AGE.length; i++) if (age <= MED_AGE[i].max) return MED_AGE[i];
    return MED_AGE[MED_AGE.length - 1];
  }
  var MED_ZONE = { 1: { label: 'Zone I — Metro', f: 1.00 }, 2: { label: 'Zone II — Tier-2', f: 0.90 }, 3: { label: 'Zone III — Other', f: 0.80 } };

  function calcMediclaim() {
    var si = n('mSI');
    var age = n('mAge');
    if (si <= 0) { toast('Mediclaim: Sum Insured daaliye'); return; }
    if (age <= 0) { toast('Mediclaim: Eldest member ki age daaliye'); return; }

    var band = medBand(age);
    var perLakh = n('mRate') || band.perLakh;
    var zone = MED_ZONE[v('mZone')] || MED_ZONE[1];
    var type = v('mType'); // individual | floater
    var adults = Math.max(0, Math.round(n('mAdults')));
    var kids = Math.max(0, Math.round(n('mKids')));
    var members = adults + kids;
    if (members < 1) { toast('Mediclaim: kam se kam 1 member'); return; }

    var rows = [
      ['Sum Insured', si],
      ['Eldest member age', age + ' yrs (' + band.label + ')'],
      ['Base rate', fmt(perLakh) + ' / lakh'],
      ['Zone', zone.label],
      ['Cover type', type === 'floater' ? 'Family Floater' : 'Individual'],
      ['Members', adults + ' adult(s) + ' + kids + ' child(ren)']
    ];

    var lakhs = si / 100000;
    var base = lakhs * perLakh * zone.f;
    var net;

    if (type === 'floater') {
      // eldest full, next adult 75%, each child 50% — floater discount thereafter
      net = base;
      if (adults > 1) { var ex = base * 0.75 * (adults - 1); net += ex; rows.push(['Additional adult(s) @75%', ex]); }
      if (kids > 0)   { var kx = base * 0.50 * kids;         net += kx; rows.push(['Child(ren) @50%', kx]); }
      rows.splice(6, 0, ['Eldest member premium', base]);
      var fl = net * 0.20; net -= fl; rows.push(['Floater discount (20%)', -fl]);
    } else {
      net = base * members;
      rows.push(['Individual premium × ' + members, net]);
    }

    if ($('mMaternity').checked) { var mt = net * 0.15; net += mt; rows.push(['Maternity cover (15%)', mt]); }
    if ($('mCritical').checked)  { var ci = lakhs * 250;  net += ci; rows.push(['Critical illness rider', ci]); }
    if ($('mPED').checked)       { var pd = net * 0.25;   net += pd; rows.push(['PED waiting-period buyback (25%)', pd]); }
    if ($('mRoomUp').checked)    { var ru = net * 0.10;   net += ru; rows.push(['Room-rent upgrade (10%)', ru]); }
    if ($('mOPD').checked)       { net += 1200; rows.push(['OPD / consultation cover', 1200]); }

    var ncb = n('mNCB');
    if (ncb > 0) { var nb = net * ncb / 100; net -= nb; rows.push(['Cumulative bonus / claim-free disc (' + ncb + '%)', -nb]); }
    var copay = n('mCopay');
    if (copay > 0) { var cp = net * (copay / 2) / 100; net -= cp; rows.push(['Co-pay ' + copay + '% (disc ' + (copay / 2) + '%)', -cp]); }

    var yrs = parseFloat(v('mTerm')) || 1;
    if (yrs === 2) { net = net * 2 * 0.925; rows.push(['2-year policy (7.5% disc)', 'applied']); }
    if (yrs === 3) { net = net * 3 * 0.90;  rows.push(['3-year policy (10% disc)', 'applied']); }

    /* Health insurance premium is GST-EXEMPT */
    var total = render('medResult', '🏥 Mediclaim / Health Premium', rows, net, true);

    if (window.registerHealthQuote) {
      window.registerHealthQuote({
        product: 'Mediclaim / Health Insurance (Indicative)',
        uin: '—',
        net: total,
        meta: [
          ['Sum Insured', fmt(si)],
          ['Cover Type', type === 'floater' ? 'Family Floater' : 'Individual'],
          ['Eldest Member Age', age + ' yrs (' + band.label + ')'],
          ['Members', adults + ' adult(s) + ' + kids + ' child(ren)'],
          ['Zone', zone.label],
          ['Base Rate', fmt(perLakh) + ' / lakh'],
          ['Policy Term', yrs + ' Year' + (yrs > 1 ? 's' : '')],
          ['Rate Basis', 'Indicative / guideline']
        ],
        rows: rows,
        covers: [],
        notes: '\u26a0\ufe0f Ye indicative guideline rates hain \u2014 official chart wale products ke liye '
             + 'Youth Eco Care / Sampoorna Swasthya / Happy Family Floater / Super Top-Up sub-tabs use karein.'
      });
    }
    var deduct = Math.min(net, (adults > 0 ? 25000 : 0) + (age >= 60 ? 25000 : 0));
    var tip = $('medTaxTip');
    if (tip) {
      tip.style.display = 'block';
      tip.innerHTML = '💡 <strong>80D benefit:</strong> is policy par approx <strong>' + fmt(deduct) +
        '</strong> tak deduction claim ho sakta hai (old tax regime, indicative).';
    }
    return total;
  }

  /* ============================================================
     Sub-tab switching + bindings
     ============================================================ */
  /* Sub-tabs sirf Fire & Theft section ke andar hain — scope us section tak
     rakha hai taaki PA / Mediclaim ke panes galti se hide na ho jaayen. */
  function initSubTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab-content'), function (sec) {
      var btns = sec.querySelectorAll('.op-tab');
      if (!btns.length) return;
      Array.prototype.forEach.call(btns, function (b) {
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(btns, function (x) { x.classList.remove('active'); });
          Array.prototype.forEach.call(sec.querySelectorAll('.op-pane'), function (p) { p.classList.remove('active'); });
          b.classList.add('active');
          var pane = sec.querySelector('#op-' + b.dataset.op);
          if (pane) pane.classList.add('active');
        });
      });
    });
  }

  /* Sidebar se seedha kisi product par jaana (e.g. Fire & Theft -> Theft) */
  window.openProduct = function (tabName, opName) {
    var navBtn = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
    if (navBtn) navBtn.click();
    if (opName) {
      var t = document.querySelector('#tab-' + tabName + ' .op-tab[data-op="' + opName + '"]');
      if (t) t.click();
    }
  };

  function bindRateHints() {
    var f = $('fOccupancy');
    if (f) f.addEventListener('change', function () { $('fRate').value = (FIRE_OCC[f.value] || {}).rate || ''; });
    var t = $('tType');
    if (t) t.addEventListener('change', function () { $('tRate').value = (BURG_TYPE[t.value] || {}).rate || ''; });
    function paRate() {
      var p = PA_TABLE[v('pPlan')];
      $('pRate').value = p ? p.rate : '';
    }
    if ($('pPlan')) $('pPlan').addEventListener('change', paRate);

    /* Medical Extension tick -> 10% / 25% selector show */
    var me = $('pMedExt');
    if (me) {
      var meSync = function () {
        var w = $('pMedExtWrap');
        if (w) w.style.display = me.checked ? 'block' : 'none';
      };
      me.addEventListener('change', meSync);
      meSync();
    }
    if ($('mAge')) $('mAge').addEventListener('change', function () { $('mRate').value = medBand(n('mAge')).perLakh; });

    /* Fire form ke andar Theft cover tick -> rate box show/hide */
    var ta = $('fTheftAdd');
    if (ta) {
      var sync = function () {
        var w = $('fTheftRateWrap');
        if (w) w.style.display = ta.checked ? 'block' : 'none';
      };
      ta.addEventListener('change', sync);
      sync();
    }
  }

  function init() {
    initSubTabs();
    bindRateHints();
    if ($('fireCalcBtn'))  $('fireCalcBtn').addEventListener('click', calcFire);
    if ($('theftCalcBtn')) $('theftCalcBtn').addEventListener('click', calcTheft);
    if ($('paCalcBtn'))    $('paCalcBtn').addEventListener('click', calcPA);
    if ($('medCalcBtn'))   $('medCalcBtn').addEventListener('click', calcMediclaim);
    // print
    var pb = $('opPrintBtn');
    if (pb) pb.addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.OtherProducts = { calcFire: calcFire, calcTheft: calcTheft, calcPA: calcPA, calcMediclaim: calcMediclaim };
})();
