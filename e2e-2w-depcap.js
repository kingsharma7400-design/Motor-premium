/* End-to-end: drives the REAL UI in jsdom with all <script src> files inlined,
   fills the Motor form, clicks Calculate, and reads the rendered rows.
   Usage: node tools/e2e-2w-depcap.js [rates-file-to-test-against-the-app]
   When a file is given it temporarily replaces uploads/rates.js.            */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..', 'uploads');
const RATES = path.join(ROOT, 'rates.js');
const swap = process.argv[2];
const keep = fs.readFileSync(RATES, 'utf8');
const restore = () => { if (swap) fs.writeFileSync(RATES, keep); };
if (swap) {
  if (!fs.existsSync(swap)) { console.error('no such file: ' + swap); process.exit(1); }
  fs.writeFileSync(RATES, fs.readFileSync(swap, 'utf8'));
  console.log('>>> rates under test: ' + swap);
}

/* ---- build the page with local scripts inlined (no CDN / no network) ---- */
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="(https?:)?\/\/[^"]*"[^>]*><\/script>/g, '<!-- cdn stripped -->');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  '<script>\n' + fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n</script>');

const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(e.message.split('\n')[0]));
vc.on('error', (...a) => jsErrors.push(a.map(String).join(' ')));

const dom = new JSDOM(html, {
  url: 'http://localhost/Motor-premium/',        // non-opaque origin → localStorage works
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc
});
const { window } = dom;
const doc = window.document;
const $ = id => doc.getElementById(id);
window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = function () {};   // not implemented by jsdom

const toasts = [];
const num = t => Number(String(t).replace(/[₹\s]/g, '').replace(/,/g, '').replace(/−/g, '-')) || 0;
const wait = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

function set(id, v) {
  const el = $(id);
  if (!el) { jsErrors.push('missing field #' + id); return; }
  if (el.disabled) return;
  el.value = v;
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
}

const POLICY_DATE = fmt(new Date());
async function fill(o) {
  set('policyDate', o.policyDate || POLICY_DATE);
  set('vehicleType', 'twoWheeler');
  await wait(30);                          // let add-on visibility run
  set('fuelType', 'Petrol');
  set('cc', o.cc);
  set('seating', 2);
  set('dor', o.dor);
  set('invoice', o.idv);
  set('idv', o.idv);
  set('policyType', o.policyType || 'package');
  set('policyTerm', '1');
  set('zone', o.zone || 'B');
  set('state', 'Punjab');
  set('ncb', o.ncb);
  set('uwDiscount', 0);
  set('ndDiscount', 0);
  set('ndRenDiscount', 0);
  if ($('antiTheft') && !$('antiTheft').disabled) set('antiTheft', ($('antiTheft').options[0] || {}).value || '0');
  $('nilDep').checked = true;
  $('nilDep').dispatchEvent(new window.Event('change', { bubbles: true }));
  toasts.length = 0;
  window.proToast = (m) => toasts.push(String(m));
  $('calcBtn').click();
  await wait(60);
  return read(o.label, o);
}

const ddmy = v => v.split('-').reverse().join('-');   // DD-MM-YYYY -> parsable
function read(label, o) {
  const age = o ? (Date.parse(ddmy(o.policyDate || POLICY_DATE)) - Date.parse(ddmy(o.dor))) / 86400000 / 365.25 : 0;
  const rows = [...doc.querySelectorAll('#calcBreakdown tr')].map(tr => ({
    text: [...tr.children].map(td => td.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
    valueCell: (tr.children[tr.children.length - 2] || {}).textContent || ''
  }));
  const findRow = re => rows.find(x => re.test(x.text));
  const ndRow = findRow(/Nil Depreciation/i);
  const ncbRow = findRow(/NCB/);
  const nd = ndRow ? ndRow.text : '(no ND row)';
  const ncb = ncbRow ? ncbRow.text : '(no NCB row)';
  const ndVal = ndRow ? num(ndRow.valueCell) : null;
  const txt = s => { const e = $(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : '?'; };
  console.log(`\n### ${label}   [vehicle age ≈ ${age.toFixed(2)} yr]`);
  console.log('  ND row  : ' + nd);
  console.log('  NCB row : ' + ncb);
  console.log(`  OD ${txt('odTotal')}  TP ${txt('tpTotal')}  GST ${txt('gstAmt')}  TOTAL ${txt('totalPremium')}`);
  if (toasts.length) console.log('  TOAST   : ' + toasts.join(' // ').slice(0, 300));
  return { nd, ncb, ndVal, total: txt('totalPremium'), age: +age.toFixed(2) };
}

/* DOR strings chosen so the age lands in a specific band at policy start = today */
function dorYearsAgo(yrs, months) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yrs);
  d.setMonth(d.getMonth() - (months || 0));
  return fmt(d);
}

(async () => {
  await wait(200);
  const dAgo = days => { const d = new Date(Date.now() - days * 86400000); return fmt(d); };
  const A = await fill({ cc: 150, idv: 100000, ncb: 20, dor: dAgo(Math.round(6.2 * 365.25)), label: 'A — 150cc, 6.2 yr, NCB 20 → 6-7 band = 1.40%' });
  const B = await fill({ cc: 150, idv: 100000, ncb: 0,  dor: dAgo(Math.round(6.2 * 365.25)), label: 'B — 150cc, 6.2 yr, NCB 0 → blocked (min 20% NCB)' });
  const C = await fill({ cc: 110, idv: 80000,  ncb: 20, dor: dAgo(Math.round(3.2 * 365.25)), label: 'C — 110cc, 3.2 yr → 3-4 band = 0.70%' });
  const D = await fill({ cc: 200, idv: 150000, ncb: 50, dor: dAgo(Math.round(5.2 * 365.25)), label: 'D — 200cc, 5.2 yr, NCB 50 → 5-6 band (150-350 col) = 1.20%' });
  const E = await fill({ cc: 151, idv: 120000, ncb: 20, dor: dAgo(Math.round(3.2 * 365.25)), label: 'E — 151cc, 3.2 yr → middle col, 3-4 band = 0.70%' });
  const E2 = await fill({ cc: 400, idv: 300000, ncb: 20, dor: dAgo(Math.round(3.2 * 365.25)), label: 'E2 — 400cc, 3.2 yr → above-350 col, 3-4 band = 0.80%' });
  const F = await fill({ cc: 500, idv: 300000, ncb: 20, dor: dAgo(Math.round(6.8 * 365.25)), label: 'F — 500cc, 6.8 yr, NCB 20 → above-350 col, 6-7 band = 1.50%' });
  const G = await fill({ cc: 110, idv: 60000,  ncb: 20, dor: '01-01-2018', policyDate: '10-09-2026', label: 'G — 110cc, 8.69 yr → beyond 7 yrs, blocked' });
  const H = await fill({ cc: 150, idv: 100000, ncb: 20, dor: '01-01-2021', policyDate: '10-09-2026', label: 'H — 150cc, 5.7 yr (fixed dates), NCB 20 → 5-6 band' });

  const amt = s => Number((String(s).match(/₹\s*([\d,]+)/) || [])[1] ? String(s).match(/₹\s*([\d,]+)/)[1].replace(/,/g, '') : NaN);
  console.log('\n================ ASSERTIONS (real UI, real DOM) ================');
  const checks = [
    [`A (age ${A.age}) → 1.4 % of ₹1,00,000 = ₹1,400`, /1\.4 % of Total IDV/.test(A.nd) && A.ndVal === 1400],
    [`B (age ${B.age}) → min-NCB message, ₹0`, /Min 20% NCB required for two wheeler/.test(B.nd) && B.ndVal === 0],
    [`C (age ${C.age}) → 0.7 % = ₹560`, /0\.7 % of Total IDV/.test(C.nd) && C.ndVal === 560],
    [`D (age ${D.age}) → 1.2 % = ₹1,800`, /1\.2 % of Total IDV/.test(D.nd) && D.ndVal === 1800],
    [`E (age ${E.age}) → 0.7 % = ₹840 (middle col, not the old 0.90)`, /0\.7 % of Total IDV/.test(E.nd) && E.ndVal === 840],
    [`E2 (age ${E2.age}) → 0.8 % = ₹2,400 (above-350 col)`, /0\.8 % of Total IDV/.test(E2.nd) && E2.ndVal === 2400],
    [`F (age ${F.age}) → 1.5 % = ₹4,500`, /1\.5 % of Total IDV/.test(F.nd) && F.ndVal === 4500],
    [`G (age ${G.age}) → blocked with the age message, ₹0`, /above 7 years/.test(G.nd) && G.ndVal === 0],
    [`H (age ${H.age}) → 5-6 band 1.2 % = ₹1,200`, /1\.2 % of Total IDV/.test(H.nd) && H.ndVal === 1200],
    ['A → NCB 20 % still applied on OD (separate row)', /NCB \(20 %\)/.test(A.ncb)],
    ['no page / jsdom errors', jsErrors.length === 0]
  ];
  let bad = 0;
  checks.forEach(([n, ok]) => { console.log((ok ? '  ✓ ' : '  ✗ ') + n); if (!ok) bad++; });
  jsErrors.slice(0, 5).forEach(e => console.log('  ERR: ' + e));
  console.log(bad === 0 ? '\n✅ E2E PASS' : `\n❌ E2E FAIL (${bad})`);
  restore();
  process.exit(bad === 0 ? 0 : 1);
})();
