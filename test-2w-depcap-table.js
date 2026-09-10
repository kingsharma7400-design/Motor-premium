/* Full-schedule check for the 2W Dep Cap table, plus boundary + regression checks.
   Usage: node tools/test-2w-depcap-table.js <rates.js path>            */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'uploads', 'rates.js');
const dir = path.dirname(path.resolve(file));

const ctx = { console, window: {}, document: { getElementById: () => null }, alert: () => {},
              localStorage: { getItem: () => null, setItem() {} } };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of [path.join(dir, 'commission_rates.js'),
                 path.join(__dirname, '..', 'uploads', 'commission_rates.js'), file]) {
  if (!fs.existsSync(f)) continue;
  try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { if (f === file) throw e; }
}

/* Expected grid exactly as supplied by the user on 10-Sep-2026.
   key: bucket -> [0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-7] */
const EXPECT = {
  A: [0.25, 0.40, 0.60, 0.70, 0.90, 1.20, 1.40],   // 0 - 150 CC
  B: [0.25, 0.40, 0.60, 0.70, 0.90, 1.20, 1.40],   // >150 - 350 CC (schedule col A)
  C: [0.40, 0.50, 0.70, 0.80, 1.20, 1.30, 1.50]    // Above 350 CC (schedule col B)
};
/* Engine convention (matches {max:N} slabs): 0-1 ->0, 1.x-2 ->1 … 5.x-6 ->5, 6.x-7 ->6, >7 -> none */
const ageToBand = a => (a > 7 ? -1 : Math.min(6, Math.max(0, Math.ceil(a) - 1)));
const bucketOf = cc => (cc > 350 ? 'C' : cc > 150 ? 'B' : 'A');
const near = (x, y) => Math.abs(x - y) < 1e-9;

let pass = 0, fail = 0;
const fails = [];
function chk(cond, msg) { if (cond) pass++; else { fail++; fails.push(msg); } }

console.log('FILE: ' + file + '\n');

/* ---- 1. every cell of the supplied schedule ---- */
for (const vt of ['twoWheeler', 'evTwoWheeler']) {
  for (const cc of [50, 110, 150, 151, 200, 350, 351, 500, 650]) {
    [0.3, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.1, 5.5, 6, 6.5, 7].forEach(age => {
      const want = EXPECT[bucketOf(cc)][ageToBand(age)];
      const needNcb = age > 5;
      const got = ctx.getNilDepRate(vt, 'petrol', age, cc, 20);
      chk(near(got, want),
          `${vt} cc=${cc} age=${age} ncb=20 -> rate ${got}, expected ${want} (bucket ${bucketOf(cc)})`);
      /* >5 yrs must be refused when NCB < 20 */
      const low = ctx.getNilDepRate(vt, 'petrol', age, cc, 0);
      chk(needNcb ? low === 0 : near(low, want),
          `${vt} cc=${cc} age=${age} ncb=0 -> ${low} (expected ${needNcb ? 0 : want})`);
    })
  }
}
console.log(`1. Schedule grid: 2 vehicle types x 9 CC points x 15 age points x 2 NCB = ${pass+fail-21} cells checked`);

/* ---- 2. eligibility + premium through calcNilDepPremium ---- */
function prem(vt, age, cc, ncb, idv) {
  return ctx.calcNilDepPremium({ vehicleType: vt, fuelType: 'petrol', age, cc, idv, odPremium: 0, ncb });
}
const u100k = id => Math.round(id * EXPECT.A[ageToBand(id)] / 100);
let r;
r = prem('twoWheeler', 7.0, 150, 20, 100000);
chk(r.eligible && near(r.rate, 1.40) && r.premium === 1400, 'user case: 7 yr 150cc NCB20 -> ' + JSON.stringify(r));
r = prem('twoWheeler', 7.1, 150, 20, 100000);
chk(!r.eligible && r.code === 'TWO_WHEELER_AGE_EXCEEDED', '7.1 yr blocked -> ' + r.code);
r = prem('twoWheeler', 6.5, 150, 0, 100000);
chk(!r.eligible && r.code === 'TWO_WHEELER_NCB_TOO_LOW' && /Min 20% NCB/.test(r.reason), 'NCB 0 @6.5 -> ' + r.code + ' / "' + r.reason + '"');
r = prem('twoWheeler', 6.5, 150, 20, 100000);   /* 6.5 falls in the 6-7 band, same as the engine */
chk(r.eligible && near(r.rate, 1.40) && r.premium === 1400, '6.5 yr NCB20 -> rate ' + r.rate + ' / ₹' + r.premium);
r = prem('twoWheeler', 6.2, 400, 50, 200000);
chk(r.eligible && near(r.rate, 1.50) && r.premium === 3000, '400cc 6.2yr NCB50 (above350 6-7=1.50) -> ' + r.rate + ' / ₹' + r.premium);
r = prem('twoWheeler', 5.2, 400, 50, 200000);
chk(r.eligible && near(r.rate, 1.30) && r.premium === 2600, '400cc 5.2yr NCB50 (above350 5-6=1.30) -> ' + r.rate + ' / ₹' + r.premium);
const ncb20 = prem('twoWheeler', 5.2, 400, 20, 200000);
const ncb50 = prem('twoWheeler', 5.2, 400, 50, 200000);
chk(ncb20.eligible && ncb20.premium === ncb50.premium && ncb20.premium === 2600,
    'above350 5-6yr: rate same for NCB 20 and 50 (>=20 is a switch, not a scale) -> ' + ncb20.premium + ' vs ' + ncb50.premium);
r = prem('twoWheeler', 3, 20, 20, 100000);           // EV 2W 20 KW -> B bucket, 2-3yr = 0.60
chk(r.eligible && near(r.rate, 0.60), 'EV 2W 20KW uses B/A table -> ' + r.rate);
console.log('2. Eligibility/premium assertions: 7 scenarios');

/* ---- 3. buckets are exclusive at the boundary ---- */
[150, 151, 350, 351].forEach(cc => {
  const b = bucketOf(cc);
  /* 5.2 -> the 5-6 band, where A/B (1.20) and C (1.30) actually differ */
  const got = ctx.getNilDepRate('twoWheeler', 'petrol', 5.2, cc, 20);
  chk(near(got, EXPECT[b][5]), `CC ${cc} -> bucket ${b} (rate ${got}, want ${EXPECT[b][5]})`);
  /* 4.2 -> the 4-5 band: A/B 0.90, C 1.20 */
  const got4 = ctx.getNilDepRate('twoWheeler', 'petrol', 4.2, cc, 20);
  chk(near(got4, EXPECT[b][4]), `CC ${cc} @4.2yr -> bucket ${b} (rate ${got4}, want ${EXPECT[b][4]})`);
});
console.log('3. CC boundary: 150 / 151 / 350 / 351');

/* ---- 4. legacy behaviour preserved: <=5 yrs and commercial/PvtCar ----
   Bands are inclusive of their upper edge (max:N), so 1.1 and 2.0 both sit in 1-2. */
const LEGACY_AGE = [[0.5, 0.25], [1, 0.25], [1.1, 0.40], [2, 0.40], [2.1, 0.60], [3, 0.60], [3.1, 0.70], [4, 0.70], [4.1, 0.90], [5, 0.90]];
LEGACY_AGE.forEach(([age, want]) => {
  const got = ctx.getNilDepRate('twoWheeler', 'petrol', age, 110, 0);   // NCB 0, <=5yr: must still work
  chk(near(got, want), `legacy <=5yr 110cc ncb=0 age=${age} -> ${got}, want ${want}`);
});
[3, 110, 150, 160, 250, 349].forEach(cc => {
  const got = ctx.getNilDepRate('twoWheeler', 'petrol', 3.2, cc, 25);
  chk(near(got, 0.70), `legacy 3-4yr cc=${cc} -> ${got}, want 0.70`);
});
/* Pvt Car + commercial untouched */
chk(near(ctx.getNilDepRate('pvtCar', 'petrol', 5.5, 1200, 20), 1.44), 'pvtCar 5.5yr NCB20 -> 1.44');
chk(ctx.getNilDepRate('pvtCar', 'petrol', 5.5, 1200, 0) === 0, 'pvtCar 5.5yr NCB0 -> 0');
chk(near(ctx.getNilDepRate('pvtCar', 'diesel', 6.5, 2000, 50), 2.45), 'pvtCar diesel 6.5yr -> 2.45');
chk(ctx.getNilDepRate('pvtCar', 'petrol', 7, 1200, 50) === 0, 'pvtCar 7yr -> 0 (still 6.5 cap)');
chk(near(ctx.getNilDepRate('taxi', null, 4.9, 1200, 20), 30), 'taxi 4.9yr -> 30 (% of OD)');
chk(ctx.getNilDepRate('taxi', null, 5.1, 1200, 20) === 0, 'taxi 5.1yr -> 0');
chk(ctx.checkNilDepEligibility('gccv', 'diesel', 6, 12000, 50).code === 'COMMERCIAL_AGE_EXCEEDED', 'gccv >5yr still commercial block');
console.log('4. Legacy + control: 14 assertions');

console.log('\n' + (fail === 0 ? '✅ ALL PASS' : '❌ FAILURES') + ` — ${pass} passed, ${fail} failed`);
if (fail) { fails.slice(0, 25).forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
