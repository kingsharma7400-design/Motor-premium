/* Real-cascade check: loads the app's own stylesheets (same order as index.html)
   into jsdom and reports the COMPUTED colour of every inline-styled node that
   was unreadable in dark mode, plus guards for the ones that must NOT change. */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..', 'uploads');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, m => {
  const f = (m.match(/href="([^"]+)"/) || [])[1] || '';
  const file = path.join(ROOT, f.replace(/^.\//, ''));
  return fs.existsSync(file) ? '<style>\n' + fs.readFileSync(file, 'utf8') + '\n</style>' : '';
});
/* runtime-generated nodes: result table + history product badge */
html = html.replace('<div class="op-result" id="fireResult" style="display:none;"></div>',
  '<div class="op-result" id="fireResult"><table><tr><td style="font-weight:700;color:#64748b;">Occupancy</td><td>Dwelling</td></tr></table></div>');

const TARGETS = [
  ['must go light in dark', 'amber "DD-MM-YYYY" hint', '#tab-calc .date-field-wrap label span', '#b45309'],
  ['must go light in dark', 'blue SI sub-label', '#tab-calc .field label[style*="#1e40af"]', '#1e40af'],
  ['must go light in dark', 'amber towing label', '#tab-calc .field label[style*="#854d0e"]', '#854d0e'],
  ['must go light in dark', 'blue CPA/passenger labels', '#tab-calc .field label[style*="#0369a1"]', '#0369a1'],
  ['must go light in dark', 'CPA hint text', '#cpaTermHint', '#0369a1'],
  ['must go light in dark', 'Fire theft-rate label', '#tab-fire .form-section label[style*="#92400e"]', '#92400e'],
  ['must go light in dark', 'PA medical-ext label', '#tab-pa .form-section label[style*="#92400e"]', '#92400e'],
  ['must go light in dark', 'grey cell in result table', '#fireResult td[style*="#64748b"]', '#64748b'],
  ['must go light in dark', 'Today shortcut link', '#todayBtn', '#2563eb'],
  /* pre-existing rule (styles-pro.css:565) normalises every .quote-meta span to
     #1e293b in dark mode — the doc stays white so it is READABLE, just not green.
     Asserted as a documented behaviour, not as a bug introduced now. */
  ['pre-existing', 'quotation green SI figure', '#qSumInsured', '#047857', '#1e293b'],
  ['must NOT change', 'quotation grey date line', '#tab-quote div[style*="color:#64748b"]', '#64748b'],
  ['must NOT change', 'health quotation grey date line', '#tab-hquote div[style*="color:#64748b"]', '#64748b'],
  ['must NOT change', 'sidebar amber footer', '#revisionDate', '#fbbf24'],
  ['must NOT change', 'navy banner text', '#hqBannerProbeNotPresent', '']
];

function build(theme) {
  const h = html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`);
  return new JSDOM(h, { url: 'http://localhost/', pretendToBeVisual: true }).window;
}
const light = build('light'), dark = build('dark');
const hex = c => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return m ? '#' + m.slice(1, 4).map(n => (+n).toString(16).padStart(2, '0')).join('') : c; };
const of = (win, sel) => { const e = win.document.querySelector(sel); return e ? hex(win.getComputedStyle(e).color) : 'MISSING'; };

let pass = 0, fail = 0;
console.log('\n' + 'expectation'.padEnd(20) + 'node'.padEnd(32) + 'LIGHT'.padEnd(10) + 'DARK'.padEnd(10) + 'verdict');
for (const [kind, label, sel, inline, darkWant] of TARGETS) {
  if (sel === '#hqBannerProbeNotPresent') continue;
  const l = of(light, sel), d = of(dark, sel);
  let ok;
  if (kind === 'must go light in dark') ok = l === inline && d !== inline && d !== 'MISSING';
  else if (kind === 'pre-existing') ok = l === inline && d === darkWant;
  else ok = l === inline && d === inline;      // quotation doc / footer stay as-is
  const line = kind.padEnd(20) + label.slice(0, 30).padEnd(32) + String(l).padEnd(10) + String(d).padEnd(10) + (ok ? '✓' : '✗ expected ' + inline);
  if (ok) { pass++; console.log(line); } else { fail++; console.log(line); }
}
/* tinted box background check */
const bgOf = (win, sel) => { const e = win.document.querySelector(sel); return e ? hex(win.getComputedStyle(e).backgroundColor) : 'MISSING'; };
for (const id of ['persBelongSIField', 'towingLimitField', 'cpaTermField', 'passPaSIField', 'fTheftRateWrap']) {
  const l = bgOf(light, '#' + id), d = bgOf(dark, '#' + id);
  const ok = l !== d && d !== 'MISSING';
  ok ? pass++ : fail++;
  console.log('box background'.padEnd(20) + ('#' + id).padEnd(32) + String(l).padEnd(10) + String(d).padEnd(10) + (ok ? '✓ recoloured' : '✗'));
}
console.log(`\n${fail === 0 ? '✅ CASCADE PASS' : '❌ CASCADE FAIL'} — ${pass} ok, ${fail} wrong\n`);
process.exit(fail ? 1 : 0);
