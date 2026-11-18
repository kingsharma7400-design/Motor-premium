/*
 * OICL Fire quote controller
 * Uses the Fire schedule data in fire-data.js. This implementation keeps the
 * public-source rating logic separate from the Motor calculator's rate engine.
 */
(function () {
  'use strict';

  const DATA = window.OICL_FIRE_DATA;
  if (!DATA) return;

  const GST_RATE = 18;
  const TERROR_RATE = 0.21; // IMTRIP pool rate per mille used by the referenced Fire engine.
  const STFI = {
    sookshma: {
      'non-industrial': 0.15, industrial: 0.25, 'storage-closed': 0.35,
      'storage-open': 1.50, roads: 0.35, railway: 0.35, 'td-lines': 0.35, cellular: 0.25
    },
    standard: {
      'non-industrial': 0.22, industrial: 0.37, 'storage-closed': 0.52,
      'storage-open': 2.25, roads: 0.52, railway: 0.52, 'td-lines': 0.52, cellular: 0.52
    }
  };
  const EQ = {
    'non-industrial': { 1: 0.25, 2: 0.15, 3: 0.10, 4: 0.05 },
    industrial: { 1: 0.50, 2: 0.25, 3: 0.10, 4: 0.05 },
    cellular: { 1: 0.225, 2: 0.225, 3: 0.225, 4: 0.225 }
  };
  const TIER_LABEL = {
    'non-industrial': 'Non-industrial', industrial: 'Industrial',
    'storage-closed': 'Storage warehouse — closed', 'storage-open': 'Storage — open',
    roads: 'Road / bridge / pipeline', railway: 'Railway / metro',
    'td-lines': 'Transmission & distribution', cellular: 'Cellular network'
  };
  const POLICY = {
    sookshma: { label: 'Bharat Sookshma Udyam Suraksha', short: 'NBSUS', max: 50000000 },
    laghu: { label: 'Bharat Laghu Udyam Suraksha', short: 'NBLUS', min: 50000000, max: 500000000 },
    sfsp: { label: 'SFSP / IAR', short: 'SFSP / IAR', min: 500000000 },
    bgr: { label: 'Bharat Griha Raksha', short: 'BGR' }
  };
  // Bharat Griha Raksha rates from the public reference's Griha Raksha tariff table.
  const BGR_RATES = {
    dwelling: { label: 'Dwelling — Home Building / Contents', flexa: 0.056, stfi: 0.075, eq: { 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.05 }, terror: 0.07, lor: 0.048, aa: 0.048 },
    coop: { label: 'Dwelling — Co-operative Housing Society', flexa: 0.121, stfi: 0.15, eq: { 1: 0.25, 2: 0.15, 3: 0.10, 4: 0.05 }, terror: 0.07, lor: 0.102, aa: 0.102 }
  };
  const BGR_LT = {
    flexa: [0.056, 0.109, 0.164, 0.220, 0.277, 0.335, 0.392, 0.451, 0.509, 0.556],
    stfi: [0.075, 0.155, 0.230, 0.311, 0.391, 0.477, 0.557, 0.643, 0.723, 0.804],
    eq: [0.05, 0.103, 0.153, 0.207, 0.261, 0.318, 0.371, 0.429, 0.482, 0.536],
    terror: [0.07, 0.165, 0.245, 0.332, 0.417, 0.508, 0.594, 0.686, 0.772, 0.857],
    addon: [0.048, 0.092, 0.134, 0.174, 0.211, 0.247, 0.280, 0.312, 0.341, 0.369],
    pa: [10, 20, 28, 37, 45, 52, 59, 66, 72, 78]
  };
  const BGR_SHORT = { 1: 10, 2: 19, 3: 29, 4: 38, 5: 48, 6: 58, 7: 67, 8: 77, 9: 86, 10: 100, 12: 100 };
  const ESC = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const $ = id => document.getElementById(id);
  const number = value => Math.max(0, Number.parseFloat(value) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const money = value => '₹' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const wholeMoney = value => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const pm = value => Number(value || 0).toFixed(3) + '‰';

  const normalRateIndex = {};
  Object.entries(DATA.rates.sookshma || {}).forEach(([name, rate]) => {
    normalRateIndex[name.toLowerCase()] = { name, sookshma: rate, laghu: (DATA.rates.laghu || {})[name] };
  });
  const treatyRateIndex = {};
  Object.entries(DATA.treatyRates || {}).forEach(([group, entries]) => {
    Object.entries(entries).forEach(([name, rate]) => {
      treatyRateIndex[name.toLowerCase()] = { name, rate, group };
    });
  });
  const addonState = {};
  let selectedPolicy = 'sookshma';

  function policyMode() { return selectedPolicy; }
  function isTariffMode() { return policyMode() === 'sfsp'; }
  function activeAddonSchedule() {
    return isTariffMode() ? (($('fireAddonSchedule') || {}).value || 'sfsp') : 'bsu';
  }
  function addonAvailable(addon) {
    return activeAddonSchedule() === 'bsu' ? Boolean(addon.bsu) : (addon.lists || []).includes(activeAddonSchedule());
  }
  function addonRate(addon) {
    return activeAddonSchedule() === 'bsu' && addon.bsuPct != null ? addon.bsuPct : addon.pct;
  }
  function getAddonState(key) {
    if (!addonState[key]) addonState[key] = { on: false, disc: '', value: '' };
    return addonState[key];
  }
  function getOccupancy(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const treaty = treatyRateIndex[raw.toLowerCase()];
    if (treaty) return { type: 'treaty', ...treaty };
    const normal = normalRateIndex[raw.toLowerCase()];
    if (normal) return { type: 'normal', ...normal };
    return null;
  }
  function getTier(occName) {
    const name = String(occName || '').toLowerCase();
    if (/cellular|wireless transmitting|telephone exchange/.test(name)) return 'cellular';
    if (/transmission.*distribution|t&d|t & d|distribution line/.test(name)) return 'td-lines';
    if (/railway track|metro track|loco shed/.test(name)) return 'railway';
    if (/^roads?\b|bridges?\b|pipe ?lines?|tunnel|viaduct|culvert|aerial ropeway/.test(name)) return 'roads';
    if (/^open storage|stored in open|good in open/.test(name)) return 'storage-open';
    if (/godown|silo storage|warehouse|cold storage premises|tank farm/.test(name)) return 'storage-closed';
    const code = (DATA.nicCodes || {})[occName] || (String(occName || '').match(/^(\d{4})\b/) || [])[1];
    if (code && String(code).charAt(0) === '1') return 'non-industrial';
    if (code && ['2', '3'].includes(String(code).charAt(0))) return 'industrial';
    if (/dwelling|lodging|boarding|hotel|motel|restaurant|cafe|health resort|office premises|meeting room|school|college|university|educational|research institute|hospital|clinic|shop|showroom|shopping mall|display centre|display center|cinema|theatre|theater|multiplex|auditorium|planetarium|marriage hall|mess house|club|library|museum|worship|data processing|call center|call centre|bpo|software park|software development|indoor stadium|health club|gymnasium|swimming pool|airport terminal|bus terminus|port premises|exhibition|fete|mandap|amusement park|sports galler/.test(name)) return 'non-industrial';
    return 'industrial';
  }
  function categoryFor(occName, si) {
    const code = (DATA.nicCodes || {})[occName] || (String(occName || '').match(/^(\d{4})\b/) || [])[1];
    const row = code && (DATA.nicFire || {})[code];
    // NIC schedule: Cotton Gin & Press moves to the declined-risk (D) category
    // when the location SI exceeds ₹20 Cr.
    if (code === '2063' && number(si) > 200000000) return 'D';
    return row ? row[0] : null;
  }
  function capsFor(mode, category, tier) {
    const flexa = mode === 'sookshma' ? 99.99 : 75;
    const natcat = mode === 'sookshma' ? (category === 'A' ? 50 : category === 'B' ? 25 : 0) : 0;
    const stfi = mode !== 'sookshma' && tier === 'roads'
      ? Math.max(natcat, 28.85) // Standard rate 0.52 down to the 0.37‰ road floor.
      : natcat;
    return { flexa, stfi, eq: natcat };
  }
  function addonLimit(addon, si, override) {
    if (addon.tariff) return 0;
    if (override > 0) return override;
    let value = addon.limitPct ? si * addon.limitPct / 100 : 0;
    if (addon.limitCap) value = value ? Math.min(value, addon.limitCap) : addon.limitCap;
    return Math.round(value);
  }
  function recommendedPolicy(si) {
    if (!si || si <= 50000000) return 'sookshma';
    if (si <= 500000000) return 'laghu';
    return 'sfsp';
  }
  function bgrLongTermRate(kind, annual, years) {
    const table = BGR_LT[kind];
    const y = clamp(Math.round(number(years) || 1), 1, 10);
    return annual * (table[y - 1] / table[0]);
  }
  function calculateBgrQuote(input) {
    const si = number(input.si);
    if (!si) throw new Error('Enter a Total Sum Insured greater than zero.');
    const occ = BGR_RATES[input.bgrOcc] || BGR_RATES.dwelling;
    const years = clamp(Math.round(number(input.bgrYears) || 1), 1, 10);
    const zone = [1, 2, 3, 4].includes(Number(input.bgrZone)) ? Number(input.bgrZone) : 4;
    const months = clamp(Math.round(number(input.bgrMonths) || 12), 1, 12);
    const rates = {
      flexa: bgrLongTermRate('flexa', occ.flexa, years), stfi: bgrLongTermRate('stfi', occ.stfi, years),
      eq: bgrLongTermRate('eq', occ.eq[zone] || occ.eq[4], years),
      terror: input.bgrTerrorOn ? bgrLongTermRate('terror', occ.terror, years) : 0,
      lor: bgrLongTermRate('addon', occ.lor, years), aa: bgrLongTermRate('addon', occ.aa, years), pa: BGR_LT.pa[years - 1]
    };
    const premium = {
      flexa: si * rates.flexa / 1000, stfi: si * rates.stfi / 1000, eq: si * rates.eq / 1000, terror: si * rates.terror / 1000,
      lor: number(input.bgrLor) * rates.lor / 1000, aa: number(input.bgrAa) * rates.aa / 1000, pa: Math.round(number(input.bgrPa)) * rates.pa
    };
    const discount = premium.flexa * clamp(number(input.bgrDiscount), 0, 100) / 100;
    const loading = premium.flexa * number(input.bgrLoading) / 100;
    const subtotal = Object.values(premium).reduce((sum, value) => sum + value, 0);
    const beforeShort = subtotal - discount + loading;
    const shortPct = years === 1 && months < 12 ? (BGR_SHORT[months] || 100) : 100;
    const netPremium = beforeShort * shortPct / 100;
    const gst = netPremium * GST_RATE / 100;
    return { bgr: true, si, occ, years, zone, months, rates, premium, discount, loading, shortPct, netPremium, gst, total: netPremium + gst };
  }

  /**
   * Pure calculator used by the UI and the regression tests. Rates are all per mille.
   */
  function calculateQuote(input) {
    if (input.policy === 'bgr') return calculateBgrQuote(input);
    const si = number(input.si);
    const occupancy = getOccupancy(input.occupancy);
    if (!si) throw new Error('Enter a Total Sum Insured greater than zero.');
    if (!occupancy) throw new Error('Choose an occupancy from the Fire rate schedule.');

    const mode = input.policy || 'sookshma';
    const tier = getTier(occupancy.name);
    const category = categoryFor(occupancy.name, si);
    const caps = capsFor(mode, category, tier);
    const isTreaty = occupancy.type === 'treaty';
    const baseRate = isTreaty
      ? occupancy.rate
      : (mode === 'sookshma' ? occupancy.sookshma : occupancy.laghu);
    if (!(baseRate >= 0)) throw new Error('No approved rate was found for this policy mode and occupancy.');

    const flexaInput = clamp(number(input.flexaDiscount), 0, 100);
    const flexaDiscount = isTreaty ? 0 : Math.min(caps.flexa, flexaInput);
    const stfiInput = clamp(number(input.stfiDiscount), 0, 100);
    const eqInput = clamp(number(input.eqDiscount), 0, 100);
    const stfiDiscount = Math.min(caps.stfi, stfiInput);
    const eqDiscount = Math.min(caps.eq, eqInput);
    const yearCount = Math.max(1, Math.round(number(input.period) || 1));
    const zone = [1, 2, 3, 4].includes(Number(input.eqZone)) ? Number(input.eqZone) : 4;

    const flexaGross = si / 1000 * baseRate;
    const flexaNet = flexaGross * (1 - flexaDiscount / 100);
    const stfiRate = (mode === 'sookshma' ? STFI.sookshma : STFI.standard)[tier] || STFI.standard.industrial;
    const stfiOn = Boolean(input.stfiOn);
    const stfiGross = stfiOn ? si / 1000 * stfiRate : 0;
    const stfiNet = stfiGross * (1 - stfiDiscount / 100);
    const eqOn = Boolean(input.eqOn);
    const eqTrack = tier === 'non-industrial' ? 'non-industrial' : tier === 'cellular' ? 'cellular' : 'industrial';
    const eqRate = EQ[eqTrack][zone];
    const eqGross = eqOn ? si / 1000 * eqRate : 0;
    const eqNet = eqGross * (1 - eqDiscount / 100);
    const terrorOn = Boolean(input.terrorOn);
    const terrorGross = terrorOn ? si / 1000 * TERROR_RATE : 0;
    const terrorNet = terrorGross;

    const schedule = input.addonSchedule || (mode === 'sfsp' ? 'sfsp' : 'bsu');
    const manualLimit = number(input.addonLimit);
    const standardAddonDisc = clamp(number(input.addonDiscount), 0, 100);
    const requestedAddons = input.addons || {};
    const addons = [];
    (DATA.addons || []).forEach(addon => {
      const allowed = schedule === 'bsu' ? Boolean(addon.bsu) : (addon.lists || []).includes(schedule);
      const state = requestedAddons[addon.key];
      if (!allowed || !state || !state.on) return;
      const pct = schedule === 'bsu' && addon.bsuPct != null ? addon.bsuPct : addon.pct;
      const limit = addonLimit(addon, si, manualLimit);
      const declaredValue = number(state.value);
      const onOwnValue = addon.base === 'limit';
      const requiresValue = Boolean(addon.declare);
      if (requiresValue && declaredValue <= 0) {
        addons.push({ ...addon, pct, limit, pending: true, free: Boolean(addon.free), gross: 0, net: 0, discount: 0 });
        return;
      }
      const rateBase = onOwnValue ? (declaredValue || limit) : si;
      const gross = addon.free ? 0 : Math.round(flexaGross * (onOwnValue ? rateBase / si : 1) * pct / 100);
      const ownDiscEntered = String(state.disc == null ? '' : state.disc).trim() !== '';
      const discount = addon.free ? 0 : (ownDiscEntered ? clamp(number(state.disc), 0, 100) : standardAddonDisc);
      const net = Math.round(gross * (1 - discount / 100));
      addons.push({ ...addon, pct, limit, declaredValue, onOwnValue, pending: false, free: Boolean(addon.free), gross, net, discount });
    });
    const addonGross = addons.reduce((total, addon) => total + addon.gross, 0);
    const addonNet = addons.reduce((total, addon) => total + addon.net, 0);
    const annualNet = flexaNet + stfiNet + eqNet + terrorNet + addonNet;
    const netPremium = annualNet * yearCount;
    const gst = netPremium * GST_RATE / 100;
    const total = netPremium + gst;

    return {
      si, mode, occupancy, tier, category, caps, isTreaty, baseRate,
      flexaInput, flexaDiscount, flexaGross, flexaNet,
      stfiOn, stfiRate, stfiInput, stfiDiscount, stfiGross, stfiNet,
      eqOn, eqRate, zone, eqInput, eqDiscount, eqGross, eqNet,
      terrorOn, terrorRate: TERROR_RATE, terrorGross, terrorNet,
      schedule, addons, addonGross, addonNet, addonRatio: flexaGross ? addonGross / flexaGross * 100 : 0,
      period: yearCount, annualNet, netPremium, gst, total,
      recommended: recommendedPolicy(si),
      discountMessages: {
        flexa: !isTreaty && flexaInput > flexaDiscount,
        stfi: stfiOn && stfiInput > stfiDiscount,
        eq: eqOn && eqInput > eqDiscount
      }
    };
  }

  function setPolicy(mode) {
    selectedPolicy = POLICY[mode] ? mode : 'sookshma';
    const isBgr = selectedPolicy === 'bgr';
    document.querySelectorAll('[data-fire-policy]').forEach(button => {
      const active = button.dataset.firePolicy === selectedPolicy;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const scheduleWrap = $('fireAddonScheduleWrap');
    if (scheduleWrap) scheduleWrap.hidden = !isTariffMode();
    const commercialDetails = $('fireCommercialDetails'); if (commercialDetails) commercialDetails.hidden = isBgr;
    const rateStatus = $('fireOccupancyStatus'); if (rateStatus) rateStatus.hidden = isBgr;
    const commercialCover = $('fireCommercialCoverSection'); if (commercialCover) commercialCover.hidden = isBgr;
    const addonsSection = $('fireAddonsSection'); if (addonsSection) addonsSection.hidden = isBgr;
    const bgrDetails = $('fireBgrDetails'); if (bgrDetails) bgrDetails.hidden = !isBgr;
    const calculateButton = $('fireCalcBtn'); if (calculateButton) calculateButton.textContent = isBgr ? '⚡ Calculate Bharat Griha Raksha Premium' : '⚡ Calculate Fire Premium';
    if (!isBgr) { renderOccupancyStatus(); renderAddons(); }
    updatePolicyHint();
  }
  function renderOccupancyList() {
    const list = $('fireOccupancyList');
    if (!list) return;
    const normal = Object.keys(normalRateIndex).map(key => normalRateIndex[key]).sort((a, b) => a.name.localeCompare(b.name));
    const treaty = Object.keys(treatyRateIndex).map(key => treatyRateIndex[key]).sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML = normal.map(item => `<option value="${ESC(item.name)}" label="Sookshma ${pm(item.sookshma)} · Laghu/SFSP ${pm(item.laghu)}"></option>`).join('') +
      treaty.map(item => `<option value="${ESC(item.name)}" label="Treaty ${pm(item.rate)} · ${ESC(item.group)}"></option>`).join('');
  }
  function renderOccupancyStatus() {
    const input = $('fireOccupancy');
    const box = $('fireOccupancyStatus');
    if (!input || !box) return;
    const occ = getOccupancy(input.value);
    if (!occ) {
      box.className = 'fire-rate-status warn';
      box.innerHTML = 'Select a listed occupancy to load the approved Fire rate.';
      return;
    }
    const rate = occ.type === 'treaty' ? occ.rate : (selectedPolicy === 'sookshma' ? occ.sookshma : occ.laghu);
    const tier = getTier(occ.name);
    const category = categoryFor(occ.name, number(($('fireSumInsured') || {}).value)) || 'not mapped';
    box.className = 'fire-rate-status' + (occ.type === 'treaty' ? ' treaty' : '');
    box.innerHTML = `<strong>${pm(rate)}</strong> FLEXA rate · ${ESC(TIER_LABEL[tier])} · Category ${ESC(category)}${occ.type === 'treaty' ? ` · <b>Treaty: ${ESC(occ.group)}</b> — Flexa discount is locked at 0%` : ''}`;
  }
  function updatePolicyHint() {
    const box = $('firePolicyHint');
    const si = number(($('fireSumInsured') || {}).value);
    if (!box) return;
    if (selectedPolicy === 'bgr') {
      box.className = 'fire-policy-hint';
      box.innerHTML = '<b>Bharat Griha Raksha (BGR)</b> — home building / contents rates, long-term rates and short-period scale are applied separately from the commercial Fire schedules.';
      return;
    }
    const recommendation = recommendedPolicy(si);
    const current = POLICY[selectedPolicy];
    const recommended = POLICY[recommendation];
    let ranges = selectedPolicy === 'sookshma' ? 'SI up to ₹5 Cr' : selectedPolicy === 'laghu' ? 'SI above ₹5 Cr and up to ₹50 Cr' : 'SI above ₹50 Cr';
    box.className = 'fire-policy-hint' + (si && recommendation !== selectedPolicy ? ' warn' : '');
    box.innerHTML = `Selected: <b>${ESC(current.short)}</b> (${ranges}).${si && recommendation !== selectedPolicy ? ` Based on this SI, <b>${ESC(recommended.short)}</b> is the matching product band — confirm underwriting before quoting.` : ''}`;
  }
  function renderAddons() {
    const host = $('fireAddonRows');
    if (!host) return;
    const schedule = activeAddonSchedule();
    const rows = (DATA.addons || []).filter(addon => schedule === 'bsu' ? Boolean(addon.bsu) : (addon.lists || []).includes(schedule));
    const state = addon => getAddonState(addon.key);
    const render = addon => {
      const s = state(addon);
      const pct = addonRate(addon);
      const rate = addon.free ? 'Free of premium' : (pct === 100 ? '100% of policy rate' : `${pct}% of policy rate`);
      const limit = addon.tariff ? 'Tariff extension' : (addon.limit || 'No separate loss limit');
      const valueBox = s.on && addon.base === 'limit'
        ? `<div class="fire-addon-value"><label>${ESC(addon.short)} value insured${addon.declare ? ' <em>required</em>' : ' <span>(blank uses schedule limit)</span>'}</label><input type="number" min="0" inputmode="decimal" data-addon-value="${ESC(addon.key)}" value="${ESC(s.value)}" placeholder="${addon.declare ? 'Enter declared value' : 'Schedule limit'}"></div>`
        : '';
      return `<div class="fire-addon ${s.on ? 'selected' : ''}" data-key="${ESC(addon.key)}">
        <label class="fire-addon-main"><input type="checkbox" data-addon-toggle="${ESC(addon.key)}" ${s.on ? 'checked' : ''}><span><b>${ESC(addon.name)}</b><small>${ESC(rate)} · ${ESC(limit)}${addon.free ? ' · RO authority' : ''}</small></span></label>
        ${addon.free ? '' : `<label class="fire-addon-disc">Discount %<input type="number" min="0" max="100" step="0.1" inputmode="decimal" data-addon-disc="${ESC(addon.key)}" value="${ESC(s.disc)}" placeholder="Global"></label>`}
        ${valueBox}
      </div>`;
    };
    const rated = rows.filter(row => !row.free);
    const free = rows.filter(row => row.free);
    host.innerHTML = `<div class="fire-addon-head"><span>${schedule === 'bsu' ? 'Bharat Sookshma / Laghu add-ons' : `${schedule.toUpperCase()} revised add-on schedule`}</span><span>${rated.filter(addon => state(addon).on).length} selected</span></div>` +
      rated.map(render).join('') + (free.length ? `<div class="fire-addon-free-title">Granted free of premium — RO authority</div>${free.map(render).join('')}` : '');
  }
  function readInput() {
    const addons = {};
    Object.keys(addonState).forEach(key => { addons[key] = { ...addonState[key] }; });
    return {
      policy: selectedPolicy,
      si: ($('fireSumInsured') || {}).value,
      occupancy: ($('fireOccupancy') || {}).value,
      period: ($('firePeriod') || {}).value,
      flexaDiscount: ($('fireFlexaDiscount') || {}).value,
      stfiOn: Boolean(($('fireSTFI') || {}).checked),
      stfiDiscount: ($('fireSTFIDiscount') || {}).value,
      eqOn: Boolean(($('fireEQ') || {}).checked),
      eqZone: ($('fireEQZone') || {}).value,
      eqDiscount: ($('fireEQDiscount') || {}).value,
      terrorOn: Boolean(($('fireTerror') || {}).checked),
      addonSchedule: activeAddonSchedule(),
      addonLimit: ($('fireAddonLimit') || {}).value,
      addonDiscount: ($('fireAddonDiscount') || {}).value,
      addons,
      bgrOcc: ($('fireBGROcc') || {}).value,
      bgrYears: ($('fireBgrYears') || {}).value,
      bgrMonths: ($('fireBgrMonths') || {}).value,
      bgrZone: ($('fireBgrZone') || {}).value,
      bgrTerrorOn: Boolean(($('fireBgrTerror') || {}).checked),
      bgrDiscount: ($('fireBgrDiscount') || {}).value,
      bgrLoading: ($('fireBgrLoading') || {}).value,
      bgrLor: ($('fireBgrLor') || {}).value,
      bgrAa: ($('fireBgrAa') || {}).value,
      bgrPa: ($('fireBgrPa') || {}).value
    };
  }
  function resultLine(label, detail, amount, muted) {
    return `<div class="fire-result-line${muted ? ' muted' : ''}"><span><b>${ESC(label)}</b>${detail ? `<small>${detail}</small>` : ''}</span><strong>${money(amount)}</strong></div>`;
  }
  function renderResult(q) {
    const host = $('fireResult');
    if (!host) return;
    const capNotes = [];
    if (q.isTreaty) capNotes.push('Treaty-notified occupancy: the FLEXA discount has been set to 0%.');
    if (q.discountMessages.flexa) capNotes.push(`FLEXA discount capped at ${q.caps.flexa}%.`);
    if (q.discountMessages.stfi) capNotes.push(`STFI discount capped at ${q.caps.stfi}%.`);
    if (q.discountMessages.eq) capNotes.push(`EQ discount capped at ${q.caps.eq}%.`);
    const flexaDetail = `${pm(q.baseRate)} × ${wholeMoney(q.si)}${q.flexaDiscount ? ` · less ${q.flexaDiscount}%` : ''}`;
    let html = `<div class="fire-result-top"><div><span>Fire premium quote</span><h3>${money(q.total)}</h3><small>Incl. GST @ ${GST_RATE}% · ${POLICY[q.mode].label}</small></div><div class="fire-result-rate">${pm(q.baseRate)}<small>FLEXA rate</small></div></div>`;
    if (capNotes.length) html += `<div class="fire-result-note">${capNotes.map(ESC).join('<br>')}</div>`;
    html += `<div class="fire-result-section">${resultLine('FLEXA', flexaDetail, q.flexaNet)}</div>`;
    if (q.stfiOn) html += `<div class="fire-result-section">${resultLine('STFI', `${pm(q.stfiRate)} · ${ESC(TIER_LABEL[q.tier])}${q.stfiDiscount ? ` · less ${q.stfiDiscount}%` : ''}`, q.stfiNet)}</div>`;
    if (q.eqOn) html += `<div class="fire-result-section">${resultLine('Earthquake', `Zone ${q.zone} · ${pm(q.eqRate)}${q.eqDiscount ? ` · less ${q.eqDiscount}%` : ''}`, q.eqNet)}</div>`;
    if (q.terrorOn) html += `<div class="fire-result-section">${resultLine('Terrorism', `${pm(q.terrorRate)} IMTRIP pool rate`, q.terrorNet)}</div>`;
    if (q.addons.length) {
      html += `<div class="fire-result-section fire-addon-result"><div class="fire-result-subhead">Add-on covers</div>`;
      q.addons.forEach(addon => {
        const detail = addon.pending ? 'Awaiting declared value — not charged' : addon.free ? 'Granted free of premium' : `${addon.pct === 100 ? 'Policy rate' : addon.pct + '% of policy rate'}${addon.onOwnValue ? ` on ${wholeMoney(addon.declaredValue || addon.limit)}` : ''}${addon.discount ? ` · less ${addon.discount}%` : ''}`;
        html += resultLine(addon.short, detail, addon.net, addon.pending || addon.free);
      });
      html += resultLine('Net add-on premium', `${q.addonRatio.toFixed(1)}% of basic premium`, q.addonNet);
      html += '</div>';
    }
    if (q.period > 1) html += `<div class="fire-result-section">${resultLine(`Long-term policy · ${q.period} years`, `Annual net premium ${money(q.annualNet)}`, q.netPremium)}</div>`;
    html += `<div class="fire-result-section">${resultLine('Net premium', '', q.netPremium)}${resultLine(`GST @ ${GST_RATE}%`, '', q.gst)}<div class="fire-result-total"><span>Total premium</span><strong>${money(q.total)}</strong></div></div>`;
    html += `<p class="fire-result-foot">Indicative calculation using the extracted Fire schedule. Issue only after proposal, inspection/acceptance and current OICL underwriting approval.</p>`;
    host.innerHTML = html;
    host.hidden = false;
    const pdfRow = $('firePdfRow'); if (pdfRow) pdfRow.hidden = false;
  }
  function renderBgrResult(q) {
    const host = $('fireResult');
    if (!host) return;
    const line = (label, detail, amount) => resultLine(label, detail, amount);
    const optional = [];
    if (q.premium.terror) optional.push(line('Terrorism', `${pm(q.rates.terror)} optional extension`, q.premium.terror));
    if (q.premium.lor) optional.push(line('Loss of rent', `${pm(q.rates.lor)} on ${wholeMoney(number(($('fireBgrLor') || {}).value))}`, q.premium.lor));
    if (q.premium.aa) optional.push(line('Alternative accommodation', `${pm(q.rates.aa)} on ${wholeMoney(number(($('fireBgrAa') || {}).value))}`, q.premium.aa));
    if (q.premium.pa) optional.push(line('Personal accident', `${Math.round(number(($('fireBgrPa') || {}).value))} person(s) × ${wholeMoney(q.rates.pa)}`, q.premium.pa));
    let html = `<div class="fire-result-top"><div><span>Bharat Griha Raksha quote</span><h3>${money(q.total)}</h3><small>Incl. GST @ ${GST_RATE}% · ${q.occ.label}</small></div><div class="fire-result-rate">${pm(q.rates.flexa)}<small>FLEXA rate</small></div></div>`;
    html += `<div class="fire-result-section">${line('FLEXA', `${pm(q.rates.flexa)} × ${wholeMoney(q.si)}`, q.premium.flexa)}${q.discount ? line('FLEXA discount', '', -q.discount) : ''}${q.loading ? line('FLEXA loading', '', q.loading) : ''}${line('STFI', pm(q.rates.stfi), q.premium.stfi)}${line('Earthquake', q.occ === BGR_RATES.coop ? `Zone ${q.zone} · ${pm(q.rates.eq)}` : pm(q.rates.eq), q.premium.eq)}</div>`;
    if (optional.length) html += `<div class="fire-result-section"><div class="fire-result-subhead">Optional covers</div>${optional.join('')}</div>`;
    if (q.shortPct < 100) html += `<div class="fire-result-section">${line('Short-period scale', `${q.shortPct}% of annual premium`, q.netPremium)}</div>`;
    html += `<div class="fire-result-section">${line('Net premium', `${q.years}-year policy`, q.netPremium)}${line(`GST @ ${GST_RATE}%`, '', q.gst)}<div class="fire-result-total"><span>Total premium</span><strong>${money(q.total)}</strong></div></div>`;
    html += `<p class="fire-result-foot">Indicative Bharat Griha Raksha calculation. The policy wording, current tariff and OICL underwriting acceptance prevail.</p>`;
    host.innerHTML = html;
    host.hidden = false;
    const pdfRow = $('firePdfRow'); if (pdfRow) pdfRow.hidden = false;
  }

  function firePDFPayload(q) {
    const rows = [];
    const facts = [];
    const notes = [];
    if (q.bgr) {
      facts.push(['Product', POLICY.bgr.label], ['Home occupancy', q.occ.label], ['Total sum insured', wholeMoney(q.si)], ['Policy term', `${q.years} year${q.years === 1 ? '' : 's'}`]);
      rows.push(['FLEXA', `${pm(q.rates.flexa)} × ${wholeMoney(q.si)}`, money(q.premium.flexa)]);
      if (q.discount) rows.push(['Less FLEXA discount', '', '−' + money(q.discount)]);
      if (q.loading) rows.push(['FLEXA loading', '', money(q.loading)]);
      rows.push(['STFI', pm(q.rates.stfi), money(q.premium.stfi)]);
      rows.push(['Earthquake', q.occ === BGR_RATES.coop ? `Zone ${q.zone} · ${pm(q.rates.eq)}` : pm(q.rates.eq), money(q.premium.eq)]);
      if (q.premium.terror) rows.push(['Terrorism', `${pm(q.rates.terror)} optional extension`, money(q.premium.terror)]);
      if (q.premium.lor) rows.push(['Loss of rent', pm(q.rates.lor), money(q.premium.lor)]);
      if (q.premium.aa) rows.push(['Alternative accommodation', pm(q.rates.aa), money(q.premium.aa)]);
      if (q.premium.pa) rows.push(['Personal accident', `${Math.round(number(($('fireBgrPa') || {}).value))} person(s)`, money(q.premium.pa)]);
      if (q.shortPct < 100) rows.push(['Short-period scale', `${q.shortPct}% of annual premium`, money(q.netPremium)]);
      rows.push(['Net premium', `${q.years}-year policy`, money(q.netPremium)], [`GST @ ${GST_RATE}%`, '', money(q.gst)]);
      notes.push('Indicative Bharat Griha Raksha calculation. The policy wording and current OICL underwriting acceptance prevail.');
      return { product: 'Fire Insurance', title: 'Bharat Griha Raksha Premium', facts, rows, total: money(q.total), notes, filename: 'Fire_Bharat_Griha_Raksha' };
    }

    facts.push(['Product', POLICY[q.mode].label], ['Occupancy', q.occupancy.name], ['Total sum insured', wholeMoney(q.si)], ['Policy period', `${q.period} year${q.period === 1 ? '' : 's'}`]);
    rows.push(['FLEXA', `${pm(q.baseRate)} × ${wholeMoney(q.si)}${q.flexaDiscount ? ` · less ${q.flexaDiscount}%` : ''}`, money(q.flexaNet)]);
    if (q.stfiOn) rows.push(['STFI', `${pm(q.stfiRate)} · ${TIER_LABEL[q.tier]}${q.stfiDiscount ? ` · less ${q.stfiDiscount}%` : ''}`, money(q.stfiNet)]);
    if (q.eqOn) rows.push(['Earthquake', `Zone ${q.zone} · ${pm(q.eqRate)}${q.eqDiscount ? ` · less ${q.eqDiscount}%` : ''}`, money(q.eqNet)]);
    if (q.terrorOn) rows.push(['Terrorism', `${pm(q.terrorRate)} IMTRIP pool rate`, money(q.terrorNet)]);
    q.addons.forEach(addon => rows.push([addon.short, addon.pending ? 'Awaiting declared value — not charged' : (addon.free ? 'Granted free of premium' : `${addon.pct === 100 ? 'Policy rate' : addon.pct + '% of policy rate'}${addon.discount ? ` · less ${addon.discount}%` : ''}`), money(addon.net)]));
    if (q.addons.length) rows.push(['Net add-on premium', `${q.addonRatio.toFixed(1)}% of basic premium`, money(q.addonNet)]);
    if (q.period > 1) rows.push(['Long-term policy', `Annual net premium ${money(q.annualNet)}`, money(q.netPremium)]);
    rows.push(['Net premium', '', money(q.netPremium)], [`GST @ ${GST_RATE}%`, '', money(q.gst)]);
    if (q.isTreaty) notes.push('Treaty-notified occupancy: FLEXA discount is set to 0%.');
    if (q.discountMessages.flexa) notes.push(`FLEXA discount entered above the permitted cap; ${q.caps.flexa}% is applied.`);
    if (q.discountMessages.stfi) notes.push(`STFI discount entered above the permitted cap; ${q.caps.stfi}% is applied.`);
    if (q.discountMessages.eq) notes.push(`Earthquake discount entered above the permitted cap; ${q.caps.eq}% is applied.`);
    notes.push('Indicative calculation using the extracted Fire schedule. Issue only after proposal, inspection, acceptance and current OICL underwriting approval.');
    return { product: 'Fire Insurance', title: 'Fire Premium Quotation', facts, rows, total: money(q.total), notes, filename: `Fire_${POLICY[q.mode].short}` };
  }

  async function downloadFirePDF(button) {
    const q = window.OICL_LAST_FIRE_QUOTE;
    if (!q) throw new Error('Calculate the Fire premium first.');
    if (!window.OIC_PRODUCT_PDF) throw new Error('PDF module is loading. Please try again.');
    return window.OIC_PRODUCT_PDF.download(firePDFPayload(q), button);
  }

  function calculateAndRender() {
    const error = $('fireError');
    try {
      const q = calculateQuote(readInput());
      if (error) { error.hidden = true; error.textContent = ''; }
      if (q.bgr) renderBgrResult(q); else renderResult(q);
      window.OICL_LAST_FIRE_QUOTE = q;
    } catch (err) {
      if (error) { error.textContent = err.message || 'Unable to calculate the Fire quote.'; error.hidden = false; }
      const host = $('fireResult');
      if (host) host.hidden = true;
      const pdfRow = $('firePdfRow'); if (pdfRow) pdfRow.hidden = true;
    }
  }
  function attachEvents() {
    document.querySelectorAll('[data-fire-policy]').forEach(button => button.addEventListener('click', () => setPolicy(button.dataset.firePolicy)));
    const occ = $('fireOccupancy');
    if (occ) ['input', 'change'].forEach(event => occ.addEventListener(event, renderOccupancyStatus));
    const si = $('fireSumInsured');
    if (si) ['input', 'change'].forEach(event => si.addEventListener(event, updatePolicyHint));
    const schedule = $('fireAddonSchedule');
    if (schedule) schedule.addEventListener('change', renderAddons);
    const addonHost = $('fireAddonRows');
    if (addonHost) {
      addonHost.addEventListener('change', event => {
        const target = event.target;
        if (target.matches('[data-addon-toggle]')) {
          getAddonState(target.dataset.addonToggle).on = target.checked;
          renderAddons();
        }
      });
      addonHost.addEventListener('input', event => {
        const target = event.target;
        if (target.matches('[data-addon-disc]')) getAddonState(target.dataset.addonDisc).disc = target.value;
        if (target.matches('[data-addon-value]')) getAddonState(target.dataset.addonValue).value = target.value;
      });
    }
    const calculateButton = $('fireCalcBtn');
    if (calculateButton) calculateButton.addEventListener('click', calculateAndRender);
    const pdfButton = $('firePdfBtn');
    if (pdfButton) pdfButton.addEventListener('click', async () => {
      try {
        await downloadFirePDF(pdfButton);
      } catch (err) {
        const message = err && err.message ? err.message : 'Unable to create the Fire PDF.';
        if (window.proToast) window.proToast(message, 'error'); else alert(message);
      }
    });
  }
  function init() {
    if (!$('tab-fire')) return;
    renderOccupancyList();
    const occ = $('fireOccupancy');
    if (occ && !occ.value) occ.value = 'Office Premises/Meeting Rooms';
    attachEvents();
    setPolicy('sookshma');
  }

  window.OICL_FIRE = { calculateQuote, calculateBgrQuote, getOccupancy, getTier, categoryFor, setPolicy, calculateAndRender, firePDFPayload, downloadFirePDF };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
