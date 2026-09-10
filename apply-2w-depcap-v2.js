#!/usr/bin/env node
/* =====================================================================
   V51.0 — 2W Dep Cap / Nil Depreciation: 3 CC buckets + 6-7 yrs + NCB gate
   ---------------------------------------------------------------------
   Schedule supplied by user (10-Sep-2026), % of IDV:

     Age        | 150CC to 350CC | Above 350
     -----------+----------------+-----------
     0-1 Year   |      0.25      |   0.40
     1-2 Year   |      0.40      |   0.50
     2-3 Year   |      0.60      |   0.70
     3-4 Year   |      0.70      |   0.80
     4-5 Year   |      0.90      |   1.20
     5-6 Year   |      1.20      |   1.30
     6-7 Year   |      1.40      |   1.50

   Mapping decision (documented in the code comment this patch writes):
     • Column A  0 – 150 CC   -> 0.25 / 0.40 / 0.60 / 0.70 / 0.90 / 1.20 / 1.40
       (the schedule's "150CC to 350CC" figures were already what the app charged
        for "upto 150 CC", so those numbers stay put for the lower band; the new
        middle column is inserted for 150 < CC <= 350, and "Above 350" is new)
     • Age > 5 yrs  -> eligible only if NCB >= 20%   (same gate as Pvt Car)
     • Age > 7 yrs  -> NOT AVAILABLE
     • EV 2W (KW):  <= 7 KW -> A,  >7 and <= 16 KW -> A,  > 16 KW -> B (150-350)
       (parity with the EV 2W OD slab structure: 0-3 / 3-7 / 7-16 / >16)

   Pvt Car / EV Car / all commercial vehicles: UNCHANGED.

   Usage:
     node tools/apply-2w-depcap-v2.js --dry-run    # preview, writes a copy only
     node tools/apply-2w-depcap-v2.js              # edits uploads/rates.js (+ .bak)
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'uploads', 'rates.js');
const DRY = process.argv.includes('--dry-run');

function replace(src, needle, withWhat, label) {
  const n = src.split(needle).length - 1;
  if (n !== 1) {
    console.error(`ERROR: anchor "${label}" matched ${n} times (expected exactly 1). Aborting — file NOT modified.`);
    process.exit(1);
  }
  return src.replace(needle, withWhat);
}

let src = fs.readFileSync(TARGET, 'utf8');
const original = src;
const done = [];

/* ---------------- 1. NIL_DEP_RATE.twoWheeler — three CC buckets ---------------- */
const OLD_TABLE = `  /* ---------- TWO WHEELER — CC-based, % of IDV ---------- */
  /* EV 2W uses Petrol 2W rates (KW threshold ~16 KW ≈ above 150 CC) */
  twoWheeler: {
    upto150: [
      { max: 1, rate: 0.25 },
      { max: 2, rate: 0.40 },
      { max: 3, rate: 0.60 },
      { max: 4, rate: 0.70 },
      { max: 5, rate: 0.90 },
      { max: Infinity, rate: 0 }      // >5 years — NOT AVAILABLE
    ],
    above150: [
      { max: 1, rate: 0.40 },
      { max: 2, rate: 0.50 },
      { max: 3, rate: 0.70 },
      { max: 4, rate: 0.80 },
      { max: 5, rate: 1.20 },
      { max: Infinity, rate: 0 }      // >5 years — NOT AVAILABLE
    ]
  },`;

const NEW_TABLE = `  /* ---------- TWO WHEELER — CC-based, % of IDV ----------
     Three CC buckets per the schedule in force:
       A: 0 – 150 CC            B: >150 – 350 CC        C: Above 350 CC
     Age bands run 0-1 … 6-7 yrs; above 7 yrs NOT AVAILABLE.
     Bands above 5 yrs require NCB >= 20% (checked in getNilDepRate /
     checkNilDepEligibility — same gate as Pvt Car).
     EV 2W uses these Petrol 2W rates (KW mapping in getNilDepRate). */
  twoWheeler: {
    ccUpto150: [          /* A — 0 to 150 CC */
      { max: 1, rate: 0.25 },
      { max: 2, rate: 0.40 },
      { max: 3, rate: 0.60 },
      { max: 4, rate: 0.70 },
      { max: 5, rate: 0.90 },
      { max: 6, rate: 1.20 },   // 5-6 Yr  — NCB >= 20% required
      { max: 7, rate: 1.40 },   // 6-7 Yr  — NCB >= 20% required
      { max: Infinity, rate: 0 }      // >7 years — NOT AVAILABLE
    ],
    cc150To350: [         /* B — above 150 CC and upto 350 CC */
      { max: 1, rate: 0.25 },
      { max: 2, rate: 0.40 },
      { max: 3, rate: 0.60 },
      { max: 4, rate: 0.70 },
      { max: 5, rate: 0.90 },
      { max: 6, rate: 1.20 },   // 5-6 Yr  — NCB >= 20% required
      { max: 7, rate: 1.40 },   // 6-7 Yr  — NCB >= 20% required
      { max: Infinity, rate: 0 }      // >7 years — NOT AVAILABLE
    ],
    above350: [           /* C — above 350 CC */
      { max: 1, rate: 0.40 },
      { max: 2, rate: 0.50 },
      { max: 3, rate: 0.70 },
      { max: 4, rate: 0.80 },
      { max: 5, rate: 1.20 },
      { max: 6, rate: 1.30 },   // 5-6 Yr  — NCB >= 20% required
      { max: 7, rate: 1.50 },   // 6-7 Yr  — NCB >= 20% required
      { max: Infinity, rate: 0 }      // >7 years — NOT AVAILABLE
    ]
  },`;
src = replace(src, OLD_TABLE, NEW_TABLE, 'NIL_DEP_RATE.twoWheeler table');
done.push('rate table: 3 CC buckets (0-150 / 150-350 / above 350), bands to 6-7 yrs');

/* ---------------- 2. getNilDepRate(): age gate + 3-way bucket choice ---------- */
const OLD_BLOCK = `  if (vehicleType === 'twoWheeler') {
    /* Two Wheeler: Dep Cap / ND is not to be picked after 5 years. */
    if (ageInYears > 5) return 0;

    /* Decide CC / KW bucket. KW threshold ≈ 16 KW (PDF parity). */
    var sz = parseFloat(ccOrKw) || 0;
    var isKw = sz > 0 && sz <= 50;          // heuristic: KW values are small
    if (isKw) {
      bucket = (sz > 16) ? node.above150 : node.upto150;
    } else {
      bucket = (sz > 150) ? node.above150 : node.upto150;
    }
  } else {`;

const NEW_BLOCK = `  if (vehicleType === 'twoWheeler') {
    /* Two Wheeler ND / Dep Cap: eligible upto 7 years.
       Above 5 years a minimum 20% NCB is required (same gate as Pvt Car). */
    if (ageInYears > 7) return 0;
    if (ageInYears > 5) {
      var ncb2w = parseFloat(ncbPct);
      if (!isNaN(ncb2w) && ncb2w < 20) return 0;   /* NaN (NCB not passed) = gate skipped */
    }

    /* Decide CC / KW bucket: A = 0-150, B = >150-350, C = >350.
       EV 2W (KW) parity with the OD slabs: > 16 KW behaves like a >350cc
       performance machine and takes the B column (150-350); A column otherwise. */
    var sz = parseFloat(ccOrKw) || 0;
    var isKw = sz > 0 && sz <= 50;          // heuristic: KW values are small
    if (isKw) {
      bucket = (sz > 16) ? node.cc150To350 : node.ccUpto150;
    } else {
      bucket = (sz > 350) ? node.above350 : (sz > 150) ? node.cc150To350 : node.ccUpto150;
    }
  } else {`;
src = replace(src, OLD_BLOCK, NEW_BLOCK, 'getNilDepRate 2W block');
done.push('getNilDepRate(): >7 blocked, >5 needs NCB>=20, 3-way CC/KW bucket');

/* ---------------- 3. checkNilDepEligibility(): 2W block ---------------- */
const OLD_CHK = `  /* --- Two Wheeler: Dep Cap / ND not available after 5 yrs --- */
  if (isTwoWheelerFamily && ageInYears > 5) {
    return {
      eligible: false,
      reason: 'ND / Dep Cap Cover not available for two wheelers above 5 years',
      code: 'TWO_WHEELER_AGE_EXCEEDED',
      rate: 0,
      basis: 'IDV'
    };
  }`;

const NEW_CHK = `  /* --- Two Wheeler: Dep Cap / ND available upto 7 yrs ---
       Above 5 yrs, min 20% NCB required (mirrors the Pvt Car rule). */
  if (isTwoWheelerFamily) {
    if (ageInYears > 7) {
      return {
        eligible: false,
        reason: 'ND / Dep Cap Cover not available for two wheelers above 7 years',
        code: 'TWO_WHEELER_AGE_EXCEEDED',
        rate: 0,
        basis: 'IDV'
      };
    }
    if (ageInYears > 5 && ncbPct !== undefined && ncbPct !== null) {
      var ncb2w = parseFloat(ncbPct) || 0;
      if (ncb2w < 20) {
        return {
          eligible: false,
          reason: 'Min 20% NCB required for two wheeler Dep Cap / ND Cover when vehicle age exceeds 5 years (current NCB: ' + ncb2w + '%)',
          code: 'TWO_WHEELER_NCB_TOO_LOW',
          rate: 0,
          basis: 'IDV'
        };
      }
    }
  }`;
src = replace(src, OLD_CHK, NEW_CHK, 'checkNilDepEligibility 2W block');
done.push('checkNilDepEligibility(): >7 blocked, >5 gated on NCB>=20 with clear message');

/* ---------------- 4. Section 13 header note ---------------- */
const OLD_NOTE = `         • Pvt Car ND Cover available upto 6.5 Years only.
           • Min 20% NCB required only when vehicle age exceeds 5 years.`;
const NEW_NOTE = `         • Pvt Car ND Cover available upto 6.5 Years only.
         • Two Wheeler ND / Dep Cap available upto 7 Years, three CC buckets
           (0-150 / above 150-350 / above 350) — schedule dated 10-Sep-2026.
           • Min 20% NCB required only when vehicle age exceeds 5 years
             (Pvt Car AND Two Wheeler / EV 2W).`;
src = replace(src, OLD_NOTE, NEW_NOTE, 'section 13 header note');
done.push('section 13 doc note updated');

/* ---------------- 5. getNilDepRate doc block ---------------- */
const OLD_DOC = `     • Pvt Car (incl. evPvtCar): age > 6.5 yrs     -> 0
     • Pvt Car (incl. evPvtCar): age > 5 yrs and NCB < 20% -> 0  (if ncbPct given)`;
const NEW_DOC = `     • Pvt Car (incl. evPvtCar): age > 6.5 yrs     -> 0
     • Pvt Car (incl. evPvtCar): age > 5 yrs and NCB < 20% -> 0  (if ncbPct given)
     • Two Wheeler / EV 2W: age > 7 yrs -> 0 ; age > 5 yrs and NCB < 20% -> 0
       CC buckets: 0-150 | >150-350 | >350 (EV 2W: >16 KW uses the 150-350 column)`;
src = replace(src, OLD_DOC, NEW_DOC, 'getNilDepRate doc block');
done.push('getNilDepRate() doc block updated');

if (src === original) {
  console.error('ERROR: nothing changed — aborting.');
  process.exit(1);
}

/* sanity: no stale bucket names left */
['node.upto150', 'node.above150'].forEach(s => {
  if (src.indexOf(s) !== -1) {
    console.error('ERROR: stale reference "' + s + '" still present. Aborting — file NOT written.');
    process.exit(1);
  }
});

console.log('Changes:');
done.forEach(d => console.log('  ✓ ' + d));

if (DRY) {
  const out = path.join(__dirname, 'rates.patched.sample.js');
  fs.writeFileSync(out, src, 'utf8');
  console.log('\n[dry-run] uploads/rates.js untouched; patched copy -> ' + out);
} else {
  fs.writeFileSync(TARGET + '.bak', original, 'utf8');
  fs.writeFileSync(TARGET, src, 'utf8');
  console.log('\nWrote ' + TARGET + '   (backup: uploads/rates.js.bak)');
}
