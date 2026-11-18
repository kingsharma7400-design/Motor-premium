/*
  Native extended-product workspace for OICL Smart Quick Quote V31.
  This file contains this project's own UI and rating engines.  It intentionally
  does not embed, frame, launch, or depend on the public reference calculator.
*/
(function () {
  'use strict';
  const rates = window.OICL_PRODUCT_RATES;
  const host = document.getElementById('nativeProductHost');
  const tabs = document.getElementById('nativeProductTabs');
  if (!rates || !host || !tabs) return;

  const $ = id => document.getElementById(id);
  const n = value => Number(value) || 0;
  const money = value => `₹${Math.round(n(value)).toLocaleString('en-IN')}`;
  const money2 = value => `₹${n(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = value => `${Math.round(n(value) * 100) / 100}%`;
  const esc = value => String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  const checked = id => !!($(id) && $(id).checked);
  const val = id => ($(id) || {}).value || '';
  const today = new Date().toISOString().slice(0, 10);
  const oneYearLater = `${new Date(new Date().setFullYear(new Date().getFullYear() + 1) - 86400000).toISOString().slice(0, 10)}`;
  let active = 'wc';

  /* -------------------------- Formula engines -------------------------- */
  function wcPeriod(from, to, type) {
    if (type === 'annual' || !from || !to) return { factor: 1, label: 'Annual — full annual rate', type: 'annual' };
    const a = new Date(from), b = new Date(to);
    if (Number.isNaN(+a) || Number.isNaN(+b) || b <= a) return { factor: 1, label: 'Annual — full annual rate', type: 'annual' };
    const days = Math.round((b - a) / 86400000) + 1;
    if (type === 'prorata') return { factor: Math.min(days / 365, 1), label: `Pro-rata — ${days} days / 365`, type, days };
    const months = (b - a) / (86400000 * 30.4375);
    const factor = months <= 1.02 ? .25 : months <= 3.05 ? .50 : months <= 6.10 ? .75 : 1;
    return { factor, label: factor === .25 ? 'Short period — up to 1 month (¼ annual)' : factor === .5 ? 'Short period — up to 3 months (½ annual)' : factor === .75 ? 'Short period — up to 6 months (¾ annual)' : 'Short period exceeding 6 months — annual rate', type, days };
  }
  function wcQuote(input) {
    const occ = rates.wc.occupations.find(x => x.code === input.code);
    if (!occ || occ.rate == null || !(input.employees > 0) || !(input.monthlyWage > 0)) return null;
    const period = wcPeriod(input.from, input.to, input.calcType);
    const annual = Math.round(input.monthlyWage * 12), capAnnual = rates.wc.wageCap * 12;
    const capped = Math.min(annual, capAnnual), excess = Math.max(0, annual - capAnnual), excessRate = Math.max(occ.rate / 16, 1.2);
    const perEmployee = capped * occ.rate / 1000 + excess * excessRate / 1000;
    const basicBeforeLoad = Math.round(perEmployee * input.employees * period.factor);
    const diseaseLoad = input.occDisease ? Math.round(basicBeforeLoad * .5) : 0;
    const basic = basicBeforeLoad + diseaseLoad;
    let medical = 0;
    const med = rates.wc.medical[input.medSI];
    if (med) {
      const [multiplier, minimum] = med;
      const raw = occ.rate * multiplier * (period.type === 'prorata' ? period.factor : 1);
      medical = raw < minimum ? minimum * input.employees : Math.round(raw * input.employees);
    }
    const discountBasic = Math.round(basic * Math.min(100, Math.max(0, input.discountBasic)) / 100);
    const discountMedical = Math.round(medical * Math.min(100, Math.max(0, input.discountMedical)) / 100);
    const minPremium = 150;
    const netBasic = basic - discountBasic;
    const minimumAdjustment = netBasic < minPremium ? minPremium - netBasic : 0;
    const net = netBasic + minimumAdjustment + medical - discountMedical;
    const gst = Math.round(net * .18);
    const warnings = [];
    const authority = rates.wc.discountAuthority[input.office] || rates.wc.discountAuthority.BO;
    if (input.discountBasic > authority || input.discountMedical > authority) warnings.push(`Entered discount exceeds ${input.office || 'BO'} delegated authority of ${authority}% — approval required.`);
    if (minimumAdjustment) warnings.push(`Basic premium has been raised to the minimum of ${money(minPremium)}.`);
    return { occ, employees: input.employees, monthlyWage: input.monthlyWage, period, annual, capped, excess, excessRate, perEmployee, basicBeforeLoad, diseaseLoad, basic, medical, discountBasic, discountMedical, minimumAdjustment, net, gst, grand: net + gst, stamp: Math.round(net / 1000), warnings };
  }
  function carQuote(input) {
    const isEar = input.mode === 'ear';
    const risk = isEar ? rates.car.earRisks.find(x => x.c === input.risk) : rates.car.risks[input.risk];
    if (!risk || !(input.si > 0)) return null;
    let rate, gross, detail;
    if (isEar) {
      const testing = Math.min(Math.max(0, input.testing), 12), erection = Math.max(0, input.months - testing);
      if (input.months <= 2) { rate = risk.c4; gross = input.si / 1000 * rate; detail = `Column 4 base rate ${rate}‰`; }
      else {
        const c5Months = Math.min(Math.max(0, erection - 1), 10), c6Months = Math.max(0, erection - 11), testExtra = Math.max(0, testing - 1);
        rate = risk.c4 + risk.c5 * c5Months + risk.c6 * c6Months + risk.c7 * testExtra;
        gross = input.si / 1000 * rate;
        detail = `C4 ${risk.c4}‰ + C5 × ${c5Months} + C6 × ${c6Months} + testing C7 × ${testExtra}`;
      }
    } else {
      const extraMonths = Math.max(0, input.months - 3);
      rate = risk.r + risk.a * extraMonths;
      gross = input.si / 1000 * rate;
      detail = `Base ${risk.r}‰ + additional ${risk.a}‰ × ${extraMonths} month(s)`;
    }
    const discount = gross * Math.min(99.99, Math.max(0, input.discount)) / 100;
    const net = gross - discount, gst = net * .18;
    return { risk, isEar, si: input.si, months: input.months, rate, gross, discount, net, gst, grand: Math.round(net + gst), detail };
  }
  function cpmQuote(input) {
    const item = rates.cpm.equipment.find(x => x[0] === input.code);
    if (!item || !(input.si > 0)) return null;
    const group = item[1], baseRate = rates.cpm.groupRates[group] || 1;
    const floater = input.floater ? baseRate * .1 : 0;
    const underground = input.underground ? (baseRate + floater) * .5 : 0;
    const basic = input.si * baseRate / 100, floaterPremium = input.si * floater / 100, undergroundPremium = input.si * underground / 100;
    const stfi = input.stfi ? input.si * rates.cpm.stfi / 1000 : 0;
    const eqRate = rates.cpm.eqRates[input.zone] || rates.cpm.eqRates[4];
    const earthquake = input.eq ? input.si * eqRate / 1000 : 0;
    const terrorism = input.terror ? input.si * rates.cpm.terror / 1000 : 0;
    const subtotal = basic + floaterPremium + undergroundPremium + stfi + earthquake + terrorism;
    const discountable = basic + floaterPremium + undergroundPremium;
    const discount = discountable * Math.min(99.99, Math.max(0, input.discount)) / 100;
    const annualNet = subtotal - discount;
    const shortPct = rates.cpm.shortPeriod[String(input.months)] || 100;
    const eqAdjusted = shortPct < 100 ? earthquake * input.months / 12 : earthquake;
    const net = shortPct < 100 ? (annualNet - earthquake) * shortPct / 100 + eqAdjusted : annualNet;
    const gst = net * .18;
    return { item, code: input.code, si: input.si, months: input.months, zone: input.zone, group, baseRate, floater, underground, basic, floaterPremium, undergroundPremium, stfi, eqRate, earthquake, terrorism, subtotal, discount, shortPct, net, gst, grand: Math.round(net + gst) };
  }
  function papsQuote(input) {
    const p = rates.paps, i = p.csi.indexOf(input.csi);
    if (i < 0) return null;
    const plan = input.plan === 'E' ? 'E' : 'P';
    const at = name => (p.rates[`${name}_${plan}`] || [])[i] || 0;
    const parts = [{ name: 'In-built Personal Accident cover', premium: at('BASE') }];
    if (input.ptd) parts.push({ name: 'Permanent Total Disablement Option II', premium: at('PTD') });
    if (input.medical) parts.push({ name: 'Medical Expenses', premium: at('MED') });
    if (input.hospitalCash) parts.push({ name: 'Accident Hospital Cash', premium: at('AHC') });
    if (input.elderlyCare) parts.push({ name: 'Elderly Care', premium: at('ELD') });
    if (input.chauffeur) parts.push({ name: 'Chauffeur Plan', premium: at('CHF') });
    const annual = parts.reduce((sum, row) => sum + row.premium, 0);
    const termFactor = input.years === 2 ? .9 : input.years === 3 ? .85 : 1;
    const beforeLoad = input.years === 1 ? annual : Math.round(annual * input.years * termFactor);
    const loadingPct = (input.risk === 'R2' ? 10 : input.risk === 'R3' ? 20 : 0) + (input.preExisting ? 10 : 0);
    const loaded = Math.round(beforeLoad * (1 + loadingPct / 100));
    const familyDiscount = input.staff ? 0 : input.familyMembers >= 3 ? 10 : input.familyMembers === 2 ? 5 : 0;
    const onlineDiscount = input.online ? 10 : 0, staffDiscount = input.staff ? 10 : 0, ncd = input.staff ? 0 : Math.min(20, Math.max(0, input.ncd));
    const discountPct = Math.min(40, familyDiscount + onlineDiscount + staffDiscount + ncd);
    const discount = Math.round(loaded * discountPct / 100);
    const net = Math.max(100, loaded - discount);
    return { plan, csi: input.csi, years: input.years, familyMembers: input.familyMembers, parts, annual, beforeLoad, loadingPct, loaded, familyDiscount, onlineDiscount, staffDiscount, ncd, discountPct, discount, net, grand: net };
  }
  function packageQuote(kind, input) {
    const schedule = rates[kind].sections;
    const owner = input.owner;
    const selected = input.selected || {};
    const values = input.values || {};
    const warnings = [];
    let contents = n(values.contents);
    if (kind === 'office') {
      const stock = n(values.contentsAG), household = n(values.contentsH), jewellery = n(values.contentsJ);
      contents = stock + household + jewellery + (stock ? Math.max(stock * .05, rates.office.documentMinimum) : 0);
    }
    const rows = [];
    schedule.forEach(section => {
      const compulsory = section.compulsory === 'always' || (section.compulsory === 'owner' && owner);
      if (!(selected[section.key] || compulsory)) return;
      if (section.requires && !(selected[section.requires])) { warnings.push(`${section.no} ${section.name} requires ${section.requires}; it has not been rated.`); return; }
      let si = section.key === 'contents' ? contents : n(values[section.key]);
      if (section.derivedOf === 'contents') si = contents * (section.derivedPct || rates.office.derivedPercent) / 100;
      if (section.key === 'paMed') si = Math.min(si, n(values.pa) * .10);
      const rate = section.key === 'breakdown' ? n(values.breakdownRate) || 2 : n(section.rate);
      if (!(si > 0)) return;
      const premium = si * rate / 1000;
      rows.push({ section, si, rate, premium });
    });
    const discountPct = Math.min(99.99, Math.max(0, input.discount));
    const subtotal = rows.reduce((sum, row) => sum + row.premium, 0);
    const discount = subtotal * discountPct / 100;
    const net = subtotal - discount, gst = net * .18;
    return { rows, contents, subtotal, discountPct, discount, net, gst, grand: Math.round(net + gst), warnings };
  }
  window.OICL_NATIVE_PRODUCTS = { wcQuote, carQuote, cpmQuote, papsQuote, packageQuote };

  /* ------------------------------- UI ---------------------------------- */
  const selectOptions = list => list.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
  const result = (title, rows, total, warnings) => `<div class="native-result" role="status"><b>${esc(title)}</b>${rows.map(row => `<div><span>${row[0]}${row[2] && row[1] ? `<small>${row[1]}</small>` : ''}</span><strong>${row[2] || row[1] || ''}</strong></div>`).join('')}<div class="native-grand"><span>Total payable</span><strong>${total}</strong></div>${warnings && warnings.length ? `<p class="native-warning">⚠ ${warnings.map(esc).join('<br>⚠ ')}</p>` : ''}</div>`;
  const calcButton = label => `<button class="btn-primary native-calc" type="button">${esc(label)}</button><div class="native-output" aria-live="polite"></div><div class="btn-row no-print native-pdf-row" hidden><button class="btn-secondary" type="button" data-native-pdf>⬇️ Download PDF (1-Page)</button></div>`;
  const checkbox = (id, label, on) => `<label class="native-check"><input id="${id}" type="checkbox"${on ? ' checked' : ''}> ${label}</label>`;

  function showNativeResult(out, title, rows, total, warnings, facts, filename) {
    out.innerHTML = result(title, rows, total, warnings);
    const panel = out.closest('.native-panel');
    const row = panel && panel.querySelector('.native-pdf-row');
    const button = panel && panel.querySelector('[data-native-pdf]');
    if (!row || !button) return;
    row.hidden = false;
    button.onclick = async () => {
      try {
        if (!window.OIC_PRODUCT_PDF) throw new Error('PDF module is loading. Please try again.');
        await window.OIC_PRODUCT_PDF.download({
          product: 'Extended Product', title, rows: rows.map(item => [item[0], item[1], item[2] || '']),
          total, warnings: undefined, facts: facts || [], notes: warnings || [], filename: filename || title
        }, button);
      } catch (err) {
        const message = err && err.message ? err.message : 'Unable to create the PDF.';
        if (window.proToast) window.proToast(message, 'error'); else alert(message);
      }
    };
  }

  function renderWC() {
    const occ = rates.wc.occupations.filter(x => x.rate != null).map(x => [x.code, `${x.code} — ${x.desc} (${x.rate}‰)`]);
    host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>Employees’ Compensation / WC</h3><p class="native-note">Native rating: annual earnings × occupational rate ÷ 1,000, with EC wage-cap and excess-wage rule.</p><label>Occupation rate schedule<select id="np-wc-occ">${selectOptions(occ)}</select></label><div class="native-fields"><label>Employees<input id="np-wc-emp" type="number" min="1" value="1"></label><label>Monthly wage (₹)<input id="np-wc-wage" type="number" min="1" value="15000"></label><label>From<input id="np-wc-from" type="date" value="${today}"></label><label>To<input id="np-wc-to" type="date" value="${oneYearLater}"></label><label>Rating basis<select id="np-wc-period"><option value="annual">Annual</option><option value="short">Short period scale</option><option value="prorata">Pro-rata days</option></select></label><label>Medical extension<select id="np-wc-med"><option value="0">Not selected</option>${Object.keys(rates.wc.medical).map(si => `<option value="${si}">₹${Number(si).toLocaleString('en-IN')}</option>`).join('')}</select></label><label>Basic discount %<input id="np-wc-db" type="number" min="0" max="100" value="0"></label><label>Medical discount %<input id="np-wc-dm" type="number" min="0" max="100" value="0"></label><label>Authority<select id="np-wc-office"><option>BO</option><option>KBO</option><option>RO</option></select></label></div>${checkbox('np-wc-disease','Part C occupational-disease extension (+50%)')} ${calcButton('Calculate WC Premium')}</div></div>`;
    host.querySelector('.native-calc').onclick = () => {
      const q = wcQuote({ code: val('np-wc-occ'), employees: n(val('np-wc-emp')), monthlyWage: n(val('np-wc-wage')), from: val('np-wc-from'), to: val('np-wc-to'), calcType: val('np-wc-period'), medSI: n(val('np-wc-med')), discountBasic: n(val('np-wc-db')), discountMedical: n(val('np-wc-dm')), office: val('np-wc-office'), occDisease: checked('np-wc-disease') });
      const out = host.querySelector('.native-output'); if (!q) { out.innerHTML = '<p class="native-warning">Enter an occupation, employee count and wage.</p>'; return; }
      const rows = [['Occupation rate', `${q.occ.rate}‰`, ''], ['Period', q.period.label, ''], ['Basic WC premium', '', money(q.basic)], ['Medical extension', '', money(q.medical)], ['Less discounts', '', `−${money(q.discountBasic + q.discountMedical)}`], ['GST @ 18%', '', money(q.gst)], ['Stamp duty (shown, not added)', '', money(q.stamp)]];
      showNativeResult(out, 'WC premium breakdown', rows, money(q.grand), q.warnings, [['Occupation', q.occ.desc], ['Employees', String(q.employees)], ['Monthly wage', money(q.monthlyWage)], ['Rating basis', q.period.label]], 'WC_Premium_Quotation');
    };
  }
  function renderCAR() {
    const carOptions = Object.entries(rates.car.risks).map(([code, r]) => [code, `${code} — ${r.n} | ${r.r}‰ + ${r.a}‰ / extra month`]);
    const earOptions = rates.car.earRisks.map(r => [r.c, `${r.c} — ${r.n} | base ${r.c4}‰`]);
    host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>CAR / EAR</h3><p class="native-note">Native tariff calculation. CAR uses the first-three-month base plus monthly additions; EAR uses Columns 4–7.</p><div class="native-fields"><label>Policy type<select id="np-car-mode"><option value="car">Contractors’ All Risks (CAR)</option><option value="ear">Erection All Risks (EAR / SCE)</option></select></label><label>Sum insured (₹)<input id="np-car-si" type="number" min="1" value="10000000"></label><label>Project duration (months)<input id="np-car-months" type="number" min="1" max="120" value="12"></label><label>Testing months (EAR)<input id="np-car-test" type="number" min="0" max="12" value="1"></label><label>Discount %<input id="np-car-disc" type="number" min="0" max="99.99" value="0"></label></div><label id="np-car-risk-wrap">CAR risk<select id="np-car-risk">${selectOptions(carOptions)}</select></label><label id="np-ear-risk-wrap" hidden>EAR risk<select id="np-ear-risk">${selectOptions(earOptions)}</select></label>${calcButton('Calculate CAR / EAR Premium')}</div></div>`;
    const sync = () => { const ear = val('np-car-mode') === 'ear'; $('np-car-risk-wrap').hidden = ear; $('np-ear-risk-wrap').hidden = !ear; };
    $('np-car-mode').onchange = sync;
    host.querySelector('.native-calc').onclick = () => { const ear = val('np-car-mode') === 'ear'; const q = carQuote({ mode: ear ? 'ear' : 'car', risk: val(ear ? 'np-ear-risk' : 'np-car-risk'), si: n(val('np-car-si')), months: n(val('np-car-months')), testing: n(val('np-car-test')), discount: n(val('np-car-disc')) }); const out = host.querySelector('.native-output'); if (!q) { out.innerHTML = '<p class="native-warning">Enter a sum insured and select a risk.</p>'; return; } const title = `${q.isEar ? 'EAR' : 'CAR'} premium breakdown`; const rows = [['Tariff risk', q.risk.n, ''], ['Rating method', q.detail, ''], ['Computed rate', `${q.rate.toFixed(3)}‰`, ''], ['Section I gross premium', '', money2(q.gross)], ['Less discount', '', `−${money2(q.discount)}`], ['GST @ 18%', '', money2(q.gst)]]; showNativeResult(out, title, rows, money(q.grand), [], [['Policy type', q.isEar ? 'Erection All Risks / SCE' : 'Contractors’ All Risks'], ['Sum insured', money2(q.si)], ['Policy period', `${q.months} month(s)`]], q.isEar ? 'EAR_Premium_Quotation' : 'CAR_Premium_Quotation'); };
  }
  function renderCPM() {
    const equipment = rates.cpm.equipment.map(x => [x[0], `${x[0]} — ${x[2]} (Group ${x[1]})`]);
    host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>Contractors’ Plant & Machinery</h3><p class="native-note">Native CPM schedule rating, including optional floater/underground and NATCAT extensions.</p><div class="native-fields"><label>Machinery category<select id="np-cpm-code">${selectOptions(equipment)}</select></label><label>Sum insured (₹)<input id="np-cpm-si" type="number" min="1" value="1000000"></label><label>Policy period<select id="np-cpm-months">${selectOptions([[.25,'Up to 10 days'],[1,'Up to 1 month'],[2,'Up to 2 months'],[3,'Up to 3 months'],[4,'Up to 4 months'],[6,'Up to 6 months'],[8,'Up to 8 months'],[12,'Annual']])}</select></label><label>EQ zone<select id="np-cpm-zone"><option value="1">Zone I — 0.50‰</option><option value="2">Zone II — 0.25‰</option><option value="3">Zone III — 0.10‰</option><option value="4" selected>Zone IV — 0.05‰</option></select></label><label>Discount %<input id="np-cpm-disc" type="number" min="0" max="99.99" value="0"></label></div><div class="native-checks">${checkbox('np-cpm-floater','Floater cover (+10% machinery rate)')}${checkbox('np-cpm-underground','Underground / tunnel works (+50% loading)')}${checkbox('np-cpm-stfi','STFI (0.40‰)',true)}${checkbox('np-cpm-eq','Earthquake',true)}${checkbox('np-cpm-terror','Terrorism (0.23‰)',true)}</div>${calcButton('Calculate CPM Premium')}</div></div>`;
    host.querySelector('.native-calc').onclick = () => { const q = cpmQuote({ code: val('np-cpm-code'), si:n(val('np-cpm-si')), months:n(val('np-cpm-months')), zone:val('np-cpm-zone'), discount:n(val('np-cpm-disc')), floater:checked('np-cpm-floater'), underground:checked('np-cpm-underground'), stfi:checked('np-cpm-stfi'), eq:checked('np-cpm-eq'), terror:checked('np-cpm-terror') }); const out=host.querySelector('.native-output'); if(!q){out.innerHTML='<p class="native-warning">Enter a machinery item and sum insured.</p>';return;} const rows = [['Equipment group', `${q.group} — base ${q.baseRate}%`, ''],['Basic machinery premium','',money2(q.basic)],['Floater / underground loading','',money2(q.floaterPremium+q.undergroundPremium)],['STFI / EQ / Terrorism','',money2(q.stfi+q.earthquake+q.terrorism)],['Short-period scale',`${q.shortPct}%`,''],['GST @ 18%','',money2(q.gst)]]; showNativeResult(out, 'CPM premium breakdown', rows, money(q.grand), [], [['Machinery code', q.code], ['Sum insured', money2(q.si)], ['Policy period', `${q.months} month(s)`], ['EQ zone', `Zone ${q.zone}`]], 'CPM_Premium_Quotation'); };
  }
  function renderPAPS() {
    const csi = rates.paps.csi.map(x => [x, money(x)]);
    host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>Parivaar Suraksha / Personal Accident</h3><p class="native-note">Native chart-based rating for one insured person. Add-on chart rates, risk loading, term factor and discount cap are applied below.</p><div class="native-fields"><label>Plan<select id="np-pa-plan"><option value="P">Premium</option><option value="E">Elite</option></select></label><label>Capital sum insured<select id="np-pa-csi">${selectOptions(csi)}</select></label><label>Policy term<select id="np-pa-years"><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option></select></label><label>Risk group<select id="np-pa-risk"><option value="R1">R1 — nil loading</option><option value="R2">R2 — 10% loading</option><option value="R3">R3 — 20% loading</option></select></label><label>Family members<select id="np-pa-members"><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label>NCD %<input id="np-pa-ncd" type="number" min="0" max="20" value="0"></label></div><div class="native-checks">${checkbox('np-pa-ptd','PTD Option II')}${checkbox('np-pa-med','Medical Expenses')}${checkbox('np-pa-ahc','Accident Hospital Cash')}${checkbox('np-pa-eld','Elderly Care')}${checkbox('np-pa-chf','Chauffeur Plan')}${checkbox('np-pa-pre','Pre-existing condition loading (+10%)')}${checkbox('np-pa-online','Direct online discount (+10%)')}${checkbox('np-pa-staff','Staff discount (+10%)')}</div>${calcButton('Calculate PA Premium')}</div></div>`;
    host.querySelector('.native-calc').onclick = () => { const q=papsQuote({plan:val('np-pa-plan'),csi:n(val('np-pa-csi')),years:n(val('np-pa-years')),risk:val('np-pa-risk'),familyMembers:n(val('np-pa-members')),ncd:n(val('np-pa-ncd')),ptd:checked('np-pa-ptd'),medical:checked('np-pa-med'),hospitalCash:checked('np-pa-ahc'),elderlyCare:checked('np-pa-eld'),chauffeur:checked('np-pa-chf'),preExisting:checked('np-pa-pre'),online:checked('np-pa-online'),staff:checked('np-pa-staff')}); const out=host.querySelector('.native-output'); if(!q){out.innerHTML='<p class="native-warning">Select a valid capital sum insured.</p>';return;} const rows = [['Annual chart premium','',money(q.annual)],['Term / loading',`${money(q.beforeLoad)} / ${q.loadingPct}%`,''],['Discount',`${q.discountPct}%` ,`−${money(q.discount)}`],['GST','Not charged in this PA chart','']]; showNativeResult(out, 'PA premium breakdown', rows, money(q.grand), [], [['Plan', q.plan === 'E' ? 'Elite' : 'Premium'], ['Capital sum insured', money(q.csi)], ['Policy term', `${q.years} year(s)`], ['Family members', String(q.familyMembers)]], 'PA_Parivaar_Premium_Quotation'); };
  }
  function renderPackage(kind) {
    const label = kind === 'shop' ? 'Shopkeepers’ Package' : 'Office Umbrella';
    const sections = rates[kind].sections;
    const list = sections.map(s => `<div class="native-cover"><label><input class="np-pkg-opt" data-key="${s.key}" type="checkbox"${s.compulsory === 'always' ? ' checked disabled' : ''}> <b>${s.no}</b> ${s.name}</label><span>${s.rate == null ? 'Rate selectable' : `${s.rate}‰`}</span>${s.key === 'contents' && kind === 'office' ? `<div class="native-subfields"><label>Contents a–g<input data-key="contentsAG" type="number" min="0" placeholder="₹"></label><label>Household goods<input data-key="contentsH" type="number" min="0" placeholder="₹"></label><label>Jewellery<input data-key="contentsJ" type="number" min="0" placeholder="₹"></label></div>` : `<label class="native-si">Sum insured / base (₹)<input data-key="${s.key}" type="number" min="0" placeholder="0"></label>`}${s.key === 'breakdown' ? '<label class="native-si">Section 11 rate ‰<input data-key="breakdownRate" type="number" min="0" value="2"></label>' : ''}${s.derivedOf ? '<small>Derived at 25% of office contents SI.</small>' : ''}${s.requires ? `<small>Requires ${s.requires} cover.</small>` : ''}</div>`).join('');
    host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>${label}</h3><p class="native-note">Native section-wise schedule rating: selected section SI × scheduled per-mille rate, less entered discount, plus GST.</p><div class="native-fields"><label>Premises<select id="np-pkg-owner"><option value="owner">Owned</option><option value="tenant">Tenanted</option></select></label><label>Policy discount %<input id="np-pkg-disc" type="number" min="0" max="99.99" value="0"></label></div><div class="native-cover-list">${list}</div>${calcButton(`Calculate ${label} Premium`)}</div></div>`;
    host.querySelector('.native-calc').onclick=()=>{ const selected={},values={};host.querySelectorAll('.np-pkg-opt').forEach(x=>selected[x.dataset.key]=x.checked);host.querySelectorAll('[data-key]').forEach(x=>{if(x.tagName==='INPUT'&&x.type!=='checkbox')values[x.dataset.key]=n(x.value);}); const q=packageQuote(kind,{owner:val('np-pkg-owner')==='owner',selected,values,discount:n(val('np-pkg-disc'))});const out=host.querySelector('.native-output'); if(!q.rows.length){out.innerHTML='<p class="native-warning">Enter a sum insured for at least one selected section.</p>';return;} const rows=q.rows.map(r=>[`${r.section.no} ${r.section.name} @ ${r.rate}‰`,'',money2(r.premium)]).concat([['Less policy discount','',`−${money2(q.discount)}`],['GST @ 18%','',money2(q.gst)]]);showNativeResult(out,`${label} premium breakdown`,rows,money(q.grand),q.warnings,[['Premises', val('np-pkg-owner') === 'owner' ? 'Owned' : 'Tenanted'],['Sections selected',String(q.rows.length)],['Policy discount',`${q.discountPct}%`]],kind === 'shop' ? 'Shopkeepers_Premium_Quotation' : 'Office_Umbrella_Premium_Quotation');};
  }
  function renderHealth() { host.innerHTML = `<div class="native-grid"><div class="native-panel"><h3>Health / Mediclaim</h3><p class="native-note">Health remains in this calculator’s own <b>Mediclaim</b> workspace. No public or third-party calculator is embedded here.</p><button type="button" class="btn-primary" id="np-health-open">Open native Mediclaim workspace</button></div></div>`; $('np-health-open').onclick = () => { const button = document.querySelector('[data-tab="med"]'); if (button) button.click(); }; }
  function render() { ({ wc:renderWC, car:renderCAR, cpm:renderCPM, paps:renderPAPS, shop:() => renderPackage('shop'), office:() => renderPackage('office'), health:renderHealth }[active] || renderWC)(); }
  tabs.addEventListener('click', event => { const button = event.target.closest('[data-native-product]'); if (!button) return; active = button.dataset.nativeProduct; tabs.querySelectorAll('[data-native-product]').forEach(x => { const on = x === button; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); }); render(); });
  render();
}());
