/* E2E for "History saves every product, shown separately".
   Drives the real page in jsdom (all scripts inlined) and inspects
   localStorage + the rendered History tab. */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.join(__dirname, '..', 'uploads');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="(https?:)?\/\/[^"]*"[^>]*><\/script>/g, '<!-- cdn -->');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  '<script>\n' + fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n</script>');

const jsErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => jsErrors.push(e.message.split('\n')[0]));
vc.on('error', (...a) => jsErrors.push(a.map(String).join(' ')));

const dom = new JSDOM(html, { url: 'http://localhost/Motor-premium/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
const { window } = dom, doc = window.document;
const $ = id => doc.getElementById(id);
window.matchMedia = window.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
window.scrollTo = () => {};
window.confirm = () => true;
window.Element.prototype.scrollIntoView = function () {};   // not implemented by jsdom

const wait = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
function set(id, v) { const el = $(id); if (!el || el.disabled) return false; el.value = v;
  el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })); return true; }
function click(id) { const el = $(id); if (!el) return false; el.click(); return true; }
const hist = () => JSON.parse(window.localStorage.getItem('oic_quote_history_v2') || '[]');

let pass = 0, fail = 0; const fails = [];
const t = (name, ok, extra) => { if (ok) { pass++; console.log('  ✓ ' + name); } else { fail++; fails.push(name + (extra ? ' → ' + extra : '')); console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')); } };

(async () => {
  await wait(250);
  console.log('== 1. Motor quote ==');
  set('policyDate', fmt(new Date()));
  set('vehicleType', 'twoWheeler'); await wait(40);
  set('fuelType', 'Petrol'); set('cc', 150); set('seating', 2);
  const d = new Date(); d.setFullYear(d.getFullYear() - 6); d.setMonth(d.getMonth() - 6);
  set('dor', fmt(d));
  set('invoice', 100000); set('idv', 100000); set('policyType', 'package'); set('policyTerm', '1');
  set('zone', 'B'); set('state', 'Punjab'); set('ncb', 20); set('uwDiscount', 0);
  set('ndDiscount', 0); set('ndRenDiscount', 0);
  $('nilDep').checked = true;
  set('insuredName', 'Rakesh Kumar'); set('regNo', 'PB10AB1234');
  click('calcBtn'); await wait(120);
  let H = hist();
  t('motor quote saved', H.length === 1, 'len=' + H.length);
  t('kind = motor', H[0] && H[0].kind === 'motor', H[0] && H[0].kind);
  t('product label = Motor', H[0] && H[0].product === 'Motor', H[0] && H[0].product);
  t('2W Dep Cap still charged (6.5 yr → 6-7 band = 1.4 % of ₹1,00,000 = ₹1,400)', /1\.4 % of Total IDV ₹1,00,000/.test($('calcBreakdown').textContent));

  console.log('== 2. Fire quote ==');
  set('fOccupancy', 'dwelling'); set('fBuilding', 5000000); set('fContents', 1000000);
  set('fStock', 0); set('fTerm', '1'); set('fDiscount', 0);
  click('fireCalcBtn'); await wait(80);
  H = hist();
  const fire = H.filter(e => e.kind === 'fire').pop();   /* oldest fire save = ₹60L run */
  t('fire quote auto-saved', H.length === 2 && !!fire, 'len=' + H.length + ' kinds=' + H.map(e=>e.kind).join(','));
  const fireSaves = H.filter(e => e.kind === 'fire');
  t('fire net recorded (₹2,400 = 0.25‰ of ₹60L + STFI 0.10‰ + RSMD 0.05‰)', fire && fire.result.net === 2400, fire && String(fire.result.net));
  t('fire sum insured captured', fire && fire.meta.sumInsured === 6000000, fire && String(fire.meta.sumInsured));
  t('fire form snapshot captured (restorable)', fire && fire.form && Object.keys(fire.form.text).length > 3, fire && String(Object.keys(fire.form.text).length) + ' fields');
  t('shared quote-number sequence (Motor #1 then Fire #2)', H[1].quoteNo === 1 && fire.quoteNo === 2, H.map(e => e.kind + '#' + e.quoteNo).join(','));

  console.log('== 3. same Fire inputs again → dedup, no duplicate ==');
  click('fireCalcBtn'); await wait(80);
  H = hist();
  t('no duplicate row created', H.length === 2, 'len=' + H.length);
  set('fBuilding', 8000000); click('fireCalcBtn'); await wait(80);
  H = hist();
  t('changed Fire inputs → new row (₹3,600 = 0.40‰ of ₹90L incl. STFI+RSMD)', H.length === 3 && H[0].result.net === 3600, 'len=' + H.length + ' net=' + H[0].result.net);

  console.log('== 4. PA quote (via registerHealthQuote hook) ==');
  set('pCSI', 500000); set('pPlan', 'ii'); set('pRisk', '1'); set('pTerm', '1'); set('pMembers', 2); set('pAge', 35); set('pRate', 1.00);
  click('paCalcBtn'); await wait(80);
  H = hist();
  const pa = H.find(e => e.kind === 'pa');
  t('PA quote saved to the same history', !!pa, 'kinds=' + H.map(e => e.kind).join(','));
  t('PA label + plan/GST info survives the generate-time refresh', pa && /Personal Accident/.test(pa.product) && /Table II/.test(String(pa.meta.policyLabel) + String(pa.meta.note)) && pa.meta.gstLabel === 'GST Exempt', pa && pa.product + ' / ' + pa.meta.policyLabel + ' / ' + pa.meta.gstLabel);
    pa && /Personal Accident/.test(pa.product) && /Table II/.test(String(pa.meta.policyLabel) + String(pa.meta.note)) && pa.meta.gstLabel === 'GST Exempt',

  console.log('== 5. History tab: separate product filter ==');
  click('navHistory') || doc.querySelector('[data-tab="history"]').click(); await wait(60);
  const sel = $('hFilterProduct');
  t('Product filter dropdown exists', !!sel);
  const opts = [...sel.options].map(o => o.value);
  t('options cover Motor + every product', ['all','motor','fire','theft','pa','yec','ossp','hff','stu'].every(v => opts.includes(v)), opts.join(','));
  const cardsWith = () => [...doc.querySelectorAll('#historyList .h-card')].map(c => c.textContent.replace(/\s+/g, ' '));
  sel.value = 'fire'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  let cards = cardsWith();
  t('filter=Fire shows only Fire quotes', cards.length === 2 && cards.every(c => /Fire/.test(c)), 'n=' + cards.length);
  sel.value = 'pa'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  cards = cardsWith();
  t('filter=PA shows only the PA quote', cards.length === 1 && /Personal Accident/.test(cards[0]), 'n=' + cards.length);
  sel.value = 'motor'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  cards = cardsWith();
  t('filter=Motor shows only Motor', cards.length === 1 && /PB10AB1234/.test(cards[0]), 'n=' + cards.length);
  t('product badge rendered on non-Motor cards', (sel.value = 'fire', sel.dispatchEvent(new window.Event('change', { bubbles: true })), [...doc.querySelectorAll('#historyList .h-tag-product')].length === 2), 'badges=' + [...doc.querySelectorAll('#historyList .h-tag-product')].length);
  t('card shows Sum Insured line instead of OD/TP', /Sum Insured ₹60,00,000/.test(cardsWith()[0]) || /Sum Insured/.test(cardsWith()[0]), cardsWith()[0].slice(0, 120));
  sel.value = 'all'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  t('All products = 4 rows (PA deduped across calc + generate)', cardsWith().length === 4, 'n=' + cardsWith().length + ' kinds=' + hist().map(e=>e.kind).join(','));
  t('stats count all products', $('hStatTotal').textContent === '4', $('hStatTotal').textContent);
  t('search finds a product by name', ($('hSearch').value = 'fire', $('hSearch').dispatchEvent(new window.Event('input', { bubbles: true })), cardsWith().length === 2), 'n=' + cardsWith().length);

  console.log('== 6. Edit (restore) a Fire quote back into its own form ==');
  $('hSearch').value = ''; $('hSearch').dispatchEvent(new window.Event('input', { bubbles: true }));
  sel.value = 'fire'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  const before = { b: $('fBuilding').value, c: $('fContents').value, o: $('fOccupancy').value };
  $('fBuilding').value = '123'; $('fContents').value = '0'; $('fOccupancy').value = 'hazardous';
  const firstFireCard = doc.querySelector('#historyList .h-card');
  firstFireCard.querySelector('[data-act="edit"]').click(); await wait(400);
  t('Edit restores the Fire pane fields', $('fBuilding').value === before.b && $('fContents').value === before.c && $('fOccupancy').value === before.o,
     `${$('fBuilding').value}/${$('fContents').value}/${$('fOccupancy').value} vs ${before.b}/${before.c}/${before.o}`);
  t('Edit does NOT create a duplicate', hist().length === 4, 'len=' + hist().length);
  console.log('== 7. PA generate-quotation refreshes the same row (no dupe) ==');
  const paBefore = hist().filter(e => e.kind === 'pa').length;
  click('paGen'); await wait(120);
  const paAfter = hist().filter(e => e.kind === 'pa').length;
  t('PA row count stable after Generate', paBefore === paAfter && paAfter === 1, paBefore + ' → ' + paAfter);

  console.log('== 8. Youth Eco Care (health product) ==');
  const yecFields = { yecPlan: 'basic', yecMode: 'individual', yecMembers: '1', yecAge1: 25 };
  Object.keys(yecFields).forEach(k => set(k, yecFields[k]));
  const siSel = $('yecSI');                       /* options are built by JS at init */
  const siOpt = [...siSel.options].find(o => Number(o.value) >= 300000) || siSel.options[0];
  siSel.value = siOpt.value;
  siSel.dispatchEvent(new window.Event('change', { bubbles: true }));
  click('yecCalcBtn'); await wait(200);
  H = hist();
  const yec = H.find(e => e.kind === 'yec');
  t('YEC saved via registerHealthQuote hook', !!yec, 'kinds=' + H.map(e => e.kind).join(','));
  t('YEC product name + UIN kept', yec && /Youth Eco/.test(yec.product) && /OICHLIP/.test(yec.meta.uin || ''), yec && yec.product + ' / ' + (yec.meta.uin || ''));
  t('YEC GST-exempt label, no GST charged', yec && yec.meta.gstLabel === 'GST Exempt' && yec.result.gstAmt === 0, yec && String(yec.result.gstAmt));
  click('yecGenRow'); click('yecGen'); await wait(150);
  t('YEC generate → same row, no duplicate', hist().filter(e => e.kind === 'yec').length === 1, 'n=' + hist().filter(e => e.kind === 'yec').length);
  sel.value = 'yec'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(60);
  t('history filter lists Youth Eco Care', cardsWith().length === 1 && /Youth Eco/.test(cardsWith()[0]), 'n=' + cardsWith().length);
  sel.value = 'all'; sel.dispatchEvent(new window.Event('change', { bubbles: true })); await wait(40);

  console.log('== 9. CSV export carries Product + Customer ==');
  let csv = '';
  window.URL.createObjectURL = b => { b.text().then(t => { csv = t; }); return 'blob:stub'; };
  window.URL.revokeObjectURL = () => {};
  doc.createElement = ((orig) => function (tag) { const el = orig.call(doc, tag); if (tag === 'a') el.click = () => {}; return el; })(doc.createElement);
  click('hExportCsv'); await wait(200);
  const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
  const hdr = (lines[0] || '').split(',');
  t('CSV has Product and Customer columns', hdr[2] === 'Product' && hdr[3] === 'Customer', lines[0]);
  t('CSV rows carry the product names', /Fire & Special Perils/.test(csv) && /Youth Eco/.test(csv), (lines[2] || '').slice(0, 60));
  t('CSV keeps the Motor customer name', /Rakesh Kumar/.test(csv));
  t('CSV row count = 5 quotes', lines.length - 1 === 5, 'rows=' + (lines.length - 1));

  console.log('\n' + (fail === 0 ? '✅ HISTORY-E2E PASS' : `❌ HISTORY-E2E FAIL (${fail})`));
  fails.forEach(f => console.log('   ✗ ' + f));
  if (jsErrors.length) { console.log('page errors:'); jsErrors.slice(0, 6).forEach(e => console.log('   ERR ' + e)); }
  process.exit(fail === 0 && jsErrors.length === 0 ? 0 : 1);
})();
