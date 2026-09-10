/* Verifies, on the live DOM: (a) the "Customized by" line is bold on screen and
   in the print/PDF CSS, (b) dark-mode colours beat the inline light-theme styles. */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..', 'uploads');
const readCss = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const css = ['styles.css', 'styles-other.css', 'styles-pro.css'].map(readCss).join('\n');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '');
html = html.replace(/<script[\s\S]*?<\/script>/g, '');
// elements as produced at runtime by app.js / health-quote.js / other.js / history.js
html = html
  .replace(/<strong class="generated-by">/, '<strong class="generated-by">')
  .replace('<div class="op-result" id="fireResult" style="display:none;"></div>',
    '<div class="op-result" id="fireResult"><table><tr><td style="font-weight:700;color:#64748b;">Occupancy</td></tr></table></div>');
if (!/generated-by/.test(html)) html += '<div class="disclaimer"><strong class="generated-by">Generated: x · Customized by Mohit Sharma</strong></div>';
const styles = ['styles.css', 'styles-other.css', 'styles-pro.css']
  .map(f => '<style>\n' + readCss(f) + '\n</style>').join('\n');
const dom = new JSDOM('<html data-theme="dark" lang="en"><head>' + styles + '</head><body>' + html + '</body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom, doc = window.document;

const appjs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const printCss = appjs.slice(appjs.indexOf('function getQuotePrintCSS'), appjs.indexOf('function buildQuoteHTMLForPDF'));

let pass = 0, fail = 0;
const t = (n, ok, x) => { ok ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (x ? ' → ' + x : ''))); };

console.log('== "Customized by" bold ==');
const el = doc.querySelector('#hqNotes strong.generated-by, .quote-doc strong.generated-by, strong.generated-by');
t('generated-by element exists in the quotation DOM', !!el);
t('screen CSS makes it bold (font-weight 800)', /\.quote-doc \.disclaimer strong[\s\S]{0,120}font-weight:\s*800/.test(css.replace(/\s*\n\s*/g, ' ')), 'rule missing');
t('print CSS (app.js getQuotePrintCSS) has .disclaimer strong 800 !important', /font-weight:\s*800 !important/.test(printCss.slice(printCss.indexOf('.disclaimer strong'))));
t('print CSS (styles-pro @media print) covers strong.generated-by', /\.quote-doc strong\.generated-by/.test(css));
t('screen CSS covers strong.generated-by too', /\.quote-doc .*strong\.generated-by/.test(css));
t('wording untouched in app.js', /Customized by Mohit Sharma<\/strong>/.test(appjs));
t('wording untouched in health-quote.js', /Customized by Mohit Sharma<\/strong>/.test(fs.readFileSync(path.join(ROOT, 'health-quote.js'), 'utf8')));
t('Excel footer already bold (s:15)', /Customized by Mohit Sharma', s: 15/.test(fs.readFileSync(path.join(ROOT, 'excel-export.js'), 'utf8')));

console.log('== dark mode overrides (real cascade through the app stylesheet stack) ==');
/* the app loads styles.css → styles-other.css → styles-pro.css; reproduce that and
   ask jsdom what each previously-broken node computes to in dark mode */
const DARK_TARGETS = [
  ['amber date hint', '#tab-calc .date-field-wrap label span', /252, 211, 77/, 'rgb(180, 83, 9)'],
  ['blue SI sub-label', '#tab-calc .field label[style*="#1e40af"]', /191, 219, 254/, 'rgb(30, 64, 175)'],
  ['amber towing label', '#tab-calc .field label[style*="#854d0e"]', /191, 219, 254/, 'rgb(133, 77, 14)'],
  ['CPA / passenger labels', '#tab-calc .field label[style*="#0369a1"]', /191, 219, 254/, 'rgb(3, 105, 161)'],
  ['CPA hint text', '#cpaTermHint', /199, 210, 254/, 'rgb(3, 105, 161)'],
  ['Fire theft-rate label', '#tab-fire .form-section label[style*="#92400e"]', /191, 219, 254/, 'rgb(146, 64, 14)'],
  ['PA medical-ext label', '#tab-pa .form-section label[style*="#92400e"]', /191, 219, 254/, 'rgb(146, 64, 14)'],
  ['grey result-table cell', '#fireResult td[style*="#64748b"]', /169, 184, 216/, 'rgb(100, 116, 139)'],
  ['Today link', '#todayBtn', /147, 197, 253/, 'rgb(37, 99, 235)']
];
for (const [name, sel, want, badInline] of DARK_TARGETS) {
  const el = doc.querySelector(sel);
  if (!el) { fail++; console.log('  ✗ ' + name + ' → node missing: ' + sel); continue; }
  const c = String(window.getComputedStyle(el).color);
  const ok = want.test(c) && c !== badInline;
  ok ? pass++ : fail++;
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + name + ' → ' + c + (ok ? '' : ' (still the light inline ' + badInline + ')'));
}
const docEl = doc.querySelector('#qSumInsured');
const docCol = docEl ? String(window.getComputedStyle(docEl).color) : 'MISSING';
t('quotation doc not tinted/darkened by the new block (stays readable on paper)',
  /255, 255, 255|30, 41, 59|4, 120, 87/.test(docCol), docCol);
t('quotation doc background stays white',
  /255, 255, 255/.test(String(window.getComputedStyle(doc.querySelector('.quote-doc')).backgroundColor)));
const gen = doc.querySelector('strong.generated-by');
t('generated-by computes bold in the app stylesheet stack',
  gen && /^(700|800|900|bold)$/.test(String(window.getComputedStyle(gen).fontWeight)),
  gen ? window.getComputedStyle(gen).fontWeight : 'no node');

console.log('\n' + (fail === 0 ? '✅ UI-FIX CHECKS PASS' : `❌ UI-FIX CHECKS FAIL (${fail})`));
process.exit(fail ? 1 : 0);
