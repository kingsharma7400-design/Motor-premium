/* ============================================================
   ossp.js  —  OICL Premium Calculator V30.0
   ORIENTAL SAMPOORNA SWASTHYA SURAKSHA (OSSP)
   UIN: OICHLIP26035V012526

   Premium rules (chart page 13):
     • Eldest insured member ................... 100%
     • Additional member aged 66 & above ....... 75%
     • Additional member aged 65 or below ...... 55%
   Age loadings (fresh purchase, for life):
     • Up to 65 ....... nil
     • 66–70 .......... +10%   (claim-free 3 yrs -> +5%)
     • 71–80 .......... +25%   (claim-free 3 yrs -> +15%)
     • 81 & above ..... +50%
   Discounts:
     • Online ......... 10% (max ₹5,000)
     • No TPA ......... 5.5% (not on PA premium)
     • Family ......... 5% flat (2+ members)
   Personal Accident optional cover: ₹50 per lakh per person,
     10% family discount if more than one member.
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

  var PLAN_LABEL = { premium: 'PREMIUM Plan', elite: 'ELITE Plan', royal: 'ROYAL Plan' };
  var MODE_LABEL = {
    annual:    'Annual (1 yr)',
    '2yr':     '2-Year term (biennial payment)',
    '3yr':     '3-Year term (triennial payment)',
    half:      'Half-Yearly instalment',
    quarterly: 'Quarterly instalment',
    monthly:   'Monthly instalment'
  };
  var ZONE_LABEL = {
    '1': 'Zone I — Gujarat, Mumbai, Chennai, Bengaluru, Pune, Delhi NCR',
    '2': 'Zone II — Rest of India'
  };

  /* ---------- age band index ---------- */
  var AGE_MAX = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 999];
  function ageIdx(age) {
    for (var i = 0; i < AGE_MAX.length; i++) if (age <= AGE_MAX[i]) return i;
    return AGE_MAX.length - 1;
  }
  function ageLabel(age) {
    return (window.OSSP_AGE_BANDS || [])[ageIdx(age)] || '';
  }

  function grid() {
    var R = window.OSSP_RATES;
    if (!R) return null;
    var z = v('osZone') || '1', p = v('osPlan') || 'premium', m = v('osMode') || 'annual';
    return (((R[z] || {})[p] || {})[m]) || null;
  }

  function siList() {
    var g = grid();
    if (!g) return [];
    return Object.keys(g).map(Number).sort(function (a, b) { return a - b; });
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
  window.osspRateFor = rateFor;

  /* ---------- age loading ---------- */
  function loadingPct(age, claimFree3) {
    if (age <= 65) return 0;
    if (age <= 70) return claimFree3 ? 5 : 10;
    if (age <= 80) return claimFree3 ? 15 : 25;
    return 50;
  }

  /* ---------- plan benefit highlights ---------- */
  function benefits(plan, si) {
    var rows = [];
    if (plan === 'premium') {
      rows.push(['Room, Boarding & Nursing', '1% of Sum Insured per day']);
      rows.push(['ICU expenses', '2% of Sum Insured per day']);
      rows.push(['Pre / Post hospitalisation', '30 days / 60 days']);
      rows.push(['Pre-existing Diseases', 'Covered after 3 consecutive policy periods']);
      rows.push(['Maternity expenses', 'Not available in Premium plan']);
      rows.push(['Health check-up', 'Not available in Premium plan']);
    } else if (plan === 'elite') {
      rows.push(['Room, Boarding & Nursing', si <= 1000000 ? '1% of SI per day' : 'Actual expenses']);
      rows.push(['ICU expenses', si <= 1000000 ? '2% of SI per day' : 'Actual expenses']);
      rows.push(['Pre / Post hospitalisation', '45 days / 90 days']);
      rows.push(['Pre-existing Diseases', '2-year waiting period']);
      rows.push(['★ Maternity expenses', 'Covered (as per SI slab limits)']);
      rows.push(['★ Health check-up', 'After 2 continuous claim-free periods']);
      rows.push(['★ Inbuilt accident cover', 'Available (benefit plan)']);
    } else {
      rows.push(['Room, Boarding & Nursing', 'Actual expenses incurred']);
      rows.push(['ICU expenses', 'Actual expenses incurred']);
      rows.push(['Pre / Post hospitalisation', '90 days / 180 days']);
      rows.push(['Pre-existing Diseases', '2-year waiting period']);
      rows.push(['★ Maternity expenses', 'Covered (as per SI slab limits)']);
      rows.push(['★ Health check-up', 'After 2 continuous claim-free periods']);
      rows.push(['★ Inbuilt accident cover', 'Available (benefit plan)']);
      rows.push(['★ Specialised oncology / investigation abroad', 'Covered — once in lifetime']);
    }
    rows.push(['AYUSH treatment', 'Up to full Sum Insured (in-patient only)']);
    rows.push(['New born baby cover', 'From day one, all SI levels']);
    rows.push(['Assisted Reproduction Treatment', 'Covered as per policy limits']);
    rows.push(['Modern treatment methods', 'Covered up to specified amount']);
    rows.push(['Dental / Plastic surgery', 'Covered when due to disease or injury']);
    rows.push(['Optional covers', 'PED buyback · Room-rent upgrade · Fixed co-pay · Personal Accident']);
    return rows;
  }

  /* ============================================================
     Calculation
     ============================================================ */
  function calcOSSP() {
    if (!window.OSSP_RATES) { toast('OSSP rate chart load nahi hua'); return; }

    var si   = parseFloat(v('osSI')) || 0;
    var plan = v('osPlan');
    var mode = v('osMode');
    var zone = v('osZone');

    if (!v('osPlan')) { toast('Plan chuniye'); return; }
    if (!v('osZone')) { toast('Zone chuniye'); return; }
    if (!v('osMode')) { toast('Payment Option chuniye'); return; }
    if (si <= 0) { toast('Sum Insured chuniye'); return; }
    if (!v('osBasis')) { toast('Cover Basis chuniye'); return; }
    if (!v('osMembers')) { toast('Number of Members chuniye'); return; }

    var ages = [];
    for (var i = 1; i <= 6; i++) {
      var a = n('osAge' + i);
      if (a > 0) ages.push(a);
    }
    if (!ages.length) { toast('OSSP: kam se kam 1 member ki age daaliye'); return; }

    var basis = v('osBasis') || 'floater';
    if (basis === 'floater' && ages.length < 2) {
      toast('Floater plan me minimum 2 persons chahiye', 'info');
    }

    var cf3 = ck('osClaimFree');
    var sorted = ages.slice().sort(function (a, b) { return b - a; });

    var rows = [
      ['Plan', PLAN_LABEL[plan]],
      ['Zone', ZONE_LABEL[zone]],
      ['Payment option', MODE_LABEL[mode]],
      ['Cover basis', basis === 'floater' ? 'Floater' : (basis === 'ff' ? 'Floater within Floater' : 'Individual')],
      ['Sum Insured', si],
      ['Members covered', sorted.length]
    ];

    var net = 0;
    sorted.forEach(function (age, i) {
      var base = rateFor(si, age);
      var pct  = i === 0 ? 100 : (age >= 66 ? 75 : 55);
      var share = base * pct / 100;
      var label = (i === 0 ? 'Eldest member' : 'Member ' + (i + 1))
                + ' — age ' + age + ' (' + ageLabel(age) + ') @ ' + pct + '%';
      rows.push([label, share]);

      var ld = loadingPct(age, cf3);
      if (ld > 0) {
        var lv = share * ld / 100;
        share += lv;
        rows.push(['   ↳ Age loading ' + ld + '% (age ' + age + ')', lv]);
      }
      net += share;
    });
    var officeBase = net;   /* base office premium — add-on % isi par lagte hain */

    /* ---- Room Rent Upgradation (Premium & Elite only, SI <= 10L) ---- */
    var ru = v('osRoomUp');
    if (ru && ru !== 'none') {
      var eligible = (plan === 'premium' || plan === 'elite') && si <= 1000000;
      var tbl = (window.OSSP_ROOM_UPGRADE || {})[String(si)];
      if (!eligible || !tbl) {
        rows.push(['Room Rent Upgradation', 'N/A — sirf Premium/Elite plan, SI ₹10 lakh tak']);
      } else {
        var rp = (ru === '50') ? tbl.opt50 : tbl.opt100;
        var ra = officeBase * rp / 100;
        net += ra;
        rows.push(['Room Rent Upgradation — ' + ru + '% enhancement (+' + rp + '%)', ra]);
      }
    }

    /* ---- PED Waiting Period Buyback (fresh policies only) ---- */
    var pb = v('osPedBuy');
    if (pb && pb !== 'none') {
      var pt = (window.OSSP_PED_BUYBACK || {})[pb];
      var pp = pt ? pt[plan] : null;
      if (pp == null) {
        rows.push(['PED Waiting Period Buyback', 'N/A — is plan me ye option nahi']);
      } else {
        var pa2 = officeBase * pp / 100;
        net += pa2;
        rows.push(['PED Buyback — ' + pt.label + ' (+' + pp + '%)', pa2]);
      }
    }

    rows.push(['Gross premium (before discounts)', net]);
    var grossBase = net;

    /* ---- Discounts ----
       Sabhi discounts SIRF basic (office) premium par lagte hain — successive
       nahi, aur Room Rent Upgradation / PED Buyback ke add-on amount par nahi.
       Isse har discount ka % predictable rehta hai aur order matter nahi karta. */
    var discTotal = 0;

    if (ck('osFamily')) {
      if (sorted.length > 1) {
        var fd = officeBase * 0.05; discTotal += fd;
        rows.push(['Family discount (5% of basic)', -fd]);
      } else {
        rows.push(['Family discount', 'N/A — only 1 member']);
      }
    }
    if (ck('osNoTPA')) {
      var td = officeBase * 0.055; discTotal += td;
      rows.push(['TPA services not opted (5.5% of basic)', -td]);
    }
    if (ck('osLongTerm')) {
      var lt = officeBase * 0.05; discTotal += lt;
      rows.push(['Long-term policy discount (5% of basic)', -lt]);
    }
    if (ck('osOnline')) {
      var od = Math.min(officeBase * 0.10, 5000); discTotal += od;
      rows.push(['Online discount (10% of basic, max ₹5,000)', -od]);
    }

    /* ---- Migration offer (clause 6.7) ---- */
    var mg = v('osMigration');
    if (mg && mg !== 'none') {
      var mt = (window.OSSP_MIGRATION || {})[mg];
      if (mt && mt.pct > 0) {
        var ma = officeBase * mt.pct / 100; discTotal += ma;
        rows.push(['Migration discount — ' + mt.label + ' (' + mt.pct + '% of basic)', -ma]);
      }
    }

    if (discTotal > 0) {
      net -= discTotal;
      if (net < 0) net = 0;
      rows.push(['Total discount', -discTotal]);
    }

    /* ---- Optional Personal Accident cover (no discounts apply) ---- */
    if (ck('osPA')) {
      var paSI = n('osPASI') || si;
      var paRate = n('osPARate') || 50;   // ₹50 per lakh per person
      var pa = (paSI / 100000) * paRate * sorted.length;
      rows.push(['PA cover — ' + fmt(paRate) + '/lakh × ' + sorted.length + ' person(s) on ' + fmt(paSI), pa]);
      if (sorted.length > 1) { var pd = pa * 0.10; pa -= pd; rows.push(['   ↳ PA family discount (10%)', -pd]); }
      net += pa;
    }

    var adj = n('osAdj');
    if (adj !== 0) { var av = net * adj / 100; net += av; rows.push(['Manual adjustment (' + adj + '%)', av]); }

    /* ---- Render (GST exempt) ---- */
    var total = net;
    var h = '<div class="op-result-head"><span>🛡️ Sampoorna Swasthya Suraksha — Premium</span>'
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
       + fmt(total) + '</strong></td></tr></tbody></table>';

    if (mode === 'monthly' || mode === 'quarterly' || mode === 'half') {
      var per = { monthly: 12, quarterly: 4, half: 2 }[mode];
      h += '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);'
         + 'background:rgba(148,163,184,.10);">📅 Ye <strong>per-instalment</strong> amount hai. '
         + 'Ek saal me ' + per + ' instalment → annual outgo approx <strong>' + fmt(total * per) + '</strong>.</div>';
    } else if (mode === '2yr' || mode === '3yr') {
      var yrs = mode === '2yr' ? 2 : 3;
      h += '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);'
         + 'background:rgba(148,163,184,.10);">📅 Ye <strong>' + yrs + '-year</strong> ka one-time premium hai '
         + '→ per year approx <strong>' + fmt(total / yrs) + '</strong>.</div>';
    }
    h += '<div style="padding:10px 14px;font-size:11px;line-height:1.6;color:var(--text-3);'
       + 'background:rgba(148,163,184,.10);">Official OICL chart · UIN OICHLIP26035V012526 · '
       + 'Entry age 18+ (no max) · SI ₹1 lakh – ₹500 lakh · lifelong renewable · '
       + '<strong>Health premium GST-exempt.</strong></div>';

    var box = $('osResult');
    box.innerHTML = h;
    box.style.display = 'block';

    /* ---- Benefits ---- */
    var bh = '<div class="op-result-head"><span>📋 Plan Features — ' + PLAN_LABEL[plan]
           + ' @ ' + fmt(si) + '</span></div><table class="breakdown-table"><tbody>';
    benefits(plan, si).forEach(function (r) {
      bh += '<tr><td>' + r[0] + '</td><td style="text-align:right;">' + r[1] + '</td></tr>';
    });
    bh += '</tbody></table>';
    var bb = $('osBenefits');
    if (bb) { bb.innerHTML = bh; bb.style.display = 'block'; }

    var tip = $('osTaxTip');
    if (tip) {
      tip.style.display = 'block';
      tip.innerHTML = '💡 <strong>Section 80D:</strong> approx <strong>'
        + fmt(Math.min(total, sorted[0] >= 60 ? 50000 : 25000)) + '</strong> tak deduction (old regime, indicative).';
    }

    /* ---- Quotation register ---- */
    if (window.registerHealthQuote) {
      window.registerHealthQuote({
        product: 'Oriental Sampoorna Swasthya Suraksha',
        uin: 'OICHLIP26035V012526',
        base: grossBase,
        net: total,
        meta: [
          ['Plan', PLAN_LABEL[plan]],
          ['Sum Insured', fmt(si)],
          ['Zone', zone === '1' ? 'Zone I' : 'Zone II'],
          ['Payment Option', MODE_LABEL[mode]],
          ['Cover Basis', basis === 'floater' ? 'Floater'
                        : (basis === 'ff' ? 'Floater within Floater' : 'Individual')],
          ['Members', String(sorted.length)],
          ['Ages', sorted.join(', ') + ' yrs'],
          ['Eldest Age Band', ageLabel(sorted[0])],
          ['Room Rent Upgrade', (v('osRoomUp') && v('osRoomUp') !== 'none')
              ? v('osRoomUp') + '% enhancement' : 'Not opted'],
          ['PED Buyback', (v('osPedBuy') && v('osPedBuy') !== 'none' && window.OSSP_PED_BUYBACK[v('osPedBuy')])
              ? window.OSSP_PED_BUYBACK[v('osPedBuy')].label : 'Not opted'],
          ['Migration', (v('osMigration') && v('osMigration') !== 'none' && window.OSSP_MIGRATION[v('osMigration')])
              ? window.OSSP_MIGRATION[v('osMigration')].label : 'Fresh policy']
        ],
        rows: rows,
        covers: benefits(plan, si),
        notes: 'Rates as per official OICL OSSP premium chart. Age loadings applied as per chart '
             + '(66-70: +10%, 71-80: +25%, 81+: +50%). Health insurance premium GST-exempt.'
      });
    }

    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return total;
  }

  /* ============================================================
     UI sync
     ============================================================ */
  function fillSI() {
    var sel = $('osSI');
    if (!sel) return;
    var prev = sel.value;
    var list = siList();
    sel.innerHTML = '<option value="" selected disabled>-- Select --</option>';
    list.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s;
      o.textContent = '₹ ' + s.toLocaleString('en-IN') + '  (' + (s / 100000) + ' lakh)';
      sel.appendChild(o);
    });
    if (prev && list.indexOf(Number(prev)) >= 0) sel.value = prev;
    syncPreview();
    syncRoomUp();
  }

  function syncPreview() {
    syncAgeLoad();
  }

  /* Age loading auto-tick: koi bhi member 66+ hote hi checkbox tick ho jaata hai */
  function syncAgeLoad() {
    var box = $('osAgeLoad'), txt = $('osAgeLoadTxt'), det = $('osAgeLoadDetail'),
        row = $('osAgeLoadRow');
    if (!box) return;

    var cf3 = ck('osClaimFree');
    var hits = [];
    for (var i = 1; i <= 6; i++) {
      var w = $('osMemWrap' + i);
      if (w && w.style.display === 'none') continue;
      var a = n('osAge' + i);
      if (a > 0) {
        var p = loadingPct(a, cf3);
        if (p > 0) hits.push({ age: a, pct: p });
      }
    }

    box.checked = hits.length > 0;
    if (row) row.style.opacity = hits.length ? '1' : '.55';

    if (!hits.length) {
      if (txt) txt.textContent = 'Not applicable';
      if (det) det.style.display = 'none';
      return;
    }

    var uniq = [];
    hits.forEach(function (h) { if (uniq.indexOf(h.pct) < 0) uniq.push(h.pct); });
    if (txt) {
      txt.textContent = 'Applied on ' + hits.length + ' member'
        + (hits.length > 1 ? 's' : '') + ' (+'
        + uniq.sort(function (a, b) { return a - b; }).join('%, +') + '%)';
    }
    if (det) {
      det.innerHTML = hits.map(function (h) {
        return 'Age ' + h.age + ' \u2192 <strong>+' + h.pct + '%</strong>';
      }).join(' &nbsp;\u00b7&nbsp; ');
      det.style.display = 'block';
    }
  }

  function syncMembers() {
    var count = parseInt(v('osMembers'), 10) || 0;
    for (var i = 1; i <= 6; i++) {
      var w = $('osMemWrap' + i);
      if (w) w.style.display = i <= count ? 'block' : 'none';
      if (i > count && $('osAge' + i)) $('osAge' + i).value = '';
    }
    syncPreview();
  }

  function syncPA() {
    var w = $('osPAWrap');
    if (w) w.style.display = ck('osPA') ? 'grid' : 'none';
  }

  /* PED buyback options plan ke hisaab se refill */
  function syncPed() {
    var sel = $('osPedBuy');
    if (!sel) return;
    var plan = v('osPlan') || 'premium';
    var T = window.OSSP_PED_BUYBACK || {};
    var prev = sel.value;
    sel.innerHTML = '<option value="none">Not opted</option>';
    Object.keys(T).forEach(function (k) {
      var pct = T[k][plan];
      if (pct == null) return;
      var o = document.createElement('option');
      o.value = k;
      o.textContent = T[k].label + '  (+' + pct + '%)';
      sel.appendChild(o);
    });
    if (prev && sel.querySelector('option[value="' + prev + '"]')) sel.value = prev;
    var note = $('osPedNote');
    if (note) {
      note.textContent = 'Fresh policies only · specified diseases (clause 5.2) par lagu nahi';
      note.style.display = 'block';
    }
  }

  /* Room rent upgrade eligibility */
  function syncRoomUp() {
    var sel = $('osRoomUp'), note = $('osRoomUpNote');
    if (!sel) return;
    var plan = v('osPlan') || 'premium';
    var si = parseFloat(v('osSI')) || 0;
    var ok = (plan === 'premium' || plan === 'elite') && si <= 1000000
             && !!(window.OSSP_ROOM_UPGRADE || {})[String(si)];
    sel.disabled = !ok;
    if (!ok) sel.value = 'none';
    if (note) {
      if (ok) {
        var t = window.OSSP_ROOM_UPGRADE[String(si)];
        note.textContent = '50% → +' + t.opt50 + '%  ·  100% → +' + t.opt100 + '%';
      } else {
        note.textContent = 'Premium / Elite plan me SI ₹10 lakh tak hi available';
      }
      note.style.display = 'block';
    }
  }

  function init() {
    ['osZone', 'osPlan', 'osMode'].forEach(function (id) {
      var e = $(id); if (e) e.addEventListener('change', fillSI);
    });
    ['osSI', 'osAge1', 'osAge2', 'osAge3', 'osAge4', 'osAge5', 'osAge6'].forEach(function (id) {
      var e = $(id);
      if (e) { e.addEventListener('change', syncPreview); e.addEventListener('input', syncPreview); }
    });
    var cf = $('osClaimFree'); if (cf) cf.addEventListener('change', syncAgeLoad);
    var m = $('osMembers'); if (m) m.addEventListener('change', syncMembers);
    var pa = $('osPA'); if (pa) pa.addEventListener('change', syncPA);
    var pl = $('osPlan'); if (pl) pl.addEventListener('change', function () { syncPed(); syncRoomUp(); });
    var sisel = $('osSI'); if (sisel) sisel.addEventListener('change', syncRoomUp);
    var b = $('osCalcBtn'); if (b) b.addEventListener('click', calcOSSP);
    fillSI();
    syncMembers();
    syncPA();
    syncPed();
    syncRoomUp();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.OSSP = { calc: calcOSSP, rateFor: rateFor };
})();
