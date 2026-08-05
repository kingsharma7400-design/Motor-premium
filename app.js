/* =========================================================
   Motor Premium Calculator Pro V 27.0  ·  Main Application
   Built per "Revised MOTOR TARIFF wef_01.06.22_NEW.pdf"
   DATE FORMAT FIX: DD-MM-YYYY — FULL INDIAN STANDARD
   Commission w.e.f. 01.07.2026 (CIRCULAR-8811)
   Class D Age Brackets w.e.f. 01.07.2026: 1-5yr | 5-7yr | 7+ yrs
   ========================================================= */

(function () {
  'use strict';

  /* ============================================================
     1.  Utility helpers + DATE UTILITIES (DD-MM-YYYY)
     ============================================================ */
  const $  = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);
  const fmt = (n) => {
    if (Math.abs(n - Math.round(n)) < 0.005) return '₹ ' + Math.round(n).toLocaleString('en-IN');
    return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  /* Parse number from input; strips ₹, commas, spaces (e.g. 23,00,000) */
  const num = (id) => {
    const el = $(id);
    if (!el) return 0;
    let v = String(el.value == null ? '' : el.value).trim();
    if (!v) return 0;
    v = v.replace(/₹/g, '').replace(/,/g, '').replace(/\s/g, '');
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  /* ===== DATE FORMAT DD-MM-YYYY — START ===== */
  function pad2(n){ return String(n).padStart(2,'0'); }

  // Format any Date / date-string → "DD-MM-YYYY"
  function formatDateDDMMYYYY(input){
    if(!input) return '';
    const d = safeParseDate(input);
    if(!d || isNaN(d)) return '';
    return pad2(d.getDate()) + '-' + pad2(d.getMonth()+1) + '-' + d.getFullYear();
  }

  // Parse DD-MM-YYYY | DD/MM/YYYY | YYYY-MM-DD → Date object
  function safeParseDate(str){
    if(!str) return null;
    if(str instanceof Date) return str;
    str = String(str).trim();
    // YYYY-MM-DD
    if(/^\d{4}-\d{2}-\d{2}$/.test(str)){
      const [y,m,da] = str.split('-').map(Number);
      const dt = new Date(y, m-1, da);
      return isNaN(dt) ? null : dt;
    }
    // DD-MM-YYYY
    let m = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if(m){
      const dd = +m[1], mm = +m[2], yy = +m[3];
      const dt = new Date(yy, mm-1, dd);
      // validate rollover (e.g. 31-02)
      if(dt.getFullYear()===yy && dt.getMonth()===mm-1 && dt.getDate()===dd) return dt;
      return null;
    }
    // DD/MM/YYYY
    m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m){
      const dd = +m[1], mm = +m[2], yy = +m[3];
      const dt = new Date(yy, mm-1, dd);
      if(dt.getFullYear()===yy && dt.getMonth()===mm-1 && dt.getDate()===dd) return dt;
      return null;
    }
    // fallback native
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
  }

  function isValidDDMMYYYY(s){
    return !!safeParseDate(s);
  }

  // Convert any accepted format → DD-MM-YYYY string
  function toDDMMYYYY(s){
    return formatDateDDMMYYYY(s);
  }

  // Add N years to a DD-MM-YYYY date, return DD-MM-YYYY
  function addYearsDDMMYYYY(dateStr, years){
    const d = safeParseDate(dateStr);
    if(!d) return '';
    const e = new Date(d);
    e.setFullYear(e.getFullYear() + years);
    e.setDate(e.getDate() - 1); // policy end = start + years - 1 day
    return formatDateDDMMYYYY(e);
  }

  // today in DD-MM-YYYY
  function todayDDMMYYYY(){
    return formatDateDDMMYYYY(new Date());
  }
  /* ===== DATE FORMAT DD-MM-YYYY — END ===== */

  function calcAge(policyDateStr, dorStr) {
    const p = safeParseDate(policyDateStr);
    const d = safeParseDate(dorStr);
    if (!p || !d || isNaN(p) || isNaN(d)) return 0;
    const diff = (p - d) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, diff);
  }

  function bracketRate(slabs, value) {
    if (!slabs) return { rate: 0, age5: 0, age10: 0, age10plus: 0 };
    for (const s of slabs) {
      if (value <= s.max) return s;
    }
    return slabs[slabs.length - 1];
  }

  function depreciationFactor(ageYears) {
    for (const s of DEPRECIATION_TABLE) {
      if (ageYears <= s.max) return s.factor;
    }
    return 0.50;
  }

  const round = (n) => Math.round(n);

  function getAgeBasedODRate(slab) {
    /* Returns rate based on vehicle age (≤5, 5-10, >10 years) */
    if (!slab) return 0;
    if (slab.age5 !== undefined && slab.age10 !== undefined && slab.age10plus !== undefined) {
      /* Older structure */
      return { age5: slab.age5, age7: slab.age7, age7plus: slab.age7plus, age10: slab.age10, age10plus: slab.age10plus };
    }
    return slab;
  }

  function pickODRate(zonedSlabs, age, ccValue) {
    if (!zonedSlabs) return 0;
    const slab = bracketRate(zonedSlabs, ccValue);
    if (!slab) return 0;
    /* Age band logic:
       - ≤5 years: use age5
       - 5-7 years: use age7 if exists (Taxi/Commercial), else fall back to age10 (Pvt Car/EV)
       - 7-10 years: use age7plus if exists, else age10
       - >10 years: use age10plus */
    if (age <= 5) return slab.age5 || slab.rate || 0;
    if (age <= 7) return slab.age7 || slab.age10 || slab.age5 || slab.rate || 0;
    if (age <= 10) return slab.age7plus || slab.age10 || slab.rate || 0;
    return slab.age10plus || slab.age7plus || slab.age10 || slab.rate || 0;
  }

  /* RTI rate lookup — age-wise & vehicle-type-wise from RTI_RATES
     Rule: once age crosses 2 years, pick 3rd-year/second-renewal rate.
     Since no separate 4th-year RTI rate is provided, the second-renewal rate continues for >3 years. */
  function getRTIRate(vehicleType, ageYears) {
    /* TAXI: New 0.45, 1st renewal (2nd yr) 0.55, 2nd renewal (3rd yr) 0.70 — NOT available above 3 years */
    if (vehicleType === 'taxi') {
      if (ageYears > 3) return 0;              // RTI not available after 3 years
      if (ageYears <= 1) return 0.45;
      if (ageYears <= 2) return 0.55;
      return 0.70;                             // 2-3 years
    }
    let rtiCategory;
    if (['pvtCar', 'evPvtCar', 'miscD'].includes(vehicleType)) {
      rtiCategory = RTI_RATES.pvtCar;
    } else if (['twoWheeler', 'evTwoWheeler'].includes(vehicleType)) {
      rtiCategory = RTI_RATES.twoWheeler;
    } else {
      rtiCategory = RTI_RATES.commercial;
    }
    if (!rtiCategory) return 0;
    if (ageYears <= 1) return rtiCategory.new || 0;
    if (ageYears <= 2) return rtiCategory.firstRenewal || 0;
    return rtiCategory.secondRenewal || 0;
  }

  /* ============================================================
     2.  Tabs
     ============================================================ */
  $$('.nav-item').forEach((b) => {
    b.addEventListener('click', () => {
      $$('.nav-item').forEach((x) => x.classList.remove('active'));
      $$('.tab-content').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      $('tab-' + b.dataset.tab).classList.add('active');
    });
  });

  /* ============================================================
     3.  Vehicle-type aware UI updates
     ============================================================ */
  function updateCCLabel() {
    const vt = $('vehicleType').value;
    const meta = VEHICLE_META[vt] || VEHICLE_META.pvtCar;
    $('ccLabel').textContent = meta.ccHint + ' (' + meta.unit + ')';
    $('ccHint').textContent = meta.unit === 'GVW kg'
      ? 'Enter Gross Vehicle Weight in kg (e.g. 12000)'
      : meta.unit === 'Seats'
        ? 'Enter total seating capacity (incl. driver)'
        : meta.unit === 'KW'
          ? 'Enter Power in KW (e.g. 75 KW)'
          : 'Enter Cubic Capacity in CC';

    /* NOTE: CC / Seating are NO LONGER auto-filled on vehicle type change.
       User must type these values explicitly (kept blank until entered). */

    /* PCCV: CC/Seats column not required — disable it (Seating Capacity field is used instead). */
    const isPCCVtype = ['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].includes(vt);
    const ccField = $('cc');
    const ccFieldWrap = ccField ? ccField.closest('.field') : null;
    if (isPCCVtype) {
      ccField.disabled = true;
      ccField.style.opacity = '0.5';
      ccField.style.cursor = 'not-allowed';
      if (ccFieldWrap) ccFieldWrap.style.opacity = '0.55';
      $('ccHint').textContent = 'Not required for PCCV — use Seating Capacity field';
    } else {
      ccField.disabled = false;
      ccField.style.opacity = '';
      ccField.style.cursor = '';
      if (ccFieldWrap) ccFieldWrap.style.opacity = '';
    }
  }

  function updateAddOnVisibility() {
    const vt = $('vehicleType').value;
    const isClassD = (vt === 'miscD' || vt === 'ambulance');
    const isGCCV = (vt === 'gccv' || vt === 'gccv3w');
    const isTaxi = (vt === 'taxi');
    const is2W = (vt === 'twoWheeler' || vt === 'evTwoWheeler');

    // Two Wheeler: only Dep Cap (Nil Dep), RTI and Electrical Accessories enabled
    const allowedForTwoWheeler = ['nilDep', 'rti', 'elecAcc'];

    // Class D: Only these add-ons enabled - Nil Dep, RTI, CNG Kit, Overturning
    const allowedForClassD = ['nilDep', 'rti', 'cngKit', 'overturning'];

    // TAXI: Dep Cap, Consumables, Key Replacement, RTI, CNG Kit, Electrical Accessories, Tyre & Rim
    const allowedForTaxi = ['nilDep', 'consumables', 'keyRepl', 'rti', 'cngKit', 'elecAcc', 'tyreRim'];

    // GCCV: user requested Dep Cap, Consumables, CNG OD/TP, Towing,
    // Geographical Extension OD ₹400 and Geographical Extension TP ₹100 to be selectable.
    const allowedForGCCV = ['nilDep', 'consumables', 'cngKit', 'towing', 'geoExtOD', 'geoExtTP'];

    const addonIds = ['nilDep', 'engineProt', 'consumables', 'keyRepl', 'rti', 'tyreRim', 'altCar', 'batteryProt', 'emiProt', 'persBelong', 'elecAcc', 'cngKit', 'towing', 'overturning', 'geoExtOD', 'geoExtTP'];

    addonIds.forEach(id => {
      const el = $(id);
      if (!el) return;
      let allowed = true;
      if (isClassD) allowed = allowedForClassD.includes(id);
      if (isGCCV) allowed = allowedForGCCV.includes(id);
      if (isTaxi) allowed = allowedForTaxi.includes(id);
      if (is2W) allowed = allowedForTwoWheeler.includes(id);

      if (allowed) {
        el.disabled = false;
        el.parentElement.style.opacity = '1';
        el.parentElement.style.cursor = '';
      } else {
        el.disabled = true;
        el.checked = false;
        el.parentElement.style.opacity = '0.4';
        el.parentElement.style.cursor = 'not-allowed';
      }
    });

    // Visual label: for GCCV Nil Dep works as Dep Cap.
    const nilDepText = $('nilDepText');
    if (nilDepText) {
      nilDepText.textContent = 'NIL Depreciation Cover';
    }

    // Show towing SI selector only when towing is checked + GCCV
    const towingLimitField = $('towingLimitField');
    const towingCb = $('towing');
    if (towingLimitField && towingCb) {
      const showTowingLimit = isGCCV && towingCb.checked;
      towingLimitField.style.display = showTowingLimit ? '' : 'none';
    }

    // CPA Term selector (Bundle Policy — Pvt Car / 2W only)
    updateCpaTermVisibility();
  }

  /* CPA Term UI:
     Bundle + Private Car / EV Car  → 1 Year  OR  3 Year
     Bundle + Two Wheeler / EV 2W   → 1 Year  OR  5 Year
     Other policies / vehicle types → hide (CPA follows policy term) */
  function updateCpaTermVisibility() {
    const field = $('cpaTermField');
    const sel = $('cpaTerm');
    const hint = $('cpaTermHint');
    const odPa = $('odPa');
    if (!field || !sel) return;

    const vt = $('vehicleType') ? $('vehicleType').value : '';
    const policy = $('policyType') ? $('policyType').value : '';
    const isCarFamily = (vt === 'pvtCar' || vt === 'evPvtCar');
    const is2WFamily = (vt === 'twoWheeler' || vt === 'evTwoWheeler');
    const isBundle = (policy === 'bundle');
    const show = isBundle && (isCarFamily || is2WFamily) && odPa && odPa.checked;

    field.style.display = show ? '' : 'none';
    if (!show) return;

    const prev = sel.value;
    sel.innerHTML = '';
    if (isCarFamily) {
      const o1 = document.createElement('option');
      o1.value = '1';
      o1.textContent = '1 Year CPA';
      const o3 = document.createElement('option');
      o3.value = '3';
      o3.textContent = '3 Year CPA (Full Bundle Term)';
      sel.appendChild(o1);
      sel.appendChild(o3);
      if (hint) hint.textContent = 'Private Car Bundle: choose 1-Year CPA or 3-Year CPA. TP remains 3-Year.';
    } else {
      const o1 = document.createElement('option');
      o1.value = '1';
      o1.textContent = '1 Year CPA';
      const o5 = document.createElement('option');
      o5.value = '5';
      o5.textContent = '5 Year CPA (Full Bundle Term)';
      sel.appendChild(o1);
      sel.appendChild(o5);
      if (hint) hint.textContent = 'Two Wheeler Bundle: choose 1-Year CPA or 5-Year CPA. TP remains 5-Year.';
    }
    // restore previous selection if still valid, else default to full term
    const valid = Array.from(sel.options).some(o => o.value === prev);
    if (valid) {
      sel.value = prev;
    } else {
      sel.value = isCarFamily ? '3' : '5';
    }
  }

  /* Req 4: grey-out (disable) a set of fields — used for Liability-Only where
     OD Valuation & Discounts are irrelevant. */
  function setFieldsDisabled(disabled, ids) {
    ids.forEach(function (id) {
      const el = $(id);
      if (!el) return;
      el.disabled = disabled;
      const wrap = el.closest('.field');
      if (wrap) {
        wrap.style.opacity = disabled ? '0.55' : '';
        wrap.style.pointerEvents = disabled ? 'none' : '';
      }
      el.style.opacity = disabled ? '0.6' : '';
    });
  }

  function updatePolicySections() {
    const policy = $('policyType').value;
    const vt = $('vehicleType').value;
    const meta = POLICY_META[policy] || { includesOD: true, includesTP: true, allowMultiYear: true, label: '' };
    const vehMeta = VEHICLE_META[vt] || VEHICLE_META.pvtCar;

    /* Req: NIL Dep Discount max — 40% for Pvt Car / 2W, 20% for all other vehicles */
    const isPvtCarFamily = ['pvtCar', 'evPvtCar'].includes(vt);
    const is2WLike = ['twoWheeler', 'evTwoWheeler'].includes(vt);
    const ndEl = $('ndDiscount');
    if (ndEl) {
      const ndMax = (isPvtCarFamily || is2WLike) ? 40 : 20;
      ndEl.max = ndMax;
      if (Number(ndEl.value) > ndMax) ndEl.value = ndMax;
    }

    $('odAddonsSection').style.display = meta.includesOD ? '' : 'none';
    $('tpSection').style.display = meta.includesTP ? '' : 'none';

    // Req 4: disable Valuation + Discounts when OD is NOT included (Liability Only).
    // NOTE: 'addOnDiscount' is intentionally excluded — it is permanently fixed at 0 (disabled in HTML).
    setFieldsDisabled(!meta.includesOD,
      ['invoice','idv','idvNonElec','idvElec','ncb','uwDiscount','antiTheft','ndDiscount','ndRenDiscount']);

    // --- GCCV GST (split applied in calc; no on-screen detail per request) ---
    const gstInput = $('gst');
    if (gstInput && vt === 'gccv' && !gstInput.value) {
      gstInput.value = 18;
    }

    /* Term selector */
    // Hide policy term field - term is auto-determined based on policy type and vehicle
    const termField = $('policyTermField');
    const termSelect = $('policyTerm');
    if (termField) {
      termField.style.display = 'none';
    }
    if (termSelect) {
      termSelect.disabled = true;
      termSelect.style.opacity = '0.5';
    }

    // Auto enable/disable OD add-ons based on vehicle type
    updateAddOnVisibility();

    // GCCV Extra GVW Loading section toggle
    const gccvSec = $('gccvGvwSection');
    if (gccvSec) {
      gccvSec.style.display = (vt === 'gccv') ? '' : 'none';
    }
    // Live preview update
    updateGccvPreview();
  }

  function updateGccvPreview() {
    const preview = $('gccvGvwPreview');
    if (!preview) return;
    const vt = $('vehicleType') ? $('vehicleType').value : '';
    if (vt !== 'gccv') {
      preview.textContent = '— Select GCCV —';
      preview.style.color = 'var(--text-3)';
      return;
    }
    const gvw = num('cc') || 0;
    const thresholdEl = $('gccvGvwThreshold');
    const rateEl = $('gccvGvwRate');
    const enabledEl = $('gccvGvwLoading');
    const threshold = thresholdEl ? (Number(thresholdEl.value) || 12000) : 12000;
    const rate = rateEl ? (Number(rateEl.value) || 0.27) : 0.27;
    const enabled = enabledEl ? (enabledEl.value === '1') : true;

    if (!enabled) {
      preview.textContent = 'Loading DISABLED';
      preview.style.color = '#ef4444';
      return;
    }
    if (gvw <= threshold) {
      preview.textContent = `${gvw.toLocaleString('en-IN')} kg — No loading (≤ ${threshold.toLocaleString('en-IN')} kg)`;
      preview.style.color = '#10b981';
    } else {
      const excess = gvw - threshold;
      const premium = excess * rate;
      preview.textContent = `${excess.toLocaleString('en-IN')} kg excess × ₹${rate} = ₹${premium.toLocaleString('en-IN')}`;
      preview.style.color = '#f59e0b';
    }
  }

  /* ============================================================
     4.  Auto-IDV helper — DD-MM-YYYY aware
     ============================================================ */
  $('autoIdv').addEventListener('click', () => {
    const invoice = num('invoice');
    const policyDateVal = $('policyDate').value || todayDDMMYYYY();
    const dorVal = $('dor').value;
    const age = calcAge(policyDateVal, dorVal);
    const f = depreciationFactor(age);
    const idv = Math.round(invoice * f);
    $('idv').value = idv;
  });

  /* ============================================================
     5.  Reset button
     ============================================================ */
  $('resetBtn').addEventListener('click', () => {
    if ($('parentVehicleType')) {
      $('parentVehicleType').value = '';
    }
    // Blank out the Vehicle Category dropdown too
    if ($('vehicleType')) {
      $('vehicleType').innerHTML = '<option value="" selected disabled>-- Select --</option>';
    }
    $('fuelType').value   = '';
    $('isElectric').value = '';
    $('cc').value         = '';
    $('seating').value    = '';
    $('dor').value        = '';
    $('policyDate').value = '';
    // clear date validation styles
    ['dor','policyDate'].forEach(id=>{
      const el=$(id); if(el){ el.classList.remove('is-valid','is-invalid'); }
    });
    $('policyType').value = '';
    $('policyTerm').value = '';
    $('zone').value       = '';
    if ($('state')) $('state').value = '';
    $('invoice').value    = '';
    $('idv').value        = '';
    if ($('insuredName')) $('insuredName').value = '';
    if ($('regNo')) $('regNo').value = '';
    $('idvNonElec').value = 0;
    $('idvElec').value    = 0;
    $('llCount').value    = 0;
    $('llPaid').value     = 0;
    $('gst').value        = 18;
    $('ncb').value        = '';
    $('uwDiscount').value = '';
    $('antiTheft').value  = 'No';
    $('ndDiscount').value = '';
    $('ndRenDiscount').value = 0;
    $('addOnDiscount').value = 0;
    // GCCV Extra GVW reset
    if ($('gccvGvwLoading')) $('gccvGvwLoading').value = '1';
    if ($('gccvGvwThreshold')) $('gccvGvwThreshold').value = 12000;
    if ($('gccvGvwRate')) $('gccvGvwRate').value = 0.27;
    // ALL OD Add-ons & Owner-Driver PA unticked by default
    ['nilDep', 'engineProt', 'consumables', 'keyRepl', 'rti', 'tyreRim', 'altCar', 'batteryProt',
     'emiProt', 'persBelong', 'elecAcc', 'cngKit', 'towing', 'geoExtOD', 'geoExtTP', 'overturning',
     'odPa', 'passPa'].forEach((id) => {
      if ($(id)) $(id).checked = false;
    });
    if ($('towingLimit')) $('towingLimit').value = '15000';
    if ($('passPaSI')) $('passPaSI').value = '100000';
    if ($('passPaSIField')) $('passPaSIField').style.display = 'none';
    if ($('cpaTermField')) $('cpaTermField').style.display = 'none';
    updateCCLabel();
    updatePolicySections();
    clearResults();
  });

  /* ============================================================
     5B.  Clear results panel (used on reset / before first calc)
     ============================================================ */
  function clearResults() {
    lastResult = null;
    const zero = '0';
    if ($('netAmount')) $('netAmount').textContent = zero;
    ['odTotal','tpTotal','gstAmt','totalPremium','commission','odTotal2','tpTotal2','totalPremium2','gstAmt2','netAmount2'].forEach(id=>{
      if ($(id)) $(id).textContent = '₹ 0';
    });
    if ($('basicRateDisplay')) $('basicRateDisplay').textContent = '—';
    const odBody = $('odTable') ? $('odTable').querySelector('tbody') : null;
    if (odBody) odBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-3);">Fill in the details and click "⚡ Calculate Premium" to see the breakdown.</td></tr>';
    const tpBody = $('tpTable') ? $('tpTable').querySelector('tbody') : null;
    if (tpBody) tpBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-3);">Fill in the details and click "⚡ Calculate Premium" to see the breakdown.</td></tr>';
    const bd = $('badgeDates'); if(bd){ bd.style.display='none'; bd.textContent=''; }
    const cb = $('calcBreakdown'); if (cb) cb.style.display = 'none';
  }

  /* ============================================================
     5C.  Validate required fields before calculating — DD-MM-YYYY aware
     ============================================================ */
  function validateInputs() {
    const missing = [];
    let checks = [
      ['parentVehicleType', 'Vehicle Type'],
      ['vehicleType', 'Vehicle Category'],
      ['fuelType', 'Fuel Type'],
      ['isElectric', 'Electric Vehicle?'],
      ['cc', 'Cubic Capacity / Seats / GVW'],
      ['seating', 'Seating Capacity'],
      ['policyType', 'Policy Type'],
      ['dor', 'Date of Registration (DD-MM-YYYY)'],
      ['policyDate', 'Policy Start Date (DD-MM-YYYY)'],
      ['zone', 'Zone'],
      ['state', 'State'],
      ['invoice', 'Invoice Price'],
      ['idv', 'IDV of Vehicle'],
      ['ncb', 'NCB %'],
      ['uwDiscount', 'U/W Discount %'],
      ['ndDiscount', 'NIL Dep. Discount %']
    ];
    // Req 4: for Liability-Only (TP) policies, Valuation & Discounts are disabled — skip them
    let polType = $('policyType') ? $('policyType').value : '';
    const skipIfLiability = ['invoice','idv','ncb','uwDiscount','ndDiscount'];
    checks = checks.filter(function (c) {
      return !(polType === 'liability' && skipIfLiability.indexOf(c[0]) !== -1);
    });
    checks.forEach(([id, label]) => {
      const el = $(id);
      if (!el) return;
      if (el.value === '' || el.value === null || el.value === undefined) {
        missing.push(label);
      }
    });
    // Date format strict check
    const dateFields = [
      ['dor','Date of Registration'],
      ['policyDate','Policy Start Date']
    ];
    const badDates = [];
    dateFields.forEach(([id,label])=>{
      const el=$(id); if(!el) return;
      const v = el.value.trim();
      if(v && !isValidDDMMYYYY(v)){
        badDates.push(label + ' — use DD-MM-YYYY (e.g. 01-07-2026), got: ' + v);
        el.classList.add('is-invalid');
        el.classList.remove('is-valid');
      } else if(v){
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
      }
    });

    if (missing.length || badDates.length) {
      let msg = '';
      if(missing.length) msg += 'Please fill / select the following fields before calculating:\n\n- ' + missing.join('\n- ');
      if(badDates.length) msg += (msg?'\n\n':'') + '❌ Invalid DATE format (must be DD-MM-YYYY):\n\n- ' + badDates.join('\n- ');
      alert(msg);
      return false;
    }

    // logical check: DOR must be <= Policy Date
    const dorD = safeParseDate($('dor').value);
    const polD = safeParseDate($('policyDate').value);
    if(dorD && polD && dorD > polD){
      alert('❌ Date of Registration ('+formatDateDDMMYYYY(dorD)+') cannot be AFTER Policy Start Date ('+formatDateDDMMYYYY(polD)+').\n\nPlease correct dates in DD-MM-YYYY format.');
      return false;
    }

    return true;
  }

  /* ============================================================
     6.  Core calculation engine
     ============================================================ */
  let lastResult = null;

  function runCalc() {
    const inputs = {
      vehicleType:    $('vehicleType').value,
      fuelType:       $('fuelType').value,
      isElectric:     $('isElectric').value,
      cc:             num('cc'),
      seating:        num('seating'),
      dor:            $('dor').value,            // DD-MM-YYYY
      policyDate:     $('policyDate').value,     // DD-MM-YYYY
      insuredName:    ($('insuredName') ? $('insuredName').value : '').trim(),
      regNo:          ($('regNo') ? $('regNo').value : '').trim().toUpperCase(),
      policyType:     $('policyType').value,
      policyTerm:     num('policyTerm') || 1,
      zone:           $('zone').value,
      state:          $('state') ? $('state').value : '',
      invoice:        num('invoice'),
      idv:            num('idv'),
      idvNonElec:     num('idvNonElec'),
      idvElec:        num('idvElec'),
      llCount:        num('llCount'),
      llPaid:         num('llPaid'),
      gst:            num('gst'),
      ncb:            Number($('ncb').value),
      uwDiscount:     num('uwDiscount'),
      antiTheft:      $('antiTheft').value,
      ndDiscount:     num('ndDiscount'),
      ndRenDiscount:  num('ndRenDiscount'),
      addOnDiscount:  num('addOnDiscount'),
      // GCCV Extra GVW Loading auto inputs
      gccvGvwThreshold: 12000,
      gccvGvwRate: 0.27,
      // NEW GCCV Towing SI column
      towingLimit: Number($('towingLimit') ? $('towingLimit').value : 15000) || 15000,
      covers: {
        nilDep:        $('nilDep').checked,
        engineProt:    $('engineProt').checked,
        consumables:   $('consumables').checked,
        keyRepl:       $('keyRepl').checked,
        rti:           $('rti').checked,
        tyreRim:       $('tyreRim').checked,
        altCar:        $('altCar').checked,
        batteryProt:   $('batteryProt').checked,
        emiProt:       $('emiProt').checked,
        persBelong:    $('persBelong').checked,
        elecAcc:       $('elecAcc').checked,
        cngKit:        $('cngKit').checked,
        towing:        $('towing').checked,
        overturning:   $('overturning').checked,
        geoExtOD:      $('geoExtOD') ? $('geoExtOD').checked : false,
        geoExtTP:      $('geoExtTP') ? $('geoExtTP').checked : false,
        odPa:          $('odPa').checked,
        passPa:        $('passPa').checked
      },
      towingLimit: $('towingLimit') ? Number($('towingLimit').value) || 15000 : 15000,
      // PA Un-named Passengers SI (₹1 lakh or ₹2 lakh)
      passPaSI: $('passPaSI') ? Number($('passPaSI').value) || 100000 : 100000,
      /* Bundle CPA term: '1' | '3' | '5' — only used for Bundle Pvt Car / 2W */
      cpaTerm: $('cpaTerm') ? $('cpaTerm').value : ''
    };

    const policyMeta = POLICY_META[inputs.policyType];
    const includesOD = policyMeta.includesOD;
    const includesTP = policyMeta.includesTP;
    const allowMultiYear = policyMeta.allowMultiYear;
    const vehMeta = VEHICLE_META[inputs.vehicleType] || VEHICLE_META.pvtCar;
    const is2WLike = ['twoWheeler', 'evTwoWheeler'].includes(inputs.vehicleType);
    const isPCCV = ['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].includes(inputs.vehicleType);
    const isCommercial = ['taxi','auto','schoolBus','staffBus','pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge','gccv','gccv3w','miscD','ambulance'].includes(inputs.vehicleType);
    const isElectricVehicle = inputs.isElectric === 'Yes' || ['evPvtCar', 'evTwoWheeler'].includes(inputs.vehicleType);

    /* Determine effective years */
    // Goods 3-Wheeler (gccv3w) is a 1-year-only policy — no long-term / 3-yr concept
    const isGCCV3W = (inputs.vehicleType === 'gccv3w');

    let years = 1;
    if (isGCCV3W) {
      years = 1; // commercial goods 3W: TP & policy term are always 1-year
    } else if (inputs.policyType === 'bundle') {
      // Bundle Policy: auto 3yr for cars, 5yr for 2W
      if (is2WLike) {
        years = 5; // Two Wheeler - 5 year
      } else {
        years = 3; // Private Car - 3 year
      }
    } else if (allowMultiYear) {
      if (is2WLike && vehMeta.allowFiveYear) {
        years = inputs.policyTerm; // can be 1, 3, or 5
      } else {
        years = inputs.policyTerm === 3 ? 3 : 1;
      }
    }

    const age = calcAge(inputs.policyDate, inputs.dor);
    const zoneKey = getZoneKey(inputs.zone);

    /* ============================================================
       A.  OWN DAMAGE
       ============================================================ */
    const rows = [];
    let running = 0;
    let odTotal = 0;

    let basicRate = 0;  // declared outside if-block so lastResult can capture it
    if (includesOD) {
      // 1. Basic OD
      const odSlabs = OD_RATES[inputs.vehicleType];
      if (odSlabs && odSlabs[zoneKey]) {
        basicRate = pickODRate(odSlabs[zoneKey], age, inputs.cc);
      }
      // Add non-electrical accessories to main IDV for basic OD calculation
      const effectiveIdvForOD = inputs.idv + (inputs.idvNonElec || 0);
      let basic = round(effectiveIdvForOD * basicRate / 100);

      // 1A. Fixed OD Addition for PCCV categories (after basic rate on IDV)
      // 1A. Fixed OD Addition — based on SEATING CAPACITY for ALL bus types
      //      (PCCV + School Bus + Staff Bus). Bands: upto 18->350, 19-36->450, 37-60->550, >60->680
      let fixedAdd = 0;
      let fixedAddNote = '';
      const isBusType = ['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge','schoolBus','staffBus'].includes(inputs.vehicleType);
      if (isBusType) {
        const seats = parseFloat(inputs.seating) || 0;
        for (const slab of BUS_FIXED_OD_ADDITION) {
          if (seats <= slab.maxSeats) { fixedAdd = slab.amount; break; }
        }
        fixedAddNote = `${VEHICLE_META[inputs.vehicleType]?.label || 'Bus'} (${seats} seats)`;
      }
      const nonElecNote = inputs.idvNonElec > 0 ? ` + Non-Elec ₹${inputs.idvNonElec.toLocaleString('en-IN')}` : '';
      if (fixedAdd > 0) {
        basic += fixedAdd;
        rows.push({ label: 'Basic OD (Rate on IDV)', detail: `${basicRate.toFixed(3)} % of IDV ₹${inputs.idv.toLocaleString('en-IN')}${nonElecNote} (${zoneKey.toUpperCase()})`, value: basic - fixedAdd, group: 'od' });
        rows.push({ label: 'Add: Fixed OD Addition', detail: `₹ ${fixedAdd} (${fixedAddNote})`, value: fixedAdd, group: 'od' });
      } else {
        rows.push({ label: 'Basic OD', detail: `${basicRate.toFixed(3)} % of IDV ₹${inputs.idv.toLocaleString('en-IN')}${nonElecNote} (${zoneKey.toUpperCase()})`, value: basic, group: 'od' });
      }
      running = basic;

      // 1B. GCCV Extra GVW Loading — ₹0.27/kg above 12,000 kg GVW
      let gvwLoading = 0;
      let gvwExcessKg = 0;
      if (inputs.vehicleType === 'gccv') {
        const threshold = 12000;
        const ratePerKg = 0.27;

        if (inputs.cc > threshold) {
          gvwExcessKg = inputs.cc - threshold;
          gvwLoading = round(gvwExcessKg * ratePerKg);
          if (gvwLoading > 0) {
            basic += gvwLoading;
            running += gvwLoading;
            rows.push({
              label: 'Add: Extra GVW Loading (GCCV)',
              detail: `${gvwExcessKg.toLocaleString('en-IN')} kg × ₹${ratePerKg}/kg above ${threshold.toLocaleString('en-IN')} kg GVW`,
              value: gvwLoading,
              group: 'od'
            });
          }
        }
        if (gvwLoading === 0 && inputs.cc > 0) {
          rows.push({
            label: 'Extra GVW Loading',
            detail: `No loading — GVW ${inputs.cc.toLocaleString('en-IN')} kg ≤ ${threshold.toLocaleString('en-IN')} kg threshold (₹${ratePerKg}/kg above threshold)`,
            value: 0,
            group: 'od',
            muted: true
          });
        }
      }

      // 2. Engine Protection
      let ep = 0;
      let epRate = 0;
      if (inputs.covers.engineProt) {
        epRate = getEngineProtRate(inputs.vehicleType, inputs.fuelType, age);
        ep = round(inputs.idv * epRate / 100);
        rows.push({ label: 'Add: Engine Protection', detail: `${epRate.toFixed(2)} % of IDV (${inputs.fuelType})`, value: ep, group: 'od' });
        running += ep;
      } else {
        rows.push({ label: 'Add: Engine Protection', detail: 'Not opted', value: 0, group: 'od', muted: true });
      }

      // 3. EP Disc/Load (Pvt Car / EV Pvt Car only)
      // ------------------------------------------------------------
      // PRIORITY logic (bullet-proof):
      //   A) IDV ≥ ₹20L  → LOADING side only (NEVER discount)
      //        CC ≤ 1500          → 0
      //        CC 1501–2499       → 10% loading
      //        CC ≥ 2500          → 15% loading
      //   B) ₹10L < IDV < ₹20L → MIDDLE
      //        CC ≤ 1500          → 10% discount (CC only)
      //        CC 1501–2499       → 0 (cancel)
      //        CC ≥ 2500          → 10% loading
      //   C) IDV ≤ ₹10L → DISCOUNT only (NEVER loading)
      //        CC ≤ 1500          → 15% discount (10+10 cap)
      //        CC > 1500          → 10% discount (IDV only)
      // NCB applies on final disc/load amount.
      // ------------------------------------------------------------
      let epDisc = 0;
      /* Req 1: Engine Protection disc/load applies to conventional Pvt Car ONLY.
         EV Pvt Car has no ICE engine — exclude it from the EP loading / discount logic. */
      const isPvtCarFamily = (inputs.vehicleType === 'pvtCar');
      if (ep > 0 && isPvtCarFamily) {
        let epAdjPct = 0;
        let epAdjReason = '';
        // Force numeric (avoid string compare bugs)
        const epIdv = Number(inputs.idv) || 0;
        let epCc = Number(inputs.cc) || 0;

        // ===== PRIORITY BRANCHES (mutually exclusive) =====
        if (epIdv >= 2000000) {
          // A) HIGH IDV — loading only, discount FORBIDDEN
          if (epCc >= 2500) {
            epAdjPct = 15;
            epAdjReason = 'IDV ≥ ₹20L AND CC ≥ 2500 — 15% loading';
          } else if (epCc > 1500) {
            epAdjPct = 10;
            epAdjReason = 'IDV ≥ ₹20L AND CC 1501–2499 — 10% loading';
          } else {
            epAdjPct = 0;
            epAdjReason = 'IDV ≥ ₹20L AND CC ≤ 1500 — No loading/discount';
          }
        } else if (epIdv > 1000000) {
          // B) MIDDLE IDV
          if (epCc >= 2500) {
            epAdjPct = 10;
            epAdjReason = '₹10L < IDV < ₹20L AND CC ≥ 2500 — 10% loading';
          } else if (epCc > 1500) {
            epAdjPct = 0;
            epAdjReason = '₹10L < IDV < ₹20L AND CC 1501–2499 — No loading/discount (cancel)';
          } else {
            epAdjPct = -10;
            epAdjReason = '₹10L < IDV < ₹20L AND CC ≤ 1500 — 10% discount (CC only)';
          }
        } else {
          // C) LOW IDV — discount only, loading FORBIDDEN
          if (epCc <= 1500) {
            epAdjPct = -15;
            epAdjReason = 'IDV ≤ ₹10L AND CC ≤ 1500 — 15% discount (10+10 capped)';
          } else {
            epAdjPct = -10;
            epAdjReason = 'IDV ≤ ₹10L AND CC > 1500 — 10% discount (IDV only)';
          }
        }

        epDisc = round(ep * epAdjPct / 100);
        const engineLabel = (inputs.vehicleType === 'evPvtCar' || (isElectricVehicle && ['pvtCar','evPvtCar'].includes(inputs.vehicleType)))
          ? `${inputs.cc || 0} KW`
          : `${inputs.cc || 0} CC`;
        if (epAdjPct < 0) {
          const epDiscNcb = inputs.ncb > 0 ? round(-epDisc * inputs.ncb / 100) : 0;
          const epDiscFinal = epDisc + epDiscNcb;
          const ncbNote = inputs.ncb > 0 ? ` (NCB ${inputs.ncb}% applied: −₹${Math.abs(epDiscNcb).toLocaleString('en-IN')})` : '';
          rows.push({ label: 'Less: EP Discount', detail: `${Math.abs(epAdjPct)} % discount on EP (${engineLabel}, IDV: ₹${epIdv.toLocaleString('en-IN')} — ${epAdjReason})${ncbNote}`, value: epDiscFinal, group: 'od' });
          running += epDiscFinal;
        } else if (epAdjPct > 0) {
          const epLoadNcb = inputs.ncb > 0 ? round(-epDisc * inputs.ncb / 100) : 0;
          const epLoadFinal = epDisc + epLoadNcb;
          const ncbNote = inputs.ncb > 0 ? ` (NCB ${inputs.ncb}% applied: −₹${Math.abs(epLoadNcb).toLocaleString('en-IN')})` : '';
          rows.push({ label: 'Add: EP Loading', detail: `${epAdjPct} % loading on EP (${engineLabel}, IDV: ₹${epIdv.toLocaleString('en-IN')} — ${epAdjReason})${ncbNote}`, value: epLoadFinal, group: 'od' });
          running += epLoadFinal;
        } else {
          rows.push({ label: 'EP Disc/Load', detail: `No discount / loading (${engineLabel}, IDV: ₹${epIdv.toLocaleString('en-IN')} — ${epAdjReason})`, value: 0, group: 'od', muted: true });
        }
      } else if (ep > 0) {
        rows.push({ label: 'EP Disc/Load', detail: 'Applicable for Pvt Car only', value: 0, group: 'od', muted: true });
      } else {
        rows.push({ label: 'EP Disc/Load', detail: '—', value: 0, group: 'od', muted: true });
      }

      // 4. Electrical Accessories (Non-Elec is added to main IDV, not separate)
      let elAcc = 0;
      if (inputs.covers.elecAcc) {
        const elRate = ADDON_FACTORS.elecAcc[inputs.vehicleType] || 4.00;
        
        if (inputs.idvElec > 0) {
          elAcc = round(inputs.idvElec * elRate / 100);
          rows.push({ label: 'Add: Electrical Accessories', detail: `${elRate.toFixed(2)} % of Elec. Accessories IDV ₹${inputs.idvElec.toLocaleString('en-IN')}`, value: elAcc, group: 'od' });
          running += elAcc;
        } else {
          rows.push({ label: 'Electrical Accessories', detail: 'Enter electrical accessories IDV to charge', value: 0, group: 'od', muted: true });
        }
        
        if (inputs.idvNonElec > 0) {
          rows.push({ label: 'Non-Electrical Accessories', detail: `₹${inputs.idvNonElec.toLocaleString('en-IN')} added to main IDV (included)`, value: 0, group: 'od', muted: true });
        }
      } else {
        if (inputs.idvElec > 0 || inputs.idvNonElec > 0) {
          rows.push({ label: 'Electrical / Non-Elec. Accessories', detail: 'Opt the checkbox to charge accessories cover', value: 0, group: 'od', muted: true });
        }
      }

      // 5. CNG/LPG OD
      let cngOD = 0;
      const isGCCV_OD = (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w');
      if (inputs.covers.cngKit && (inputs.fuelType === 'CNG' || inputs.fuelType === 'LPG' || isGCCV_OD)) {
        if (isGCCV_OD) {
          const cngBaseOD = Math.max(0, basic - (typeof gvwLoading !== 'undefined' ? gvwLoading : 0));
          cngOD = round(cngBaseOD * CNG_OD_PCT);
          if (cngOD > 0) {
            rows.push({ label: 'Add: CNG Cover (OD)', detail: `5% of Basic OD (₹${cngBaseOD.toLocaleString('en-IN')}) – GVW loading excluded [GCCV]`, value: cngOD, group: 'od' });
            running += cngOD;
          } else {
            rows.push({ label: 'CNG Cover (OD)', detail: 'Basic OD = 0', value: 0, group: 'od', muted: true });
          }
        } else if (inputs.vehicleType === 'taxi') {
          // TAXI: CNG OD picked on BASIC OD (not IDV) — 5% of Basic OD [per requirement]
          cngOD = round(basic * CNG_OD_PCT);
          if (cngOD > 0) {
            rows.push({ label: 'Add: CNG Cover (OD)', detail: `5% of Basic OD (₹${basic.toLocaleString('en-IN')}) [Taxi]`, value: cngOD, group: 'od' });
            running += cngOD;
          } else {
            rows.push({ label: 'CNG Cover (OD)', detail: 'Basic OD = 0', value: 0, group: 'od', muted: true });
          }
        } else {
          // Pvt Car (and other non-GCCV/non-Taxi): CNG OD = 5% of Basic OD
          cngOD = round(basic * CNG_OD_PCT);
          if (cngOD > 0) {
            rows.push({ label: 'Add: CNG Cover (OD)', detail: `5% of Basic OD (₹${basic.toLocaleString('en-IN')})`, value: cngOD, group: 'od' });
            running += cngOD;
          } else {
            rows.push({ label: 'CNG Cover (OD)', detail: 'Basic OD = 0', value: 0, group: 'od', muted: true });
          }
        }
      }

      // 6. Additional Towing
      let towing = 0;
      if (inputs.covers.towing) {
        if (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w') {
          const towingSI = Number($('towingLimit') ? $('towingLimit').value : 15000) || 15000;
          const towingRate = (towingSI <= 15000) ? 0.05 : 0.075;
          towing = round(towingSI * towingRate);
          const pctLabel = (towingSI <= 15000) ? '5%' : '7.5%';
          rows.push({
            label: 'Add: Additional Towing',
            detail: `₹${towingSI.toLocaleString('en-IN')} @ ${pctLabel}`,
            value: towing,
            group: 'od'
          });
        } else {
          towing = inputs.vehicleType === 'pvtCar' ? 1500
                : inputs.vehicleType === 'twoWheeler' ? 500
                : 2000;
          rows.push({ label: 'Add: Additional Towing', detail: 'Fixed', value: towing, group: 'od' });
        }
        running += towing;
      }

      // 6A. Geographical Extension (OD)
      let geoExtOD = 0;
      if (inputs.covers.geoExtOD) {
        geoExtOD = 400;
        rows.push({ label: 'Add: Geographical Extension (OD)', detail: 'Fixed ₹400', value: geoExtOD, group: 'od' });
        running += geoExtOD;
      }

      // 7. Overturning Cover
      let overturn = 0;
      if (inputs.covers.overturning) {
        overturn = round(basic * 0.05);
        rows.push({ label: 'Add: Overturning Cover', detail: '5 % of Basic', value: overturn, group: 'od' });
        running += overturn;
      }

      // 8. IMT-23
      const imt23Rate = ADDON_FACTORS.imt23[inputs.vehicleType] || 0;
      let imt23 = 0;
      if (imt23Rate > 0) {
        const isGCCVWithExtras = (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w');
        const imtBase = isGCCVWithExtras
          ? (basic + (inputs.covers.geoExtOD && geoExtOD > 0 ? geoExtOD : 0) + (inputs.covers.towing && towing > 0 ? towing : 0) + (inputs.covers.cngKit && cngOD > 0 ? cngOD : 0))
          : basic;
        imt23 = round(imtBase * imt23Rate / 100);
        const parts = [`${basic.toLocaleString('en-IN')} (Basic)`];
        if (inputs.covers.geoExtOD && geoExtOD > 0) parts.push(`₹${geoExtOD} (Geo)`);
        if (inputs.covers.towing && towing > 0) parts.push(`₹${towing} (Tow)`);
        if (isGCCVWithExtras && inputs.covers.cngKit && cngOD > 0) parts.push(`₹${cngOD} (CNG)`);
        const imtDetail = isGCCVWithExtras
          ? `${imt23Rate} % of Basic + Geo + Towing + CNG (${parts.join(' + ')})`
          : `${imt23Rate} % of Basic OD`;
        rows.push({ label: 'Add: IMT-23', detail: imtDetail, value: imt23, group: 'od' });
        running += imt23;
      } else if (inputs.vehicleType !== 'taxi') {
        /* Taxi: IMT-23 not applicable — row hidden completely */
        rows.push({ label: 'Add: IMT-23 (Basic+El+CNG+Tow)', detail: '—', value: 0, group: 'od', muted: true });
      }

      // 9. U/W Discount
      const uwBase = basic + elAcc + cngOD + overturn + imt23;
      const uwAmt  = round(-uwBase * inputs.uwDiscount / 100);
      if (uwAmt) {
        rows.push({ label: 'Less: U/W Discount', detail: `${inputs.uwDiscount} % on Basic+El+IMT+CNG+OT`, value: uwAmt, group: 'od' });
        running += uwAmt;
      }
      const postUWBase = running;
      const isGCCVDepCap = (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w');
      const commercialDepCapBase = basic + imt23 
        + (isGCCVDepCap ? geoExtOD : 0)
        + (cngOD > 0 ? cngOD : 0)
        + (elAcc > 0 ? elAcc : 0);

      // 10. Consumables Cover
      let consum = 0;
      if (inputs.covers.consumables) {
        const isGCCV = (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w');
        /* TAXI removed from fixed 0.25% list — taxi now uses age-based table (0.10 / 0.11 / 0.14 upto 5 yrs) */
        const isOtherCommercial = ['auto','schoolBus','staffBus','pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge','miscD','ambulance'].includes(inputs.vehicleType);

        if (isGCCV) {
          const cRate = getConsumablesRate(age, 'gccv');
          consum = round(inputs.idv * cRate / 100);
          rows.push({ 
            label: 'Add: Consumables Cover', 
            detail: `${cRate.toFixed(2)} % of IDV (GCCV — age: ${age.toFixed(1)} yr)`, 
            value: consum, 
            group: 'od' 
          });
          running += consum;
        } else if (inputs.vehicleType === 'taxi') {
          /* TAXI: age-based — 0.10% (new), 0.11% (2-3 yr), 0.14% (3-5 yr). >5 yr NOT available.
             Charged on (IDV + Non-Elec Accessories) per requirement */
          const cRate = getConsumablesRate(age, 'taxi');
          if (cRate > 0) {
            const consumBase = inputs.idv + inputs.idvNonElec;
            consum = round(consumBase * cRate / 100);
            rows.push({
              label: 'Add: Consumables Cover',
              detail: `${cRate.toFixed(2)} % of (IDV + Non-Elec Acc) ₹${consumBase.toLocaleString('en-IN')} (Taxi — age: ${age.toFixed(1)} yr)`,
              value: consum,
              group: 'od'
            });
            running += consum;
          } else {
            rows.push({ label: 'Consumables Cover', detail: '⚠️ Not available — taxi age exceeds 5 years', value: 0, group: 'od', muted: true });
          }
        } else if (isOtherCommercial) {
          const cRate = 0.25;
          consum = round(inputs.idv * cRate / 100);
          rows.push({ 
            label: 'Add: Consumables Cover', 
            detail: `${cRate.toFixed(2)} % of IDV (Commercial — fixed)`, 
            value: consum, 
            group: 'od' 
          });
          running += consum;
        } else if (age > 5) {
          rows.push({ label: 'Consumables Cover', detail: '⚠️ Not available — vehicle age exceeds 5 years', value: 0, group: 'od', muted: true });
        } else {
          const cRate = getConsumablesRate(age);
          consum = round(inputs.idv * cRate / 100);
          rows.push({ label: 'Add: Consumables Cover', detail: `${cRate.toFixed(2)} % of IDV (age: ${age.toFixed(1)} yr)`, value: consum, group: 'od' });
          running += consum;
        }
      }

      // 11. Key Replacement
      let key = 0;
      if (inputs.covers.keyRepl) {
        if (inputs.vehicleType === 'taxi') {
          /* TAXI: ₹250 up to IDV ₹5L, ₹400 above ₹5L */
          key = (inputs.idv > 500000) ? 400 : 250;
          const keyNote = (inputs.idv > 500000) ? 'Taxi — IDV > ₹5L (₹400)' : 'Taxi — IDV ≤ ₹5L (₹250)';
          rows.push({ label: 'Add: Key Replacement', detail: keyNote, value: key, group: 'od' });
        } else {
          const keySlab = getKeyReplacementSlab(inputs.idv);
          key = keySlab.premium;
          rows.push({ label: 'Add: Key Replacement', detail: `${keySlab.label} — slab premium`, value: key, group: 'od' });
        }
        running += key;
      }

      // 12. RTI
      let rti = 0;
      if (inputs.covers.rti) {
        const rRate = getRTIRate(inputs.vehicleType, age);
        if (rRate > 0) {
          /* TAXI: RTI charged on (IDV + Non-Elec Accessories) per requirement */
          const rtiBase = (inputs.vehicleType === 'taxi')
            ? (inputs.idv + inputs.idvNonElec)
            : inputs.idv;
          rti = round(rtiBase * rRate / 100);
          const rtiDetail = (inputs.vehicleType === 'taxi')
            ? `${rRate.toFixed(2)} % of (IDV + Non-Elec Acc) ₹${rtiBase.toLocaleString('en-IN')} (age: ${age.toFixed(1)} yr)`
            : `${rRate.toFixed(2)} % of IDV (age: ${age.toFixed(1)} yr)`;
          rows.push({ label: 'Add: Return to Invoice (IDV)', detail: rtiDetail, value: rti, group: 'od' });
          running += rti;
        } else if (inputs.vehicleType === 'taxi' && age > 3) {
          rows.push({ label: 'Return to Invoice (RTI)', detail: '⚠️ Not available — taxi age exceeds 3 years', value: 0, group: 'od', muted: true });
        }
      }

      // 13. Nil Depreciation / Dep Cap — Calculated on Total IDV (Main + Non-Elec + Elec Accessories)
      let nd = 0;
      const totalIdvForDepCap = (inputs.idv || 0) + (inputs.idvNonElec || 0) + (inputs.idvElec || 0);
      const ndOdBase = isCommercial ? commercialDepCapBase : basic;
      if (inputs.covers.nilDep) {
        const ndResult = calcNilDepPremium({
          vehicleType: inputs.vehicleType,
          fuelType:    inputs.fuelType,
          age:         age,
          cc:          inputs.cc || inputs.seating,
          ncb:         inputs.ncb,
          idv:         totalIdvForDepCap,
          odPremium:   ndOdBase
        });
        if (ndResult.eligible && ndResult.premium > 0) {
          nd = ndResult.premium;
          const accessoriesNote = (inputs.idvNonElec > 0 || inputs.idvElec > 0)
            ? ` (IDV ₹${inputs.idv.toLocaleString('en-IN')} + Non-Elec ₹${inputs.idvNonElec.toLocaleString('en-IN')} + Elec ₹${inputs.idvElec.toLocaleString('en-IN')})`
            : '';
          const detail = (ndResult.basis === 'IDV')
            ? `${ndResult.rate} % of Total IDV ₹${totalIdvForDepCap.toLocaleString('en-IN')}${accessoriesNote}`
            : (inputs.vehicleType === 'taxi'
                ? `${ndResult.rate} % of (OD + Elec Acc + CNG OD) (₹${ndOdBase.toLocaleString('en-IN')})`
                : `${ndResult.rate} % of OD + Extra GVW + IMT-23${isGCCVDepCap ? ' + Geo Ext OD + CNG OD' : ''} (₹${ndOdBase.toLocaleString('en-IN')})`);
          rows.push({ label: 'Add: Nil Depreciation Cover', detail: detail, value: nd, group: 'od' });
          running += nd;
        } else if (!ndResult.eligible) {
          rows.push({
            label: 'Nil Depreciation Cover',
            detail: '⚠️ ' + ndResult.reason,
            value: 0,
            group: 'od',
            muted: true
          });
        }
      }

      // 14. Alternate Car Benefit
      let acb = 0;
      if (inputs.covers.altCar) {
        const acbRate = ADDON_FACTORS.altCar[inputs.vehicleType] || 0.10;
        acb = round(inputs.idv * acbRate / 100);
        rows.push({ label: 'Add: Alternative Car Benefit', detail: `${acbRate} % of IDV`, value: acb, group: 'od' });
        running += acb;
      }

      // 15. Battery Protection — Age-based rates for Pvt Car
      let bp = 0;
      if (inputs.covers.batteryProt) {
        const bpData = ADDON_FACTORS.batteryProt[inputs.vehicleType];
        let bpRate = 0.10;
        let ageNote = '';
        
        if (Array.isArray(bpData)) {
          // Age-based rate for Pvt Car
          for (let i = 0; i < bpData.length; i++) {
            if (age <= bpData[i].maxAge) {
              bpRate = bpData[i].rate;
              ageNote = ` (${age.toFixed(1)} yr old vehicle)`;
              break;
            }
          }
        } else {
          bpRate = bpData || 0.10;
        }
        
        const totalIdv = (inputs.idv || 0) + (inputs.idvNonElec || 0) + (inputs.idvElec || 0);
        bp = round(totalIdv * bpRate / 100);
        rows.push({ label: 'Add: Battery Protection', detail: `${bpRate.toFixed(2)} % of IDV${ageNote}`, value: bp, group: 'od' });
        running += bp;
      }

      // 17. Tyre & Rim — Charged on INVOICE PRICE, not IDV
      let tr = 0;
      if (inputs.covers.tyreRim) {
        const trRate = ADDON_FACTORS.tyreRim[inputs.vehicleType] || 0.20;
        tr = round(inputs.invoice * trRate / 100);
        rows.push({ label: 'Add: Tyre & Rim Protection', detail: `${trRate} % of Invoice Price (₹${inputs.invoice.toLocaleString('en-IN')})`, value: tr, group: 'od' });
        running += tr;
      }

      // 18-19. EMI / PB
      if (inputs.covers.emiProt) {
        rows.push({ label: 'Add: EMI Protection', detail: 'Quote-based', value: 0, group: 'od', muted: true });
      }
      // Show/hide Personal Belongings SI selector
    const persBelongSIField = $('persBelongSIField');
    const persBelongCb = $('persBelong');
    if (persBelongSIField && persBelongCb) {
      persBelongSIField.style.display = persBelongCb.checked ? '' : 'none';
    }
    
    // 18. Personal Belongings Cover
      if (inputs.covers.persBelong) {
        const persBelongSI = Number($('persBelongSI') ? $('persBelongSI').value : 5000) || 5000;
        let pbPremium = 0;
        if (persBelongSI === 10000) {
          pbPremium = 650;
        } else {
          pbPremium = 400; // ₹5,000 SI
        }
        rows.push({ label: 'Add: Loss of Personal Belongings', detail: `SI ₹${persBelongSI.toLocaleString('en-IN')} (Fixed Premium)`, value: pbPremium, group: 'od' });
        running += pbPremium;
      }

      // 20. ND Discount
      let ndDisc = 0;
      if (nd > 0 && inputs.ndDiscount > 0) {
        ndDisc = round(-nd * inputs.ndDiscount / 100);
        rows.push({ label: 'Less: NIL Dep. Discount', detail: `${inputs.ndDiscount} % on ND premium`, value: ndDisc, group: 'od' });
        running += ndDisc;
      }

      // 21. Add-on Discount
      const addonBase = rti + acb + bp + tr;
      if (addonBase > 0 && inputs.addOnDiscount > 0) {
        const v = round(-addonBase * inputs.addOnDiscount / 100);
        rows.push({ label: 'Less: Add-on Discount', detail: `${inputs.addOnDiscount} % on RTI/ACB/BP/TR`, value: v, group: 'od' });
        running += v;
      }

      // 22. ND Renewal Discount
      let ndRenDisc = 0;
      if (nd > 0 && inputs.ndRenDiscount > 0) {
        ndRenDisc = round(-nd * inputs.ndRenDiscount / 100);
        rows.push({ label: 'Less: Renewal Disc (NIL Dep)', detail: `${inputs.ndRenDiscount} %`, value: ndRenDisc, group: 'od' });
        running += ndRenDisc;
      }

      // 23. Anti-theft Discount
      let atd = 0;
      if (inputs.antiTheft === 'Yes') {
        atd = Math.max(-ANTI_THEFT_CAP, +(-postUWBase * ANTI_THEFT_PCT / 100).toFixed(2));
        rows.push({ label: 'Less: Anti-Theft Discount', detail: `2.5 % of (Basic+EP+El-Disc), cap ₹ ${ANTI_THEFT_CAP}`, value: atd, group: 'od' });
        running += atd;
      }

      // 24. NCB
      let ncbAmt = 0;
      if (inputs.ncb > 0) {
        const isClassD = ['miscD','ambulance'].includes(inputs.vehicleType);
        let ncbBase, ncbDetail;
        if (isPCCV) {
          const netDepCap = Math.max(0, nd + ndDisc + ndRenDisc);
          ncbBase = Math.max(0, postUWBase + netDepCap);
          ncbDetail = `On OD Premium after IMT-23 & U/W Disc ₹${postUWBase.toLocaleString('en-IN')} + Dep Cap after discount ₹${netDepCap.toLocaleString('en-IN')}`;
        } else if (isClassD) {
          // Class D (Ambulance / Misc D): NCB on OD after UW + Nil Dep after Dep Cap discount
          const netDepCap = Math.max(0, nd + ndDisc + ndRenDisc);
          ncbBase = Math.max(0, postUWBase + netDepCap);
          ncbDetail = `On OD Premium after IMT-23 & U/W Disc ₹${postUWBase.toLocaleString('en-IN')} + Dep Cap after discount ₹${netDepCap.toLocaleString('en-IN')}`;
        } else if (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w') {
          const netDepCap = Math.max(0, nd + ndDisc + ndRenDisc);
          ncbBase = Math.max(0, postUWBase + netDepCap);
          ncbDetail = `On Towing + OD after U/W Disc (₹${postUWBase.toLocaleString('en-IN')}) + Dep Cap after Disc (₹${netDepCap.toLocaleString('en-IN')}) + Geo Ext OD`;
        } else if (inputs.vehicleType === 'taxi') {
          /* TAXI: NCB on OD after UW + Dep Cap after Dep Cap Discount */
          const netDepCap = Math.max(0, nd + ndDisc + ndRenDisc);
          ncbBase = Math.max(0, postUWBase + netDepCap);
          ncbDetail = `On OD after U/W Disc ₹${postUWBase.toLocaleString('en-IN')} + Dep Cap after Discount ₹${netDepCap.toLocaleString('en-IN')}`;
        } else {
          const basicAfterUW = round(basic * (100 - inputs.uwDiscount) / 100);
          ncbBase = Math.max(0, basicAfterUW + ep);
          ncbDetail = `On (Basic after UW Disc ₹${basicAfterUW.toLocaleString('en-IN')} + EP ₹${ep.toLocaleString('en-IN')})`;
        }
        ncbAmt = round(-ncbBase * inputs.ncb / 100);
        rows.push({ label: `Less: NCB (${inputs.ncb} %)`, detail: ncbDetail, value: ncbAmt, group: 'od' });
        running += ncbAmt;
      }
      odTotal = Math.max(0, round(running));

      /* Two Wheeler minimum OD premium floor (Rs.100) */
      if (is2WLike && includesOD && odTotal < 100) {
        const minOdAdj = 100 - odTotal;
        rows.push({ label: 'Add: Minimum OD Premium', detail: 'Two Wheeler minimum OD premium floor ₹100 applied', value: minOdAdj, group: 'od' });
        odTotal = 100;
      }
    }

    /* ============================================================
       B.  LIABILITY (TP)
       ============================================================ */
    const tpRows = [];
    let tpRun = 0;
    let tpTotal = 0;
    let basicTP = 0;

    if (includesTP) {
      const tpSlabs = TP_RATES[inputs.vehicleType];
      let slabKey = 'annual';
      if (years === 3) slabKey = 'threeYear';
      else if (years === 5) slabKey = 'fiveYear';
      if (!tpSlabs || !tpSlabs[slabKey]) slabKey = 'annual';
      const slab = tpSlabs && tpSlabs[slabKey];

      basicTP = 0;
      let cpaAvailable = 0;
      let cpaInTP = 0;
      let cpaNote = '';
      let cpaYearsUsed = years; // actual CPA term charged (may differ from TP years on Bundle)
      let perPassenger = 0;
      const matched = slab ? bracketRate(slab, inputs.cc) : null;

      /* Resolve CPA premium for Bundle policies where user can choose
         1-Year CPA OR full-term CPA (3yr Car / 5yr 2W).
         TP premium always stays full multi-year; only CPA amount changes. */
      function resolveBundleCpa(vehicleType, fullTermYears, chosenTerm) {
        const isCar = (vehicleType === 'pvtCar' || vehicleType === 'evPvtCar');
        const is2W  = (vehicleType === 'twoWheeler' || vehicleType === 'evTwoWheeler');
        const term = parseInt(chosenTerm, 10);
        // Annual CPA rates
        const annualCpa = isCar ? 320 : (is2W ? 360 : 320);
        // Full-term CPA from rate tables (preferred) — fall back to annual × years
        let fullCpa = 0;
        if (matched && matched.cpa) {
          fullCpa = matched.cpa;
        } else if (isCar && fullTermYears === 3) {
          fullCpa = 900;
        } else if (is2W && fullTermYears === 5) {
          fullCpa = 1607;
        } else {
          fullCpa = annualCpa * fullTermYears;
        }

        if (term === 1) {
          return { amount: annualCpa, years: 1, label: '1 Year' };
        }
        // full term (3 for car, 5 for 2W) or any other value → full
        return {
          amount: fullCpa,
          years: fullTermYears,
          label: fullTermYears + ' Year'
        };
      }

      if (matched) {
        if (matched.tp !== undefined) {
          basicTP = matched.tp;
          cpaAvailable = matched.cpa || 0;
          if (inputs.vehicleType === 'gccv' && cpaAvailable === 0) {
            cpaAvailable = 320 * years;
          }
          const isBundledCpaVehicle = ['pvtCar', 'evPvtCar'].includes(inputs.vehicleType);
          const is2WCpaVehicle = ['twoWheeler', 'evTwoWheeler'].includes(inputs.vehicleType);
          const isBundleWithCpaChoice = (inputs.policyType === 'bundle') && (isBundledCpaVehicle || is2WCpaVehicle);

          if (isBundleWithCpaChoice && inputs.covers.odPa) {
            const cpaPick = resolveBundleCpa(inputs.vehicleType, years, inputs.cpaTerm);
            cpaInTP = cpaPick.amount;
            cpaAvailable = cpaPick.amount;
            cpaYearsUsed = cpaPick.years;
            cpaNote = (isBundledCpaVehicle ? 'Mandatory – ' : '') + 'Opted · ' + cpaPick.label + ' CPA';
          } else if (isBundledCpaVehicle) {
            // Owner-Driver PA (CPA) is MANDATORY for Pvt Car — include when opted
            cpaInTP = inputs.covers.odPa ? cpaAvailable : 0;
            cpaNote = inputs.covers.odPa ? 'Mandatory – Opted' : 'Mandatory – Not opted';
            cpaYearsUsed = years;
          } else {
            cpaInTP = inputs.covers.odPa ? cpaAvailable : 0;
            cpaNote = inputs.covers.odPa ? 'Opted' : 'Not opted';
            cpaYearsUsed = years;
          }
          perPassenger = matched.perPassenger || 0;
        } else if (matched.baseTp !== undefined) {
          basicTP = matched.baseTp;
          perPassenger = matched.perPassenger || 0;
          cpaAvailable = 320 * years;
          cpaInTP = inputs.covers.odPa ? cpaAvailable : 0;
          cpaNote = inputs.covers.odPa ? 'Opted' : 'Not opted';
          cpaYearsUsed = years;
        }
      }

      const isPCCVtp = ['pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].includes(inputs.vehicleType);
      // Passenger count = Seating - 1 (excluding driver) for ALL vehicle types
      const paxCount = Math.max(0, inputs.seating - 1);
      let ppTP = 0;
      if (perPassenger > 0 && paxCount > 0) {
        ppTP = perPassenger * paxCount;
      }

      const totalTPBeforeCPA = basicTP + ppTP;
      tpRows.push({ label: 'Basic TP Cover', qty: years + ' yr', rate: basicTP, value: totalTPBeforeCPA, group: 'tp' });
      tpRun += totalTPBeforeCPA;

      if (ppTP > 0) {
        tpRows.push({ label: 'TP for Passengers', qty: paxCount, rate: perPassenger, value: ppTP, group: 'tp' });
      }

      if (cpaInTP > 0) {
        if (!isCommercial) {
          const perYr = cpaYearsUsed > 0 ? (cpaInTP / cpaYearsUsed) : cpaInTP;
          tpRows.push({ label: 'CPA (Owner-Driver PA)', qty: cpaYearsUsed + ' yr', rate: perYr, value: cpaInTP, group: 'tp', detail: cpaNote || 'Opted' });
        } else {
          tpRows.push({ label: 'CPA (Owner-Driver PA)', qty: cpaYearsUsed + ' yr', rate: 320, value: cpaInTP, group: 'tp', detail: cpaNote || 'Opted' });
        }
        tpRun += cpaInTP;
      } else if (cpaAvailable > 0) {
        tpRows.push({ label: 'CPA (Owner-Driver PA)', qty: years + ' yr', rate: cpaAvailable / years, value: 0, group: 'tp', detail: cpaNote || 'Not opted', muted: true });
      }

      if (inputs.llCount > 0) {
        const isLLCommercial = ['taxi','auto','schoolBus','staffBus','pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].includes(inputs.vehicleType);
        const llRate = isLLCommercial ? TP_FLAT.llEmployeeCommercial.perYear : TP_FLAT.llEmployee.perYear;
        const llEmp = inputs.llCount * llRate * years;
        tpRows.push({ label: 'LL to Employees', qty: inputs.llCount + ' × ' + years + ' yr', rate: llRate, value: llEmp, group: 'tp' });
        tpRun += llEmp;
      }

      if (inputs.llPaid > 0) {
        const isLLCommercial = ['taxi','auto','schoolBus','staffBus','pccvSmall','pccvMedium','pccvLarge','pccvExtraLarge'].includes(inputs.vehicleType);
        const llRate = isLLCommercial ? TP_FLAT.llPaidDrvCommercial.perYear : TP_FLAT.llPaidDrv.perYear;
        const llPaid = inputs.llPaid * llRate * years;
        tpRows.push({ label: 'LL to Paid Driver / NFPP', qty: inputs.llPaid + ' × ' + years + ' yr', rate: llRate, value: llPaid, group: 'tp' });
        tpRun += llPaid;
      }

      const isGCCV_TP = inputs.vehicleType === 'gccv';
      if (inputs.covers.cngKit && (inputs.fuelType === 'CNG' || inputs.fuelType === 'LPG' || isGCCV_TP)) {
        const cngTP = TP_FLAT.cngTP_PerLakh;
        tpRows.push({ label: 'CNG Cover – TP', qty: 1, rate: cngTP, value: cngTP, group: 'tp', detail: 'Flat premium' });
        tpRun += cngTP;
      }

      if (inputs.covers.geoExtTP) {
        const geoTP = 100;
        tpRows.push({ label: 'Geographical Extension (TP)', qty: 1, rate: geoTP, value: geoTP, group: 'tp', detail: 'Fixed premium' });
        tpRun += geoTP;
      }

      if (inputs.covers.passPa && inputs.seating > 1) {
        const passengerCount = Math.max(0, inputs.seating - 1);
        // SI per person from selector (₹1 lakh or ₹2 lakh)
        const passPaSIEl = $('passPaSI');
        const siPerPerson = passPaSIEl ? (Number(passPaSIEl.value) || 100000) : 100000;
        const paRatePerPerson = round((siPerPerson / 100000) * TP_FLAT.passPA.ratePerLakh);
        const passPA = passengerCount * paRatePerPerson * years;
        tpRows.push({
          label: 'PA Un-named Passengers',
          qty: passengerCount + ' × ' + years + ' yr',
          rate: paRatePerPerson,
          value: passPA,
          group: 'tp',
          detail: `SI ${fmt(siPerPerson)} per person @ ₹${TP_FLAT.passPA.ratePerLakh}/lakh/yr`
        });
        tpRun += passPA;
      }

      tpTotal = Math.max(0, round(tpRun));
      tpRows.push({ label: 'TP TOTAL', qty: '', rate: '', value: tpTotal, group: 'tpTotal', bold: true });
    } else {
      tpRows.push({ label: 'TP not applicable for this policy type', qty: '', rate: '', value: 0, group: 'tpTotal', bold: true, muted: true });
    }

    /* ============================================================
       C.  GST + Net
       ============================================================ */
    const totalPremium = odTotal + tpTotal;
    let odGstRate, tpGstRate;
    let odGstAmt = 0, tpGstAmt = 0;
    let gstAmt = 0;
    let gstSplit = false;
    let tpBasicGstAmt = 0, tpAddonsGstAmt = 0;
    const isGCCV = (inputs.vehicleType === 'gccv' || inputs.vehicleType === 'gccv3w');

    if (isGCCV) {
      gstSplit = true;
      odGstRate = 18;
      tpGstRate = 5;
      const tpGstBasicOnly = true;
      odGstAmt = round(odTotal * odGstRate / 100);
      if (tpGstBasicOnly && typeof basicTP !== 'undefined' && basicTP > 0) {
        const basicTpValue = Math.min(basicTP, tpTotal);
        const tpAddonsValue = Math.max(0, tpTotal - basicTpValue);
        tpBasicGstAmt = round(basicTpValue * tpGstRate / 100);
        tpAddonsGstAmt = round(tpAddonsValue * 18 / 100);
        tpGstAmt = tpBasicGstAmt + tpAddonsGstAmt;
      } else {
        tpGstAmt = round(tpTotal * tpGstRate / 100);
      }
      gstAmt = odGstAmt + tpGstAmt;
    } else {
      odGstRate = inputs.gst;
      tpGstRate = inputs.gst;
      gstAmt = round(totalPremium * inputs.gst / 100);
      odGstAmt = includesOD ? round(odTotal * odGstRate / 100) : 0;
      tpGstAmt = includesTP ? round(tpTotal * tpGstRate / 100) : 0;
    }

    const net = round(totalPremium + gstAmt);

    /* ---- Commission (w.e.f 01.07.2026 CIRCULAR-8811):
           OD premium × odRate%  +  TP premium × tpRate% ---- */
    const commRates = getCommissionRates(inputs.vehicleType, inputs.policyType, age, inputs.cc, inputs.uwDiscount, inputs.state);
    const commissionOD = round(odTotal * commRates.od / 100);
    const commissionTP = round(tpTotal * commRates.tp / 100);
    const commission = commissionOD + commissionTP;

    lastResult = {
      inputs, odRows: rows, tpRows: tpRows,
      odTotal, tpTotal, totalPremium, gstAmt, net,
      commission, commissionOD, commissionTP,
      commissionOdRate: commRates.od, commissionTpRate: commRates.tp,
      commissionNote: commRates.note || '',
      basicRate, policyMeta, years,
      includesOD, includesTP,
      gstSplit,
      odGstRate, tpGstRate,
      odGstAmt, tpGstAmt,
      tpBasicGstAmt, tpAddonsGstAmt,
      isGCCV,
      age // expose age for quotation
    };

    renderResults(lastResult);
    renderQuotation(lastResult);
    if (typeof updateGccvPreview === 'function') updateGccvPreview();
  }

  /* ============================================================
     7.  Render · Calculator panel
     ============================================================ */
  function renderResults(r) {
    const fmtNum = (n) => Math.round(n).toLocaleString('en-IN');
    $('netAmount').textContent = fmtNum(r.net);
    $('odTotal').textContent = fmt(r.odTotal);
    $('tpTotal').textContent = fmt(r.tpTotal);
    $('gstAmt').textContent = fmt(r.gstAmt);

    $('totalPremium').textContent = fmt(r.totalPremium);
    if ($('commission')) $('commission').textContent = fmt(r.commission);
    if ($('commissionDetail')) {
      let commDetailText = '(OD ' + r.commissionOdRate + '% + TP ' + r.commissionTpRate + '%)';
      if (r.commissionNote) commDetailText += ' — ' + r.commissionNote;
      $('commissionDetail').textContent = commDetailText;
    }
    $('basicRateDisplay').textContent = r.basicRate ? r.basicRate.toFixed(3) + ' %' : '—';

    $('odTotal2').textContent = fmt(r.odTotal);
    $('tpTotal2').textContent = fmt(r.tpTotal);
    $('totalPremium2').textContent = fmt(r.totalPremium);
    $('gstAmt2').textContent = fmt(r.gstAmt);
    $('netAmount2').textContent = fmt(r.net);

    // --- GCCV SPLIT GST DISPLAY ---
    if (r.isGCCV) {
      const isBasicOnly = (r.tpBasicGstAmt > 0 || r.tpAddonsGstAmt > 0);
      if (isBasicOnly) {
        if ($('gstPct')) $('gstPct').textContent = `OD 18% | B.TP 5% | Add 18%`;
        if ($('gstPct2')) $('gstPct2').textContent = `OD 18% | Basic TP 5% | Add-ons 18%`;
      } else {
        if ($('gstPct')) $('gstPct').textContent = `${r.odGstRate} OD / ${r.tpGstRate} TP`;
        if ($('gstPct2')) $('gstPct2').textContent = `${r.odGstRate} OD / ${r.tpGstRate} TP`;
      }
      const gstAmtEl = $('gstAmt');
      if (gstAmtEl) {
        if (isBasicOnly) {
          gstAmtEl.title = `OD GST 18% = ${fmt(r.odGstAmt)} | Basic TP GST 5% = ${fmt(r.tpBasicGstAmt)} | TP Add-ons GST 18% = ${fmt(r.tpAddonsGstAmt)}`;
        } else {
          gstAmtEl.title = `OD GST ${r.odGstRate}% = ${fmt(r.odGstAmt)} | TP GST ${r.tpGstRate}% = ${fmt(r.tpGstAmt)}`;
        }
      }
      const gstAmt2El = $('gstAmt2');
      if (gstAmt2El) {
        if (isBasicOnly) {
          gstAmt2El.title = `OD GST 18% = ${fmt(r.odGstAmt)} | Basic TP GST 5% = ${fmt(r.tpBasicGstAmt)} | TP Add-ons GST 18% = ${fmt(r.tpAddonsGstAmt)}`;
        } else {
          gstAmt2El.title = `OD GST ${r.odGstRate}% = ${fmt(r.odGstAmt)} | TP GST ${r.tpGstRate}% = ${fmt(r.tpGstAmt)}`;
        }
      }

      const finalTbody = document.querySelector('#netAmount2')?.closest('table')?.querySelector('tbody');
      if (finalTbody) {
        finalTbody.querySelectorAll('.gccv-gst-split').forEach(n=>n.remove());
        const gstRow = finalTbody.querySelector('tr:nth-last-child(2)');
        if (gstRow) {
          const odTr = document.createElement('tr');
          odTr.className = 'gccv-gst-split';
          odTr.style.fontSize = '11px';
          odTr.style.color = 'var(--text-2)';
          odTr.innerHTML = `<td style="padding-left:24px;">↳ OD GST @ ${r.odGstRate}%</td><td class="right num">${fmt(r.odGstAmt)}</td>`;
          
          const isBasicOnly = r.tpBasicGstAmt > 0 || r.tpAddonsGstAmt > 0;
          if (isBasicOnly) {
            const basicTpTr = document.createElement('tr');
            basicTpTr.className = 'gccv-gst-split';
            basicTpTr.style.fontSize = '11px';
            basicTpTr.style.color = '#047857';
            basicTpTr.style.fontWeight = '600';
            basicTpTr.innerHTML = `<td style="padding-left:24px;">↳ Basic TP GST @ ${r.tpGstRate}% ✅</td><td class="right num" style="color:#047857">${fmt(r.tpBasicGstAmt||0)}</td>`;
            const addonsTr = document.createElement('tr');
            addonsTr.className = 'gccv-gst-split';
            addonsTr.style.fontSize = '11px';
            addonsTr.style.color = 'var(--text-2)';
            addonsTr.innerHTML = `<td style="padding-left:24px;">↳ TP Add-ons GST @ 18% <span style="font-size:9px;color:#94a3b8">(LL, PA, CPA, CNG-TP, GeoExt)</span></td><td class="right num">${fmt(r.tpAddonsGstAmt||0)}</td>`;
            gstRow.insertAdjacentElement('afterend', addonsTr);
            gstRow.insertAdjacentElement('afterend', basicTpTr);
            gstRow.insertAdjacentElement('afterend', odTr);
          } else {
            const tpTr = document.createElement('tr');
            tpTr.className = 'gccv-gst-split';
            tpTr.style.fontSize = '11px';
            tpTr.style.color = 'var(--text-2)';
            tpTr.innerHTML = `<td style="padding-left:24px;">↳ TP GST @ ${r.tpGstRate}%</td><td class="right num">${fmt(r.tpGstAmt)}</td>`;
            gstRow.insertAdjacentElement('afterend', tpTr);
            gstRow.insertAdjacentElement('afterend', odTr);
          }
          const gstLabelCell = gstRow.querySelector('td:first-child');
          if (gstLabelCell) {
            if (isBasicOnly) {
              gstLabelCell.innerHTML = `<strong>GST Total</strong> <span style="font-size:10px;color:#b45309">— GCCV Split: OD 18% | Basic TP 5% | TP Add-ons 18%</span>`;
            } else {
              gstLabelCell.innerHTML = `<strong>GST Total</strong> <span style="font-size:10px;color:var(--text-3)">(OD ${r.odGstRate}% + TP ${r.tpGstRate}%)</span>`;
            }
          }
        }
      }
    } else {
      const displayedGst = (r.isGCCV && r.inputs.policyType === 'liability') ? 5 : r.inputs.gst;
      if ($('gstPct')) $('gstPct').textContent = displayedGst;
      if ($('gstPct2')) $('gstPct2').textContent = displayedGst;
      document.querySelectorAll('.gccv-gst-split').forEach(n=>n.remove());
      const finalTbody = document.querySelector('#netAmount2')?.closest('table')?.querySelector('tbody');
      if (finalTbody) {
        const gstRow = finalTbody.querySelector('tr:nth-last-child(2)');
        if (gstRow) {
          const labelCell = gstRow.querySelector('td:first-child');
          if (labelCell && !labelCell.innerHTML.includes('gstPct2')) {
            labelCell.innerHTML = `GST @ <span id="gstPct2">${r.inputs.gst}</span>%`;
          }
        }
      }
    }

    $('rowOdTotal').style.display = r.includesOD ? '' : 'none';
    $('rowTpTotal').style.display = r.includesTP ? '' : 'none';

    const vehLabel = VEHICLE_META[r.inputs.vehicleType]?.label || 'Pvt Car';
    const termLabel = r.years === 5 ? '5-Year' : (r.years === 3 ? '3-Year' : '1-Year');
    const polLabel = (r.inputs.policyType === 'bundle' && r.years === 3)
      ? 'Bundle Policy (3-Year)'
      : (r.inputs.policyType === 'bundle' && r.years === 5)
      ? 'Bundle Policy (5-Year)'
      : r.policyMeta.label + ' · ' + termLabel;
    $('badgeVehicle').textContent = vehLabel;
    $('badgePolicy').textContent = polLabel;

    // date badge
    const bd = $('badgeDates');
    if(bd && r.inputs.policyDate){
      bd.style.display='';
      bd.textContent = '📅 ' + formatDateDDMMYYYY(r.inputs.policyDate);
    }

    /* OD table */
    const odBody = $('odTable').querySelector('tbody');
    odBody.innerHTML = '';
    if (!r.includesOD) {
      odBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-3);">🚫 OD Premium not applicable — this is a Liability-Only policy.</td></tr>';
    } else {
      r.odRows.forEach((row) => {
        const tr = document.createElement('tr');
        if (row.bold) tr.classList.add('final-row');
        if (row.muted) tr.classList.add('muted');
        const sign = row.value > 0 ? '+ ' : (row.value < 0 ? '− ' : '');
        const valStr = row.value === 0 ? '—' : sign + fmt(Math.abs(row.value));
        const valClass = row.value < 0 ? 'negative' : (row.value > 0 ? 'positive' : '');
        const running = Math.max(0, runningSum(r.odRows, r.odRows.indexOf(row)));
        tr.innerHTML = `
          <td>
            <div class="label-cell">
              <span class="label-main">${row.label}</span>
              ${row.detail ? '<span class="label-detail">' + row.detail + '</span>' : ''}
            </div>
          </td>
          <td class="num">${row.detail || '—'}</td>
          <td class="right num ${valClass}">${valStr}</td>
          <td class="right num">${fmt(running)}</td>
        `;
        odBody.appendChild(tr);
      });
    }

    /* TP table */
    const tpBody = $('tpTable').querySelector('tbody');
    tpBody.innerHTML = '';
    if (!r.includesTP) {
      tpBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-3);">🚫 TP Premium not applicable — this is a Stand-alone OD policy.</td></tr>';
    } else {
      r.tpRows.forEach((row) => {
        const tr = document.createElement('tr');
        if (row.bold) tr.classList.add('final-row');
        if (row.muted) tr.classList.add('muted');
        const rate = row.rate ? fmt(row.rate) : '—';
        tr.innerHTML = `
          <td>
            <div class="label-cell">
              <span class="label-main">${row.label}</span>
              ${row.detail ? '<span class="label-detail">' + row.detail + '</span>' : ''}
            </div>
          </td>
          <td class="num">${row.qty !== undefined && row.qty !== '' ? row.qty : '—'}</td>
          <td class="num">${rate}</td>
          <td class="right num">${fmt(row.value)}</td>
        `;
        tpBody.appendChild(tr);
      });
    }

    const cbHide = $('calcBreakdown');
    if (cbHide) cbHide.style.display = 'none';
  }

  function runningSum(rows, idx) {
    let s = 0;
    for (let i = 0; i <= idx; i++) s += rows[i].value || 0;
    return Math.max(0, s);
  }

  /* ============================================================
     8.  Render · Quotation — DD-MM-YYYY
     ============================================================ */
  function renderQuotation(r) {
    const i = r.inputs;
    const todayStr = todayDDMMYYYY();
    if($('qDate')) $('qDate').textContent = todayStr;
    if($('qDateTop')) $('qDateTop').textContent = todayStr;
    if($('qGeneratedAt')) $('qGeneratedAt').textContent = todayStr + ' ' + new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});

    $('qVehicle').textContent = (VEHICLE_META[i.vehicleType]?.label || 'Pvt Car') + ' (' + i.cc + ' ' + (VEHICLE_META[i.vehicleType]?.unit || 'CC') + ')';
    $('qCc').textContent = i.cc + ' ' + (VEHICLE_META[i.vehicleType]?.unit || 'CC');
    $('qFuel').textContent = i.fuelType;
    const termLabel = r.years === 5 ? '5-Year' : (r.years === 3 ? '3-Year' : '1-Year');
    $('qPolicy').textContent = (i.policyType === 'bundle' && r.years === 3)
      ? 'Bundle Policy (3-Year)'
      : (i.policyType === 'bundle' && r.years === 5)
      ? 'Bundle Policy (5-Year)'
      : r.policyMeta.label + ' · ' + termLabel;

    // ===== DD-MM-YYYY DATES =====
    const dorFormatted = formatDateDDMMYYYY(i.dor) || '—';
    const policyStartFormatted = formatDateDDMMYYYY(i.policyDate) || '—';
    const policyEndFormatted = i.policyDate ? addYearsDDMMYYYY(i.policyDate, r.years) : '—';

    $('qDor').textContent = dorFormatted;
    if($('qPolicyStart')) $('qPolicyStart').textContent = policyStartFormatted;
    if($('qPolicyEnd')) $('qPolicyEnd').textContent = policyEndFormatted;

    // ===== INSURED NAME / REG. NO. / STATE =====
    if($('qInsuredName')) $('qInsuredName').textContent = (i.insuredName || '—');
    if($('qRegNo')) $('qRegNo').textContent = (i.regNo || '—');
    if($('qState')) $('qState').textContent = (i.state || '—');

    // Period label
    if($('qPeriodLabel')){
      $('qPeriodLabel').textContent = `Period: ${policyStartFormatted} → ${policyEndFormatted} (${r.years} yr)`;
    }
    // Age label
    if($('qAgeLabel') && r.age !== undefined){
      $('qAgeLabel').textContent = `Vehicle Age: ${r.age.toFixed(1)} yr`;
    }

    // GST % label — GCCV Liability-Only shows 5% (TP only); otherwise entered rate
    $('qGstPct').textContent = (r.isGCCV && i.policyType === 'liability') ? 5 : i.gst;

    $('qOdTotal').textContent = fmt(r.odTotal);
    $('qTpTotal').textContent = fmt(r.tpTotal);
    $('qTotal').textContent = fmt(r.totalPremium);
    $('qGst').textContent = fmt(r.gstAmt);
    $('qNet').textContent = fmt(r.net);

    /* GCCV GST Split display in quotation */
    if (r.isGCCV && r.gstSplit) {
      const gstRow = $('qGstRow');
      const gstSplitOd = $('qGstSplitOd');
      const gstSplitTp = $('qGstSplitTp');
      const gstSplitTpAddons = $('qGstSplitTpAddons');
      
      if (gstRow) {
        const isBasicOnly = (r.tpBasicGstAmt > 0 || r.tpAddonsGstAmt > 0);
        if (isBasicOnly) {
          gstRow.querySelector('td:first-child').innerHTML = `<strong>GST Total</strong> <span style="font-size:10px;color:#b45309">— OD 18% | Basic TP 5% | Add-ons 18%</span>`;
        } else {
          gstRow.querySelector('td:first-child').innerHTML = `<strong>GST Total</strong> <span style="font-size:10px;color:#64748b">(OD 18% + TP 5%)</span>`;
        }
      }
      
      if (gstSplitOd) {
        gstSplitOd.style.display = '';
        $('qGstOdAmt').textContent = fmt(r.odGstAmt);
      }
      
      if (gstSplitTp) {
        gstSplitTp.style.display = '';
        $('qGstTpAmt').textContent = fmt(r.tpGstAmt - (r.tpAddonsGstAmt || 0));
      }
      
      if (gstSplitTpAddons && r.tpAddonsGstAmt > 0) {
        gstSplitTpAddons.style.display = '';
        $('qGstTpAddonsAmt').textContent = fmt(r.tpAddonsGstAmt);
      }
    } else {
      // Hide GST split rows for non-GCCV
      if ($('qGstSplitOd')) $('qGstSplitOd').style.display = 'none';
      if ($('qGstSplitTp')) $('qGstSplitTp').style.display = 'none';
      if ($('qGstSplitTpAddons')) $('qGstSplitTpAddons').style.display = 'none';
    }

    /* Premium Summary box (clean document style) */
    if ($('qOdTotal2')) $('qOdTotal2').textContent = fmt(r.odTotal);
    if ($('qTpTotal2')) $('qTpTotal2').textContent = fmt(r.tpTotal);
    if ($('qGst2')) $('qGst2').textContent = fmt(r.gstAmt);
    if ($('qNet2')) $('qNet2').textContent = fmt(r.net);
    if ($('qGstPct2')) $('qGstPct2').textContent = (r.isGCCV && r.inputs.policyType === 'liability') ? 5 : r.inputs.gst;

    $('qRowOdTotal').style.display = r.includesOD ? '' : 'none';
    $('qRowTpTotal').style.display = r.includesTP ? '' : 'none';
    $('qOdHead').textContent = r.includesOD ? 'Own Damage Premium (A)' : 'Own Damage Premium — Not Applicable';
    $('qTpHead').textContent = r.includesTP ? 'Liability Premium (B) — TP + PA' : 'Liability Premium — Not Applicable';

    /* OD table */
    const odBody = $('qOdTable').querySelector('tbody');
    odBody.innerHTML = '';
    if (!r.includesOD) {
      odBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-3);">Not applicable for Liability-Only policy</td></tr>';
    } else {
      r.odRows.forEach((row) => {
        const tr = document.createElement('tr');
        if (row.bold) tr.classList.add('final-row');
        const sign = row.value > 0 ? '+ ' : (row.value < 0 ? '− ' : '');
        const valStr = row.value === 0 ? '—' : sign + fmt(Math.abs(row.value));
        tr.innerHTML = `
          <td>
            <div class="label-cell">
              <span class="label-main">${row.label}</span>
              ${row.detail ? '<span class="label-detail">' + row.detail + '</span>' : ''}
            </div>
          </td>
          <td class="num">${row.detail || '—'}</td>
          <td class="right num">${valStr}</td>
        `;
        odBody.appendChild(tr);
      });
    }

    /* TP table */
    const tpBody = $('qTpTable').querySelector('tbody');
    tpBody.innerHTML = '';
    if (!r.includesTP) {
      tpBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-3);">Not applicable for Stand-alone OD policy</td></tr>';
    } else {
      r.tpRows.forEach((row) => {
        const tr = document.createElement('tr');
        if (row.bold) tr.classList.add('final-row');
        if (row.muted) tr.classList.add('muted');
        const rate = row.rate ? fmt(row.rate) : '—';
        tr.innerHTML = `
          <td>
            <div class="label-cell">
              <span class="label-main">${row.label}</span>
              ${row.detail ? '<span class="label-detail">' + row.detail + '</span>' : ''}
            </div>
          </td>
          <td class="num">${row.qty !== undefined && row.qty !== '' ? row.qty : '—'}</td>
          <td class="num">${rate}</td>
          <td class="right num">${fmt(row.value)}</td>
        `;
        tpBody.appendChild(tr);
      });
    }

    if (!$('quoteNumber').dataset.locked) {
      let seq = parseInt(localStorage.getItem('quoteSeq') || '0', 10);
      if (isNaN(seq) || seq < 0) seq = 0;
      seq = seq + 1;
      localStorage.setItem('quoteSeq', String(seq));
      $('quoteNumber').textContent = String(seq).padStart(4, '0');
    }
  }

  /* ============================================================
     8.5. Vehicle Category Mapping
     ============================================================ */
  const vehicleCategoryMapping = {
    privateCar: [
      { value: 'pvtCar', label: 'Private Car (Petrol / Diesel)' },
      { value: 'evPvtCar', label: 'Electric Pvt Car' }
    ],
    twoWheeler: [
      { value: 'twoWheeler', label: 'Two Wheeler (2W)' },
      { value: 'evTwoWheeler', label: 'Electric 2-Wheeler' }
    ],
    taxi: [
      { value: 'taxi', label: 'Taxi / PCCV (≤6 seats)' }
    ],
    pccv: [
      { value: 'schoolBus', label: 'School Bus' },
      { value: 'staffBus', label: 'Staff Bus' },
      { value: 'pccvSmall', label: 'PCCV (6–17 seats)' },
      { value: 'pccvMedium', label: 'PCCV (17–34 seats)' },
      { value: 'pccvLarge', label: 'PCCV (34–60 seats)' },
      { value: 'pccvExtraLarge', label: 'PCCV (>60 seats)' }
    ],
    classD: [
      { value: 'ambulance', label: 'Ambulance' },
      { value: 'miscD', label: 'Misc – Domestic (MISC D)' }
    ],
    gccv: [
      { value: 'gccv', label: 'Goods Vehicle – GCCV (by GVW)' }
    ],
    gccv3w: [
      { value: 'gccv3w', label: 'GCCV 3-Wheeler (Goods Carrier)' }
    ],
    auto: [
      { value: 'auto', label: 'Auto Rickshaw (3W)' }
    ]
  };

  function updateVehicleCategories() {
    const parentType = $('parentVehicleType').value;
    const categories = vehicleCategoryMapping[parentType] || [];
    const catSelect = $('vehicleType');

    const currentVal = catSelect.value;

    catSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select --';
    placeholder.disabled = true;
    catSelect.appendChild(placeholder);

    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.value;
      opt.textContent = cat.label;
      catSelect.appendChild(opt);
    });

    if (categories.some(c => c.value === currentVal) && currentVal !== '') {
      catSelect.value = currentVal;
    } else {
      catSelect.value = '';
    }

    updateCCLabel();
    updatePolicySections();
  }

  /* ============================================================
     8.7. U/W DISCOUNT AUTO-PICK (w.e.f. 01-06-2026 structure)
     - Auto-fills max "Upto" % based on vehicle type, CC/GVW/seats,
       age, NCB (>=20% = With NCB), IDV band, Brand New & SAOD.
     - Field remains editable; user can lower it manually.
     ============================================================ */
  let uwManuallyEdited = false;

  function autoPickUWDiscount() {
    const uwEl = $('uwDiscount');
    if (!uwEl) return;
    const vt = $('vehicleType').value;
    if (!vt || typeof getUWDiscountAuto !== 'function') return;

    const dorV = $('dor').value.trim();
    const pdV  = $('policyDate').value.trim();
    let age = 0, brandNew = false;
    if (dorV && pdV && isValidDDMMYYYY(dorV) && isValidDDMMYYYY(pdV)) {
      age = calcAge(pdV, dorV);
      /* Brand New = DOR same as Policy Start Date */
      brandNew = (formatDateDDMMYYYY(dorV) === formatDateDDMMYYYY(pdV));
    } else {
      return; // dates incomplete — wait
    }

    const r = getUWDiscountAuto({
      vehicleType: vt,
      cc:          Number($('cc').value) || 0,
      seating:     Number($('seating').value) || 0,
      idv:         Number($('idv').value) || 0,
      age:         age,
      ncb:         Number($('ncb').value) || 0,
      policyType:  $('policyType').value,
      brandNew:    brandNew,
      isEV:        ($('isElectric').value === 'Yes' || ['evPvtCar','evTwoWheeler'].includes(vt))
    });
    if (!r) return;

    if (!uwManuallyEdited) {
      uwEl.value = r.pct;
    }
    /* hint below the field */
    let hint = document.getElementById('uwAutoHint');
    if (!hint) {
      hint = document.createElement('span');
      hint.id = 'uwAutoHint';
      hint.style.cssText = 'font-size:10px;color:#2563eb;margin-top:2px;display:block;';
      uwEl.parentElement.appendChild(hint);
    }
    hint.textContent = '✓ Auto: max ' + r.pct + '% — ' + r.note + (uwManuallyEdited ? ' (manual value in use)' : '');
    /* warn if user exceeds allowed max */
    const cur = Number(uwEl.value) || 0;
    if (cur > r.pct) {
      hint.textContent = '⚠️ Max allowed ' + r.pct + '% (' + r.note + ') — entered ' + cur + '%';
      hint.style.color = '#dc2626';
    } else {
      hint.style.color = '#2563eb';
    }
  }

  /* re-pick on relevant field changes */
  ['vehicleType','cc','seating','ncb','idv','policyType','isElectric','dor','policyDate'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('change', () => { uwManuallyEdited = false; autoPickUWDiscount(); });
    if (el.tagName === 'INPUT') el.addEventListener('input', () => { uwManuallyEdited = false; autoPickUWDiscount(); });
  });
  /* manual typing in uwDiscount = user override */
  if ($('uwDiscount')) {
    $('uwDiscount').addEventListener('input', () => { uwManuallyEdited = true; autoPickUWDiscount(); });
  }

  /* ============================================================
     9.  Buttons / bindings + DATE INPUT BINDING (DD-MM-YYYY)
     ============================================================ */

  // --- Date input mask & validation ---
  function bindDateInput(id){
    const el = $(id);
    if(!el) return;
    el.setAttribute('placeholder','DD-MM-YYYY');
    el.setAttribute('maxlength','10');
    el.setAttribute('inputmode','numeric');
    el.addEventListener('input', function(e){
      let v = e.target.value.replace(/[^\d]/g,'').slice(0,8);
      let out = '';
      if(v.length >= 1) out = v.slice(0,2);
      if(v.length >= 3) out += '-' + v.slice(2,4);
      if(v.length >= 5) out += '-' + v.slice(4,8);
      e.target.value = out;
      // live validation styling
      if(out.length===10){
        if(isValidDDMMYYYY(out)){
          el.classList.remove('is-invalid'); el.classList.add('is-valid');
        } else {
          el.classList.remove('is-valid'); el.classList.add('is-invalid');
        }
      } else {
        el.classList.remove('is-valid','is-invalid');
      }
    });
    el.addEventListener('blur', function(){
      const v = el.value.trim();
      if(!v) { el.classList.remove('is-valid','is-invalid'); return; }
      // try to normalize separators
      let norm = v.replace(/\//g,'-').replace(/\./g,'-');
      // if user typed YYYY-MM-DD, convert
      if(/^\d{4}-\d{2}-\d{2}$/.test(norm)){
        norm = formatDateDDMMYYYY(norm);
        el.value = norm;
      }
      if(isValidDDMMYYYY(norm)){
        el.value = formatDateDDMMYYYY(norm); // normalize padding
        el.classList.remove('is-invalid'); el.classList.add('is-valid');
      } else {
        el.classList.remove('is-valid'); el.classList.add('is-invalid');
      }
    });
    // paste handler
    el.addEventListener('paste', function(e){
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const cleaned = pasted.replace(/[^\d]/g,'').slice(0,8);
      let out = cleaned;
      if(cleaned.length>4) out = cleaned.slice(0,2)+'-'+cleaned.slice(2,4)+'-'+cleaned.slice(4);
      else if(cleaned.length>2) out = cleaned.slice(0,2)+'-'+cleaned.slice(2);
      el.value = out;
      el.dispatchEvent(new Event('input'));
    });
  }

  bindDateInput('dor');
  bindDateInput('policyDate');

  // Today button
  const todayBtn = $('todayBtn');
  if(todayBtn){
    todayBtn.addEventListener('click', function(e){
      e.preventDefault();
      const pd = $('policyDate');
      if(pd){
        pd.value = todayDDMMYYYY();
        pd.classList.remove('is-invalid'); pd.classList.add('is-valid');
      }
    });
  }

  if ($('parentVehicleType')) {
    $('parentVehicleType').addEventListener('change', updateVehicleCategories);
  }

  /* Calculate Premium — ONLY trigger point for running the calculation */
  $('calcBtn').addEventListener('click', () => {
    if (!validateInputs()) return;
    runCalc();
  });

  $('gotoQuote').addEventListener('click', () => {
    $$('.nav-item').forEach((x) => x.classList.remove('active'));
    $$('.tab-content').forEach((x) => x.classList.remove('active'));
    document.querySelector('[data-tab="quote"]').classList.add('active');
    $('tab-quote').classList.add('active');
  });
  $('quoteBack').addEventListener('click', () => {
    $$('.nav-item').forEach((x) => x.classList.remove('active'));
    $$('.tab-content').forEach((x) => x.classList.remove('active'));
    document.querySelector('[data-tab="calc"]').classList.add('active');
    $('tab-calc').classList.add('active');
  });
  // printQuote bound later to 1-page visual PDF download (not browser print)
  
  $('shareQuote').addEventListener('click', () => {
    if (!lastResult) {
      alert('Please calculate premium first before sharing/exporting.');
      return;
    }
    const m = $('shareModal');
    if (m) m.style.display = 'flex';
  });

  /* ---- Share modal wiring ---- */
  const shareModalEl = $('shareModal');
  if (shareModalEl) {
    shareModalEl.addEventListener('click', (e) => {
      if (e.target === shareModalEl) shareModalEl.style.display = 'none';
    });
  }
  if ($('shareCancel')) {
    $('shareCancel').addEventListener('click', () => {
      if (shareModalEl) shareModalEl.style.display = 'none';
    });
  }

  function buildShareText(r) {
    const i = r.inputs;
    const today = todayDDMMYYYY();
    const qNo = $('quoteNumber') ? $('quoteNumber').textContent : '0001';
    return `🏢 *ORIENTAL INSURANCE - Motor Premium Quotation*\n\n📋 Quotation No: ${qNo}\n📅 Date: ${today}\n\n🚗 *Vehicle Details:*\n• Type: ${VEHICLE_META[i.vehicleType]?.label || 'Pvt Car'}\n• ${VEHICLE_META[i.vehicleType]?.unit || 'CC'}: ${i.cc}\n• Fuel: ${i.fuelType}\n• Zone: ${i.zone}
• Insured Name: ${i.insuredName || '—'}
• Reg. No.: ${i.regNo || '—'}\n\n📊 *Premium Breakdown:*\n• Own Damage (OD): ₹${r.odTotal.toLocaleString('en-IN')}\n• Third Party (TP): ₹${r.tpTotal.toLocaleString('en-IN')}\n• GST: ₹${r.gstAmt.toLocaleString('en-IN')}\n• *Net Premium: ₹${r.net.toLocaleString('en-IN')}*\n\n📅 Policy: ${r.policyMeta.label} (${r.years} Year)\n\n_This is an indicative quotation. Final premium subject to inspection & underwriting._`;
  }

  function buildShareEmail(r) {
    const i = r.inputs;
    const today = todayDDMMYYYY();
    const qNo = $('quoteNumber') ? $('quoteNumber').textContent : '0001';
    const subject = `Motor Premium Quotation - Oriental Insurance (${qNo})`;
    const body =
`Dear Customer,

Please find below the indicative premium quotation from The Oriental Insurance Company Ltd.

Quotation No : ${qNo}
Date         : ${today}
Vehicle      : ${VEHICLE_META[i.vehicleType]?.label || 'Pvt Car'} (${VEHICLE_META[i.vehicleType]?.unit || 'CC'}: ${i.cc}, Fuel: ${i.fuelType}, Zone: ${i.zone})
Policy       : ${r.policyMeta.label} (${r.years} Year)

Premium Breakdown:
- Own Damage (OD) : Rs. ${r.odTotal.toLocaleString('en-IN')}
- Third Party (TP): Rs. ${r.tpTotal.toLocaleString('en-IN')}
- GST             : Rs. ${r.gstAmt.toLocaleString('en-IN')}
- Net Premium     : Rs. ${r.net.toLocaleString('en-IN')}

This is an indicative quotation. Final premium is subject to inspection & underwriting.

Regards,
Oriental Insurance`;
    return { subject, body };
  }

  /* ============================================================
     SHARE AS PDF — same visual layout as Quotation tab (#quoteDoc)
     ONE PAGE A4 — full quote scaled to fit a single A4 sheet.
     NEVER falls back to plain text share.
     ============================================================ */
  function pdfEscape(s){ return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  function sanitizeAscii(s){ return String(s).replace(/₹/g,'Rs.').replace(/[–—]/g,'-').replace(/[^\x20-\x7E]/g,''); }

  function downloadPDFBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }

  /* Compact CSS — designed so full quotation fits cleanly on 1 A4 page */
  function getQuotePrintCSS() {
    return `
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #0a2540; }
      .quote-doc { width: 794px; padding: 14px 18px 12px; background: #fff; position: relative; }
      .quote-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2.5px solid #0a2540; }
      .logo-circle { width: 34px; height: 34px; border-radius: 50%; background: #0a2540; color: #fbbf24; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; margin-bottom: 3px; }
      .brand-title { font-size: 13px; font-weight: 800; color: #0a2540; letter-spacing: 0.2px; }
      .quote-no { text-align: right; }
      .quote-no-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
      .quote-num { font-size: 22px; font-weight: 800; color: #0a2540; line-height: 1.05; }
      .quote-summary { background: #0a2540; color: #fff; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; }
      .qs-title { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.6); font-weight: 700; margin-bottom: 6px; }
      .qs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .qs-item { display: flex; flex-direction: column; gap: 2px; }
      .qs-item span { font-size: 9px; color: rgba(255,255,255,0.55); font-weight: 600; }
      .qs-item b { font-size: 13px; font-weight: 800; color: #fff; }
      .qs-grand { border-left: 2px solid rgba(245,158,11,0.6); padding-left: 10px; }
      .qs-grand span { color: #fbbf24 !important; }
      .qs-grand b { color: #fbbf24 !important; font-size: 14px !important; }
      .quote-meta { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; margin-bottom: 6px; font-size: 10px; }
      .quote-meta strong { display: block; font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1px; }
      .quote-meta span { color: #0a2540; font-weight: 600; }
      .chip-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; font-size: 9px; }
      .chip { padding: 2px 8px; border-radius: 6px; font-weight: 600; border: 1px solid; }
      .chip-g { background: #f0fdf4; border-color: #bbf7d0; color: #065f46; }
      .chip-o { background: #fff7ed; border-color: #fde68a; color: #92400e; }
      .chip-b { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
      h3.sec { font-size: 11px; font-weight: 800; color: #0a2540; margin: 8px 0 3px; padding-bottom: 2px; border-bottom: 1.5px solid #e2e8f0; }
      table.bt { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 4px; }
      table.bt th { background: #f1f5f9; color: #475569; text-align: left; padding: 3px 5px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1.5px solid #cbd5e1; }
      table.bt th.right, table.bt td.right { text-align: right; white-space: nowrap; }
      table.bt td { padding: 2.5px 5px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #0f172a; }
      table.bt .muted { opacity: 0.45; }
      table.bt .final-row td { font-weight: 700; background: #f8fafc; }
      .label-main { font-weight: 700; display: block; line-height: 1.2; }
      .label-detail { font-size: 7.5px; color: #64748b; display: block; margin-top: 0; line-height: 1.2; }
      table.ft { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
      table.ft td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
      table.ft td.right { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
      table.ft tr.bold td { font-weight: 800; background: #f8fafc; }
      table.ft tr.grand td { background: #0a2540; color: #fff; font-weight: 800; font-size: 12px; border: none; }
      table.ft tr.grand td:last-child { color: #fbbf24; font-size: 13px; }
      .quote-foot { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
      .sig-block { flex: 1; font-size: 8.5px; color: #64748b; }
      .sig-line { border-bottom: 1px solid #94a3b8; height: 22px; margin-top: 2px; }
      .doc-watermark { position: absolute; inset: 0; z-index: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='280'%20height='180'%3E%3Ctext%20x='8'%20y='105'%20transform='rotate(-35%208%20105)'%20font-family='Arial,sans-serif'%20font-size='36'%20font-weight='bold'%20fill='%230f172a'%20fill-opacity='0.06'%3EOICL%3C/text%3E%3C/svg%3E"); background-repeat: repeat; background-size: 280px 180px; }
      .quote-doc > *:not(.doc-watermark) { position: relative; z-index: 1; }
      .disclaimer { margin-top: 8px; font-size: 7.5px; color: #64748b; line-height: 1.35; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    `;
  }

  /* Build standalone HTML that matches Quotation tab content from lastResult + live DOM values */
  function buildQuoteHTMLForPDF(r) {
    const i = r.inputs;
    const qNo = ($('quoteNumber') ? $('quoteNumber').textContent : '0001');
    const today = todayDDMMYYYY();
    const dor = formatDateDDMMYYYY(i.dor) || ($('qDor') ? $('qDor').textContent : '—');
    const pStart = formatDateDDMMYYYY(i.policyDate) || ($('qPolicyStart') ? $('qPolicyStart').textContent : '—');
    const pEnd = i.policyDate ? addYearsDDMMYYYY(i.policyDate, r.years) : ($('qPolicyEnd') ? $('qPolicyEnd').textContent : '—');
    const veh = (VEHICLE_META[i.vehicleType]?.label || 'Pvt Car') + ' (' + i.cc + ' ' + (VEHICLE_META[i.vehicleType]?.unit || 'CC') + ')';
    const termLabel = r.years === 5 ? '5-Year' : (r.years === 3 ? '3-Year' : '1-Year');
    const polLabel = (i.policyType === 'bundle' && r.years === 3)
      ? 'Bundle Policy (3-Year)'
      : (i.policyType === 'bundle' && r.years === 5)
      ? 'Bundle Policy (5-Year)'
      : (r.policyMeta.label + ' · ' + termLabel);
    const ageTxt = (r.age !== undefined) ? r.age.toFixed(1) + ' yr' : '—';
    const gstPct = (r.isGCCV && i.policyType === 'liability') ? 5 : i.gst;

    function money(n) {
      return 'Rs. ' + Math.round(n).toLocaleString('en-IN');
    }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    let odRowsHtml = '';
    if (!r.includesOD) {
      odRowsHtml = '<tr><td colspan="3" style="text-align:center;padding:16px;color:#94a3b8;">Not applicable for Liability-Only policy</td></tr>';
    } else {
      (r.odRows || []).forEach(row => {
        if (row.muted && row.value === 0) return;
        const sign = row.value > 0 ? '+ ' : (row.value < 0 ? '- ' : '');
        const valStr = row.value === 0 ? '—' : sign + money(Math.abs(row.value));
        odRowsHtml += `<tr class="${row.bold ? 'final-row' : ''} ${row.muted ? 'muted' : ''}">
          <td><span class="label-main">${esc(row.label)}</span>${row.detail ? '<span class="label-detail">' + esc(row.detail) + '</span>' : ''}</td>
          <td>${esc(row.detail || '—')}</td>
          <td class="right">${esc(valStr)}</td>
        </tr>`;
      });
    }

    let tpRowsHtml = '';
    if (!r.includesTP) {
      tpRowsHtml = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#94a3b8;">Not applicable for Stand-alone OD policy</td></tr>';
    } else {
      (r.tpRows || []).forEach(row => {
        if (row.muted && row.value === 0) return;
        const rate = (row.rate !== undefined && row.rate !== '') ? money(row.rate) : '—';
        tpRowsHtml += `<tr class="${row.bold ? 'final-row' : ''} ${row.muted ? 'muted' : ''}">
          <td><span class="label-main">${esc(row.label)}</span>${row.detail ? '<span class="label-detail">' + esc(row.detail) + '</span>' : ''}</td>
          <td>${esc(row.qty !== undefined && row.qty !== '' ? row.qty : '—')}</td>
          <td>${esc(rate)}</td>
          <td class="right">${esc(money(row.value || 0))}</td>
        </tr>`;
      });
    }

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${getQuotePrintCSS()}</style></head><body>
      <div class="quote-doc" id="pdfRoot">
        <div class="doc-watermark" aria-hidden="true"></div>
        <div class="quote-head">
          <div>
            <div class="logo-circle">OIC</div>
            <div class="brand-title">ORIENTAL INSURANCE COMPANY LTD</div>
          </div>
          <div class="quote-no">
            <div class="quote-no-label">Quotation</div>
            <div class="quote-num">${esc(qNo)}</div>
            <div style="font-size:10px;color:#64748b;margin-top:4px;">Date: <b style="color:#0a2540;">${esc(today)}</b></div>
          </div>
        </div>

        <div class="quote-summary">
          <div class="qs-title">Premium Summary</div>
          <div class="qs-grid">
            <div class="qs-item"><span>Own Damage (OD)</span><b>${esc(money(r.odTotal))}</b></div>
            <div class="qs-item"><span>Third Party (TP)</span><b>${esc(money(r.tpTotal))}</b></div>
            <div class="qs-item"><span>GST @ ${esc(gstPct)}%</span><b>${esc(money(r.gstAmt))}</b></div>
            <div class="qs-item qs-grand"><span>Net Premium Payable</span><b>${esc(money(r.net))}</b></div>
          </div>
        </div>

        <div class="quote-meta">
          <div><strong>Insured Name</strong><span>${esc(i.insuredName || '—')}</span></div>
          <div><strong>Reg. No.</strong><span>${esc(i.regNo || '—')}</span></div>
          <div><strong>Quotation Date</strong><span>${esc(today)}</span></div>
          <div><strong>Vehicle</strong><span>${esc(veh)}</span></div>
          <div><strong>CC / GVW</strong><span>${esc(i.cc + ' ' + (VEHICLE_META[i.vehicleType]?.unit || 'CC'))}</span></div>
          <div><strong>Fuel</strong><span>${esc(i.fuelType)}</span></div>
          <div><strong>Policy Type</strong><span>${esc(polLabel)}</span></div>
          <div><strong>Reg. Date</strong><span>${esc(dor)}</span></div>
          <div><strong>Policy Start</strong><span style="color:#047857;font-weight:700;">${esc(pStart)}</span></div>
          <div><strong>Policy End</strong><span style="color:#b45309;font-weight:700;">${esc(pEnd)}</span></div>
        </div>

        <div class="chip-row">
          <span class="chip chip-g">All dates: DD-MM-YYYY</span>
          <span class="chip chip-o">Period: ${esc(pStart)} → ${esc(pEnd)} (${r.years} yr)</span>
          <span class="chip chip-b">Vehicle Age: ${esc(ageTxt)}</span>
        </div>

        <h3 class="sec">${r.includesOD ? 'Own Damage Premium (A)' : 'Own Damage Premium — Not Applicable'}</h3>
        <table class="bt">
          <thead><tr><th>Cover</th><th>Detail</th><th class="right">Premium</th></tr></thead>
          <tbody>${odRowsHtml}</tbody>
        </table>

        <h3 class="sec">${r.includesTP ? 'Liability Premium (B) — TP + PA' : 'Liability Premium — Not Applicable'}</h3>
        <table class="bt">
          <thead><tr><th>Cover</th><th>Quantity</th><th>Rate</th><th class="right">Premium</th></tr></thead>
          <tbody>${tpRowsHtml}</tbody>
        </table>

        <table class="ft">
          <tbody>
            ${r.includesOD ? `<tr><td>Own Damage Premium (A)</td><td class="right">${esc(money(r.odTotal))}</td></tr>` : ''}
            ${r.includesTP ? `<tr><td>Liability Premium (B)</td><td class="right">${esc(money(r.tpTotal))}</td></tr>` : ''}
            <tr class="bold"><td>Total Premium before GST</td><td class="right">${esc(money(r.totalPremium))}</td></tr>
            <tr><td>GST @ ${esc(gstPct)}%${r.isGCCV ? ' <span style="font-size:9px;color:#64748b">(OD 18% + TP 5%)</span>' : ''}</td><td class="right">${esc(money(r.gstAmt))}</td></tr>
            ${r.isGCCV && r.gstSplit ? `
              <tr style="font-size:9px;color:#64748b;"><td style="padding-left:20px;">↳ OD GST @ 18%</td><td class="right">${esc(money(r.odGstAmt))}</td></tr>
              <tr style="font-size:9px;color:#047857;font-weight:600;"><td style="padding-left:20px;">↳ TP GST @ 5%</td><td class="right" style="color:#047857;">${esc(money(r.tpGstAmt - (r.tpAddonsGstAmt || 0)))}</td></tr>
              ${r.tpAddonsGstAmt > 0 ? `<tr style="font-size:9px;color:#64748b;"><td style="padding-left:20px;">↳ TP Add-ons GST @ 18%</td><td class="right">${esc(money(r.tpAddonsGstAmt))}</td></tr>` : ''}
            ` : ''}
            <tr class="grand"><td>Net Premium Payable</td><td class="right">${esc(money(r.net))}</td></tr>
          </tbody>
        </table>

        <div class="quote-foot">
          <div class="sig-block"><div>Signature</div><div class="sig-line"></div></div>
          <div class="sig-block"><div>Name of Agent / Agency Code</div><div class="sig-line"></div></div>
          <div class="sig-block"><div>Branch / Divisional Manager</div><div class="sig-line"></div></div>
        </div>

        <div class="disclaimer">
          Disclaimer: Premiums computed are indicative and based on publicly notified IRDAI rates &amp;
          standard Oriental Insurance add-on loading factors. Final premium is subject to underwriting,
          inspection &amp; GST rules in force on the date of policy issuance.<br>
          <strong>All dates in this quotation are in DD-MM-YYYY format · Generated: ${esc(today)}</strong>
        </div>
      </div>
    </body></html>`;
  }

  /* Render HTML string into offscreen iframe, return full-height canvas of #pdfRoot */
  function renderHTMLToCanvas(html) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:860px;height:1200px;border:0;opacity:0;pointer-events:none;';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      const cleanup = () => { try { iframe.remove(); } catch (e) {} };

      // Wait for layout
      setTimeout(() => {
        try {
          const root = doc.getElementById('pdfRoot') || doc.body;
          const width = Math.max(root.scrollWidth, 794);
          const height = Math.max(root.scrollHeight, 400);
          // Size iframe to full content
          iframe.style.width = width + 'px';
          iframe.style.height = height + 'px';

          // Prefer html2canvas if available; else SVG foreignObject snapshot
          const doSvgSnap = () => {
            const clone = root.cloneNode(true);
            // Serialize with styles already in document
            const styleText = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');
            const serializer = new XMLSerializer();
            let inner = serializer.serializeToString(clone);
            // foreignObject needs XHTML
            const svg =
              `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
              `<foreignObject width="100%" height="100%">` +
              `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#fff;">` +
              `<style>${styleText}</style>${inner}</div></foreignObject></svg>`;

            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
              try {
                const scale = 2; // sharp PDF
                const canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(url);
                cleanup();
                resolve({ canvas, width, height });
              } catch (err) {
                URL.revokeObjectURL(url);
                cleanup();
                reject(err);
              }
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              cleanup();
              reject(new Error('SVG snapshot failed'));
            };
            img.src = url;
          };

          if (typeof window.html2canvas === 'function') {
            window.html2canvas(root, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: width,
              height: height,
              windowWidth: width,
              windowHeight: height
            }).then(canvas => {
              cleanup();
              resolve({ canvas, width, height });
            }).catch(() => doSvgSnap());
          } else {
            doSvgSnap();
          }
        } catch (err) {
          cleanup();
          reject(err);
        }
      }, 250);
    });
  }

  /* ONE-PAGE A4 PDF — scales entire quotation image to fit a single A4 sheet */
  function canvasToSinglePageA4PDF(canvas) {
    // A4 in PDF points (1 pt = 1/72 inch)
    const pageW = 595.28;
    const pageH = 841.89;
    const margin = 16; // tight margin so more content fits
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    // Fit FULL canvas onto ONE page (width + height)
    const scale = Math.min(contentW / canvas.width, contentH / canvas.height);
    const drawW = canvas.width * scale;
    const drawH = canvas.height * scale;
    // Centre horizontally, top-align with small offset
    const x = margin + (contentW - drawW) / 2;
    const y = pageH - margin - drawH; // PDF y is from bottom

    // Encode full canvas as JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.93);
    const b64 = dataUrl.split(',')[1];
    const bin = atob(b64);
    const jpeg = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i);

    function enc(str) {
      const a = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 0xff;
      return a;
    }

    const parts = [];
    let pos = 0;
    const offsets = [0];
    function add(u8) { parts.push(u8); pos += u8.length; }
    function addObj(num, bodyU8) {
      offsets[num] = pos;
      add(enc(num + ' 0 obj\n'));
      add(bodyU8);
      add(enc('\nendobj\n'));
    }

    add(enc('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n'));

    // 1 Catalog, 2 Pages, 3 Page, 4 Content, 5 Image
    addObj(1, enc('<< /Type /Catalog /Pages 2 0 R >>'));
    addObj(2, enc('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    addObj(3, enc(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH +
      '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>'
    ));

    const stream =
      'q\n' +
      drawW.toFixed(2) + ' 0 0 ' + drawH.toFixed(2) + ' ' +
      x.toFixed(2) + ' ' + y.toFixed(2) + ' cm\n' +
      '/Im0 Do\nQ\n';
    addObj(4, enc('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'));

    const hdr =
      '<< /Type /XObject /Subtype /Image /Width ' + canvas.width +
      ' /Height ' + canvas.height +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
      jpeg.length + ' >>\nstream\n';
    const ftr = '\nendstream';
    const imgBody = new Uint8Array(hdr.length + jpeg.length + ftr.length);
    imgBody.set(enc(hdr), 0);
    imgBody.set(jpeg, hdr.length);
    imgBody.set(enc(ftr), hdr.length + jpeg.length);
    addObj(5, imgBody);

    const xrefStart = pos;
    let xref = 'xref\n0 6\n';
    xref += '0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) {
      xref += String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n';
    }
    add(enc(xref));
    add(enc('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF'));

    let total = 0;
    parts.forEach(p => total += p.length);
    const out = new Uint8Array(total);
    let off = 0;
    parts.forEach(p => { out.set(p, off); off += p.length; });
    return new Blob([out], { type: 'application/pdf' });
  }

  // Alias kept for any older call sites
  function canvasToMultiPagePDF(canvas) {
    return canvasToSinglePageA4PDF(canvas);
  }

  /* Build 1-page A4 visual PDF blob of Quotation (NOT browser print) */
  async function buildOnePageQuotePDFBlob() {
    if (!lastResult) throw new Error('No calculation result');
    try { renderQuotation(lastResult); } catch (e) {}

    let canvas = null;

    // Always prefer standalone compact HTML (fits A4 one-page better than live DOM)
    try {
      const html = buildQuoteHTMLForPDF(lastResult);
      const snap = await renderHTMLToCanvas(html);
      canvas = snap.canvas;
    } catch (e1) {
      canvas = null;
    }

    // Fallback: capture live quotation DOM
    if (!canvas) {
      const liveDoc = $('quoteDoc');
      if (liveDoc && typeof window.html2canvas === 'function') {
        const tab = $('tab-quote');
        const wasHidden = tab && !tab.classList.contains('active');
        const prevDisplay = tab ? tab.style.display : '';
        if (wasHidden && tab) {
          tab.style.display = 'block';
          tab.style.position = 'absolute';
          tab.style.left = '-10000px';
          tab.style.top = '0';
          tab.style.width = '900px';
        }
        try {
          canvas = await window.html2canvas(liveDoc, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
        } catch (e) { canvas = null; }
        if (wasHidden && tab) {
          tab.style.display = prevDisplay;
          tab.style.position = '';
          tab.style.left = '';
          tab.style.top = '';
          tab.style.width = '';
        }
      }
    }

    if (!canvas) throw new Error('Could not render quotation canvas');
    return canvasToSinglePageA4PDF(canvas);
  }

  async function sharePDFFile(mode) {
    // mode: 'share' | 'download' — both use SAME one-page visual PDF
    // NEVER falls back to window.print() (print layout is unreliable)
    if (!lastResult) {
      alert('Please calculate premium first before sharing.');
      return;
    }

    const qNo = ($('quoteNumber') ? $('quoteNumber').textContent : '0001').replace(/[^\w-]/g, '') || '0001';
    const filename = 'OIC_Quotation_' + qNo + '.pdf';

    try {
      const blob = await buildOnePageQuotePDFBlob();
      const file = new File([blob], filename, { type: 'application/pdf', lastModified: Date.now() });

      if (mode === 'download') {
        downloadPDFBlob(blob, filename);
        if (shareModalEl) shareModalEl.style.display = 'none';
        return;
      }

      // Share mode: file only (no text)
      let shared = false;
      if (navigator.canShare) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            shared = true;
          }
        } catch (err) {
          if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
            shared = true; // user cancelled
          }
        }
      }

      if (!shared) {
        downloadPDFBlob(blob, filename);
        alert('1-Page A4 Quotation PDF downloaded as "' + filename + '".\n\nWhatsApp / Email se attach karke share karo.');
      }
    } catch (e) {
      console.error('PDF share failed', e);
      alert('Visual 1-page PDF ban nahi paya.\n\nInternet on karke dobara try karo (html2canvas load hona chahiye).\nPrint use mat karo — Share as PDF se hi sahi layout aata hai.');
    }
    if (shareModalEl) shareModalEl.style.display = 'none';
  }

  const spf = $('sharePdfFile');
  if (spf) spf.addEventListener('click', () => sharePDFFile('share'));
  if ($('sharePdf')) {
    // Same one-page visual PDF — download only (NOT browser print)
    $('sharePdf').addEventListener('click', () => sharePDFFile('download'));
  }

  // Quotation tab "Print Quotation" also downloads same 1-page visual PDF
  if ($('printQuote')) {
    $('printQuote').onclick = null;
    $('printQuote').addEventListener('click', () => {
      if (!lastResult) {
        alert('Please calculate premium first.');
        return;
      }
      sharePDFFile('download');
    });
  }

  /* These only update visible sections/UI hints — they do NOT auto-calculate anymore */
  $('policyType').addEventListener('change', () => { updatePolicySections(); });
  $('policyTerm').addEventListener('change', () => { });

  /* Initial setup */
  if ($('parentVehicleType')) {
    // Start with a blank Vehicle Category dropdown until user picks a Vehicle Type
    const catSelect = $('vehicleType');
    catSelect.innerHTML = '<option value="" selected disabled>-- Select --</option>';
  }

  updateCCLabel();
  updatePolicySections();
  updateAddOnVisibility();

  // Show a blank results panel until the user clicks Calculate Premium
  clearResults();

  // Set default policy start date = today DD-MM-YYYY (helpful)
  const pdEl = $('policyDate');
  if(pdEl && !pdEl.value){
    // leave blank initially to force user entry, but show hint via placeholder
    // uncomment next line to auto-fill:
    // pdEl.value = todayDDMMYYYY();
  }

  // Vehicle type change: only refresh UI sections, no auto-calculation
  $('vehicleType').addEventListener('change', () => {
    updateCCLabel();
    updatePolicySections();
    updateAddOnVisibility();
  });

  /* Req 2: when Fuel Type = CNG, auto-tick the CNG/Kit cover so the CNG TP
     premium is added automatically. Only in the CNG case — if the user later
     switches away from CNG we un-tick only the auto-applied selection. */
  let cngAutoChecked = false;
  const fuelEl = $('fuelType');
  if (fuelEl) {
    fuelEl.addEventListener('change', () => {
      const cngCb = $('cngKit');
      if (!cngCb) return;
      if (fuelEl.value === 'CNG') {
        if (!cngCb.disabled) {
          cngCb.checked = true;
          cngAutoChecked = true;
        }
      } else if (cngAutoChecked) {
        cngCb.checked = false;
        cngAutoChecked = false;
      }
    });
  }

  // Show/hide towing limit column dynamically (UI only, no auto-calc)
  const towingCb = $('towing');
  if (towingCb) {
    towingCb.addEventListener('change', () => {
      updateAddOnVisibility();
    });
  }

  // Show/hide Personal Belongings SI selector when checkbox toggled
  const persBelongCb = $('persBelong');
  if (persBelongCb) {
    persBelongCb.addEventListener('change', () => {
      const siField = $('persBelongSIField');
      if (siField) {
        siField.style.display = persBelongCb.checked ? '' : 'none';
      }
    });
  }

  // Show/hide PA Un-named Passengers SI selector when checkbox toggled
  const passPaCb = $('passPa');
  if (passPaCb) {
    passPaCb.addEventListener('change', () => {
      const siField = $('passPaSIField');
      if (siField) {
        siField.style.display = passPaCb.checked ? '' : 'none';
      }
    });
  }

  // CPA Term selector — show when Owner-Driver PA is checked on Bundle (Pvt Car / 2W)
  const odPaCb = $('odPa');
  if (odPaCb) {
    odPaCb.addEventListener('change', () => {
      updateCpaTermVisibility();
    });
  }
  // Policy / vehicle change already calls updateAddOnVisibility → updateCpaTermVisibility

  // --- Global date display sync ---
  function syncAllDateDisplays(){
    const dstr = todayDDMMYYYY();
    const rev = $('revisionDate'); if(rev) rev.textContent = dstr;
    const live = $('liveUpdateDate'); if(live) live.textContent = dstr;
    const qd = $('qDate'); if(qd && qd.textContent==='18-06-2026') qd.textContent = dstr;
    const qdt = $('qDateTop'); if(qdt) qdt.textContent = dstr;
    const qgen = $('qGeneratedAt'); if(qgen) qgen.textContent = dstr;
  }
  syncAllDateDisplays();

  console.log('%c✓ Motor Calculator V27.0 — DD-MM-YYYY ACTIVE', 'color:#fff;background:#0a2540;padding:6px 12px;border-radius:6px;font-weight:700;');
  console.log('Date parse test:', formatDateDDMMYYYY('2026-07-01'), '== 01-07-2026 ?', formatDateDDMMYYYY('2026-07-01')==='01-07-2026');

})();
